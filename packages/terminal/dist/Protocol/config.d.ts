/**
 * Dark Protocol SDK Configuration
 * Helius RPC endpoints for Solana connectivity
 */
import { Cluster } from '@solana/web3.js';
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
export declare const NETWORK_CONFIGS: Record<string, RPCConfig>;
/**
 * Get RPC configuration for a specific network
 *
 * @param cluster - Network cluster name
 * @param useSecure - Use secure/dedicated RPC endpoint if available
 * @returns RPC endpoint URL
 */
export declare function getRPCEndpoint(cluster?: Cluster | 'mainnet' | 'devnet' | 'testnet' | 'localnet', useSecure?: boolean): string;
/**
 * Get WebSocket endpoint for a specific network
 *
 * @param cluster - Network cluster name
 * @returns WebSocket endpoint URL
 */
export declare function getWSEndpoint(cluster?: Cluster | 'mainnet' | 'devnet' | 'testnet' | 'localnet'): string | undefined;
/**
 * Dark Protocol program IDs for different networks
 */
export declare const PROGRAM_IDS: {
    readonly mainnet: "DARKxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx";
    readonly devnet: "DARKxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx";
    readonly testnet: "DARKxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx";
    readonly localnet: "DARKxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx";
};
/**
 * Get program ID for a specific network
 *
 * @param cluster - Network cluster name
 * @returns Program ID string
 */
export declare function getProgramId(cluster?: Cluster | 'mainnet' | 'devnet' | 'testnet' | 'localnet'): string;
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
export declare function resolveConfig(config?: SDKConfig): Required<Omit<SDKConfig, 'heliusApiKey' | 'wsUrl'>> & {
    heliusApiKey?: string;
    wsUrl?: string;
};
/**
 * Example usage:
 *
 * ```typescript
 * import { resolveConfig } from '@dark-protocol/sdk';
 *
 * // Use devnet with standard RPC
 * const config1 = resolveConfig({ cluster: 'devnet' });
 *
 * // Use devnet with secure RPC
 * const config2 = resolveConfig({
 *   cluster: 'devnet',
 *   useSecureRpc: true
 * });
 *
 * // Use mainnet with custom program ID
 * const config3 = resolveConfig({
 *   cluster: 'mainnet',
 *   programId: 'YourProgramId...',
 *   useSecureRpc: true
 * });
 * ```
 */
//# sourceMappingURL=config.d.ts.map