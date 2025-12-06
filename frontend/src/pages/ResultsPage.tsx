import { Link } from 'react-router-dom';
import { PROPOSAL_ID } from '../config';
import { useProposalQuery } from '../features/voting/hooks';
import { NetworkCard } from '../components/NetworkCard';
import '../App.css';

function formatPercent(count: number, total: number) {
  if (total === 0) return '0%';
  return `${Math.round((count / total) * 100)}%`;
}

export default function ResultsPage() {
  const { data: proposal, isLoading, error } = useProposalQuery();

  const totalVotes = proposal ? proposal.counts.reduce((sum, n) => sum + n, 0) : 0;

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Simple On-Chain Voting</p>
          <h1 className="title">Live Results</h1>
          <p className="subtitle">
            Read-only view of the shared proposal on Sui. Updates automatically.
          </p>
          <p className="meta">
            <Link to="/">Back to voting page</Link>
          </p>
        </div>
      </header>

      <NetworkCard />

      {!PROPOSAL_ID && (
        <div className="card warning">
          <h2>Missing configuration</h2>
          <p>Set VITE_PROPOSAL_ID in .env.local to load live results.</p>
        </div>
      )}

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
            <div className="badge">Results</div>
          </div>

          <div className="options">
            {proposal.options.map((opt, idx) => {
              const count = proposal.counts[idx] ?? 0;
              const percent = formatPercent(count, totalVotes);
              return (
                <div key={opt} className="option" style={{ cursor: 'default' }}>
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
