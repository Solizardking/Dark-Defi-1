import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { DarkProtocolClient } from './client';
import { PriceOracle, type TokenPrice } from './oracle';
import type { JupiterSwapRoute } from './types';
/**
 * Jupiter Ultra Order response
 */
export interface JupiterUltraOrder {
    order: string;
    requestId: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    slippageBps: number;
    platformFeeBps: number;
    priceImpactPct: string;
}
/**
 * Jupiter Ultra Execute response
 */
export interface JupiterUltraExecuteResult {
    signature: string;
    requestId: string;
    status: 'pending' | 'success' | 'failed';
}
/**
 * Token holdings from Jupiter Ultra
 */
export interface TokenHolding {
    mint: string;
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    uiBalance: number;
    priceUsd?: number;
    valueUsd?: number;
}
/**
 * Token safety warnings from Shield API
 */
export interface TokenShieldWarning {
    mint: string;
    warnings: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    freezeAuthority?: boolean;
    mintAuthority?: boolean;
    lowLiquidity?: boolean;
}
/**
 * Swap quote with oracle pricing
 */
export interface SwapQuoteWithOracle extends JupiterSwapRoute {
    inputPrice?: TokenPrice;
    outputPrice?: TokenPrice;
    exchangeRate?: number;
    priceDeviation?: number;
}
export declare class PrivateSwapManager {
    private client;
    private jupiterApiKey?;
    private oracle;
    constructor(client: DarkProtocolClient, config?: {
        jupiterApiKey?: string;
        birdeyeApiKey?: string;
        heliusApiKey?: string;
    });
    /**
     * Get Jupiter quote for swap (v6 API)
     */
    getQuote(inputMint: PublicKey, outputMint: PublicKey, amount: bigint, slippageBps?: number): Promise<JupiterSwapRoute>;
    /**
     * Get quote with oracle pricing validation
     */
    getQuoteWithOracle(inputMint: PublicKey, outputMint: PublicKey, amount: bigint, slippageBps?: number): Promise<SwapQuoteWithOracle>;
    /**
     * Get unsigned transaction from Jupiter Ultra (Order endpoint)
     */
    getOrder(inputMint: PublicKey, outputMint: PublicKey, amount: bigint, takerAddress: PublicKey, slippageBps?: number): Promise<JupiterUltraOrder>;
    /**
     * Execute signed transaction (Execute endpoint)
     */
    executeOrder(signedTransaction: string, requestId: string): Promise<JupiterUltraExecuteResult>;
    /**
     * Get token holdings using DAS API
     */
    getHoldings(walletAddress: PublicKey): Promise<TokenHolding[]>;
    /**
     * Check token safety (Shield API)
     */
    checkTokenSafety(mints: string[]): Promise<TokenShieldWarning[]>;
    /**
     * Search for tokens
     */
    searchTokens(query: string): Promise<any[]>;
    /**
     * Get available routers
     */
    getRouters(): Promise<string[]>;
    /**
     * Execute private swap with privacy protection and oracle validation
     */
    executePrivateSwap(params: {
        inputMint: PublicKey;
        outputMint: PublicKey;
        inputAmount: bigint;
        minOutputAmount: bigint;
        slippageBps?: number;
        userPublicKey: PublicKey;
        validateWithOracle?: boolean;
    }): Promise<string>;
    /**
     * Execute swap using Jupiter Ultra API
     */
    executeUltraSwap(params: {
        inputMint: PublicKey;
        outputMint: PublicKey;
        amount: bigint;
        userPublicKey: PublicKey;
        slippageBps?: number;
        signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
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
    /**
     * Get oracle instance for external use
     */
    getOracle(): PriceOracle;
    /**
     * Display swap quote with oracle pricing
     */
    displaySwapQuote(inputMint: PublicKey, outputMint: PublicKey, amount: bigint, slippageBps?: number): Promise<void>;
}
//# sourceMappingURL=swap.d.ts.map