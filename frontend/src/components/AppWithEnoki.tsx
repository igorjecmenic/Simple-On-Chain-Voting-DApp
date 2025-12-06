import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PACKAGE_ID, PROPOSAL_ID } from '../config';
import { useHasVotedQuery, useProposalQuery, useVoteMutation } from '../features/voting/hooks'
import { NetworkCard } from './NetworkCard';
import '../App.css';
import Login from './Login';

function formatPercent(count: number, total: number) {
  if (total === 0) return '0%';
  return `${Math.round((count / total) * 100)}%`;
}

export function AppWithEnoki() {
  const account = useCurrentAccount();
  const { data: proposal, isLoading, error } = useProposalQuery();
  const { data: hasVoted } = useHasVotedQuery(account?.address);
  const voteMutation = useVoteMutation();

  const totalVotes = useMemo(
    () => (proposal ? proposal.counts.reduce((sum, n) => sum + n, 0) : 0),
    [proposal],
  );

  const handleVote = (choice: number) => {
    if (voteMutation.isPending) return;
    voteMutation.mutate(choice);
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Simple On-Chain Voting</p>
          <h1 className="title">Ship the silliest feature next</h1>
          <p className="subtitle">
            Cast a single vote. Results update live from the shared proposal object on Sui.
          </p>
          <p className="meta">
            <Link to="/results">View results-only page</Link>
          </p>
        </div>
        <Login />
      </header>

      <NetworkCard />

      {!PACKAGE_ID || !PROPOSAL_ID ? (
        <div className="card warning">
          <h2>Missing configuration</h2>
          <p>Set VITE_PACKAGE_ID and VITE_PROPOSAL_ID in .env.local after deploying the Move package.</p>
        </div>
      ) : null}

      {isLoading && <div className="card muted">Loading proposal from chain...</div>}
      {error && (
        <div className="card warning">
          <h2>Unable to load proposal</h2>
          <p>{String((error as Error).message)}</p>
        </div>
      )}

      {proposal && (
        <div className="card">
          <div className="proposal-header">
            <div>
              <p className="label">Proposal</p>
              <h2>{proposal.question}</h2>
              <p className="meta">
                Proposal ID: <code>{PROPOSAL_ID}</code>
              </p>
            </div>
            <div className="badge">One vote per address</div>
          </div>

          <div className="options">
            {proposal.options.map((opt, idx) => {
              const count = proposal.counts[idx] ?? 0;
              const percent = formatPercent(count, totalVotes);
              const disabled = !account || hasVoted || voteMutation.isPending;
              return (
                <button
                  key={opt}
                  className="option"
                  onClick={() => handleVote(idx)}
                  disabled={disabled}
                >
                  <div className="option-main">
                    <span className="option-label">{opt}</span>
                    <span className="option-meta">{percent}</span>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: percent === '0%' ? '4px' : percent }}
                    />
                  </div>
                  <div className="option-count">{count} votes</div>
                </button>
              );
            })}
          </div>

          <div className="status">
            {!account && <p>Sing in to vote.</p>}
            {account && hasVoted && <p>You already voted with {account.address}.</p>}
            {account && !hasVoted && <p>Choose an option to vote.</p>}
            {voteMutation.isPending && <p>Submitting your vote...</p>}
            {voteMutation.isSuccess && (
              <p>
                Vote recorded! Digest: <code>{voteMutation.data?.digest}</code>
              </p>
            )}
            {voteMutation.error && <p className="error">Error: {String(voteMutation.error as Error)}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AppWithEnoki;
