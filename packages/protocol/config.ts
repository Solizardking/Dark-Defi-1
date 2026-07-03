/**
 * Dark Protocol SDK Configuration
 * Helius RPC endpoints for Solana connectivity
 */

import { clusterApiUrl, Cluster } from '@solana/web3.js';
import { DARK_PROTOCOL_PROGRAM_ID } from './programs';

/**
 * RPC Configuration for different networks
 */
export interface RPCConfig {
  /** Standard RPC endpoint */
  rpc: string;
  /** Secure/dedicated RPC endpoint (optional) */
  secureRpc?: string;
  /** WebSocket endpoint for real-time updates */
  wss?: string;
}

/**
 * Network configurations with Helius RPC endpoints
 */
export const NETWORK_CONFIGS: Record<string, RPCConfig> = {
  /**
   * Mainnet - Production network
   */
  mainnet: {
    rpc: process.env.HELIUS_RPC_URL ||
          `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ''}`,
    secureRpc: process.env.HELIUS_SECURE_RPC_URL ||
               `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ''}`,
    wss: process.env.HELIUS_WSS_URL ||
         `wss://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ''}`,
  },

  /**
   * Devnet - Development/testing network
   */
  devnet: {
    rpc: process.env.HELIUS_DEVNET_URL ||
         `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ''}`,
    secureRpc: process.env.HELIUS_SECURE_DEVNET_URL ||
               `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ''}`,
    wss: process.env.HELIUS_DEVNET_WSS_URL ||
         `wss://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ''}`,
  },

  /**
   * Testnet - Public testing network
   */
  testnet: {
    rpc: clusterApiUrl('testnet'),
  },

  /**
   * Localnet - Local validator for development
   */
  localnet: {
    rpc: 'http://localhost:8899',
    wss: 'ws://localhost:8900',
  },
};

/**
 * Get RPC configuration for a specific network
 *
 * @param cluster - Network cluster name
 * @param useSecure - Use secure/dedicated RPC endpoint if available
 * @returns RPC endpoint URL
 */
export function getRPCEndpoint(
  cluster: Cluster | 'mainnet' | 'devnet' | 'testnet' | 'localnet' = 'devnet',
  useSecure: boolean = false
): string {
  const config = NETWORK_CONFIGS[cluster];

  if (!config) {
    throw new Error(`Unknown cluster: ${cluster}`);
  }

  if (useSecure && config.secureRpc) {
    return config.secureRpc;
  }

  return config.rpc;
}

/**
 * Get WebSocket endpoint for a specific network
 *
 * @param cluster - Network cluster name
 * @returns WebSocket endpoint URL
 */
export function getWSEndpoint(
  cluster: Cluster | 'mainnet' | 'devnet' | 'testnet' | 'localnet' = 'devnet'
): string | undefined {
  const config = NETWORK_CONFIGS[cluster];
  return config?.wss;
}

/**
 * Dark Protocol program IDs for different networks
 */
export const PROGRAM_IDS = {
  mainnet: DARK_PROTOCOL_PROGRAM_ID,
  devnet: DARK_PROTOCOL_PROGRAM_ID,
  testnet: DARK_PROTOCOL_PROGRAM_ID,
  localnet: DARK_PROTOCOL_PROGRAM_ID,
} as const;

/**
 * Get program ID for a specific network
 *
 * @param cluster - Network cluster name
 * @returns Program ID string
 */
export function getProgramId(
  cluster: Cluster | 'mainnet' | 'devnet' | 'testnet' | 'localnet' = 'devnet'
): string {
  const normalizedCluster = cluster === 'mainnet-beta' ? 'mainnet' : cluster;
  return PROGRAM_IDS[normalizedCluster as keyof typeof PROGRAM_IDS] || PROGRAM_IDS.devnet;
}

/**
 * SDK Configuration options
 */
export interface SDKConfig {
  /** Network cluster */
  cluster?: Cluster | 'mainnet' | 'devnet' | 'testnet' | 'localnet';
  /** RPC endpoint URL (overrides cluster default) */
  rpcUrl?: string;
  /** Use secure/dedicated RPC endpoint */
  useSecureRpc?: boolean;
  /** WebSocket endpoint URL */
  wsUrl?: string;
  /** Program ID (overrides cluster default) */
  programId?: string;
  /** Helius API key */
  heliusApiKey?: string;
}

/**
 * Resolve SDK configuration with defaults
 *
 * @param config - Partial SDK configuration
 * @returns Complete SDK configuration
 */
export function resolveConfig(config: SDKConfig = {}): Required<Omit<SDKConfig, 'heliusApiKey' | 'wsUrl'>> & { heliusApiKey?: string; wsUrl?: string } {
  const cluster = config.cluster || 'devnet';

  return {
    cluster,
    rpcUrl: config.rpcUrl || getRPCEndpoint(cluster, config.useSecureRpc),
    useSecureRpc: config.useSecureRpc ?? false,
    wsUrl: config.wsUrl || getWSEndpoint(cluster),
    programId: config.programId || getProgramId(cluster),
    heliusApiKey: config.heliusApiKey || process.env.HELIUS_API_KEY,
  };
}

/**
 * Example usage:
 *
 * ```typescript
 * import { resolveConfig } from '@dark-protocol/sdk';
 *
 * const config1 = resolveConfig({ cluster: 'devnet' });
 * const config2 = resolveConfig({ cluster: 'devnet', useSecureRpc: true });
 * const config3 = resolveConfig({
 *   cluster: 'mainnet',
 *   programId: 'YourProgramId...',
 *   useSecureRpc: true
 * });
 * ```
 */
