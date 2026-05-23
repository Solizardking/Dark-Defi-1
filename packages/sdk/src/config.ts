/**
 * Dark Protocol SDK Configuration
 * On-chain program: E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Deployed program IDs.
 *   LOCAL / DEVNET: E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm
 *   MAINNET: update to mainnet program ID after deployment
 */
export const PROGRAM_IDS = {
  /** Dark Protocol shielded-note pool program */
  DARK_PROTOCOL: new PublicKey('E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm'),
  /** Alias for the shielded wallet program (same contract) */
  SHIELDED_WALLET: new PublicKey('E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm'),
  /** MAINNET placeholder — replace after `solana program deploy` on mainnet */
  DARK_PROTOCOL_MAINNET: new PublicKey('E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm'),
};

/**
 * RPC endpoints per network.
 * Use a Helius API key for higher rate-limits and better reliability.
 */
export const RPC_ENDPOINTS = {
  DEVNET:          'https://api.devnet.solana.com',
  DEVNET_HELIUS:   'https://devnet.helius-rpc.com/?api-key=',
  MAINNET:         'https://api.mainnet-beta.solana.com',
  MAINNET_HELIUS:  'https://mainnet.helius-rpc.com/?api-key=',
  LOCALNET:        'http://localhost:8899',
};

export type Network = 'devnet' | 'mainnet' | 'localnet';

export interface DarkProtocolConfig {
  network: Network;
  rpcEndpoint?: string;
  heliusApiKey?: string;
}

/**
 * Return the RPC endpoint for the given network.
 * Prefers Helius if an API key is provided.
 */
export function getRpcEndpoint(
  network: Network,
  heliusApiKey?: string,
  customEndpoint?: string
): string {
  if (customEndpoint) return customEndpoint;
  if (heliusApiKey) {
    if (network === 'devnet') return RPC_ENDPOINTS.DEVNET_HELIUS + heliusApiKey;
    if (network === 'mainnet') return RPC_ENDPOINTS.MAINNET_HELIUS + heliusApiKey;
  }
  switch (network) {
    case 'devnet':   return RPC_ENDPOINTS.DEVNET;
    case 'mainnet':  return RPC_ENDPOINTS.MAINNET;
    case 'localnet': return RPC_ENDPOINTS.LOCALNET;
    default:         return RPC_ENDPOINTS.DEVNET;
  }
}

/**
 * Return the program ID for the given network.
 * Mainnet program ID is the same until a separate mainnet deployment is made.
 */
export function getProgramId(_network: Network): PublicKey {
  return PROGRAM_IDS.DARK_PROTOCOL;
}

export function getShieldedWalletId(_network: Network): PublicKey {
  return PROGRAM_IDS.SHIELDED_WALLET;
}

/**
 * PDA seeds for the protocol state singleton.
 */
export const PROTOCOL_STATE_SEED = 'protocol';
export const POOL_VAULT_SEED     = 'pool_vault';
export const NOTE_SEED           = 'note';
export const NULLIFIER_SEED      = 'nullifier';
