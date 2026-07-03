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
// Types & Interfaces
// ============================================================================

/**
 * Token price information from oracle
 */
export interface TokenPrice {
  mint: string;              // Token mint address
  symbol: string;            // Token symbol (SOL, USDC, etc.)
  priceUsd: number;         // Price in USD
  priceChange24h: number;   // 24h price change percentage
  liquidityUsd: number;     // Total liquidity in USD
  volume24h: number;        // 24h trading volume in USD
  source: 'birdeye' | 'jupiter' | 'helius';  // Data source
  timestamp: number;        // Unix timestamp (ms)
}

/**
 * Detailed market data for a token
 */
export interface MarketData {
  price: number;            // Current price
  volume24h: number;        // 24h trading volume
  liquidity: number;        // Total liquidity
  priceChange24h: number;   // 24h price change percentage
  symbol?: string;          // Token symbol
  holders?: number;         // Number of token holders
  supply?: number;          // Total/circulating supply
  marketCap?: number;       // Market capitalization
}

/**
 * Birdeye API response structure
 */
interface BirdeyePriceResponse {
  data: {
    value: number;
    updateUnixTime: number;
    updateHumanTime: string;
    priceChange24h: number;
  };
  success: boolean;
}

interface BirdeyeMarketDataResponse {
  data: {
    address: string;
    symbol: string;
    price: number;
    liquidity: number;
    v24hUSD: number;
    priceChange24hPercent: number;
    holder: number;
    supply: number;
    mc: number;
  };
  success: boolean;
}

/**
 * Jupiter Price API response structure
 */
interface JupiterPriceResponse {
  data: {
    [mint: string]: {
      id: string;
      type: string;
      price: string;
      extraInfo?: {
        lastSwappedPrice?: {
          lastJupiterSellAt?: number;
          lastJupiterSellPrice?: string;
        };
      };
    };
  };
  timeTaken: number;
}

/**
 * Oracle configuration
 */
export interface OracleConfig {
  birdeyeApiKey?: string;
  jupiterApiKey?: string;
  heliusApiKey?: string;
}

// ============================================================================
// Constants
// ============================================================================

const BIRDEYE_API_URL = 'https://public-api.birdeye.so';
const JUPITER_PRICE_API_URL = 'https://api.jup.ag/price/v2';

// Well-known token addresses
export const KNOWN_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
} as const;

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
export class PriceOracle {
  private birdeyeApiKey?: string;
  private jupiterApiKey?: string;
  private heliusApiKey?: string;

  constructor(config?: OracleConfig) {
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
  async getPrice(mint: string): Promise<TokenPrice> {
    // Try Birdeye first (most accurate for Solana)
    try {
      return await this.getBirdeyePrice(mint);
    } catch (error) {
      console.warn('Birdeye price fetch failed:', error);
    }

    // Fallback to Jupiter
    try {
      return await this.getJupiterPrice(mint);
    } catch (error) {
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
  async getBirdeyePrice(mint: string): Promise<TokenPrice> {
    if (!this.birdeyeApiKey) {
      throw new Error('Birdeye API key not configured');
    }

    const response = await fetch(
      `${BIRDEYE_API_URL}/defi/price?address=${mint}`,
      {
        headers: {
          'X-API-KEY': this.birdeyeApiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.statusText}`);
    }

    const data = (await response.json()) as BirdeyePriceResponse;

    if (!data.success || !data.data) {
      throw new Error('Invalid Birdeye response');
    }

    // Get additional market data
    let marketData: MarketData | null = null;
    try {
      marketData = await this.getBirdeyeMarketData(mint);
    } catch (error) {
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
  async getBirdeyeMarketData(mint: string): Promise<MarketData> {
    if (!this.birdeyeApiKey) {
      throw new Error('Birdeye API key not configured');
    }

    const response = await fetch(
      `${BIRDEYE_API_URL}/defi/token_overview?address=${mint}`,
      {
        headers: {
          'X-API-KEY': this.birdeyeApiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.statusText}`);
    }

    const result = (await response.json()) as BirdeyeMarketDataResponse;

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
  async getJupiterPrice(mint: string): Promise<TokenPrice> {
    const headers: Record<string, string> = {};
    if (this.jupiterApiKey) {
      headers['X-API-KEY'] = this.jupiterApiKey;
    }

    const response = await fetch(
      `${JUPITER_PRICE_API_URL}?ids=${mint}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`);
    }

    const data = (await response.json()) as JupiterPriceResponse;

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
      liquidityUsd: 0,   // Not available in price endpoint
      volume24h: 0,      // Not available in price endpoint
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
  async getPrices(mints: string[]): Promise<TokenPrice[]> {
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
  async getExchangeRate(fromMint: string, toMint: string): Promise<number> {
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
  calculateMinOutput(expectedOutput: bigint, slippageBps: number): bigint {
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
  validateSlippage(
    expectedOutput: bigint,
    actualOutput: bigint,
    slippageBps: number
  ): boolean {
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
  calculateActualSlippage(
    expectedOutput: bigint,
    actualOutput: bigint
  ): number {
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
  static bpsToPercentage(bps: number): number {
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
  static percentageToBps(percentage: number): number {
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
  static getRecommendedSlippage(volatility24h: number): number {
    if (volatility24h < 5) return 10;   // 0.1% for stablecoins
    if (volatility24h < 15) return 50;  // 0.5% for major pairs
    if (volatility24h < 30) return 100; // 1.0% for volatile tokens
    if (volatility24h < 50) return 200; // 2.0% for meme coins
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
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (price >= 1) {
    return price.toFixed(4);
  } else if (price >= 0.01) {
    return price.toFixed(6);
  } else {
    return price.toFixed(8);
  }
}

/**
 * Format slippage percentage
 *
 * @param bps - Slippage in basis points
 * @returns Formatted string (e.g., "0.5%")
 */
export function formatSlippage(bps: number): string {
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
export function calculatePriceImpact(
  inputAmount: bigint,
  outputAmount: bigint,
  inputPrice: number,
  outputPrice: number,
  inputDecimals: number,
  outputDecimals: number
): number {
  const inputValueUsd =
    (Number(inputAmount) / Math.pow(10, inputDecimals)) * inputPrice;
  const outputValueUsd =
    (Number(outputAmount) / Math.pow(10, outputDecimals)) * outputPrice;

  return ((outputValueUsd - inputValueUsd) / inputValueUsd) * 100;
}
