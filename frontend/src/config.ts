import { getFullnodeUrl } from '@mysten/sui/client';

export type SupportedNetwork = 'testnet' | 'mainnet' | 'devnet' | 'localnet';

const envNetwork = (import.meta.env.VITE_SUI_NETWORK as string | undefined)?.toLowerCase();
export const NETWORK: SupportedNetwork =
  envNetwork === 'mainnet' || envNetwork === 'devnet' || envNetwork === 'localnet'
    ? envNetwork
    : 'testnet';

export const FULLNODE_URL =
  (import.meta.env.VITE_FULLNODE_URL as string | undefined) ?? getFullnodeUrl(NETWORK);
export const PACKAGE_ID = (import.meta.env.VITE_PACKAGE_ID as string | undefined) ?? '';
export const PROPOSAL_ID = (import.meta.env.VITE_PROPOSAL_ID as string | undefined) ?? '';

export const APP_QUESTION_FALLBACK =
  'Which feature should the pizza delivery drone ship next?';
export const APP_OPTIONS_FALLBACK = ['Pineapple detection', 'Anti-seagull lasers', 'Fold-proof boxes'];

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '';
export const USE_SPONSORED_TRANSACTIONS =
  (import.meta.env.VITE_USE_SPONSORED_TRANSACTIONS as string | undefined)?.toLowerCase() === 'true';
