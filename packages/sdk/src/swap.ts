import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { DarkProtocolClient } from './client';
import { PriceOracle, type TokenPrice, formatPrice, formatSlippage } from './oracle';
import type { JupiterSwapRoute } from './types';

// Jupiter Ultra API endpoints
const JUPITER_ULTRA_API_URL = 'https://lite-api.jup.ag/ultra/v1';
const JUPITER_QUOTE_API_URL = 'https://lite-api.jup.ag/swap/v1';

// ============================================================================
// Types for Jupiter Ultra API
// ============================================================================

/**
 * Jupiter Ultra Order response
 */
export interface JupiterUltraOrder {
  order: string;              // Base64-encoded unsigned transaction
  requestId: string;          // Request ID for tracking
  inputMint: string;          // Input token mint
  outputMint: string;         // Output token mint
  inAmount: string;           // Input amount
  outAmount: string;          // Estimated output amount
  slippageBps: number;        // Slippage in BPS
  platformFeeBps: number;     // Platform fee in BPS
  priceImpactPct: string;     // Price impact percentage
}

/**
 * Jupiter Ultra Execute response
 */
export interface JupiterUltraExecuteResult {
  signature: string;          // Transaction signature
  requestId: string;          // Request ID for tracking
  status: 'pending' | 'success' | 'failed';
}

/**
 * Token holdings from Jupiter Ultra
 */
export interface TokenHolding {
  mint: string;               // Token mint address
  symbol: string;             // Token symbol
  name: string;               // Token name
  balance: string;            // Balance in smallest units
  decimals: number;           // Token decimals
  uiBalance: number;          // Human-readable balance
  priceUsd?: number;          // Price in USD (if available)
  valueUsd?: number;          // Total value in USD
}

/**
 * Token safety warnings from Shield API
 */
export interface TokenShieldWarning {
  mint: string;               // Token mint address
  warnings: string[];         // List of warnings
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  freezeAuthority?: boolean;  // Has freeze authority
  mintAuthority?: boolean;    // Has mint authority
  lowLiquidity?: boolean;     // Low liquidity warning
}

/**
 * Swap quote with oracle pricing
 */
export interface SwapQuoteWithOracle extends JupiterSwapRoute {
  inputPrice?: TokenPrice;    // Input token oracle price
  outputPrice?: TokenPrice;   // Output token oracle price
  exchangeRate?: number;      // Oracle exchange rate
  priceDeviation?: number;    // Deviation from oracle price (%)
}

// ============================================================================
// Private Swap Manager with Oracle Integration
// ============================================================================

export class PrivateSwapManager {
  private client: DarkProtocolClient;
  private jupiterApiKey?: string;
  private oracle: PriceOracle;

  constructor(client: DarkProtocolClient, config?: {
    jupiterApiKey?: string;
    birdeyeApiKey?: string;
    heliusApiKey?: string;
  }) {
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
  async getQuote(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: bigint,
    slippageBps: number = 50
  ): Promise<JupiterSwapRoute> {
    const url = new URL(`${JUPITER_QUOTE_API_URL}/quote`);
    url.searchParams.set('inputMint', inputMint.toString());
    url.searchParams.set('outputMint', outputMint.toString());
    url.searchParams.set('amount', amount.toString());
    url.searchParams.set('slippageBps', slippageBps.toString());

    const headers: Record<string, string> = {};
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
  async getQuoteWithOracle(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: bigint,
    slippageBps: number = 50
  ): Promise<SwapQuoteWithOracle> {
    // Get Jupiter quote
    const quote = await this.getQuote(inputMint, outputMint, amount, slippageBps);

    // Get oracle prices in parallel
    const [inputPrice, outputPrice] = await Promise.all([
      this.oracle.getPrice(inputMint.toString()).catch(() => undefined),
      this.oracle.getPrice(outputMint.toString()).catch(() => undefined),
    ]);

    // Calculate oracle-based exchange rate
    let exchangeRate: number | undefined;
    let priceDeviation: number | undefined;

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
  async getOrder(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: bigint,
    takerAddress: PublicKey,
    slippageBps: number = 50
  ): Promise<JupiterUltraOrder> {
    const url = new URL(`${JUPITER_ULTRA_API_URL}/order`);
    url.searchParams.set('inputMint', inputMint.toString());
    url.searchParams.set('outputMint', outputMint.toString());
    url.searchParams.set('amount', amount.toString());
    url.searchParams.set('taker', takerAddress.toString());
    url.searchParams.set('slippageBps', slippageBps.toString());

    const headers: Record<string, string> = {};
    if (this.jupiterApiKey) {
      headers['Authorization'] = `Bearer ${this.jupiterApiKey}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Jupiter Ultra order error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Execute signed transaction (Execute endpoint)
   */
  async executeOrder(
    signedTransaction: string,
    requestId: string
  ): Promise<JupiterUltraExecuteResult> {
    const url = new URL(`${JUPITER_ULTRA_API_URL}/execute`);

    const body = {
      transaction: signedTransaction,
      requestId,
    };

    const headers: Record<string, string> = {
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
  async getHoldings(walletAddress: PublicKey): Promise<TokenHolding[]> {
    const url = new URL(`${JUPITER_ULTRA_API_URL}/holdings`);
    url.searchParams.set('wallet', walletAddress.toString());

    const headers: Record<string, string> = {};
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
  async checkTokenSafety(mints: string[]): Promise<TokenShieldWarning[]> {
    const url = new URL(`${JUPITER_ULTRA_API_URL}/shield`);
    for (const mint of mints) {
      url.searchParams.append('mints', mint);
    }

    const headers: Record<string, string> = {};
    if (this.jupiterApiKey) {
      headers['Authorization'] = `Bearer ${this.jupiterApiKey}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Jupiter Shield API error: ${response.statusText}`);
    }

    const data = await response.json();
    const warningMap = data.warnings || {};

    return mints.map((mint) => {
      const mintWarnings = Array.isArray(warningMap[mint]) ? warningMap[mint] : [];
      const warnings = mintWarnings
        .map((warning: Record<string, unknown>) => String(warning.message ?? warning.type ?? 'Unknown warning'))
        .filter(Boolean);
      const severities = mintWarnings
        .map((warning: Record<string, unknown>) => String(warning.severity ?? '').toLowerCase());

      const riskLevel: TokenShieldWarning['riskLevel'] =
        severities.includes('danger') || severities.includes('critical')
          ? 'critical'
          : severities.includes('warn') || severities.includes('warning')
          ? 'medium'
          : 'low';

      return {
        mint,
        warnings,
        riskLevel,
      };
    });
  }

  /**
   * Search for tokens
   */
  async searchTokens(query: string): Promise<any[]> {
    const url = new URL(`${JUPITER_ULTRA_API_URL}/search`);
    url.searchParams.set('query', query);

    const headers: Record<string, string> = {};
    if (this.jupiterApiKey) {
      headers['Authorization'] = `Bearer ${this.jupiterApiKey}`;
    }

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      throw new Error(`Jupiter search error: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.tokens || [];
  }

  /**
   * Get available routers
   */
  async getRouters(): Promise<string[]> {
    const url = new URL(`${JUPITER_ULTRA_API_URL}/routers`);

    const headers: Record<string, string> = {};
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
  async executePrivateSwap(params: {
    inputMint: PublicKey;
    outputMint: PublicKey;
    inputAmount: bigint;
    minOutputAmount: bigint;
    slippageBps?: number;
    userPublicKey: PublicKey;
    validateWithOracle?: boolean;
  }): Promise<string> {
    // Check token safety first
    const warnings = await this.checkTokenSafety([
      params.inputMint.toString(),
      params.outputMint.toString(),
    ]);

    const highRiskTokens = warnings.filter(w =>
      w.riskLevel === 'high' || w.riskLevel === 'critical'
    );

    if (highRiskTokens.length > 0) {
      console.warn('⚠️ High-risk tokens detected:', highRiskTokens);
    }

    // Get quote with oracle validation
    const quote = await this.getQuoteWithOracle(
      params.inputMint,
      params.outputMint,
      params.inputAmount,
      params.slippageBps
    );

    // Validate quote with oracle if requested
    if (params.validateWithOracle && quote.priceDeviation !== undefined) {
      const maxDeviation = 2; // 2% max deviation from oracle
      if (Math.abs(quote.priceDeviation) > maxDeviation) {
        throw new Error(
          `Price deviation too high: ${quote.priceDeviation.toFixed(2)}% ` +
          `(max ${maxDeviation}%). Possible price manipulation.`
        );
      }
    }

    // Validate slippage
    const slippageBps = params.slippageBps || 50;
    const isValid = this.oracle.validateSlippage(
      quote.outputAmount,
      params.minOutputAmount,
      slippageBps
    );

    if (!isValid) {
      throw new Error(
        `Minimum output amount ${params.minOutputAmount} ` +
        `exceeds slippage tolerance of ${formatSlippage(slippageBps)}`
      );
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
    const jupiterRoutePlan = this.encodeRoutePlan(quote);

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
  async executeUltraSwap(params: {
    inputMint: PublicKey;
    outputMint: PublicKey;
    amount: bigint;
    userPublicKey: PublicKey;
    slippageBps?: number;
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
  }): Promise<string> {
    const slippageBps = params.slippageBps || 50;

    // Step 1: Get unsigned transaction
    const order = await this.getOrder(
      params.inputMint,
      params.outputMint,
      params.amount,
      params.userPublicKey,
      slippageBps
    );

    // Step 2: Decode and sign transaction
    const transactionBuffer = Buffer.from(order.order, 'base64');
    const transaction = VersionedTransaction.deserialize(transactionBuffer);
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
  private parseJupiterRoute(data: any): JupiterSwapRoute {
    return {
      inputMint: new PublicKey(data.inputMint),
      outputMint: new PublicKey(data.outputMint),
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
  private encodeRoutePlan(route: JupiterSwapRoute): Uint8Array {
    // Serialize route plan to bytes for on-chain processing
    const json = JSON.stringify(route.routePlan);
    return new TextEncoder().encode(json);
  }

  /**
   * Get best route across multiple DEXs
   */
  async getBestRoute(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: bigint
  ): Promise<JupiterSwapRoute> {
    // Jupiter automatically finds best route
    return this.getQuote(inputMint, outputMint, amount);
  }

  /**
   * Get oracle instance for external use
   */
  getOracle(): PriceOracle {
    return this.oracle;
  }

  /**
   * Display swap quote with oracle pricing
   */
  async displaySwapQuote(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: bigint,
    slippageBps: number = 50
  ): Promise<void> {
    const quote = await this.getQuoteWithOracle(
      inputMint,
      outputMint,
      amount,
      slippageBps
    );

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
