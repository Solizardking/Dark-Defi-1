"use strict";
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
exports.DarkWallet = void 0;
const web3_js_1 = require("@solana/web3.js");
const bip39 = __importStar(require("bip39"));
const bip32_1 = require("bip32");
class DarkWallet {
    constructor(client, keypair) {
        this.notes = new Map();
        this.client = client;
        this.keypair = keypair;
    }
    /**
     * Create wallet from mnemonic
     */
    static async fromMnemonic(client, mnemonic, accountIndex = 0) {
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const path = `m/44'/501'/${accountIndex}'/0'`;
        const derivedSeed = (0, bip32_1.derivePath)(path, seed.toString('hex')).key;
        const keypair = web3_js_1.Keypair.fromSeed(derivedSeed);
        return new DarkWallet(client, keypair);
    }
    /**
     * Create wallet from private key
     */
    static fromPrivateKey(client, privateKey) {
        const keypair = web3_js_1.Keypair.fromSecretKey(privateKey);
        return new DarkWallet(client, keypair);
    }
    /**
     * Generate new wallet
     */
    static async generate(client) {
        const mnemonic = bip39.generateMnemonic(256);
        const wallet = await DarkWallet.fromMnemonic(client, mnemonic);
        return { wallet, mnemonic };
    }
    /**
     * Get public key
     */
    get publicKey() {
        return this.keypair.publicKey;
    }
    /**
     * Initialize shielded address
     */
    async initializeShieldedAddress(viewingKey, spendingKeyCommitment) {
        const tx = await this.client.program.methods
            .createShieldedAddress(Array.from(viewingKey), Array.from(spendingKeyCommitment))
            .accounts({
            payer: this.publicKey,
            systemProgram: web3_js_1.PublicKey.default,
        })
            .signers([this.keypair])
            .rpc();
        // Fetch the created shielded address
        this.shieldedAddress = await this.client.getShieldedAddress(this.publicKey);
        return tx;
    }
    /**
     * Get wallet state
     */
    async getState() {
        const shieldedAddress = await this.client.getShieldedAddress(this.publicKey);
        const transparentBalance = await this.client.connection.getBalance(this.publicKey);
        // Fetch notes
        const notes = [];
        // TODO: Scan blockchain for notes belonging to this wallet
        return {
            shieldedBalance: BigInt(0), // Calculate from notes
            transparentBalance: BigInt(transparentBalance),
            notes,
            pendingNotes: [],
            shieldedAddress: shieldedAddress || undefined,
        };
    }
    /**
     * Shield tokens (move from transparent to shielded)
     */
    async shieldTokens(amount, tokenMint) {
        // Generate commitment and nullifier
        const commitment = new Uint8Array(32);
        const nullifier = new Uint8Array(32);
        crypto.getRandomValues(commitment);
        crypto.getRandomValues(nullifier);
        const tx = await this.client.program.methods
            .shieldTokens(amount, Array.from(commitment), Array.from(nullifier))
            .accounts({
            user: this.publicKey,
            systemProgram: web3_js_1.PublicKey.default,
            tokenProgram: web3_js_1.PublicKey.default,
        })
            .signers([this.keypair])
            .rpc();
        return tx;
    }
    /**
     * Unshield tokens (move from shielded to transparent)
     */
    async unshieldTokens(amount, nullifier, proof) {
        const tx = await this.client.program.methods
            .unshieldTokens(amount, Array.from(nullifier), Array.from(proof))
            .accounts({
            user: this.publicKey,
            tokenProgram: web3_js_1.PublicKey.default,
        })
            .signers([this.keypair])
            .rpc();
        return tx;
    }
    /**
     * Private transfer
     */
    async privateTransfer(recipientAddress, amount, memo) {
        // Generate ZK proof for transfer
        const inputNullifiers = [new Uint8Array(32)];
        const outputCommitments = [new Uint8Array(32)];
        const proof = new Uint8Array(256);
        const encryptedMemo = memo ? Buffer.from(memo) : Buffer.alloc(0);
        const tx = await this.client.program.methods
            .privateTransfer(inputNullifiers.map(n => Array.from(n)), outputCommitments.map(c => Array.from(c)), Array.from(proof), Array.from(encryptedMemo))
            .accounts({
            sender: this.publicKey,
            systemProgram: web3_js_1.PublicKey.default,
        })
            .signers([this.keypair])
            .rpc();
        return tx;
    }
    /**
     * Export wallet
     */
    export() {
        return {
            publicKey: this.publicKey.toBase58(),
            privateKey: Buffer.from(this.keypair.secretKey).toString('hex'),
        };
    }
}
exports.DarkWallet = DarkWallet;
//# sourceMappingURL=wallet.js.map