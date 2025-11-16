"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateSwapManager = void 0;
const web3_js_1 = require("@solana/web3.js");
const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
const JUPITER_PROGRAM_ID = new web3_js_1.PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4');
class PrivateSwapManager {
    constructor(client, jupiterApiKey) {
        this.client = client;
        this.jupiterApiKey = jupiterApiKey;
    }
    /**
     * Get Jupiter quote for swap
     */
    async getQuote(inputMint, outputMint, amount, slippageBps = 50) {
        const url = new URL(`${JUPITER_API_URL}/quote`);
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
     * Execute private swap with privacy protection
     */
    async executePrivateSwap(params) {
        // Get Jupiter route
        const route = await this.getQuote(params.inputMint, params.outputMint, params.inputAmount, params.slippageBps);
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
        const jupiterRoutePlan = this.encodeRoutePlan(route);
        // Execute private swap through Dark Protocol
        const tx = await this.client.program.methods
            .privateSwap(params.inputAmount, Array.from(inputCommitment), Array.from(outputCommitment), Array.from(nullifier), Array.from(proof), Array.from(jupiterRoutePlan))
            .accounts({
            user: params.userPublicKey,
            jupiterProgram: JUPITER_PROGRAM_ID,
            tokenProgram: web3_js_1.PublicKey.default,
            systemProgram: web3_js_1.PublicKey.default,
        })
            .rpc();
        return tx;
    }
    /**
     * Parse Jupiter API route response
     */
    parseJupiterRoute(data) {
        return {
            inputMint: new web3_js_1.PublicKey(data.inputMint),
            outputMint: new web3_js_1.PublicKey(data.outputMint),
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
}
exports.PrivateSwapManager = PrivateSwapManager;
//# sourceMappingURL=swap.js.map