/**
 * Dark Protocol SDK Configuration
 */
import { PublicKey } from '@solana/web3.js';
/**
 * Deployed program IDs on Solana Devnet
 */
export declare const PROGRAM_IDS: {
    DARK_PROTOCOL: PublicKey;
    SHIELDED_WALLET: PublicKey;
};
/**
 * RPC Endpoints for different networks
 */
export declare const RPC_ENDPOINTS: {
    DEVNET: string;
    DEVNET_HELIUS: string;
    MAINNET: string;
    LOCALNET: string;
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
export declare function getRpcEndpoint(network: Network, customEndpoint?: string): string;
/**
 * Get program ID for network
 */
export declare function getProgramId(network: Network): PublicKey;
export declare function getShieldedWalletId(network: Network): PublicKey;
//# sourceMappingURL=config.d.ts.map