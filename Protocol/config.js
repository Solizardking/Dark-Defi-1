"use strict";
/**
 * Dark Protocol SDK Configuration
 * Helius RPC endpoints for Solana connectivity
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROGRAM_IDS = exports.NETWORK_CONFIGS = void 0;
exports.getRPCEndpoint = getRPCEndpoint;
exports.getWSEndpoint = getWSEndpoint;
exports.getProgramId = getProgramId;
exports.resolveConfig = resolveConfig;
const web3_js_1 = require("@solana/web3.js");
/**
 * Network configurations with Helius RPC endpoints
 */
exports.NETWORK_CONFIGS = {
    /**
     * Mainnet - Production network
     */
    mainnet: {
        rpc: process.env.HELIUS_RPC_URL ||
            `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ''}`,
        secureRpc: process.env.HELIUS_SECURE_RPC_URL ||
            'https://alli-pigt1b-fast-mainnet.helius-rpc.com',
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
            'https://cati-etnoqa-fast-devnet.helius-rpc.com',
        wss: process.env.HELIUS_DEVNET_WSS_URL ||
            `wss://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ''}`,
    },
    /**
     * Testnet - Public testing network
     */
    testnet: {
        rpc: (0, web3_js_1.clusterApiUrl)('testnet'),
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
function getRPCEndpoint(cluster = 'devnet', useSecure = false) {
    const config = exports.NETWORK_CONFIGS[cluster];
    if (!config) {
        throw new Error(`Unknown cluster: ${cluster}`);
    }
    // Use secure RPC if available and requested
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
function getWSEndpoint(cluster = 'devnet') {
    const config = exports.NETWORK_CONFIGS[cluster];
    return config?.wss;
}
/**
 * Dark Protocol program IDs for different networks
 */
exports.PROGRAM_IDS = {
    mainnet: 'DARKxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx',
    devnet: 'DARKxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx',
    testnet: 'DARKxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx',
    localnet: 'DARKxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx',
};
/**
 * Get program ID for a specific network
 *
 * @param cluster - Network cluster name
 * @returns Program ID string
 */
function getProgramId(cluster = 'devnet') {
    const normalizedCluster = cluster === 'mainnet-beta' ? 'mainnet' : cluster;
    return exports.PROGRAM_IDS[normalizedCluster] || exports.PROGRAM_IDS.devnet;
}
/**
 * Resolve SDK configuration with defaults
 *
 * @param config - Partial SDK configuration
 * @returns Complete SDK configuration
 */
function resolveConfig(config = {}) {
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
//# sourceMappingURL=config.js.map