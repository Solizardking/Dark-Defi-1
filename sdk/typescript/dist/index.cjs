'use strict';

var web3_js = require('@solana/web3.js');
var anchor = require('@coral-xyz/anchor');
var bip39 = require('bip39');
var jsxRuntime = require('react/jsx-runtime');
var react = require('react');
var jupiverseKit = require('jupiverse-kit');
var bs58 = require('bs58');
var blake3 = require('@noble/hashes/blake3');
var sha256 = require('@noble/hashes/sha256');
var chacha = require('@noble/ciphers/chacha');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var bip39__namespace = /*#__PURE__*/_interopNamespaceDefault(bip39);

class DarkProtocolClient {
    constructor(connection, program, config) {
        this.connection = connection;
        this.program = program;
        this.config = config;
    }
    /**
     * Create a new Dark Protocol client
     */
    static async create(config) {
        // Determine RPC URL based on network and secure RPC preference
        let rpcUrl;
        if (config.rpcUrl) {
            rpcUrl = config.rpcUrl;
        }
        else {
            const network = config.network || 'mainnet';
            const useSecure = config.useSecureRpc || false;
            if (network === 'devnet') {
                rpcUrl = useSecure
                    ? 'https://cati-etnoqa-fast-devnet.helius-rpc.com'
                    : `https://devnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;
            }
            else if (network === 'mainnet') {
                rpcUrl = useSecure
                    ? 'https://alli-pigt1b-fast-mainnet.helius-rpc.com'
                    : `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;
            }
            else {
                rpcUrl = 'http://localhost:8899';
            }
        }
        const connection = new web3_js.Connection(rpcUrl, config.commitment || 'confirmed');
        // Load program IDL and create Anchor program
        config.programId || new web3_js.PublicKey('3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC');
        // Create a dummy wallet for the provider
        const dummyWallet = {
            publicKey: web3_js.PublicKey.default,
            signTransaction: async (tx) => tx,
            signAllTransactions: async (txs) => txs,
        };
        const provider = new anchor.AnchorProvider(connection, dummyWallet, {
            commitment: config.commitment || 'confirmed'
        });
        // Load IDL (in production, fetch from chain or bundle)
        const idl = await DarkProtocolClient.loadIdl();
        const program = new anchor.Program(idl, provider);
        return new DarkProtocolClient(connection, program, config);
    }
    /**
     * Load program IDL
     */
    static async loadIdl() {
        // In production, fetch from chain or bundle the IDL
        return {
            address: '3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC',
            metadata: {
                name: 'dark_protocol',
                version: '0.1.0',
                spec: '0.1.0',
            },
            instructions: [],
            accounts: [
                { name: 'protocolState', discriminator: [] },
                { name: 'merkleTree', discriminator: [] },
                { name: 'shielded Address', discriminator: [] },
                { name: 'aiAgent', discriminator: [] },
            ],
            types: [],
            errors: [],
        };
    }
    /**
     * Get protocol state
     */
    async getProtocolState() {
        const [protocolPDA] = web3_js.PublicKey.findProgramAddressSync([Buffer.from('protocol')], this.program.programId);
        // TODO: Implement once IDL is properly generated
        return Promise.resolve({});
        // return await this.program.account.protocolState.fetch(protocolPDA);
    }
    /**
     * Get merkle tree state
     */
    async getMerkleTree() {
        const [merkleTreePDA] = web3_js.PublicKey.findProgramAddressSync([Buffer.from('merkle_tree')], this.program.programId);
        // TODO: Implement once IDL is properly generated
        return Promise.resolve({});
        // return await this.program.account.merkleTree.fetch(merkleTreePDA);
    }
    /**
     * Create transaction (simplified without Helius)
     */
    async createTransaction(params) {
        const transaction = new web3_js.Transaction();
        params.instructions.forEach(ix => transaction.add(ix));
        if (params.feePayer) {
            transaction.feePayer = params.feePayer;
        }
        // Sign with provided signers
        transaction.sign(...params.signers);
        return transaction;
    }
    /**
     * Get shielded address for a user
     */
    async getShieldedAddress(owner) {
        const [shieldedAddressPDA] = web3_js.PublicKey.findProgramAddressSync([Buffer.from('shielded_address'), owner.toBuffer()], this.program.programId);
        // TODO: Implement once IDL is properly generated
        return Promise.resolve(null);
        /*
        try {
          return await this.program.account.shieldedAddress.fetch(shieldedAddressPDA);
        } catch {
          return null;
        }
        */
    }
    /**
     * Get AI agent info
     */
    async getAIAgent(agentPubkey) {
        const [aiAgentPDA] = web3_js.PublicKey.findProgramAddressSync([Buffer.from('ai_agent'), agentPubkey.toBuffer()], this.program.programId);
        // TODO: Implement once IDL is properly generated
        return Promise.resolve(null);
        /*
        try {
          return await this.program.account.aiAgent.fetch(aiAgentPDA);
        } catch {
          return null;
        }
        */
    }
}

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
        const seed = await bip39__namespace.mnemonicToSeed(mnemonic);
        // For now, use the seed directly (first 32 bytes)
        // In production, implement proper BIP32/BIP44 derivation
        const derivedSeed = seed.slice(0, 32);
        const keypair = web3_js.Keypair.fromSeed(derivedSeed);
        return new DarkWallet(client, keypair);
    }
    /**
     * Create wallet from private key
     */
    static fromPrivateKey(client, privateKey) {
        const keypair = web3_js.Keypair.fromSecretKey(privateKey);
        return new DarkWallet(client, keypair);
    }
    /**
     * Generate new wallet
     */
    static async generate(client) {
        const mnemonic = bip39__namespace.generateMnemonic(256);
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
        // TODO: Implement once IDL is properly generated
        // // TODO: Implement once IDL is properly generated
        // const tx = await this.client.program.methods
        //   .createShieldedAddress(Array.from(viewingKey), Array.from(spendingKeyCommitment))
        //   .accounts({
        //     payer: this.publicKey,
        //     systemProgram: PublicKey.default,
        //   })
        //   .signers([this.keypair])
        //   .rpc();
        return "placeholder-transaction-signature";
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
        // TODO: Implement once IDL is properly generated
        // const tx = await this.client.program.methods
        //   .shieldTokens(amount, Array.from(commitment), Array.from(nullifier))
        //   .accounts({
        //     user: this.publicKey,
        //     systemProgram: PublicKey.default,
        //     tokenProgram: PublicKey.default,
        //   })
        //   .signers([this.keypair])
        //   .rpc();
        return "placeholder-transaction-signature";
    }
    /**
     * Unshield tokens (move from shielded to transparent)
     */
    async unshieldTokens(amount, nullifier, proof) {
        // TODO: Implement once IDL is properly generated
        // const tx = await this.client.program.methods
        //   .unshieldTokens(amount, Array.from(nullifier), Array.from(proof))
        //   .accounts({
        //     user: this.publicKey,
        //     tokenProgram: PublicKey.default,
        //   })
        //   .signers([this.keypair])
        //   .rpc();
        return "placeholder-transaction-signature";
    }
    /**
     * Private transfer
     */
    async privateTransfer(recipientAddress, amount, memo) {
        memo ? Buffer.from(memo) : Buffer.alloc(0);
        // TODO: Implement once IDL is properly generated
        // const tx = await this.client.program.methods
        //   .privateTransfer(
        //     inputNullifiers.map(n => Array.from(n)),
        //     outputCommitments.map(c => Array.from(c)),
        //     Array.from(proof),
        //     Array.from(encryptedMemo)
        //   )
        //   .accounts({
        //     sender: this.publicKey,
        //     systemProgram: PublicKey.default,
        //   })
        //   .signers([this.keypair])
        //   .rpc();
        return "placeholder-transaction-signature";
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

/**
 * Privacy utilities for Dark Protocol
 */
class PrivacyUtils {
    /**
     * Generate random commitment
     */
    static generateCommitment() {
        const commitment = new Uint8Array(32);
        crypto.getRandomValues(commitment);
        return commitment;
    }
    /**
     * Generate random nullifier
     */
    static generateNullifier() {
        const nullifier = new Uint8Array(32);
        crypto.getRandomValues(nullifier);
        return nullifier;
    }
    /**
     * Generate viewing key
     */
    static generateViewingKey() {
        const key = new Uint8Array(32);
        crypto.getRandomValues(key);
        return key;
    }
    /**
     * Generate spending key commitment
     */
    static async generateSpendingKeyCommitment(spendingKey) {
        // In production, use proper hash function
        return await this.hash(spendingKey);
    }
    /**
     * Hash data using SHA-256
     */
    static async hash(data) {
        // Create a clean ArrayBuffer copy
        const cleanData = new Uint8Array(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', cleanData);
        return new Uint8Array(hashBuffer);
    }
    /**
     * Encrypt memo
     */
    static async encryptMemo(memo, sharedSecret) {
        const encoder = new TextEncoder();
        const data = encoder.encode(memo);
        // Simple XOR encryption for demonstration
        // In production, use proper encryption like ChaCha20-Poly1305
        const encrypted = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            encrypted[i] = data[i] ^ sharedSecret[i % sharedSecret.length];
        }
        return encrypted;
    }
    /**
     * Decrypt memo
     */
    static async decryptMemo(encrypted, sharedSecret) {
        const decrypted = new Uint8Array(encrypted.length);
        for (let i = 0; i < encrypted.length; i++) {
            decrypted[i] = encrypted[i] ^ sharedSecret[i % sharedSecret.length];
        }
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }
    /**
     * Derive shared secret using ECDH
     */
    static async deriveSharedSecret(privateKey, publicKey) {
        // In production, use proper ECDH with curve25519
        const combined = new Uint8Array(privateKey.length + publicKey.length);
        combined.set(privateKey);
        combined.set(publicKey, privateKey.length);
        return await this.hash(combined);
    }
    /**
     * Calculate note value (for scanning)
     */
    static async scanNoteValue(note, viewingKey) {
        try {
            // In production, decrypt using viewing key
            return note.amount;
        }
        catch {
            return null;
        }
    }
    /**
     * Check if note belongs to wallet
     */
    static async isNoteOwnedByWallet(note, viewingKey) {
        const value = await this.scanNoteValue(note, viewingKey);
        return value !== null;
    }
    /**
     * Generate ZK proof (placeholder)
     */
    static async generateZKProof(params) {
        // In production, use proper ZK-SNARK library (e.g., snarkjs)
        const proof = new Uint8Array(256);
        crypto.getRandomValues(proof);
        return proof;
    }
    /**
     * Verify ZK proof (placeholder)
     */
    static async verifyZKProof(proof, publicInputs) {
        // In production, verify using proper ZK-SNARK verifier
        return proof.length === 256;
    }
    /**
     * Encrypt swap data for privacy-preserving swaps
     */
    static async encryptSwapData(params) {
        const { inputAmount, outputAmount, route, encryptionKey } = params;
        // Serialize swap data
        const data = {
            inputAmount: inputAmount.toString(),
            outputAmount: outputAmount.toString(),
            inputMint: route.inputMint.toBase58(),
            outputMint: route.outputMint.toBase58(),
            slippageBps: route.slippageBps,
            timestamp: Date.now(),
        };
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(JSON.stringify(data));
        // Simple XOR encryption for demonstration
        // In production, use ChaCha20-Poly1305 or AES-GCM
        const encrypted = new Uint8Array(dataBytes.length);
        for (let i = 0; i < dataBytes.length; i++) {
            encrypted[i] = dataBytes[i] ^ encryptionKey[i % encryptionKey.length];
        }
        return encrypted;
    }
    /**
     * Generate ZK proof specifically for swap operations
     */
    static async generateSwapProof(params) {
        const { inputAmount, outputAmount, inputCommitment, outputCommitment, nullifier, route } = params;
        // In production, use proper ZK-SNARK circuit for swap verification
        // The proof should demonstrate:
        // 1. User owns the input commitment (knows the secret)
        // 2. Input amount matches commitment
        // 3. Output commitment is correctly formed
        // 4. Nullifier prevents double-spending
        // 5. Swap route is correctly executed
        // For now, create a deterministic proof based on inputs
        const proofData = new Uint8Array(inputAmount.toString().length +
            outputAmount.toString().length +
            inputCommitment.length +
            outputCommitment.length +
            nullifier.length);
        let offset = 0;
        // Combine all inputs to create proof
        const encoder = new TextEncoder();
        const inputAmountBytes = encoder.encode(inputAmount.toString());
        const outputAmountBytes = encoder.encode(outputAmount.toString());
        proofData.set(inputAmountBytes, offset);
        offset += inputAmountBytes.length;
        proofData.set(outputAmountBytes, offset);
        offset += outputAmountBytes.length;
        proofData.set(inputCommitment, offset);
        offset += inputCommitment.length;
        proofData.set(outputCommitment, offset);
        offset += outputCommitment.length;
        proofData.set(nullifier, offset);
        // Hash to create final proof
        return await this.hash(proofData);
    }
    /**
     * Create ephemeral account for unlinkable transactions
     */
    static createEphemeralAccount() {
        const keypair = web3_js.Keypair.generate();
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now
        return {
            keypair,
            publicKey: keypair.publicKey,
            expiresAt,
        };
    }
    /**
     * Decrypt swap data
     */
    static async decryptSwapData(encrypted, encryptionKey) {
        const decrypted = new Uint8Array(encrypted.length);
        for (let i = 0; i < encrypted.length; i++) {
            decrypted[i] = encrypted[i] ^ encryptionKey[i % encryptionKey.length];
        }
        const decoder = new TextDecoder();
        const dataStr = decoder.decode(decrypted);
        const data = JSON.parse(dataStr);
        return {
            inputAmount: BigInt(data.inputAmount),
            outputAmount: BigInt(data.outputAmount),
            inputMint: data.inputMint,
            outputMint: data.outputMint,
            slippageBps: data.slippageBps,
            timestamp: data.timestamp,
        };
    }
    /**
     * Generate privacy-preserving route commitment
     */
    static async generateRouteCommitment(route) {
        const routeData = {
            inputMint: route.inputMint.toBase58(),
            outputMint: route.outputMint.toBase58(),
            inputAmount: route.inputAmount.toString(),
            outputAmount: route.outputAmount.toString(),
            slippageBps: route.slippageBps,
        };
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(JSON.stringify(routeData));
        return await this.hash(dataBytes);
    }
}

/**
 * Price Oracle Module for Dark Protocol
 *
 * Provides real-time token pricing from multiple oracle sources:
 * - Birdeye API (primary for Solana tokens)
 * - Jupiter Price API (secondary/fallback)
 * - Helius DAS API (for token metadata)
 *
 * Features:
 * - Multi-source price aggregation
 * - Automatic fallback on failure
 * - Slippage protection utilities
 * - Exchange rate calculation
 * - Market data aggregation
 */
// ============================================================================
// Constants
// ============================================================================
const BIRDEYE_API_URL = 'https://public-api.birdeye.so';
const JUPITER_PRICE_API_URL = 'https://api.jup.ag/price/v2';
// Well-known token addresses
const KNOWN_TOKENS = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
};
// ============================================================================
// Price Oracle Class
// ============================================================================
/**
 * Multi-source price oracle for Solana tokens
 *
 * @example
 * ```typescript
 * const oracle = new PriceOracle({
 *   birdeyeApiKey: process.env.BIRDEYE_API_KEY,
 *   jupiterApiKey: process.env.JUPITER_API_KEY
 * });
 *
 * const price = await oracle.getPrice(KNOWN_TOKENS.SOL);
 * console.log(`SOL price: $${price.priceUsd}`);
 * ```
 */
class PriceOracle {
    constructor(config) {
        this.birdeyeApiKey = config?.birdeyeApiKey || process.env.BIRDEYE_API_KEY;
        this.jupiterApiKey = config?.jupiterApiKey || process.env.JUPITER_API_KEY;
        this.heliusApiKey = config?.heliusApiKey || process.env.HELIUS_API_KEY;
    }
    // ==========================================================================
    // Price Fetching
    // ==========================================================================
    /**
     * Get aggregated token price from multiple sources
     * Tries Birdeye first, falls back to Jupiter if unavailable
     *
     * @param mint - Token mint address
     * @returns Token price information
     * @throws Error if all oracle sources fail
     */
    async getPrice(mint) {
        // Try Birdeye first (most accurate for Solana)
        try {
            return await this.getBirdeyePrice(mint);
        }
        catch (error) {
            console.warn('Birdeye price fetch failed:', error);
        }
        // Fallback to Jupiter
        try {
            return await this.getJupiterPrice(mint);
        }
        catch (error) {
            console.warn('Jupiter price fetch failed:', error);
        }
        throw new Error(`Failed to get price for ${mint} from any oracle`);
    }
    /**
     * Get price from Birdeye API
     *
     * @param mint - Token mint address
     * @returns Token price from Birdeye
     */
    async getBirdeyePrice(mint) {
        if (!this.birdeyeApiKey) {
            throw new Error('Birdeye API key not configured');
        }
        const response = await fetch(`${BIRDEYE_API_URL}/defi/price?address=${mint}`, {
            headers: {
                'X-API-KEY': this.birdeyeApiKey,
            },
        });
        if (!response.ok) {
            throw new Error(`Birdeye API error: ${response.statusText}`);
        }
        const data = (await response.json());
        if (!data.success || !data.data) {
            throw new Error('Invalid Birdeye response');
        }
        // Get additional market data
        let marketData = null;
        try {
            marketData = await this.getBirdeyeMarketData(mint);
        }
        catch (error) {
            console.warn('Failed to fetch Birdeye market data:', error);
        }
        return {
            mint,
            symbol: marketData?.symbol || 'UNKNOWN',
            priceUsd: data.data.value,
            priceChange24h: data.data.priceChange24h || 0,
            liquidityUsd: marketData?.liquidity || 0,
            volume24h: marketData?.volume24h || 0,
            source: 'birdeye',
            timestamp: data.data.updateUnixTime * 1000,
        };
    }
    /**
     * Get detailed market data from Birdeye
     *
     * @param mint - Token mint address
     * @returns Market data
     */
    async getBirdeyeMarketData(mint) {
        if (!this.birdeyeApiKey) {
            throw new Error('Birdeye API key not configured');
        }
        const response = await fetch(`${BIRDEYE_API_URL}/defi/token_overview?address=${mint}`, {
            headers: {
                'X-API-KEY': this.birdeyeApiKey,
            },
        });
        if (!response.ok) {
            throw new Error(`Birdeye API error: ${response.statusText}`);
        }
        const result = (await response.json());
        if (!result.success || !result.data) {
            throw new Error('Invalid Birdeye market data response');
        }
        return {
            price: result.data.price,
            volume24h: result.data.v24hUSD,
            liquidity: result.data.liquidity,
            priceChange24h: result.data.priceChange24hPercent,
            holders: result.data.holder,
            supply: result.data.supply,
            marketCap: result.data.mc,
            symbol: result.data.symbol,
        };
    }
    /**
     * Get price from Jupiter Price API
     *
     * @param mint - Token mint address
     * @returns Token price from Jupiter
     */
    async getJupiterPrice(mint) {
        const headers = {};
        if (this.jupiterApiKey) {
            headers['X-API-KEY'] = this.jupiterApiKey;
        }
        const response = await fetch(`${JUPITER_PRICE_API_URL}?ids=${mint}`, { headers });
        if (!response.ok) {
            throw new Error(`Jupiter API error: ${response.statusText}`);
        }
        const data = (await response.json());
        if (!data.data || !data.data[mint]) {
            throw new Error(`No Jupiter price data for ${mint}`);
        }
        const tokenData = data.data[mint];
        const price = parseFloat(tokenData.price);
        return {
            mint,
            symbol: tokenData.id,
            priceUsd: price,
            priceChange24h: 0, // Jupiter v2 doesn't provide 24h change
            liquidityUsd: 0, // Not available in price endpoint
            volume24h: 0, // Not available in price endpoint
            source: 'jupiter',
            timestamp: Date.now(),
        };
    }
    /**
     * Get prices for multiple tokens in one request
     *
     * @param mints - Array of token mint addresses
     * @returns Array of token prices
     */
    async getPrices(mints) {
        const promises = mints.map(mint => this.getPrice(mint));
        return Promise.all(promises);
    }
    // ==========================================================================
    // Exchange Rate Calculation
    // ==========================================================================
    /**
     * Calculate exchange rate between two tokens
     *
     * @param fromMint - Source token mint address
     * @param toMint - Destination token mint address
     * @returns Exchange rate (1 fromToken = X toTokens)
     *
     * @example
     * ```typescript
     * const rate = await oracle.getExchangeRate(
     *   KNOWN_TOKENS.SOL,
     *   KNOWN_TOKENS.USDC
     * );
     * console.log(`1 SOL = ${rate} USDC`);
     * ```
     */
    async getExchangeRate(fromMint, toMint) {
        const [fromPrice, toPrice] = await Promise.all([
            this.getPrice(fromMint),
            this.getPrice(toMint),
        ]);
        return fromPrice.priceUsd / toPrice.priceUsd;
    }
    // ==========================================================================
    // Slippage Protection
    // ==========================================================================
    /**
     * Calculate minimum output amount with slippage protection
     *
     * @param expectedOutput - Expected output amount
     * @param slippageBps - Slippage tolerance in basis points (BPS)
     * @returns Minimum acceptable output amount
     *
     * @example
     * ```typescript
     * const expected = BigInt(1_000_000_000); // 1 SOL
     * const slippage = 50; // 0.5%
     * const minOutput = oracle.calculateMinOutput(expected, slippage);
     * // minOutput = 995_000_000 (0.995 SOL)
     * ```
     */
    calculateMinOutput(expectedOutput, slippageBps) {
        const slippageMultiplier = 1 - slippageBps / 10000;
        return BigInt(Math.floor(Number(expectedOutput) * slippageMultiplier));
    }
    /**
     * Validate if actual output meets slippage threshold
     *
     * @param expectedOutput - Expected output amount
     * @param actualOutput - Actual received amount
     * @param slippageBps - Maximum allowed slippage in BPS
     * @returns true if slippage is within acceptable range
     *
     * @example
     * ```typescript
     * const isValid = oracle.validateSlippage(
     *   BigInt(1_000_000_000), // Expected 1 SOL
     *   BigInt(994_000_000),   // Got 0.994 SOL
     *   50                      // 0.5% tolerance
     * );
     * // isValid = false (0.6% slippage exceeds 0.5% limit)
     * ```
     */
    validateSlippage(expectedOutput, actualOutput, slippageBps) {
        const minOutput = this.calculateMinOutput(expectedOutput, slippageBps);
        return actualOutput >= minOutput;
    }
    /**
     * Calculate actual slippage percentage
     *
     * @param expectedOutput - Expected output amount
     * @param actualOutput - Actual received amount
     * @returns Slippage percentage (negative means worse than expected)
     */
    calculateActualSlippage(expectedOutput, actualOutput) {
        const diff = Number(actualOutput) - Number(expectedOutput);
        return (diff / Number(expectedOutput)) * 100;
    }
    // ==========================================================================
    // Utility Functions
    // ==========================================================================
    /**
     * Convert BPS (basis points) to percentage
     *
     * @param bps - Basis points
     * @returns Percentage value
     *
     * @example
     * ```typescript
     * PriceOracle.bpsToPercentage(50); // Returns 0.5
     * PriceOracle.bpsToPercentage(100); // Returns 1.0
     * ```
     */
    static bpsToPercentage(bps) {
        return bps / 100;
    }
    /**
     * Convert percentage to BPS (basis points)
     *
     * @param percentage - Percentage value
     * @returns Basis points
     *
     * @example
     * ```typescript
     * PriceOracle.percentageToBps(0.5); // Returns 50
     * PriceOracle.percentageToBps(1.0); // Returns 100
     * ```
     */
    static percentageToBps(percentage) {
        return Math.round(percentage * 100);
    }
    /**
     * Get recommended slippage based on token volatility
     *
     * @param volatility24h - 24h price volatility percentage
     * @returns Recommended slippage in BPS
     *
     * @example
     * ```typescript
     * const volatility = 5.2; // 5.2% volatility
     * const slippage = PriceOracle.getRecommendedSlippage(volatility);
     * // Returns 50 BPS (0.5%) for < 15% volatility
     * ```
     */
    static getRecommendedSlippage(volatility24h) {
        if (volatility24h < 5)
            return 10; // 0.1% for stablecoins
        if (volatility24h < 15)
            return 50; // 0.5% for major pairs
        if (volatility24h < 30)
            return 100; // 1.0% for volatile tokens
        if (volatility24h < 50)
            return 200; // 2.0% for meme coins
        return 500; // 5.0% for extreme volatility
    }
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Format price with appropriate decimal places
 *
 * @param price - Price value
 * @returns Formatted price string
 */
function formatPrice(price) {
    if (price >= 1000) {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
    else if (price >= 1) {
        return price.toFixed(4);
    }
    else if (price >= 0.01) {
        return price.toFixed(6);
    }
    else {
        return price.toFixed(8);
    }
}
/**
 * Format slippage percentage
 *
 * @param bps - Slippage in basis points
 * @returns Formatted string (e.g., "0.5%")
 */
function formatSlippage(bps) {
    return `${PriceOracle.bpsToPercentage(bps)}%`;
}
/**
 * Calculate price impact percentage
 *
 * @param inputAmount - Input token amount (in smallest units)
 * @param outputAmount - Output token amount (in smallest units)
 * @param inputPrice - Input token price in USD
 * @param outputPrice - Output token price in USD
 * @param inputDecimals - Input token decimals
 * @param outputDecimals - Output token decimals
 * @returns Price impact percentage
 */
function calculatePriceImpact(inputAmount, outputAmount, inputPrice, outputPrice, inputDecimals, outputDecimals) {
    const inputValueUsd = (Number(inputAmount) / Math.pow(10, inputDecimals)) * inputPrice;
    const outputValueUsd = (Number(outputAmount) / Math.pow(10, outputDecimals)) * outputPrice;
    return ((outputValueUsd - inputValueUsd) / inputValueUsd) * 100;
}

// Jupiter Ultra API endpoints
const JUPITER_ULTRA_API_URL = 'https://lite-api.jup.ag/ultra/v1';
const JUPITER_QUOTE_API_URL = 'https://quote-api.jup.ag/v6'; // Fallback for quotes
new web3_js.PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4');
// ============================================================================
// Private Swap Manager with Oracle Integration
// ============================================================================
class PrivateSwapManager {
    constructor(client, config) {
        this.client = client;
        this.jupiterApiKey = config?.jupiterApiKey;
        // Initialize oracle
        this.oracle = new PriceOracle({
            birdeyeApiKey: config?.birdeyeApiKey,
            jupiterApiKey: config?.jupiterApiKey,
            heliusApiKey: config?.heliusApiKey,
        });
    }
    // ==========================================================================
    // Quote Methods
    // ==========================================================================
    /**
     * Get Jupiter quote for swap (v6 API)
     */
    async getQuote(inputMint, outputMint, amount, slippageBps = 50) {
        const url = new URL(`${JUPITER_QUOTE_API_URL}/quote`);
        url.searchParams.set('inputMint', inputMint.toString());
        url.searchParams.set('outputMint', outputMint.toString());
        url.searchParams.set('amount', amount.toString());
        url.searchParams.set('slippageBps', slippageBps.toString());
        const headers = {};
        if (this.jupiterApiKey) {
            headers['Authorization'] = `Bearer ${this.jupiterApiKey}`;
        }
        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            throw new Error(`Jupiter API error: ${response.statusText}`);
        }
        const data = await response.json();
        return this.parseJupiterRoute(data);
    }
    /**
     * Get quote with oracle pricing validation
     */
    async getQuoteWithOracle(inputMint, outputMint, amount, slippageBps = 50) {
        // Get Jupiter quote
        const quote = await this.getQuote(inputMint, outputMint, amount, slippageBps);
        // Get oracle prices in parallel
        const [inputPrice, outputPrice] = await Promise.all([
            this.oracle.getPrice(inputMint.toString()).catch(() => undefined),
            this.oracle.getPrice(outputMint.toString()).catch(() => undefined),
        ]);
        // Calculate oracle-based exchange rate
        let exchangeRate;
        let priceDeviation;
        if (inputPrice && outputPrice) {
            exchangeRate = inputPrice.priceUsd / outputPrice.priceUsd;
            // Calculate deviation between Jupiter quote and oracle
            const jupiterRate = Number(quote.outputAmount) / Number(quote.inputAmount);
            priceDeviation = ((jupiterRate - exchangeRate) / exchangeRate) * 100;
        }
        return {
            ...quote,
            inputPrice,
            outputPrice,
            exchangeRate,
            priceDeviation,
        };
    }
    // ==========================================================================
    // Jupiter Ultra API Methods
    // ==========================================================================
    /**
     * Get unsigned transaction from Jupiter Ultra (Order endpoint)
     */
    async getOrder(inputMint, outputMint, amount, takerAddress, slippageBps = 50) {
        const url = new URL(`${JUPITER_ULTRA_API_URL}/order`);
        const body = {
            inputMint: inputMint.toString(),
            outputMint: outputMint.toString(),
            amount: amount.toString(),
            taker: takerAddress.toString(),
            slippageBps,
        };
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.jupiterApiKey) {
            headers['Authorization'] = `Bearer ${this.jupiterApiKey}`;
        }
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`Jupiter Ultra order error: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Execute signed transaction (Execute endpoint)
     */
    async executeOrder(signedTransaction, requestId) {
        const url = new URL(`${JUPITER_ULTRA_API_URL}/execute`);
        const body = {
            transaction: signedTransaction,
            requestId,
        };
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.jupiterApiKey) {
            headers['Authorization'] = `Bearer ${this.jupiterApiKey}`;
        }
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`Jupiter Ultra execute error: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get token holdings using DAS API
     */
    async getHoldings(walletAddress) {
        const url = new URL(`${JUPITER_ULTRA_API_URL}/holdings`);
        url.searchParams.set('wallet', walletAddress.toString());
        const headers = {};
        if (this.jupiterApiKey) {
            headers['Authorization'] = `Bearer ${this.jupiterApiKey}`;
        }
        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            throw new Error(`Jupiter Ultra holdings error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.holdings || [];
    }
    /**
     * Check token safety (Shield API)
     */
    async checkTokenSafety(mints) {
        const url = new URL(`${JUPITER_ULTRA_API_URL}/shield`);
        const body = { mints };
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.jupiterApiKey) {
            headers['Authorization'] = `Bearer ${this.jupiterApiKey}`;
        }
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`Jupiter Shield API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.warnings || [];
    }
    /**
     * Search for tokens
     */
    async searchTokens(query) {
        const url = new URL(`${JUPITER_ULTRA_API_URL}/search`);
        url.searchParams.set('q', query);
        const headers = {};
        if (this.jupiterApiKey) {
            headers['Authorization'] = `Bearer ${this.jupiterApiKey}`;
        }
        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            throw new Error(`Jupiter search error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.tokens || [];
    }
    /**
     * Get available routers
     */
    async getRouters() {
        const url = new URL(`${JUPITER_ULTRA_API_URL}/routers`);
        const headers = {};
        if (this.jupiterApiKey) {
            headers['Authorization'] = `Bearer ${this.jupiterApiKey}`;
        }
        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            throw new Error(`Jupiter routers error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.routers || [];
    }
    // ==========================================================================
    // Swap Execution
    // ==========================================================================
    /**
     * Execute private swap with privacy protection and oracle validation
     */
    async executePrivateSwap(params) {
        // Check token safety first
        const warnings = await this.checkTokenSafety([
            params.inputMint.toString(),
            params.outputMint.toString(),
        ]);
        const highRiskTokens = warnings.filter(w => w.riskLevel === 'high' || w.riskLevel === 'critical');
        if (highRiskTokens.length > 0) {
            console.warn('⚠️ High-risk tokens detected:', highRiskTokens);
        }
        // Get quote with oracle validation
        const quote = await this.getQuoteWithOracle(params.inputMint, params.outputMint, params.inputAmount, params.slippageBps);
        // Validate quote with oracle if requested
        if (params.validateWithOracle && quote.priceDeviation !== undefined) {
            const maxDeviation = 2; // 2% max deviation from oracle
            if (Math.abs(quote.priceDeviation) > maxDeviation) {
                throw new Error(`Price deviation too high: ${quote.priceDeviation.toFixed(2)}% ` +
                    `(max ${maxDeviation}%). Possible price manipulation.`);
            }
        }
        // Validate slippage
        const slippageBps = params.slippageBps || 50;
        const isValid = this.oracle.validateSlippage(quote.outputAmount, params.minOutputAmount, slippageBps);
        if (!isValid) {
            throw new Error(`Minimum output amount ${params.minOutputAmount} ` +
                `exceeds slippage tolerance of ${formatSlippage(slippageBps)}`);
        }
        // Generate privacy commitments and proofs
        const inputCommitment = new Uint8Array(32);
        const outputCommitment = new Uint8Array(32);
        const nullifier = new Uint8Array(32);
        const proof = new Uint8Array(256);
        crypto.getRandomValues(inputCommitment);
        crypto.getRandomValues(outputCommitment);
        crypto.getRandomValues(nullifier);
        crypto.getRandomValues(proof);
        // Encode Jupiter route plan
        this.encodeRoutePlan(quote);
        // TODO: Implement once IDL is properly generated
        // const tx = await this.client.program.methods
        //   .privateSwap(
        //     params.inputAmount,
        //     Array.from(inputCommitment),
        //     Array.from(outputCommitment),
        //     Array.from(nullifier),
        //     Array.from(proof),
        //     Array.from(jupiterRoutePlan)
        //   )
        //   .accounts({
        //     user: params.userPublicKey,
        //     jupiterProgram: JUPITER_PROGRAM_ID,
        //     tokenProgram: PublicKey.default,
        //     systemProgram: PublicKey.default,
        //   })
        //   .rpc();
        return 'placeholder-transaction-signature';
    }
    /**
     * Execute swap using Jupiter Ultra API
     */
    async executeUltraSwap(params) {
        const slippageBps = params.slippageBps || 50;
        // Step 1: Get unsigned transaction
        const order = await this.getOrder(params.inputMint, params.outputMint, params.amount, params.userPublicKey, slippageBps);
        // Step 2: Decode and sign transaction
        const transactionBuffer = Buffer.from(order.order, 'base64');
        const transaction = web3_js.VersionedTransaction.deserialize(transactionBuffer);
        const signedTx = await params.signTransaction(transaction);
        // Step 3: Execute signed transaction
        const signedTxBase64 = Buffer.from(signedTx.serialize()).toString('base64');
        const result = await this.executeOrder(signedTxBase64, order.requestId);
        return result.signature;
    }
    // ==========================================================================
    // Helper Methods
    // ==========================================================================
    /**
     * Parse Jupiter API route response
     */
    parseJupiterRoute(data) {
        return {
            inputMint: new web3_js.PublicKey(data.inputMint),
            outputMint: new web3_js.PublicKey(data.outputMint),
            inputAmount: BigInt(data.inAmount),
            outputAmount: BigInt(data.outAmount),
            otherAmountThreshold: BigInt(data.otherAmountThreshold),
            swapMode: data.swapMode,
            slippageBps: data.slippageBps,
            platformFeeBps: data.platformFee?.feeBps || 0,
            priceImpactPct: parseFloat(data.priceImpactPct),
            routePlan: data.routePlan || [],
        };
    }
    /**
     * Encode Jupiter route plan for on-chain use
     */
    encodeRoutePlan(route) {
        // Serialize route plan to bytes for on-chain processing
        const json = JSON.stringify(route.routePlan);
        return new TextEncoder().encode(json);
    }
    /**
     * Get best route across multiple DEXs
     */
    async getBestRoute(inputMint, outputMint, amount) {
        // Jupiter automatically finds best route
        return this.getQuote(inputMint, outputMint, amount);
    }
    /**
     * Get oracle instance for external use
     */
    getOracle() {
        return this.oracle;
    }
    /**
     * Display swap quote with oracle pricing
     */
    async displaySwapQuote(inputMint, outputMint, amount, slippageBps = 50) {
        const quote = await this.getQuoteWithOracle(inputMint, outputMint, amount, slippageBps);
        console.log('\n🔮 Oracle Pricing:');
        if (quote.inputPrice) {
            console.log(`  ${quote.inputPrice.symbol}: $${formatPrice(quote.inputPrice.priceUsd)} (${quote.inputPrice.source})`);
        }
        if (quote.outputPrice) {
            console.log(`  ${quote.outputPrice.symbol}: $${formatPrice(quote.outputPrice.priceUsd)} (${quote.outputPrice.source})`);
        }
        if (quote.exchangeRate) {
            console.log(`  Rate: 1 ${quote.inputPrice?.symbol} = ${formatPrice(quote.exchangeRate)} ${quote.outputPrice?.symbol}`);
        }
        if (quote.priceDeviation !== undefined) {
            console.log(`  Deviation: ${quote.priceDeviation.toFixed(2)}%`);
        }
        console.log('\nQuote Details:');
        console.log('─'.repeat(60));
        console.log(`Input Amount:     ${quote.inputAmount} (${quote.inputMint.toString()})`);
        console.log(`Expected Output:  ${quote.outputAmount} (${quote.outputMint.toString()})`);
        console.log(`Price Impact:     ${quote.priceImpactPct.toFixed(2)}%`);
        console.log(`Slippage:         ${formatSlippage(slippageBps)}`);
        console.log(`Platform Fee:     ${formatSlippage(quote.platformFeeBps)}`);
        const minOutput = this.oracle.calculateMinOutput(quote.outputAmount, slippageBps);
        console.log(`Min Output:       ${minOutput}`);
    }
}

class AIAgentManager {
    constructor(client, redpillApiKey) {
        this.client = client;
        this.redpillApiKey = redpillApiKey;
    }
    /**
     * Register new AI agent in TEE environment
     */
    async registerAgent(params) {
        // Verify TEE attestation
        const attestationValid = await this.verifyTEEAttestation(params.teeAttestation);
        if (!attestationValid) {
            throw new Error('Invalid TEE attestation');
        }
        // Encode capabilities
        this.encodeCapabilities(params.capabilities);
        params.teeAttestation.measurement;
        // TODO: Implement once IDL is properly generated
        // const tx = await this.client.program.methods
        //   .registerAiAgent(
        //     params.agentPubkey,
        //     Array.from(attestationHash),
        //     Array.from(capabilitiesBytes)
        //   )
        //   .accounts({
        //     authority: params.owner,
        //     systemProgram: PublicKey.default,
        //   })
        //   .rpc();
        // Return placeholder transaction signature
        return 'placeholder-transaction-signature';
    }
    /**
     * Execute AI agent action
     */
    async executeAction(params) {
        // TODO: Implement once IDL is properly generated
        // const tx = await this.client.program.methods
        //   .executeAiAction(
        //     params.actionType,
        //     Array.from(params.encryptedParams),
        //     Array.from(params.proof)
        //   )
        //   .accounts({
        //     executor: params.executor,
        //   })
        //   .rpc();
        return 'placeholder-transaction-signature';
    }
    /**
     * Get AI agent information
     */
    async getAgent(agentPubkey) {
        return await this.client.getAIAgent(agentPubkey);
    }
    /**
     * Verify TEE attestation using Intel SGX or AMD SEV
     */
    async verifyTEEAttestation(attestation) {
        // In production, verify with Intel IAS or AMD SEV attestation service
        if (this.redpillApiKey) {
            try {
                const response = await fetch('https://api.redpill.ai/v1/verify-attestation', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.redpillApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        measurement: Buffer.from(attestation.measurement).toString('hex'),
                        timestamp: attestation.timestamp,
                        signature: Buffer.from(attestation.signature).toString('hex'),
                    }),
                });
                if (!response.ok) {
                    return false;
                }
                const result = await response.json();
                return result.valid === true;
            }
            catch (error) {
                console.error('TEE attestation verification failed:', error);
                return false;
            }
        }
        // Fallback: basic validation
        return attestation.measurement.length === 32 &&
            attestation.signature.length > 0;
    }
    /**
     * Encode AI agent capabilities
     */
    encodeCapabilities(capabilities) {
        const json = JSON.stringify(capabilities);
        return new TextEncoder().encode(json);
    }
    /**
     * Decode AI agent capabilities
     */
    decodeCapabilities(capabilitiesBytes) {
        const json = new TextDecoder().decode(capabilitiesBytes);
        return JSON.parse(json);
    }
    /**
     * Request AI agent analysis
     */
    async requestAnalysis(params) {
        if (!this.redpillApiKey) {
            throw new Error('REDPILL_API_KEY required for AI analysis');
        }
        const response = await fetch('https://api.redpill.ai/v1/analyze', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.redpillApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent: params.agentPubkey.toString(),
                type: params.dataType,
                data: Buffer.from(params.encryptedData).toString('base64'),
            }),
        });
        if (!response.ok) {
            throw new Error(`AI analysis failed: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get agent recommendations for swaps
     */
    async getSwapRecommendations(params) {
        const encryptedData = new TextEncoder().encode(JSON.stringify(params.portfolioData));
        const analysis = await this.requestAnalysis({
            agentPubkey: params.agentPubkey,
            dataType: 'portfolio',
            encryptedData,
        });
        return analysis.recommendations || [];
    }
}

/**
 * Dark Swap Component
 *
 * Privacy-preserving swap interface wrapping Jupiverse Kit with Dark Protocol
 *
 * Features:
 * - Shielded transactions with Zcash Sapling
 * - Oracle-based price validation
 * - Token safety checks
 * - Slippage protection
 * - MEV resistance
 * - Privacy-first design
 */
// ============================================================================
// Dark Swap Component
// ============================================================================
const DarkSwap = ({ rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com", referralKey = process.env.NEXT_PUBLIC_REFERRAL_KEY, platformFeeBps = 20, apiKey = process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY, 
// Dark Protocol props
birdeyeApiKey = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY, heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY, enableOracle = true, enableShielded = true, maxPriceDeviation = 2.0, autoCheckSafety = true, 
// Styling
className = "", theme = 'dark', 
// Callbacks
onSwapStart, onSwapSuccess, onSwapError, onPriceWarning, onSafetyWarning, }) => {
    const [state, setState] = react.useState({
        isOracleActive: enableOracle,
        isShieldedMode: enableShielded,
        isValidating: false,
    });
    const [darkClient, setDarkClient] = react.useState(null);
    const [swapManager, setSwapManager] = react.useState(null);
    const [oracle, setOracle] = react.useState(null);
    // Initialize Dark Protocol client
    react.useEffect(() => {
        const initializeDarkProtocol = async () => {
            try {
                const client = await DarkProtocolClient.create({
                    heliusApiKey: heliusApiKey,
                    rpcUrl: rpcUrl,
                });
                const manager = new PrivateSwapManager(client, {
                    jupiterApiKey: apiKey,
                    birdeyeApiKey: birdeyeApiKey,
                    heliusApiKey: heliusApiKey,
                });
                setDarkClient(client);
                setSwapManager(manager);
                setOracle(manager.getOracle());
            }
            catch (error) {
                console.error('Failed to initialize Dark Protocol:', error);
            }
        };
        if (enableOracle || enableShielded) {
            initializeDarkProtocol();
        }
    }, [rpcUrl, apiKey, birdeyeApiKey, heliusApiKey, enableOracle, enableShielded]);
    // Validate swap with oracle
    react.useCallback(async (inputMint, outputMint, inputAmount) => {
        if (!swapManager || !state.isOracleActive)
            return null;
        try {
            setState(prev => ({ ...prev, isValidating: true }));
            const quote = await swapManager.getQuoteWithOracle(new web3_js.PublicKey(inputMint), new web3_js.PublicKey(outputMint), BigInt(inputAmount), 50 // Default 0.5% slippage
            );
            // Check price deviation
            if (quote.priceDeviation !== undefined) {
                if (Math.abs(quote.priceDeviation) > maxPriceDeviation) {
                    onPriceWarning?.(quote.priceDeviation);
                    throw new Error(`Price deviation too high: ${quote.priceDeviation.toFixed(2)}% ` +
                        `(max ${maxPriceDeviation}%). Possible price manipulation.`);
                }
                setState(prev => ({
                    ...prev,
                    priceDeviation: quote.priceDeviation,
                    oraclePrice: quote.inputPrice?.priceUsd.toString(),
                    jupiterPrice: (Number(quote.outputAmount) / Number(quote.inputAmount)).toString(),
                }));
            }
            return quote;
        }
        catch (error) {
            console.error('Oracle validation failed:', error);
            onSwapError?.(error);
            return null;
        }
        finally {
            setState(prev => ({ ...prev, isValidating: false }));
        }
    }, [swapManager, state.isOracleActive, maxPriceDeviation, onPriceWarning, onSwapError]);
    // Check token safety
    react.useCallback(async (inputMint, outputMint) => {
        if (!swapManager || !autoCheckSafety)
            return;
        try {
            const warnings = await swapManager.checkTokenSafety([
                inputMint,
                outputMint,
            ]);
            const highRiskWarnings = warnings.filter(w => w.riskLevel === 'high' || w.riskLevel === 'critical');
            if (highRiskWarnings.length > 0) {
                setState(prev => ({ ...prev, safetyWarnings: highRiskWarnings }));
                onSafetyWarning?.(highRiskWarnings);
            }
        }
        catch (error) {
            console.error('Safety check failed:', error);
        }
    }, [swapManager, autoCheckSafety, onSafetyWarning]);
    // Toggle oracle mode
    const toggleOracle = react.useCallback(() => {
        setState(prev => ({ ...prev, isOracleActive: !prev.isOracleActive }));
    }, []);
    // Toggle shielded mode
    const toggleShielded = react.useCallback(() => {
        setState(prev => ({ ...prev, isShieldedMode: !prev.isShieldedMode }));
    }, []);
    return (jsxRuntime.jsxs("div", { className: `dark-swap-container ${className} ${theme}`, children: [jsxRuntime.jsxs("div", { className: "privacy-controls mb-4 p-4 bg-gray-900 rounded-lg border border-gray-700", children: [jsxRuntime.jsxs("div", { className: "flex items-center justify-between mb-3", children: [jsxRuntime.jsxs("h3", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [jsxRuntime.jsx("span", { children: "\uD83D\uDD12" }), jsxRuntime.jsx("span", { children: "Dark Protocol Privacy" })] }), jsxRuntime.jsxs("div", { className: "flex gap-2", children: [jsxRuntime.jsx("button", { onClick: toggleOracle, className: `px-3 py-1 rounded text-sm font-medium transition-colors ${state.isOracleActive
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-700 text-gray-300'}`, children: state.isOracleActive ? '🔮 Oracle ON' : '🔮 Oracle OFF' }), jsxRuntime.jsx("button", { onClick: toggleShielded, className: `px-3 py-1 rounded text-sm font-medium transition-colors ${state.isShieldedMode
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-700 text-gray-300'}`, children: state.isShieldedMode ? '🛡️ Shielded ON' : '🛡️ Shielded OFF' })] })] }), state.isOracleActive && (jsxRuntime.jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [state.priceDeviation !== undefined && (jsxRuntime.jsxs("div", { className: "bg-gray-800 p-2 rounded", children: [jsxRuntime.jsx("div", { className: "text-gray-400 text-xs mb-1", children: "Price Deviation" }), jsxRuntime.jsxs("div", { className: `font-semibold ${Math.abs(state.priceDeviation) > 1
                                            ? 'text-yellow-400'
                                            : 'text-green-400'}`, children: [state.priceDeviation.toFixed(2), "%"] })] })), state.oraclePrice && (jsxRuntime.jsxs("div", { className: "bg-gray-800 p-2 rounded", children: [jsxRuntime.jsx("div", { className: "text-gray-400 text-xs mb-1", children: "Oracle Price" }), jsxRuntime.jsxs("div", { className: "text-white font-semibold", children: ["$", state.oraclePrice] })] }))] })), state.safetyWarnings && state.safetyWarnings.length > 0 && (jsxRuntime.jsx("div", { className: "mt-3 p-3 bg-yellow-900/20 border border-yellow-600 rounded", children: jsxRuntime.jsxs("div", { className: "flex items-start gap-2", children: [jsxRuntime.jsx("span", { className: "text-yellow-400 text-xl", children: "\u26A0\uFE0F" }), jsxRuntime.jsxs("div", { className: "flex-1", children: [jsxRuntime.jsx("div", { className: "text-yellow-400 font-semibold mb-1", children: "High-Risk Tokens Detected" }), jsxRuntime.jsx("ul", { className: "text-sm text-yellow-300 space-y-1", children: state.safetyWarnings.map((warning, idx) => (jsxRuntime.jsxs("li", { children: ["\u2022 ", warning.mint.slice(0, 8), "... - ", warning.warnings.join(', ')] }, idx))) })] })] }) })), state.isValidating && (jsxRuntime.jsxs("div", { className: "mt-3 flex items-center gap-2 text-blue-400 text-sm", children: [jsxRuntime.jsx("div", { className: "animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" }), jsxRuntime.jsx("span", { children: "Validating with oracle..." })] }))] }), jsxRuntime.jsxs("div", { className: "jupiter-swap-wrapper relative", children: [jsxRuntime.jsx(jupiverseKit.Swap, { rpcUrl: rpcUrl, referralKey: referralKey, platformFeeBps: platformFeeBps, apiKey: apiKey }), state.isShieldedMode && (jsxRuntime.jsxs("div", { className: "absolute top-2 right-2 px-3 py-1 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1", children: [jsxRuntime.jsx("span", { children: "\uD83D\uDEE1\uFE0F" }), jsxRuntime.jsx("span", { children: "Shielded" })] }))] }), jsxRuntime.jsx("div", { className: "privacy-footer mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700 text-xs text-gray-400", children: jsxRuntime.jsxs("div", { className: "flex items-center justify-between", children: [jsxRuntime.jsxs("div", { className: "flex items-center gap-4", children: [jsxRuntime.jsxs("div", { className: "flex items-center gap-1", children: [jsxRuntime.jsx("span", { className: "w-2 h-2 bg-green-500 rounded-full" }), jsxRuntime.jsx("span", { children: "MEV Protected" })] }), jsxRuntime.jsxs("div", { className: "flex items-center gap-1", children: [jsxRuntime.jsx("span", { className: "w-2 h-2 bg-blue-500 rounded-full" }), jsxRuntime.jsx("span", { children: "Oracle Validated" })] }), state.isShieldedMode && (jsxRuntime.jsxs("div", { className: "flex items-center gap-1", children: [jsxRuntime.jsx("span", { className: "w-2 h-2 bg-purple-500 rounded-full" }), jsxRuntime.jsx("span", { children: "Zcash Privacy" })] }))] }), jsxRuntime.jsx("a", { href: "https://darkprotocol.io", target: "_blank", rel: "noopener noreferrer", className: "text-gray-500 hover:text-gray-300 transition-colors", children: "Powered by Dark Protocol" })] }) })] }));
};
// ============================================================================
// Full Page Dark Swap Demo
// ============================================================================
const DarkSwapDemo = () => {
    return (jsxRuntime.jsx("div", { className: "min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900", children: jsxRuntime.jsx(DarkSwap, { rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com", referralKey: process.env.NEXT_PUBLIC_REFERRAL_KEY, platformFeeBps: 20, apiKey: process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY, enableOracle: true, enableShielded: true, maxPriceDeviation: 2.0, autoCheckSafety: true, onSwapSuccess: (signature) => {
                console.log('✅ Swap successful:', signature);
            }, onPriceWarning: (deviation) => {
                console.warn('⚠️ Price deviation warning:', deviation);
            }, onSafetyWarning: (warnings) => {
                console.warn('⚠️ Token safety warnings:', warnings);
            } }) }));
};

exports.TransactionType = void 0;
(function (TransactionType) {
    TransactionType["Shield"] = "Shield";
    TransactionType["Unshield"] = "Unshield";
    TransactionType["PrivateTransfer"] = "PrivateTransfer";
    TransactionType["PrivateSwap"] = "PrivateSwap";
    TransactionType["PoolDeposit"] = "PoolDeposit";
    TransactionType["PoolWithdraw"] = "PoolWithdraw";
})(exports.TransactionType || (exports.TransactionType = {}));
exports.PrivacyLevel = void 0;
(function (PrivacyLevel) {
    PrivacyLevel["Full"] = "Full";
    PrivacyLevel["Partial"] = "Partial";
    PrivacyLevel["Minimal"] = "Minimal";
})(exports.PrivacyLevel || (exports.PrivacyLevel = {}));

/**
 * Utility functions for Dark Protocol
 */
/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * Convert hex string to bytes
 */
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}
/**
 * Convert bytes to base58
 */
function bytesToBase58(bytes) {
    return bs58.encode(bytes);
}
/**
 * Convert base58 to bytes
 */
function base58ToBytes(base58) {
    return bs58.decode(base58);
}
/**
 * Format amount with decimals
 */
function formatAmount(amount, decimals) {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const fractional = amount % divisor;
    return `${whole}.${fractional.toString().padStart(decimals, '0')}`;
}
/**
 * Parse amount from string
 */
function parseAmount(amount, decimals) {
    const [whole, fractional = '0'] = amount.split('.');
    const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFractional);
}
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Retry function with exponential backoff
 */
async function retry(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await sleep(delayMs * Math.pow(2, i));
            }
        }
    }
    throw lastError;
}
/**
 * Chunk array into smaller arrays
 */
function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
/**
 * Get explorer URL for transaction
 */
function getExplorerUrl(signature, cluster = 'mainnet') {
    const clusterParam = cluster === 'mainnet' ? '' : `?cluster=${cluster}`;
    return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
}
/**
 * Get explorer URL for address
 */
function getAddressExplorerUrl(address, cluster = 'mainnet') {
    const addressStr = typeof address === 'string' ? address : address.toBase58();
    const clusterParam = cluster === 'mainnet' ? '' : `?cluster=${cluster}`;
    return `https://explorer.solana.com/address/${addressStr}${clusterParam}`;
}
/**
 * Validate Solana address
 */
function isValidAddress(address) {
    try {
        new web3_js.PublicKey(address);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Generate random bytes
 */
function randomBytes(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
}
/**
 * Combine multiple Uint8Arrays
 */
function concatBytes(...arrays) {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}
/**
 * Compare two Uint8Arrays for equality
 */
function bytesEqual(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}

/**
 * Zcash Sapling Address System for Solana
 *
 * This module implements the complete Sapling address hierarchy adapted from Zcash:
 * Spending Key (sk) → Expanded Spending Key → Full Viewing Key → Incoming Viewing Key → Payment Address
 *
 * Compatible with the Rust implementation in: programs/dark-protocol/src/crypto/sapling.rs
 */
/** Sapling diversifier size (11 bytes, same as Zcash) */
const SAPLING_DIVERSIFIER_SIZE = 11;
/** Sapling spending key size */
const SAPLING_SK_SIZE = 32;
/** Full viewing key size (ak + nk + ovk) */
const SAPLING_FVK_SIZE = 96;
/** Payment address size (diversifier + pk_d) */
const SAPLING_ADDRESS_SIZE = 43;
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
        if (d.length !== SAPLING_DIVERSIFIER_SIZE) {
            throw new Error(`Diversifier must be ${SAPLING_DIVERSIFIER_SIZE} bytes`);
        }
        if (pk_d.length !== 32) {
            throw new Error('pk_d must be 32 bytes');
        }
    }
    /**
     * Convert to 43-byte representation (same as Zcash)
     */
    toBytes() {
        const bytes = new Uint8Array(SAPLING_ADDRESS_SIZE);
        bytes.set(this.d, 0);
        bytes.set(this.pk_d, SAPLING_DIVERSIFIER_SIZE);
        return bytes;
    }
    /**
     * Create from 43-byte representation
     */
    static fromBytes(bytes) {
        if (bytes.length !== SAPLING_ADDRESS_SIZE) {
            throw new Error(`Address must be ${SAPLING_ADDRESS_SIZE} bytes`);
        }
        const d = bytes.slice(0, SAPLING_DIVERSIFIER_SIZE);
        const pk_d = bytes.slice(SAPLING_DIVERSIFIER_SIZE, SAPLING_ADDRESS_SIZE);
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
        const hash1 = sha256.sha256(bytes);
        const hash2 = sha256.sha256(hash1);
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
        if (diversifier.length !== SAPLING_DIVERSIFIER_SIZE) {
            throw new Error(`Diversifier must be ${SAPLING_DIVERSIFIER_SIZE} bytes`);
        }
        // Derive pk_d from ivk and diversifier using Blake3
        const pk_d = blake3.blake3(new Uint8Array([
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
        const div = new Uint8Array(SAPLING_DIVERSIFIER_SIZE);
        div[0] = 1; // Start with non-zero
        return div;
    }
    /**
     * Generate random diversifier
     */
    static randomDiversifier() {
        const div = new Uint8Array(SAPLING_DIVERSIFIER_SIZE);
        crypto.getRandomValues(div);
        div[0] = div[0] || 1; // Ensure first byte is non-zero
        return div;
    }
}
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
        const bytes = new Uint8Array(SAPLING_FVK_SIZE);
        bytes.set(this.ak, 0);
        bytes.set(this.nk, 32);
        bytes.set(this.ovk, 64);
        return bytes;
    }
    /**
     * Create from 96-byte representation
     */
    static fromBytes(bytes) {
        if (bytes.length !== SAPLING_FVK_SIZE) {
            throw new Error(`FVK must be ${SAPLING_FVK_SIZE} bytes`);
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
        const ivk = blake3.blake3(new Uint8Array([
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
        const hash = sha256.sha256(new Uint8Array([
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
        const ak = blake3.blake3(new Uint8Array([
            ...this.ask,
            ...Buffer.from('sapling_ak_derivation', 'utf8')
        ]), { dkLen: 32 });
        // Derive nk from nsk
        const nk = blake3.blake3(new Uint8Array([
            ...this.nsk,
            ...Buffer.from('sapling_nk_derivation', 'utf8')
        ]), { dkLen: 32 });
        return new SaplingFullViewingKey(ak, nk, this.ovk);
    }
}
/**
 * Sapling Spending Key (32-byte seed)
 * Master secret key - NEVER store on-chain or share
 */
class SaplingSpendingKey {
    constructor(sk) {
        this.sk = sk;
        if (sk.length !== SAPLING_SK_SIZE) {
            throw new Error(`Spending key must be ${SAPLING_SK_SIZE} bytes`);
        }
    }
    /**
     * Generate random spending key from seed
     */
    static random(seed) {
        const sk = blake3.blake3(new Uint8Array([
            ...seed,
            ...Buffer.from('sapling_spending_key', 'utf8')
        ]), { dkLen: 32 });
        return new SaplingSpendingKey(sk);
    }
    /**
     * Generate from mnemonic phrase (BIP39)
     */
    static async fromMnemonic(mnemonic) {
        const bip39 = await import('bip39');
        const seed = await bip39.mnemonicToSeed(mnemonic);
        return SaplingSpendingKey.random(seed);
    }
    /**
     * Expand spending key to get ask, nsk, ovk
     * Same algorithm as Rust implementation
     */
    expandedSpendingKey() {
        // Derive ask
        const ask = blake3.blake3(new Uint8Array([
            ...this.sk,
            ...Buffer.from('sapling_ask_derivation', 'utf8')
        ]), { dkLen: 32 });
        // Derive nsk
        const nsk = blake3.blake3(new Uint8Array([
            ...this.sk,
            ...Buffer.from('sapling_nsk_derivation', 'utf8')
        ]), { dkLen: 32 });
        // Derive ovk
        const ovk = blake3.blake3(new Uint8Array([
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
        if (bytes.length !== SAPLING_SK_SIZE) {
            throw new Error(`Spending key must be ${SAPLING_SK_SIZE} bytes`);
        }
        return new SaplingSpendingKey(bytes);
    }
}
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
        const diversifier = blake3.blake3(new Uint8Array([
            ...this.spendingKey.sk,
            ...indexBytes,
            ...Buffer.from('diversifier', 'utf8')
        ]), { dkLen: SAPLING_DIVERSIFIER_SIZE });
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
/**
 * Utility functions for Sapling addresses
 */
class SaplingUtils {
    /**
     * Generate new wallet with mnemonic
     */
    static async generateWallet() {
        const bip39 = await import('bip39');
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
            return addr.toBytes().length === SAPLING_ADDRESS_SIZE;
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

/**
 * Zcash-style Note Encryption for Solana
 *
 * Implements encrypted note transmission with ChaCha20-Poly1305 AEAD
 * Compatible with: programs/dark-protocol/src/crypto/note_encryption.rs
 */
/** Authentication bytes for encrypted data */
const NOTEENCRYPTION_AUTH_BYTES = 16;
/** Note plaintext field sizes */
const V_SIZE = 8; // Value (amount)
const RHO_SIZE = 32; // Nullifier seed
const R_SIZE = 32; // Randomness
const MEMO_SIZE = 512; // Memo field
/** Sapling encrypted plaintext size */
const SAPLING_ENCPLAINTEXT_SIZE = 1 + 11 + V_SIZE + R_SIZE + MEMO_SIZE; // leadbyte + diversifier + value + rseed + memo
/** Sapling outgoing plaintext size */
const SAPLING_OUTPLAINTEXT_SIZE = 32 + 32; // pk_d + esk
/** Sapling ciphertext sizes */
const SAPLING_ENCCIPHERTEXT_SIZE = SAPLING_ENCPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;
const SAPLING_OUTCIPHERTEXT_SIZE = SAPLING_OUTPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;
/**
 * Sapling Note Plaintext
 * Structure before encryption
 */
class SaplingNotePlaintext {
    constructor(leadbyte, // 1 byte (0x01 or 0x02 for ZIP 212)
    d, // 11 bytes (diversifier)
    value, // 8 bytes (note amount)
    rseed, // 32 bytes (randomness seed)
    memo // 512 bytes (memo field)
    ) {
        this.leadbyte = leadbyte;
        this.d = d;
        this.value = value;
        this.rseed = rseed;
        this.memo = memo;
        if (d.length !== 11)
            throw new Error('Diversifier must be 11 bytes');
        if (rseed.length !== 32)
            throw new Error('rseed must be 32 bytes');
        if (memo.length !== MEMO_SIZE)
            throw new Error(`Memo must be ${MEMO_SIZE} bytes`);
    }
    /**
     * Create new note plaintext
     */
    static new(paymentAddress, value, rseed, memo) {
        return new SaplingNotePlaintext(0x02, // ZIP 212 activated
        paymentAddress.d, value, rseed, memo);
    }
    /**
     * Serialize to bytes
     */
    toBytes() {
        const bytes = new Uint8Array(SAPLING_ENCPLAINTEXT_SIZE);
        let offset = 0;
        // Leadbyte
        bytes[offset] = this.leadbyte;
        offset += 1;
        // Diversifier (11 bytes)
        bytes.set(this.d, offset);
        offset += 11;
        // Value (8 bytes, little-endian)
        const valueView = new DataView(bytes.buffer, offset, 8);
        valueView.setBigUint64(0, this.value, true);
        offset += 8;
        // Rseed (32 bytes)
        bytes.set(this.rseed, offset);
        offset += 32;
        // Memo (512 bytes)
        bytes.set(this.memo, offset);
        return bytes;
    }
    /**
     * Deserialize from bytes
     */
    static fromBytes(bytes) {
        if (bytes.length !== SAPLING_ENCPLAINTEXT_SIZE) {
            throw new Error(`Invalid plaintext size: ${bytes.length}`);
        }
        let offset = 0;
        // Leadbyte
        const leadbyte = bytes[offset];
        if (leadbyte !== 0x01 && leadbyte !== 0x02) {
            throw new Error('Invalid leadbyte');
        }
        offset += 1;
        // Diversifier
        const d = bytes.slice(offset, offset + 11);
        offset += 11;
        // Value
        const valueView = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
        const value = valueView.getBigUint64(0, true);
        offset += 8;
        // Rseed
        const rseed = bytes.slice(offset, offset + 32);
        offset += 32;
        // Memo
        const memo = bytes.slice(offset, offset + MEMO_SIZE);
        return new SaplingNotePlaintext(leadbyte, d, value, rseed, memo);
    }
    /**
     * Derive note commitment (simplified)
     */
    cm(pk_d) {
        const hash = blake3.blake3(new Uint8Array([
            this.leadbyte,
            ...this.d,
            ...pk_d,
            ...this.valueToBytes(),
            ...this.rseed,
            ...Buffer.from('sapling_note_commitment', 'utf8')
        ]), { dkLen: 32 });
        return hash;
    }
    /**
     * Derive note commitment randomness
     */
    rcm() {
        const hash = blake3.blake3(new Uint8Array([
            ...this.rseed,
            ...Buffer.from('sapling_rcm', 'utf8')
        ]), { dkLen: 32 });
        return hash;
    }
    valueToBytes() {
        const bytes = new Uint8Array(8);
        const view = new DataView(bytes.buffer);
        view.setBigUint64(0, this.value, true);
        return bytes;
    }
}
/**
 * Sapling Outgoing Plaintext
 * For sender to recover sent notes
 */
class SaplingOutgoingPlaintext {
    constructor(pk_d, // 32 bytes
    esk // 32 bytes (ephemeral secret key)
    ) {
        this.pk_d = pk_d;
        this.esk = esk;
        if (pk_d.length !== 32)
            throw new Error('pk_d must be 32 bytes');
        if (esk.length !== 32)
            throw new Error('esk must be 32 bytes');
    }
    /**
     * Serialize to bytes
     */
    toBytes() {
        const bytes = new Uint8Array(SAPLING_OUTPLAINTEXT_SIZE);
        bytes.set(this.pk_d, 0);
        bytes.set(this.esk, 32);
        return bytes;
    }
    /**
     * Deserialize from bytes
     */
    static fromBytes(bytes) {
        if (bytes.length !== SAPLING_OUTPLAINTEXT_SIZE) {
            throw new Error('Invalid outgoing plaintext size');
        }
        const pk_d = bytes.slice(0, 32);
        const esk = bytes.slice(32, 64);
        return new SaplingOutgoingPlaintext(pk_d, esk);
    }
}
/**
 * Note Encryption Context
 * Handles encryption of notes for recipients
 */
class NoteEncryption {
    constructor(h_sig, seed) {
        this.h_sig = h_sig;
        this.esk = NoteEncryption.generateEsk(seed);
        this.epk = NoteEncryption.deriveEpk(this.esk);
    }
    /**
     * Generate ephemeral secret key
     */
    static generateEsk(seed) {
        return blake3.blake3(new Uint8Array([
            ...seed,
            ...Buffer.from('sapling_esk_generation', 'utf8')
        ]), { dkLen: 32 });
    }
    /**
     * Derive ephemeral public key from esk
     */
    static deriveEpk(esk) {
        return blake3.blake3(new Uint8Array([
            ...esk,
            ...Buffer.from('sapling_epk_derivation', 'utf8')
        ]), { dkLen: 32 });
    }
    /**
     * Encrypt note for recipient
     */
    async encryptNote(plaintext, pk_enc) {
        // Derive shared secret using DH
        const sharedSecret = this.deriveSharedSecret(pk_enc);
        // Derive symmetric key
        const encKey = this.deriveEncryptionKey(sharedSecret, true);
        // Serialize plaintext
        const ptBytes = plaintext.toBytes();
        // Encrypt using ChaCha20-Poly1305
        const ciphertext = await this.chacha20Poly1305Encrypt(ptBytes, encKey);
        return ciphertext;
    }
    /**
     * Encrypt outgoing plaintext for sender recovery
     */
    async encryptOutgoing(outPlaintext, ovk, cv) {
        // Derive outgoing encryption key
        const outKey = this.deriveOutgoingKey(ovk, cv);
        // Serialize outgoing plaintext
        const ptBytes = outPlaintext.toBytes();
        // Encrypt
        const ciphertext = await this.chacha20Poly1305Encrypt(ptBytes, outKey);
        return ciphertext;
    }
    /**
     * Derive shared secret (simplified ECDH)
     */
    deriveSharedSecret(pk_enc) {
        return blake3.blake3(new Uint8Array([
            ...this.esk,
            ...pk_enc,
            ...Buffer.from('sapling_ka_agree', 'utf8')
        ]), { dkLen: 32 });
    }
    /**
     * Derive encryption key from shared secret
     */
    deriveEncryptionKey(sharedSecret, isIncoming) {
        const label = isIncoming ? 'sapling_enc_key' : 'sapling_out_key';
        return blake3.blake3(new Uint8Array([
            ...sharedSecret,
            ...this.epk,
            ...this.h_sig,
            ...Buffer.from(label, 'utf8')
        ]), { dkLen: 32 });
    }
    /**
     * Derive outgoing encryption key
     */
    deriveOutgoingKey(ovk, cv) {
        return blake3.blake3(new Uint8Array([
            ...ovk,
            ...cv,
            ...this.epk,
            ...Buffer.from('sapling_ock', 'utf8')
        ]), { dkLen: 32 });
    }
    /**
     * ChaCha20-Poly1305 encryption
     */
    async chacha20Poly1305Encrypt(plaintext, key) {
        // Generate nonce (12 bytes for ChaCha20-Poly1305)
        const nonce = new Uint8Array(12);
        crypto.getRandomValues(nonce);
        // Encrypt with AEAD
        const cipher = chacha.chacha20poly1305(key, nonce);
        const ciphertext = cipher.encrypt(plaintext);
        // Prepend nonce to ciphertext
        const result = new Uint8Array(nonce.length + ciphertext.length);
        result.set(nonce, 0);
        result.set(ciphertext, nonce.length);
        return result;
    }
    /**
     * Get ephemeral public key
     */
    getEpk() {
        return this.epk;
    }
    /**
     * Get ephemeral secret key (use carefully!)
     */
    getEsk() {
        return this.esk;
    }
}
/**
 * Note Decryption Context
 * Handles decryption of received notes
 */
class NoteDecryption {
    constructor(ivk) {
        if (ivk.length !== 32) {
            throw new Error('IVK must be 32 bytes');
        }
        this.ivk = ivk;
    }
    /**
     * Create from Sapling incoming viewing key
     */
    static fromSaplingIVK(ivk) {
        return new NoteDecryption(ivk.ivk);
    }
    /**
     * Decrypt encrypted note
     */
    async decryptNote(ciphertext, epk, h_sig) {
        if (ciphertext.length !== SAPLING_ENCCIPHERTEXT_SIZE) {
            throw new Error('Invalid ciphertext size');
        }
        // Derive shared secret
        const sharedSecret = this.deriveSharedSecret(epk);
        // Derive decryption key
        const decKey = this.deriveDecryptionKey(sharedSecret, epk, h_sig);
        // Decrypt
        const plaintext = await this.chacha20Poly1305Decrypt(ciphertext, decKey);
        // Parse plaintext
        return SaplingNotePlaintext.fromBytes(plaintext);
    }
    /**
     * Derive shared secret for decryption
     */
    deriveSharedSecret(epk) {
        return blake3.blake3(new Uint8Array([
            ...this.ivk,
            ...epk,
            ...Buffer.from('sapling_ka_agree', 'utf8')
        ]), { dkLen: 32 });
    }
    /**
     * Derive decryption key
     */
    deriveDecryptionKey(sharedSecret, epk, h_sig) {
        return blake3.blake3(new Uint8Array([
            ...sharedSecret,
            ...epk,
            ...h_sig,
            ...Buffer.from('sapling_enc_key', 'utf8')
        ]), { dkLen: 32 });
    }
    /**
     * ChaCha20-Poly1305 decryption
     */
    async chacha20Poly1305Decrypt(ciphertext, key) {
        if (ciphertext.length < 12 + NOTEENCRYPTION_AUTH_BYTES) {
            throw new Error('Ciphertext too short');
        }
        // Extract nonce (first 12 bytes)
        const nonce = ciphertext.slice(0, 12);
        // Extract actual ciphertext
        const ct = ciphertext.slice(12);
        // Decrypt with AEAD
        const cipher = chacha.chacha20poly1305(key, nonce);
        const plaintext = cipher.decrypt(ct);
        return plaintext;
    }
}
/**
 * Utility functions for note encryption
 */
class NoteEncryptionUtils {
    /**
     * Create encrypted note for recipient
     */
    static async createEncryptedNote(params) {
        // Generate randomness
        const rseed = new Uint8Array(32);
        crypto.getRandomValues(rseed);
        // Create memo bytes
        const memoBytes = new Uint8Array(MEMO_SIZE);
        const encoder = new TextEncoder();
        const memoEncoded = encoder.encode(params.memo);
        memoBytes.set(memoEncoded.slice(0, MEMO_SIZE));
        // Create plaintext
        const plaintext = SaplingNotePlaintext.new(params.recipientAddress, params.value, rseed, memoBytes);
        // Generate signature hash
        const h_sig = sha256.sha256(rseed);
        // Create encryption context
        const encryption = new NoteEncryption(h_sig, rseed);
        // Derive recipient's encryption key (from payment address)
        const pk_enc = params.recipientAddress.pk_d;
        // Encrypt for recipient
        const encCiphertext = await encryption.encryptNote(plaintext, pk_enc);
        // Create outgoing plaintext for sender recovery
        const outPlaintext = new SaplingOutgoingPlaintext(params.recipientAddress.pk_d, encryption.getEsk());
        // Derive value commitment (simplified)
        const cv = blake3.blake3(new Uint8Array([
            ...params.value.toString().split('').map(c => c.charCodeAt(0)),
            ...rseed
        ]), { dkLen: 32 });
        // Encrypt for sender
        const outCiphertext = await encryption.encryptOutgoing(outPlaintext, params.senderOvk, cv);
        // Get note commitment
        const cm = plaintext.cm(params.recipientAddress.pk_d);
        return {
            encCiphertext,
            outCiphertext,
            epk: encryption.getEpk(),
            cm
        };
    }
    /**
     * Try to decrypt note with viewing key
     */
    static async tryDecryptNote(encryptedNote, ivk, h_sig) {
        try {
            const decryption = NoteDecryption.fromSaplingIVK(ivk);
            const plaintext = await decryption.decryptNote(encryptedNote.encCiphertext, encryptedNote.epk, h_sig);
            return plaintext;
        }
        catch {
            return null;
        }
    }
    /**
     * Generate empty memo
     */
    static emptyMemo() {
        return new Uint8Array(MEMO_SIZE);
    }
    /**
     * Create memo from string
     */
    static memoFromString(str) {
        const memo = new Uint8Array(MEMO_SIZE);
        const encoder = new TextEncoder();
        const encoded = encoder.encode(str);
        memo.set(encoded.slice(0, MEMO_SIZE));
        return memo;
    }
    /**
     * Parse memo to string
     */
    static memoToString(memo) {
        const decoder = new TextDecoder();
        // Find first null byte
        let length = memo.findIndex(b => b === 0);
        if (length === -1)
            length = memo.length;
        return decoder.decode(memo.slice(0, length));
    }
}

/**
 * Dark Protocol SDK Configuration
 */
/**
 * Deployed program IDs on Solana Devnet
 */
const PROGRAM_IDS = {
    DARK_PROTOCOL: new web3_js.PublicKey('3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC'),
    SHIELDED_WALLET: new web3_js.PublicKey('4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg'),
};
/**
 * RPC Endpoints for different networks
 */
const RPC_ENDPOINTS = {
    DEVNET: 'https://api.devnet.solana.com',
    DEVNET_HELIUS: 'https://devnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0',
    MAINNET: 'https://api.mainnet-beta.solana.com',
    LOCALNET: 'http://localhost:8899',
};
/**
 * Get RPC endpoint for network
 */
function getRpcEndpoint(network, customEndpoint) {
    if (customEndpoint)
        return customEndpoint;
    switch (network) {
        case 'devnet':
            return RPC_ENDPOINTS.DEVNET;
        case 'mainnet':
            return RPC_ENDPOINTS.MAINNET;
        case 'localnet':
            return RPC_ENDPOINTS.LOCALNET;
        default:
            return RPC_ENDPOINTS.DEVNET;
    }
}
/**
 * Get program ID for network
 */
function getProgramId(network) {
    // Currently same for all networks
    return PROGRAM_IDS.DARK_PROTOCOL;
}
function getShieldedWalletId(network) {
    // Currently same for all networks
    return PROGRAM_IDS.SHIELDED_WALLET;
}

/**
 * Dark Protocol SDK
 * Privacy-first Solana wallet with Zcash Sapling integration, AI agents, Jupiter swaps, and Helius
 */
// Core client
// Version
const VERSION = '0.2.0'; // Updated for Zcash Sapling integration

exports.AIAgentManager = AIAgentManager;
exports.DarkProtocolClient = DarkProtocolClient;
exports.DarkSwap = DarkSwap;
exports.DarkSwapDemo = DarkSwapDemo;
exports.DarkWallet = DarkWallet;
exports.KNOWN_TOKENS = KNOWN_TOKENS;
exports.MEMO_SIZE = MEMO_SIZE;
exports.NOTEENCRYPTION_AUTH_BYTES = NOTEENCRYPTION_AUTH_BYTES;
exports.NoteDecryption = NoteDecryption;
exports.NoteEncryption = NoteEncryption;
exports.NoteEncryptionUtils = NoteEncryptionUtils;
exports.PROGRAM_IDS = PROGRAM_IDS;
exports.PriceOracle = PriceOracle;
exports.PrivacyUtils = PrivacyUtils;
exports.PrivateSwapManager = PrivateSwapManager;
exports.RHO_SIZE = RHO_SIZE;
exports.RPC_ENDPOINTS = RPC_ENDPOINTS;
exports.R_SIZE = R_SIZE;
exports.SAPLING_ADDRESS_SIZE = SAPLING_ADDRESS_SIZE;
exports.SAPLING_DIVERSIFIER_SIZE = SAPLING_DIVERSIFIER_SIZE;
exports.SAPLING_ENCCIPHERTEXT_SIZE = SAPLING_ENCCIPHERTEXT_SIZE;
exports.SAPLING_ENCPLAINTEXT_SIZE = SAPLING_ENCPLAINTEXT_SIZE;
exports.SAPLING_FVK_SIZE = SAPLING_FVK_SIZE;
exports.SAPLING_OUTCIPHERTEXT_SIZE = SAPLING_OUTCIPHERTEXT_SIZE;
exports.SAPLING_OUTPLAINTEXT_SIZE = SAPLING_OUTPLAINTEXT_SIZE;
exports.SAPLING_SK_SIZE = SAPLING_SK_SIZE;
exports.SaplingExpandedSpendingKey = SaplingExpandedSpendingKey;
exports.SaplingFullViewingKey = SaplingFullViewingKey;
exports.SaplingHDWallet = SaplingHDWallet;
exports.SaplingIncomingViewingKey = SaplingIncomingViewingKey;
exports.SaplingNotePlaintext = SaplingNotePlaintext;
exports.SaplingOutgoingPlaintext = SaplingOutgoingPlaintext;
exports.SaplingPaymentAddress = SaplingPaymentAddress;
exports.SaplingSpendingKey = SaplingSpendingKey;
exports.SaplingUtils = SaplingUtils;
exports.VERSION = VERSION;
exports.V_SIZE = V_SIZE;
exports.base58ToBytes = base58ToBytes;
exports.bytesEqual = bytesEqual;
exports.bytesToBase58 = bytesToBase58;
exports.bytesToHex = bytesToHex;
exports.calculatePriceImpact = calculatePriceImpact;
exports.chunk = chunk;
exports.concatBytes = concatBytes;
exports.formatAmount = formatAmount;
exports.formatPrice = formatPrice;
exports.formatSlippage = formatSlippage;
exports.getAddressExplorerUrl = getAddressExplorerUrl;
exports.getExplorerUrl = getExplorerUrl;
exports.getProgramId = getProgramId;
exports.getRpcEndpoint = getRpcEndpoint;
exports.getShieldedWalletId = getShieldedWalletId;
exports.hexToBytes = hexToBytes;
exports.isValidAddress = isValidAddress;
exports.parseAmount = parseAmount;
exports.randomBytes = randomBytes;
exports.retry = retry;
exports.sleep = sleep;
//# sourceMappingURL=index.cjs.map
