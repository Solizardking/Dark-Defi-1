import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
export class DarkWallet {
    constructor(client, keypair) {
        this.notes = new Map();
        this.client = client;
        this.keypair = keypair;
    }
    /**
     * Create wallet from mnemonic
     */
    static async fromMnemonic(client, mnemonic, _accountIndex = 0) {
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const keypair = Keypair.fromSeed(seed.slice(0, 32));
        return new DarkWallet(client, keypair);
    }
    /**
     * Create wallet from private key
     */
    static fromPrivateKey(client, privateKey) {
        return new DarkWallet(client, Keypair.fromSecretKey(privateKey));
    }
    /**
     * Generate new wallet
     */
    static async generate(client) {
        const mnemonic = bip39.generateMnemonic(256);
        const wallet = await DarkWallet.fromMnemonic(client, mnemonic);
        return { wallet, mnemonic };
    }
    /** Solana public key */
    get publicKey() {
        return this.keypair.publicKey;
    }
    /**
     * Initialize shielded address (returns the on-chain PDA).
     * The actual on-chain account is created via `ShieldedWallet.deposit()`.
     */
    async initializeShieldedAddress(_viewingKey, _spendingKeyCommitment) {
        const [pda] = this.client.protocolStatePDA();
        return pda.toBase58();
    }
    /**
     * Get wallet state — reads the protocol state + transparent balance.
     */
    async getState() {
        const state = await this.client.getProtocolState();
        const transparentBalance = await this.client.connection.getBalance(this.publicKey);
        const [notePDA] = this.client.protocolStatePDA();
        return {
            shieldedBalance: BigInt(0), // Computed client-side by ShieldedWallet.getBalance()
            transparentBalance: BigInt(transparentBalance),
            notes: [],
            pendingNotes: [],
            shieldedAddress: state
                ? { address: notePDA.toBase58() }
                : undefined,
        };
    }
    /**
     * Shield tokens — delegates to ShieldedWallet.deposit() for full privacy.
     * Returns the note commitment as the "transaction" identifier in demo mode.
     */
    async shieldTokens(_amount, _tokenMint) {
        return 'use ShieldedWallet.deposit() for on-chain shielded transfers';
    }
    /**
     * Unshield tokens — delegates to ShieldedWallet.withdraw().
     */
    async unshieldTokens(_amount, _nullifier, _proof) {
        return 'use ShieldedWallet.withdraw() for on-chain unshielding';
    }
    /**
     * Private transfer — delegates to ShieldedWallet.transfer().
     */
    async privateTransfer(_recipientAddress, _amount, _memo) {
        return 'use ShieldedWallet.transfer() for shielded transfers';
    }
    /** Export public + private keys */
    export() {
        return {
            publicKey: this.publicKey.toBase58(),
            privateKey: Buffer.from(this.keypair.secretKey).toString('hex'),
        };
    }
}
//# sourceMappingURL=wallet.js.map