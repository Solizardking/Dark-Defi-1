"use strict";
/**
 * Zcash Sapling Address System for Solana
 *
 * This module implements the complete Sapling address hierarchy adapted from Zcash:
 * Spending Key (sk) → Expanded Spending Key → Full Viewing Key → Incoming Viewing Key → Payment Address
 *
 * Compatible with the Rust implementation in: programs/dark-protocol/src/crypto/sapling.rs
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaplingUtils = exports.SaplingHDWallet = exports.SaplingSpendingKey = exports.SaplingExpandedSpendingKey = exports.SaplingFullViewingKey = exports.SaplingIncomingViewingKey = exports.SaplingPaymentAddress = exports.SAPLING_ADDRESS_SIZE = exports.SAPLING_FVK_SIZE = exports.SAPLING_SK_SIZE = exports.SAPLING_DIVERSIFIER_SIZE = void 0;
const blake3_js_1 = require("@noble/hashes/blake3.js");
const sha2_js_1 = require("@noble/hashes/sha2.js");
/** Sapling diversifier size (11 bytes, same as Zcash) */
exports.SAPLING_DIVERSIFIER_SIZE = 11;
/** Sapling spending key size */
exports.SAPLING_SK_SIZE = 32;
/** Full viewing key size (ak + nk + ovk) */
exports.SAPLING_FVK_SIZE = 96;
/** Payment address size (diversifier + pk_d) */
exports.SAPLING_ADDRESS_SIZE = 43;
/**
 * Sapling Payment Address
 * Format: 11-byte diversifier + 32-byte pk_d (identical to Zcash)
 */
class SaplingPaymentAddress {
    constructor(d, // 11 bytes
    pk_d // 32 bytes
    ) {
        this.d = d;
        this.pk_d = pk_d;
        if (d.length !== exports.SAPLING_DIVERSIFIER_SIZE) {
            throw new Error(`Diversifier must be ${exports.SAPLING_DIVERSIFIER_SIZE} bytes`);
        }
        if (pk_d.length !== 32) {
            throw new Error('pk_d must be 32 bytes');
        }
    }
    /**
     * Convert to 43-byte representation (same as Zcash)
     */
    toBytes() {
        const bytes = new Uint8Array(exports.SAPLING_ADDRESS_SIZE);
        bytes.set(this.d, 0);
        bytes.set(this.pk_d, exports.SAPLING_DIVERSIFIER_SIZE);
        return bytes;
    }
    /**
     * Create from 43-byte representation
     */
    static fromBytes(bytes) {
        if (bytes.length !== exports.SAPLING_ADDRESS_SIZE) {
            throw new Error(`Address must be ${exports.SAPLING_ADDRESS_SIZE} bytes`);
        }
        const d = bytes.slice(0, exports.SAPLING_DIVERSIFIER_SIZE);
        const pk_d = bytes.slice(exports.SAPLING_DIVERSIFIER_SIZE, exports.SAPLING_ADDRESS_SIZE);
        return new SaplingPaymentAddress(d, pk_d);
    }
    /**
     * Get base58 string representation
     */
    toBase58() {
        const bytes = this.toBytes();
        return this.bytesToBase58(bytes);
    }
    /**
     * Create from base58 string
     */
    static fromBase58(str) {
        const bytes = this.base58ToBytes(str);
        return SaplingPaymentAddress.fromBytes(bytes);
    }
    /**
     * Get hash of payment address (for indexing)
     */
    getHash() {
        const bytes = this.toBytes();
        // Double SHA-256 (same as Zcash)
        const hash1 = (0, sha2_js_1.sha256)(bytes);
        const hash2 = (0, sha2_js_1.sha256)(hash1);
        return hash2;
    }
    // Helper methods
    bytesToBase58(bytes) {
        // Use bs58 encoding
        const bs58 = require('bs58');
        return bs58.encode(bytes);
    }
    static base58ToBytes(str) {
        const bs58 = require('bs58');
        return bs58.decode(str);
    }
}
exports.SaplingPaymentAddress = SaplingPaymentAddress;
/**
 * Sapling Incoming Viewing Key (ivk)
 * Used to derive payment addresses and decrypt incoming notes
 */
class SaplingIncomingViewingKey {
    constructor(ivk) {
        this.ivk = ivk;
        if (ivk.length !== 32) {
            throw new Error('IVK must be 32 bytes');
        }
    }
    /**
     * Derive payment address from diversifier
     * Same algorithm as Rust implementation
     */
    address(diversifier) {
        if (diversifier.length !== exports.SAPLING_DIVERSIFIER_SIZE) {
            throw new Error(`Diversifier must be ${exports.SAPLING_DIVERSIFIER_SIZE} bytes`);
        }
        // Derive pk_d from ivk and diversifier using Blake3
        const pk_d = (0, blake3_js_1.blake3)(new Uint8Array([
            ...this.ivk,
            ...diversifier,
            ...Buffer.from('sapling_pk_d_derivation', 'utf8')
        ]), { dkLen: 32 });
        return new SaplingPaymentAddress(diversifier, pk_d);
    }
    /**
     * Generate default diversifier (same as Rust implementation)
     */
    static defaultDiversifier() {
        const div = new Uint8Array(exports.SAPLING_DIVERSIFIER_SIZE);
        div[0] = 1; // Start with non-zero
        return div;
    }
    /**
     * Generate random diversifier
     */
    static randomDiversifier() {
        const div = new Uint8Array(exports.SAPLING_DIVERSIFIER_SIZE);
        crypto.getRandomValues(div);
        div[0] = div[0] || 1; // Ensure first byte is non-zero
        return div;
    }
}
exports.SaplingIncomingViewingKey = SaplingIncomingViewingKey;
/**
 * Sapling Full Viewing Key (fvk)
 * Contains ak (authentication key), nk (nullifier deriving key), ovk (outgoing viewing key)
 */
class SaplingFullViewingKey {
    constructor(ak, // 32 bytes
    nk, // 32 bytes
    ovk // 32 bytes
    ) {
        this.ak = ak;
        this.nk = nk;
        this.ovk = ovk;
        if (ak.length !== 32 || nk.length !== 32 || ovk.length !== 32) {
            throw new Error('All FVK components must be 32 bytes');
        }
    }
    /**
     * Convert to 96-byte representation
     */
    toBytes() {
        const bytes = new Uint8Array(exports.SAPLING_FVK_SIZE);
        bytes.set(this.ak, 0);
        bytes.set(this.nk, 32);
        bytes.set(this.ovk, 64);
        return bytes;
    }
    /**
     * Create from 96-byte representation
     */
    static fromBytes(bytes) {
        if (bytes.length !== exports.SAPLING_FVK_SIZE) {
            throw new Error(`FVK must be ${exports.SAPLING_FVK_SIZE} bytes`);
        }
        const ak = bytes.slice(0, 32);
        const nk = bytes.slice(32, 64);
        const ovk = bytes.slice(64, 96);
        return new SaplingFullViewingKey(ak, nk, ovk);
    }
    /**
     * Derive incoming viewing key
     * Same algorithm as Rust implementation
     */
    inViewingKey() {
        const ivk = (0, blake3_js_1.blake3)(new Uint8Array([
            ...this.ak,
            ...this.nk,
            ...Buffer.from('sapling_ivk_derivation', 'utf8')
        ]), { dkLen: 32 });
        return new SaplingIncomingViewingKey(ivk);
    }
    /**
     * Get fingerprint for key derivation (ZIP 32)
     */
    getFingerprint() {
        const hash = (0, sha2_js_1.sha256)(new Uint8Array([
            ...this.ak,
            ...this.nk,
            ...this.ovk,
            ...Buffer.from('sapling_fvk_fingerprint', 'utf8')
        ]));
        return hash;
    }
    /**
     * Check if viewing key is valid
     */
    isValid() {
        // Check that keys are not all zeros
        const akValid = !this.ak.every(b => b === 0);
        const nkValid = !this.nk.every(b => b === 0);
        const ovkValid = !this.ovk.every(b => b === 0);
        return akValid && nkValid && ovkValid;
    }
}
exports.SaplingFullViewingKey = SaplingFullViewingKey;
/**
 * Sapling Expanded Spending Key
 * Contains ask, nsk, ovk
 */
class SaplingExpandedSpendingKey {
    constructor(ask, // 32 bytes
    nsk, // 32 bytes
    ovk // 32 bytes
    ) {
        this.ask = ask;
        this.nsk = nsk;
        this.ovk = ovk;
        if (ask.length !== 32 || nsk.length !== 32 || ovk.length !== 32) {
            throw new Error('All expanded SK components must be 32 bytes');
        }
    }
    /**
     * Derive full viewing key
     * Same algorithm as Rust implementation
     */
    fullViewingKey() {
        // Derive ak from ask
        const ak = (0, blake3_js_1.blake3)(new Uint8Array([
            ...this.ask,
            ...Buffer.from('sapling_ak_derivation', 'utf8')
        ]), { dkLen: 32 });
        // Derive nk from nsk
        const nk = (0, blake3_js_1.blake3)(new Uint8Array([
            ...this.nsk,
            ...Buffer.from('sapling_nk_derivation', 'utf8')
        ]), { dkLen: 32 });
        return new SaplingFullViewingKey(ak, nk, this.ovk);
    }
}
exports.SaplingExpandedSpendingKey = SaplingExpandedSpendingKey;
/**
 * Sapling Spending Key (32-byte seed)
 * Master secret key - NEVER store on-chain or share
 */
class SaplingSpendingKey {
    constructor(sk) {
        this.sk = sk;
        if (sk.length !== exports.SAPLING_SK_SIZE) {
            throw new Error(`Spending key must be ${exports.SAPLING_SK_SIZE} bytes`);
        }
    }
    /**
     * Generate random spending key from seed
     */
    static random(seed) {
        const sk = (0, blake3_js_1.blake3)(new Uint8Array([
            ...seed,
            ...Buffer.from('sapling_spending_key', 'utf8')
        ]), { dkLen: 32 });
        return new SaplingSpendingKey(sk);
    }
    /**
     * Generate from mnemonic phrase (BIP39)
     */
    static async fromMnemonic(mnemonic) {
        const bip39 = await Promise.resolve().then(() => __importStar(require('bip39')));
        const seed = await bip39.mnemonicToSeed(mnemonic);
        return SaplingSpendingKey.random(seed);
    }
    /**
     * Expand spending key to get ask, nsk, ovk
     * Same algorithm as Rust implementation
     */
    expandedSpendingKey() {
        // Derive ask
        const ask = (0, blake3_js_1.blake3)(new Uint8Array([
            ...this.sk,
            ...Buffer.from('sapling_ask_derivation', 'utf8')
        ]), { dkLen: 32 });
        // Derive nsk
        const nsk = (0, blake3_js_1.blake3)(new Uint8Array([
            ...this.sk,
            ...Buffer.from('sapling_nsk_derivation', 'utf8')
        ]), { dkLen: 32 });
        // Derive ovk
        const ovk = (0, blake3_js_1.blake3)(new Uint8Array([
            ...this.sk,
            ...Buffer.from('sapling_ovk_derivation', 'utf8')
        ]), { dkLen: 32 });
        return new SaplingExpandedSpendingKey(ask, nsk, ovk);
    }
    /**
     * Get full viewing key
     */
    fullViewingKey() {
        return this.expandedSpendingKey().fullViewingKey();
    }
    /**
     * Get default payment address
     */
    defaultAddress() {
        const fvk = this.fullViewingKey();
        const ivk = fvk.inViewingKey();
        const div = SaplingIncomingViewingKey.defaultDiversifier();
        return ivk.address(div);
    }
    /**
     * Export to bytes
     */
    toBytes() {
        return new Uint8Array(this.sk);
    }
    /**
     * Import from bytes
     */
    static fromBytes(bytes) {
        if (bytes.length !== exports.SAPLING_SK_SIZE) {
            throw new Error(`Spending key must be ${exports.SAPLING_SK_SIZE} bytes`);
        }
        return new SaplingSpendingKey(bytes);
    }
}
exports.SaplingSpendingKey = SaplingSpendingKey;
/**
 * Hierarchical Deterministic Wallet (ZIP 32)
 * Generate multiple addresses from a single seed
 */
class SaplingHDWallet {
    constructor(spendingKey) {
        this.spendingKey = spendingKey;
        this.fullViewingKey = spendingKey.fullViewingKey();
        this.incomingViewingKey = this.fullViewingKey.inViewingKey();
    }
    /**
     * Create from mnemonic phrase
     */
    static async fromMnemonic(mnemonic) {
        const sk = await SaplingSpendingKey.fromMnemonic(mnemonic);
        return new SaplingHDWallet(sk);
    }
    /**
     * Create from spending key
     */
    static fromSpendingKey(sk) {
        return new SaplingHDWallet(sk);
    }
    /**
     * Get spending key (use carefully - this is the master secret!)
     */
    getSpendingKey() {
        return this.spendingKey;
    }
    /**
     * Get full viewing key (safe to store)
     */
    getFullViewingKey() {
        return this.fullViewingKey;
    }
    /**
     * Get incoming viewing key
     */
    getIncomingViewingKey() {
        return this.incomingViewingKey;
    }
    /**
     * Get default payment address
     */
    getDefaultAddress() {
        return this.spendingKey.defaultAddress();
    }
    /**
     * Generate diversified address (can create unlimited)
     */
    generateDiversifiedAddress(index) {
        // Generate deterministic diversifier from index
        const indexBytes = new Uint8Array(4);
        new DataView(indexBytes.buffer).setUint32(0, index, true);
        const diversifier = (0, blake3_js_1.blake3)(new Uint8Array([
            ...this.spendingKey.sk,
            ...indexBytes,
            ...Buffer.from('diversifier', 'utf8')
        ]), { dkLen: exports.SAPLING_DIVERSIFIER_SIZE });
        // Ensure first byte is non-zero
        diversifier[0] = diversifier[0] || 1;
        return this.incomingViewingKey.address(diversifier);
    }
    /**
     * Generate multiple diversified addresses
     */
    generateDiversifiedAddresses(count) {
        const addresses = [];
        for (let i = 0; i < count; i++) {
            addresses.push(this.generateDiversifiedAddress(i));
        }
        return addresses;
    }
}
exports.SaplingHDWallet = SaplingHDWallet;
/**
 * Utility functions for Sapling addresses
 */
class SaplingUtils {
    /**
     * Generate new wallet with mnemonic
     */
    static async generateWallet() {
        const bip39 = await Promise.resolve().then(() => __importStar(require('bip39')));
        const mnemonic = bip39.generateMnemonic(256); // 24 words
        const wallet = await SaplingHDWallet.fromMnemonic(mnemonic);
        return { wallet, mnemonic };
    }
    /**
     * Restore wallet from mnemonic
     */
    static async restoreWallet(mnemonic) {
        return await SaplingHDWallet.fromMnemonic(mnemonic);
    }
    /**
     * Check if address is valid Sapling address
     */
    static isValidAddress(address) {
        try {
            const addr = SaplingPaymentAddress.fromBase58(address);
            return addr.toBytes().length === exports.SAPLING_ADDRESS_SIZE;
        }
        catch {
            return false;
        }
    }
    /**
     * Parse address from various formats
     */
    static parseAddress(address) {
        if (typeof address === 'string') {
            return SaplingPaymentAddress.fromBase58(address);
        }
        else {
            return SaplingPaymentAddress.fromBytes(address);
        }
    }
}
exports.SaplingUtils = SaplingUtils;
//# sourceMappingURL=sapling.js.map