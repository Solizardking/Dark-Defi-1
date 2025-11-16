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
/**
 * Token price information from oracle
 */
export interface TokenPrice {
    mint: string;
    symbol: string;
    priceUsd: number;
    priceChange24h: number;
    liquidityUsd: number;
    volume24h: number;
    source: 'birdeye' | 'jupiter' | 'helius';
    timestamp: number;
}
/**
 * Detailed market data for a token
 */
export interface MarketData {
    price: number;
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
    symbol?: string;
    holders?: number;
    supply?: number;
    marketCap?: number;
}
/**
 * Oracle configuration
 */
export interface OracleConfig {
    birdeyeApiKey?: string;
    jupiterApiKey?: string;
    heliusApiKey?: string;
}
export declare const KNOWN_TOKENS: {
    readonly SOL: "So11111111111111111111111111111111111111112";
    readonly USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    readonly USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
    readonly BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
    readonly JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";
};
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
export declare class PriceOracle {
    private birdeyeApiKey?;
    private jupiterApiKey?;
    private heliusApiKey?;
    constructor(config?: OracleConfig);
    /**
     * Get aggregated token price from multiple sources
     * Tries Birdeye first, falls back to Jupiter if unavailable
     *
     * @param mint - Token mint address
     * @returns Token price information
     * @throws Error if all oracle sources fail
     */
    getPrice(mint: string): Promise<TokenPrice>;
    /**
     * Get price from Birdeye API
     *
     * @param mint - Token mint address
     * @returns Token price from Birdeye
     */
    getBirdeyePrice(mint: string): Promise<TokenPrice>;
    /**
     * Get detailed market data from Birdeye
     *
     * @param mint - Token mint address
     * @returns Market data
     */
    getBirdeyeMarketData(mint: string): Promise<MarketData>;
    /**
     * Get price from Jupiter Price API
     *
     * @param mint - Token mint address
     * @returns Token price from Jupiter
     */
    getJupiterPrice(mint: string): Promise<TokenPrice>;
    /**
     * Get prices for multiple tokens in one request
     *
     * @param mints - Array of token mint addresses
     * @returns Array of token prices
     */
    getPrices(mints: string[]): Promise<TokenPrice[]>;
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
    getExchangeRate(fromMint: string, toMint: string): Promise<number>;
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
    calculateMinOutput(expectedOutput: bigint, slippageBps: number): bigint;
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
    validateSlippage(expectedOutput: bigint, actualOutput: bigint, slippageBps: number): boolean;
    /**
     * Calculate actual slippage percentage
     *
     * @param expectedOutput - Expected output amount
     * @param actualOutput - Actual received amount
     * @returns Slippage percentage (negative means worse than expected)
     */
    calculateActualSlippage(expectedOutput: bigint, actualOutput: bigint): number;
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
    static bpsToPercentage(bps: number): number;
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
    static percentageToBps(percentage: number): number;
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
    static getRecommendedSlippage(volatility24h: number): number;
}
/**
 * Format price with appropriate decimal places
 *
 * @param price - Price value
 * @returns Formatted price string
 */
export declare function formatPrice(price: number): string;
/**
 * Format slippage percentage
 *
 * @param bps - Slippage in basis points
 * @returns Formatted string (e.g., "0.5%")
 */
export declare function formatSlippage(bps: number): string;
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
export declare function calculatePriceImpact(inputAmount: bigint, outputAmount: bigint, inputPrice: number, outputPrice: number, inputDecimals: number, outputDecimals: number): number;
//# sourceMappingURL=oracle.d.ts.map