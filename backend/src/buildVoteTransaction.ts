import { Transaction } from '@mysten/sui/transactions';

export function buildVoteTransaction(packageId: string, proposalId: string, choice: number) {
    const tx = new Transaction();
    tx.moveCall({
        target: `${packageId}::voting::vote`,
        arguments: [tx.object(proposalId), tx.pure.u64(choice)],
    });
    return tx;
}
