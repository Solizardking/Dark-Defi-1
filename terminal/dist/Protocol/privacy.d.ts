import { Keypair, PublicKey } from '@solana/web3.js';
import type { Note, JupiterSwapRoute } from './types';
/**
 * Privacy utilities for Dark Protocol
 */
export declare class PrivacyUtils {
    /**
     * Generate random commitment
     */
    static generateCommitment(): Uint8Array;
    /**
     * Generate random nullifier
     */
    static generateNullifier(): Uint8Array;
    /**
     * Generate viewing key
     */
    static generateViewingKey(): Uint8Array;
    /**
     * Generate spending key commitment
     */
    static generateSpendingKeyCommitment(spendingKey: Uint8Array): Promise<Uint8Array>;
    /**
     * Hash data using SHA-256
     */
    static hash(data: Uint8Array): Promise<Uint8Array>;
    /**
     * Encrypt memo
     */
    static encryptMemo(memo: string, sharedSecret: Uint8Array): Promise<Uint8Array>;
    /**
     * Decrypt memo
     */
    static decryptMemo(encrypted: Uint8Array, sharedSecret: Uint8Array): Promise<string>;
    /**
     * Derive shared secret using ECDH
     */
    static deriveSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array>;
    /**
     * Calculate note value (for scanning)
     */
    static scanNoteValue(note: Note, viewingKey: Uint8Array): Promise<bigint | null>;
    /**
     * Check if note belongs to wallet
     */
    static isNoteOwnedByWallet(note: Note, viewingKey: Uint8Array): Promise<boolean>;
    /**
     * Generate ZK proof (placeholder)
     */
    static generateZKProof(params: {
        inputs: Uint8Array[];
        outputs: Uint8Array[];
        secrets: Uint8Array[];
    }): Promise<Uint8Array>;
    /**
     * Verify ZK proof (placeholder)
     */
    static verifyZKProof(proof: Uint8Array, publicInputs: Uint8Array[]): Promise<boolean>;
    /**
     * Encrypt swap data for privacy-preserving swaps
     */
    static encryptSwapData(params: {
        inputAmount: bigint;
        outputAmount: bigint;
        route: JupiterSwapRoute;
        encryptionKey: Uint8Array;
    }): Promise<Uint8Array>;
    /**
     * Generate ZK proof specifically for swap operations
     */
    static generateSwapProof(params: {
        inputAmount: bigint;
        outputAmount: bigint;
        inputCommitment: Uint8Array;
        outputCommitment: Uint8Array;
        nullifier: Uint8Array;
        route: JupiterSwapRoute;
    }): Promise<Uint8Array>;
    /**
     * Create ephemeral account for unlinkable transactions
     */
    static createEphemeralAccount(): {
        keypair: Keypair;
        publicKey: PublicKey;
        expiresAt: number;
    };
    /**
     * Decrypt swap data
     */
    static decryptSwapData(encrypted: Uint8Array, encryptionKey: Uint8Array): Promise<{
        inputAmount: bigint;
        outputAmount: bigint;
        inputMint: string;
        outputMint: string;
        slippageBps: number;
        timestamp: number;
    }>;
    /**
     * Generate privacy-preserving route commitment
     */
    static generateRouteCommitment(route: JupiterSwapRoute): Promise<Uint8Array>;
}
//# sourceMappingURL=privacy.d.ts.map