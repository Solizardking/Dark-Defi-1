/**
 * Dark Protocol SDK Configuration
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Deployed program IDs on Solana Devnet
 */
export const PROGRAM_IDS = {
  DARK_PROTOCOL: new PublicKey('3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC'),
  SHIELDED_WALLET: new PublicKey('4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg'),
};

/**
 * RPC Endpoints for different networks
 */
export const RPC_ENDPOINTS = {
  DEVNET: 'https://api.devnet.solana.com',
  DEVNET_HELIUS: 'https://devnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0',
  MAINNET: 'https://api.mainnet-beta.solana.com',
  LOCALNET: 'http://localhost:8899',
};

/**
 * Network types
 */
export type Network = 'devnet' | 'mainnet' | 'localnet';

/**
 * SDK Configuration
 */
export interface DarkProtocolConfig {
  network: Network;
  rpcEndpoint?: string;
}

/**
 * Get RPC endpoint for network
 */
export function getRpcEndpoint(network: Network, customEndpoint?: string): string {
  if (customEndpoint) return customEndpoint;
  
  switch (network) {
    case 'devnet':
      return RPC_ENDPOINTS.DEVNET;
    case 'mainnet':
      return RPC_ENDPOINTS.MAINNET;
    case 'localnet':
      return RPC_ENDPOINTS.LOCALNET;
    default:
      return RPC_ENDPOINTS.DEVNET;
  }
}

/**
 * Get program ID for network
 */
export function getProgramId(network: Network): PublicKey {
  // Currently same for all networks
  return PROGRAM_IDS.DARK_PROTOCOL;
}

export function getShieldedWalletId(network: Network): PublicKey {
  // Currently same for all networks
  return PROGRAM_IDS.SHIELDED_WALLET;
}
