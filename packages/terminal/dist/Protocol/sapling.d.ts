/**
 * Zcash Sapling Address System for Solana
 *
 * This module implements the complete Sapling address hierarchy adapted from Zcash:
 * Spending Key (sk) → Expanded Spending Key → Full Viewing Key → Incoming Viewing Key → Payment Address
 *
 * Compatible with the Rust implementation in: programs/dark-protocol/src/crypto/sapling.rs
 */
/** Sapling diversifier size (11 bytes, same as Zcash) */
export declare const SAPLING_DIVERSIFIER_SIZE = 11;
/** Sapling spending key size */
export declare const SAPLING_SK_SIZE = 32;
/** Full viewing key size (ak + nk + ovk) */
export declare const SAPLING_FVK_SIZE = 96;
/** Payment address size (diversifier + pk_d) */
export declare const SAPLING_ADDRESS_SIZE = 43;
/**
 * Sapling Payment Address
 * Format: 11-byte diversifier + 32-byte pk_d (identical to Zcash)
 */
export declare class SaplingPaymentAddress {
    readonly d: Uint8Array;
    readonly pk_d: Uint8Array;
    constructor(d: Uint8Array, // 11 bytes
    pk_d: Uint8Array);
    /**
     * Convert to 43-byte representation (same as Zcash)
     */
    toBytes(): Uint8Array;
    /**
     * Create from 43-byte representation
     */
    static fromBytes(bytes: Uint8Array): SaplingPaymentAddress;
    /**
     * Get base58 string representation
     */
    toBase58(): string;
    /**
     * Create from base58 string
     */
    static fromBase58(str: string): SaplingPaymentAddress;
    /**
     * Get hash of payment address (for indexing)
     */
    getHash(): Uint8Array;
    private bytesToBase58;
    private static base58ToBytes;
}
/**
 * Sapling Incoming Viewing Key (ivk)
 * Used to derive payment addresses and decrypt incoming notes
 */
export declare class SaplingIncomingViewingKey {
    readonly ivk: Uint8Array;
    constructor(ivk: Uint8Array);
    /**
     * Derive payment address from diversifier
     * Same algorithm as Rust implementation
     */
    address(diversifier: Uint8Array): SaplingPaymentAddress;
    /**
     * Generate default diversifier (same as Rust implementation)
     */
    static defaultDiversifier(): Uint8Array;
    /**
     * Generate random diversifier
     */
    static randomDiversifier(): Uint8Array;
}
/**
 * Sapling Full Viewing Key (fvk)
 * Contains ak (authentication key), nk (nullifier deriving key), ovk (outgoing viewing key)
 */
export declare class SaplingFullViewingKey {
    readonly ak: Uint8Array;
    readonly nk: Uint8Array;
    readonly ovk: Uint8Array;
    constructor(ak: Uint8Array, // 32 bytes
    nk: Uint8Array, // 32 bytes
    ovk: Uint8Array);
    /**
     * Convert to 96-byte representation
     */
    toBytes(): Uint8Array;
    /**
     * Create from 96-byte representation
     */
    static fromBytes(bytes: Uint8Array): SaplingFullViewingKey;
    /**
     * Derive incoming viewing key
     * Same algorithm as Rust implementation
     */
    inViewingKey(): SaplingIncomingViewingKey;
    /**
     * Get fingerprint for key derivation (ZIP 32)
     */
    getFingerprint(): Uint8Array;
    /**
     * Check if viewing key is valid
     */
    isValid(): boolean;
}
/**
 * Sapling Expanded Spending Key
 * Contains ask, nsk, ovk
 */
export declare class SaplingExpandedSpendingKey {
    readonly ask: Uint8Array;
    readonly nsk: Uint8Array;
    readonly ovk: Uint8Array;
    constructor(ask: Uint8Array, // 32 bytes
    nsk: Uint8Array, // 32 bytes
    ovk: Uint8Array);
    /**
     * Derive full viewing key
     * Same algorithm as Rust implementation
     */
    fullViewingKey(): SaplingFullViewingKey;
}
/**
 * Sapling Spending Key (32-byte seed)
 * Master secret key - NEVER store on-chain or share
 */
export declare class SaplingSpendingKey {
    readonly sk: Uint8Array;
    constructor(sk: Uint8Array);
    /**
     * Generate random spending key from seed
     */
    static random(seed: Uint8Array): SaplingSpendingKey;
    /**
     * Generate from mnemonic phrase (BIP39)
     */
    static fromMnemonic(mnemonic: string): Promise<SaplingSpendingKey>;
    /**
     * Expand spending key to get ask, nsk, ovk
     * Same algorithm as Rust implementation
     */
    expandedSpendingKey(): SaplingExpandedSpendingKey;
    /**
     * Get full viewing key
     */
    fullViewingKey(): SaplingFullViewingKey;
    /**
     * Get default payment address
     */
    defaultAddress(): SaplingPaymentAddress;
    /**
     * Export to bytes
     */
    toBytes(): Uint8Array;
    /**
     * Import from bytes
     */
    static fromBytes(bytes: Uint8Array): SaplingSpendingKey;
}
/**
 * Hierarchical Deterministic Wallet (ZIP 32)
 * Generate multiple addresses from a single seed
 */
export declare class SaplingHDWallet {
    private spendingKey;
    private fullViewingKey;
    private incomingViewingKey;
    constructor(spendingKey: SaplingSpendingKey);
    /**
     * Create from mnemonic phrase
     */
    static fromMnemonic(mnemonic: string): Promise<SaplingHDWallet>;
    /**
     * Create from spending key
     */
    static fromSpendingKey(sk: SaplingSpendingKey): SaplingHDWallet;
    /**
     * Get spending key (use carefully - this is the master secret!)
     */
    getSpendingKey(): SaplingSpendingKey;
    /**
     * Get full viewing key (safe to store)
     */
    getFullViewingKey(): SaplingFullViewingKey;
    /**
     * Get incoming viewing key
     */
    getIncomingViewingKey(): SaplingIncomingViewingKey;
    /**
     * Get default payment address
     */
    getDefaultAddress(): SaplingPaymentAddress;
    /**
     * Generate diversified address (can create unlimited)
     */
    generateDiversifiedAddress(index: number): SaplingPaymentAddress;
    /**
     * Generate multiple diversified addresses
     */
    generateDiversifiedAddresses(count: number): SaplingPaymentAddress[];
}
/**
 * Utility functions for Sapling addresses
 */
export declare class SaplingUtils {
    /**
     * Generate new wallet with mnemonic
     */
    static generateWallet(): Promise<{
        wallet: SaplingHDWallet;
        mnemonic: string;
    }>;
    /**
     * Restore wallet from mnemonic
     */
    static restoreWallet(mnemonic: string): Promise<SaplingHDWallet>;
    /**
     * Check if address is valid Sapling address
     */
    static isValidAddress(address: string): boolean;
    /**
     * Parse address from various formats
     */
    static parseAddress(address: string | Uint8Array): SaplingPaymentAddress;
}
//# sourceMappingURL=sapling.d.ts.map