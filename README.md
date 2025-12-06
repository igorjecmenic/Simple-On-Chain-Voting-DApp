# Simple On-Chain Voting DApp

This repo pairs a Sui Move voting contract with a React + Vite frontend. The Move package creates a shared proposal object that lets each address vote exactly once, and the UI fetches live counts from chain.

## Smart Contracts
- Location: `contracts/voting`
- Build: `sui move build contracts/voting`
- Test: `sui move test contracts/voting`
- Deploy (testnet example):
  ```
  sui client publish --gas-budget 100000000 contracts/voting
  ```
- Create & share proposal on testnet (example):
  ```
  sui client call \
    --gas-budget 20000000 \
    --package <PACKAGE_ID> \
    --module voting \
    --function create_shared \
    --args "Which feature should the pizza drone ship next?" \
    --args '["Pineapple detection","Anti-seagull lasers","Fold-proof boxes"]'
  ```
  Note the resulting `Proposal` object ID and set it in the frontend env.

## Frontend (React)
- Location: `frontend/`
- Install deps: `cd frontend && npm install`
- Dev server: `npm run dev`
- Typecheck/build: `npm run build`
- Env file: copy `app/.env.example` to `.env.local` and set:
  - `VITE_PACKAGE_ID=<package id from publish>`
  - `VITE_PROPOSAL_ID=<shared proposal object id>`
  - (Optional) `VITE_SUI_NETWORK` (`testnet`, `devnet`, `mainnet`, `localnet`) and `VITE_FULLNODE_URL`
  - (Optional) Sponsored voting via backend: `VITE_USE_SPONSORED_TRANSACTIONS=true`, `VITE_BACKEND_URL=http://localhost:3001`

## Sponsored Transaction Backend
- Location: `backend/`
- Env: copy `backend/.env.example` to `.env` and set `ENOKI_PRIVATE_KEY=<enoki portal private key>`, optional `SUI_NETWORK`, `FULLNODE_URL`, `PORT`.
- Run: `cd backend && npm install && npm run dev`
- Behavior: `/api/sponsor-vote` builds the vote transaction server-side, requests sponsorship from Enoki, and returns the sponsored bytes/digest. `/api/execute-transaction` submits the signed sponsored transaction. The frontend signs the sponsored bytes locally, so no private keys leave the browser.

## Notes
- Contract events: `voting::voting::Voted` (emits proposal, voter, choice), `ProposalCreated`.
- Each address can vote once per proposal; invalid option indices abort on-chain.
- UI uses `@mysten/dapp-kit` for wallet connect and `@tanstack/react-query` for live updates. Build already succeeds via `npm run build`.
