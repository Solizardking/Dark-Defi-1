/**
 * Zcash-style Note Encryption for Solana
 *
 * Implements encrypted note transmission with ChaCha20-Poly1305 AEAD
 * Compatible with: programs/dark-protocol/src/crypto/note_encryption.rs
 */
import { SaplingPaymentAddress, SaplingIncomingViewingKey } from './sapling';
/** Authentication bytes for encrypted data */
export declare const NOTEENCRYPTION_AUTH_BYTES = 16;
/** Note plaintext field sizes */
export declare const V_SIZE = 8;
export declare const RHO_SIZE = 32;
export declare const R_SIZE = 32;
export declare const MEMO_SIZE = 512;
/** Sapling encrypted plaintext size */
export declare const SAPLING_ENCPLAINTEXT_SIZE: number;
/** Sapling outgoing plaintext size */
export declare const SAPLING_OUTPLAINTEXT_SIZE: number;
/** Sapling ciphertext sizes */
export declare const SAPLING_ENCCIPHERTEXT_SIZE: number;
export declare const SAPLING_OUTCIPHERTEXT_SIZE: number;
/**
 * Sapling Note Plaintext
 * Structure before encryption
 */
export declare class SaplingNotePlaintext {
    readonly leadbyte: number;
    readonly d: Uint8Array;
    readonly value: bigint;
    readonly rseed: Uint8Array;
    readonly memo: Uint8Array;
    constructor(leadbyte: number, // 1 byte (0x01 or 0x02 for ZIP 212)
    d: Uint8Array, // 11 bytes (diversifier)
    value: bigint, // 8 bytes (note amount)
    rseed: Uint8Array, // 32 bytes (randomness seed)
    memo: Uint8Array);
    /**
     * Create new note plaintext
     */
    static new(paymentAddress: SaplingPaymentAddress, value: bigint, rseed: Uint8Array, memo: Uint8Array): SaplingNotePlaintext;
    /**
     * Serialize to bytes
     */
    toBytes(): Uint8Array;
    /**
     * Deserialize from bytes
     */
    static fromBytes(bytes: Uint8Array): SaplingNotePlaintext;
    /**
     * Derive note commitment (simplified)
     */
    cm(pk_d: Uint8Array): Uint8Array;
    /**
     * Derive note commitment randomness
     */
    rcm(): Uint8Array;
    private valueToBytes;
}
/**
 * Sapling Outgoing Plaintext
 * For sender to recover sent notes
 */
export declare class SaplingOutgoingPlaintext {
    readonly pk_d: Uint8Array;
    readonly esk: Uint8Array;
    constructor(pk_d: Uint8Array, // 32 bytes
    esk: Uint8Array);
    /**
     * Serialize to bytes
     */
    toBytes(): Uint8Array;
    /**
     * Deserialize from bytes
     */
    static fromBytes(bytes: Uint8Array): SaplingOutgoingPlaintext;
}
/**
 * Note Encryption Context
 * Handles encryption of notes for recipients
 */
export declare class NoteEncryption {
    private esk;
    private epk;
    private h_sig;
    constructor(h_sig: Uint8Array, seed: Uint8Array);
    /**
     * Generate ephemeral secret key
     */
    private static generateEsk;
    /**
     * Derive ephemeral public key from esk
     */
    private static deriveEpk;
    /**
     * Encrypt note for recipient
     */
    encryptNote(plaintext: SaplingNotePlaintext, pk_enc: Uint8Array): Promise<Uint8Array>;
    /**
     * Encrypt outgoing plaintext for sender recovery
     */
    encryptOutgoing(outPlaintext: SaplingOutgoingPlaintext, ovk: Uint8Array, cv: Uint8Array): Promise<Uint8Array>;
    /**
     * Derive shared secret (simplified ECDH)
     */
    private deriveSharedSecret;
    /**
     * Derive encryption key from shared secret
     */
    private deriveEncryptionKey;
    /**
     * Derive outgoing encryption key
     */
    private deriveOutgoingKey;
    /**
     * ChaCha20-Poly1305 encryption
     */
    private chacha20Poly1305Encrypt;
    /**
     * Get ephemeral public key
     */
    getEpk(): Uint8Array;
    /**
     * Get ephemeral secret key (use carefully!)
     */
    getEsk(): Uint8Array;
}
/**
 * Note Decryption Context
 * Handles decryption of received notes
 */
export declare class NoteDecryption {
    private ivk;
    constructor(ivk: Uint8Array);
    /**
     * Create from Sapling incoming viewing key
     */
    static fromSaplingIVK(ivk: SaplingIncomingViewingKey): NoteDecryption;
    /**
     * Decrypt encrypted note
     */
    decryptNote(ciphertext: Uint8Array, epk: Uint8Array, h_sig: Uint8Array): Promise<SaplingNotePlaintext>;
    /**
     * Derive shared secret for decryption
     */
    private deriveSharedSecret;
    /**
     * Derive decryption key
     */
    private deriveDecryptionKey;
    /**
     * ChaCha20-Poly1305 decryption
     */
    private chacha20Poly1305Decrypt;
}
/**
 * Encrypted Note for storage/transmission
 */
export interface EncryptedNote {
    /** Encrypted note ciphertext */
    encCiphertext: Uint8Array;
    /** Outgoing ciphertext for sender */
    outCiphertext: Uint8Array;
    /** Ephemeral public key */
    epk: Uint8Array;
    /** Note commitment */
    cm: Uint8Array;
}
/**
 * Utility functions for note encryption
 */
export declare class NoteEncryptionUtils {
    /**
     * Create encrypted note for recipient
     */
    static createEncryptedNote(params: {
        recipientAddress: SaplingPaymentAddress;
        value: bigint;
        memo: string;
        senderOvk: Uint8Array;
    }): Promise<EncryptedNote>;
    /**
     * Try to decrypt note with viewing key
     */
    static tryDecryptNote(encryptedNote: EncryptedNote, ivk: SaplingIncomingViewingKey, h_sig: Uint8Array): Promise<SaplingNotePlaintext | null>;
    /**
     * Generate empty memo
     */
    static emptyMemo(): Uint8Array;
    /**
     * Create memo from string
     */
    static memoFromString(str: string): Uint8Array;
    /**
     * Parse memo to string
     */
    static memoToString(memo: Uint8Array): string;
}
//# sourceMappingURL=note-encryption.d.ts.map