import { PublicKey } from '@solana/web3.js';
import { DarkProtocolClient } from './client';
import type { JupiterSwapRoute } from './types';
export declare class PrivateSwapManager {
    private client;
    private jupiterApiKey?;
    constructor(client: DarkProtocolClient, jupiterApiKey?: string);
    /**
     * Get Jupiter quote for swap
     */
    getQuote(inputMint: PublicKey, outputMint: PublicKey, amount: bigint, slippageBps?: number): Promise<JupiterSwapRoute>;
    /**
     * Execute private swap with privacy protection
     */
    executePrivateSwap(params: {
        inputMint: PublicKey;
        outputMint: PublicKey;
        inputAmount: bigint;
        minOutputAmount: bigint;
        slippageBps?: number;
        userPublicKey: PublicKey;
    }): Promise<string>;
    /**
     * Parse Jupiter API route response
     */
    private parseJupiterRoute;
    /**
     * Encode Jupiter route plan for on-chain use
     */
    private encodeRoutePlan;
    /**
     * Get best route across multiple DEXs
     */
    getBestRoute(inputMint: PublicKey, outputMint: PublicKey, amount: bigint): Promise<JupiterSwapRoute>;
}
//# sourceMappingURL=swap.d.ts.map