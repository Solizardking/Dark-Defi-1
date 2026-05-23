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
export declare const PROGRAM_IDS: {
    /** Dark Protocol shielded-note pool program */
    DARK_PROTOCOL: PublicKey;
    /** Alias for the shielded wallet program (same contract) */
    SHIELDED_WALLET: PublicKey;
    /** MAINNET placeholder — replace after `solana program deploy` on mainnet */
    DARK_PROTOCOL_MAINNET: PublicKey;
};
/**
 * RPC endpoints per network.
 * Use a Helius API key for higher rate-limits and better reliability.
 */
export declare const RPC_ENDPOINTS: {
    DEVNET: string;
    DEVNET_HELIUS: string;
    MAINNET: string;
    MAINNET_HELIUS: string;
    LOCALNET: string;
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
export declare function getRpcEndpoint(network: Network, heliusApiKey?: string, customEndpoint?: string): string;
/**
 * Return the program ID for the given network.
 * Mainnet program ID is the same until a separate mainnet deployment is made.
 */
export declare function getProgramId(_network: Network): PublicKey;
export declare function getShieldedWalletId(_network: Network): PublicKey;
/**
 * PDA seeds for the protocol state singleton.
 */
export declare const PROTOCOL_STATE_SEED = "protocol";
export declare const POOL_VAULT_SEED = "pool_vault";
export declare const NOTE_SEED = "note";
export declare const NULLIFIER_SEED = "nullifier";
//# sourceMappingURL=config.d.ts.map