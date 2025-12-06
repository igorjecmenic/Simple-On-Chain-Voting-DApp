import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSignAndExecuteTransaction, useSignTransaction, useSuiClient } from '@mysten/dapp-kit';
import { BACKEND_URL, NETWORK, PACKAGE_ID, PROPOSAL_ID, USE_SPONSORED_TRANSACTIONS } from '../../config';
import { executeSponsoredTransaction, requestSponsoredVote } from '../../lib/sponsor';
import { fetchProposal, hasAddressVoted } from './api';

const proposalKey = ['proposal', PROPOSAL_ID];

export const useProposalQuery = () =>
  useQuery({
    queryKey: proposalKey,
    queryFn: () => fetchProposal(PROPOSAL_ID),
    enabled: Boolean(PROPOSAL_ID),
    staleTime: 5_000,
  });

export const useHasVotedQuery = (address?: string) =>
  useQuery({
    queryKey: ['has-voted', PROPOSAL_ID, address],
    queryFn: () => hasAddressVoted(PROPOSAL_ID, address!),
    enabled: Boolean(PROPOSAL_ID && address),
    staleTime: 5_000,
  });

export const useVoteMutation = () => {
  const queryClient = useQueryClient();
  const signAndExecute = useSignAndExecuteTransaction();
  const signTransaction = useSignTransaction();
  const account = useCurrentAccount();
  const client = useSuiClient();

  return useMutation({
    mutationFn: async (choice: number) => {
      if (!PACKAGE_ID || !PROPOSAL_ID) {
        throw new Error('Package ID or proposal ID missing');
      }

      const sponsorEnabled = USE_SPONSORED_TRANSACTIONS && Boolean(BACKEND_URL);

      if (sponsorEnabled) {
        if (!account?.address) {
          throw new Error('Connect a wallet before submitting a vote.');
        }

        const sponsored = await requestSponsoredVote(BACKEND_URL, {
          sender: account.address,
          packageId: PACKAGE_ID,
          proposalId: PROPOSAL_ID,
          choice,
        });

        const { signature } = await signTransaction.mutateAsync({
          transaction: sponsored.bytes,
          chain: `sui:${NETWORK}`,
        });

        if (!signature) {
          throw new Error('Failed to sign sponsored transaction.');
        }

        await executeSponsoredTransaction(BACKEND_URL, {
          digest: sponsored.digest,
          signature,
        });

        await client.waitForTransaction({ digest: sponsored.digest });
        return { digest: sponsored.digest };
      }

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::voting::vote`,
        arguments: [tx.object(PROPOSAL_ID), tx.pure.u64(choice)],
      });

      return signAndExecute.mutateAsync({ transaction: tx });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalKey });
      queryClient.invalidateQueries({ queryKey: ['has-voted'] });
    },
  });
};
