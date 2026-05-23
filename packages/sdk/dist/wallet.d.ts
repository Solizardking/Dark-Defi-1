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
    static fromMnemonic(client: DarkProtocolClient, mnemonic: string, _accountIndex?: number): Promise<DarkWallet>;
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
    /** Solana public key */
    get publicKey(): PublicKey;
    /**
     * Initialize shielded address (returns the on-chain PDA).
     * The actual on-chain account is created via `ShieldedWallet.deposit()`.
     */
    initializeShieldedAddress(_viewingKey: Uint8Array, _spendingKeyCommitment: Uint8Array): Promise<string>;
    /**
     * Get wallet state — reads the protocol state + transparent balance.
     */
    getState(): Promise<WalletState>;
    /**
     * Shield tokens — delegates to ShieldedWallet.deposit() for full privacy.
     * Returns the note commitment as the "transaction" identifier in demo mode.
     */
    shieldTokens(_amount: bigint, _tokenMint: PublicKey): Promise<string>;
    /**
     * Unshield tokens — delegates to ShieldedWallet.withdraw().
     */
    unshieldTokens(_amount: bigint, _nullifier: Uint8Array, _proof: Uint8Array): Promise<string>;
    /**
     * Private transfer — delegates to ShieldedWallet.transfer().
     */
    privateTransfer(_recipientAddress: PublicKey, _amount: bigint, _memo?: string): Promise<string>;
    /** Export public + private keys */
    export(): {
        publicKey: string;
        privateKey: string;
    };
}
//# sourceMappingURL=wallet.d.ts.map