import { Keypair, PublicKey } from '@solana/web3.js';
import { DarkProtocolClient } from './client';
import type { WalletState } from './types';
export declare class DarkWallet {
    private client;
    private keypair;
    private shieldedAddress?;
    private notes;
    constructor(client: DarkProtocolClient, keypair: Keypair);
    /**
     * Create wallet from mnemonic
     */
    static fromMnemonic(client: DarkProtocolClient, mnemonic: string, accountIndex?: number): Promise<DarkWallet>;
    /**
     * Create wallet from private key
     */
    static fromPrivateKey(client: DarkProtocolClient, privateKey: Uint8Array): DarkWallet;
    /**
     * Generate new wallet
     */
    static generate(client: DarkProtocolClient): Promise<{
        wallet: DarkWallet;
        mnemonic: string;
    }>;
    /**
     * Get public key
     */
    get publicKey(): PublicKey;
    /**
     * Initialize shielded address
     */
    initializeShieldedAddress(viewingKey: Uint8Array, spendingKeyCommitment: Uint8Array): Promise<string>;
    /**
     * Get wallet state
     */
    getState(): Promise<WalletState>;
    /**
     * Shield tokens (move from transparent to shielded)
     */
    shieldTokens(amount: bigint, tokenMint: PublicKey): Promise<string>;
    /**
     * Unshield tokens (move from shielded to transparent)
     */
    unshieldTokens(amount: bigint, nullifier: Uint8Array, proof: Uint8Array): Promise<string>;
    /**
     * Private transfer
     */
    privateTransfer(recipientAddress: PublicKey, amount: bigint, memo?: string): Promise<string>;
    /**
     * Export wallet
     */
    export(): {
        publicKey: string;
        privateKey: string;
    };
}
//# sourceMappingURL=wallet.d.ts.map