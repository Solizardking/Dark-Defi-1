/**
 * Oracle Integration Example
 *
 * Demonstrates how to use the Price Oracle and Jupiter Ultra API
 * for privacy-preserving swaps with real-time pricing validation
 */

import {
  DarkProtocolClient,
  PrivateSwapManager,
  PriceOracle,
  KNOWN_TOKENS,
  formatPrice,
  formatSlippage,
} from '@dark-protocol/sdk';
import { PublicKey, Keypair } from '@solana/web3.js';

async function main() {
  // ============================================================================
  // Setup
  // ============================================================================

  console.log('🚀 Dark Protocol Oracle Integration Example\n');

  // Initialize Dark Protocol client
  const client = await DarkProtocolClient.create({
    heliusApiKey: process.env.HELIUS_API_KEY!,
    rpcUrl: process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
  });

  // Initialize swap manager with all oracle keys
  const swapManager = new PrivateSwapManager(client, {
    jupiterApiKey: process.env.JUPITER_API_KEY,
    birdeyeApiKey: process.env.BIRDEYE_API_KEY,
    heliusApiKey: process.env.HELIUS_API_KEY,
  });

  const oracle = swapManager.getOracle();

  // Demo wallet (use your own keypair in production)
  const wallet = Keypair.generate();
  console.log(`📍 Wallet: ${wallet.publicKey.toString()}\n`);

  // ============================================================================
  // Example 1: Get Real-Time Token Prices
  // ============================================================================

  console.log('📊 Example 1: Real-Time Token Prices\n');

  try {
    // Get SOL price
    const solPrice = await oracle.getPrice(KNOWN_TOKENS.SOL);
    console.log('SOL Price:');
    console.log(`  Price: $${formatPrice(solPrice.priceUsd)}`);
    console.log(`  24h Change: ${solPrice.priceChange24h.toFixed(2)}%`);
    console.log(`  Liquidity: $${formatPrice(solPrice.liquidityUsd)}`);
    console.log(`  Volume 24h: $${formatPrice(solPrice.volume24h)}`);
    console.log(`  Source: ${solPrice.source}`);
    console.log();

    // Get USDC price
    const usdcPrice = await oracle.getPrice(KNOWN_TOKENS.USDC);
    console.log('USDC Price:');
    console.log(`  Price: $${formatPrice(usdcPrice.priceUsd)}`);
    console.log(`  24h Change: ${usdcPrice.priceChange24h.toFixed(2)}%`);
    console.log(`  Source: ${usdcPrice.source}`);
    console.log();
  } catch (error) {
    console.error('Error fetching prices:', error);
  }

  // ============================================================================
  // Example 2: Calculate Exchange Rates
  // ============================================================================

  console.log('💱 Example 2: Exchange Rate Calculation\n');

  try {
    const rate = await oracle.getExchangeRate(
      KNOWN_TOKENS.SOL,
      KNOWN_TOKENS.USDC
    );
    console.log(`1 SOL = ${formatPrice(rate)} USDC`);
    console.log(`1 USDC = ${formatPrice(1 / rate)} SOL\n`);
  } catch (error) {
    console.error('Error calculating exchange rate:', error);
  }

  // ============================================================================
  // Example 3: Slippage Protection
  // ============================================================================

  console.log('🛡️ Example 3: Slippage Protection\n');

  const expectedOutput = BigInt(1_000_000_000); // 1 SOL
  const slippageBps = 50; // 0.5%

  const minOutput = oracle.calculateMinOutput(expectedOutput, slippageBps);
  console.log(`Expected output: ${expectedOutput} lamports`);
  console.log(`Slippage tolerance: ${formatSlippage(slippageBps)}`);
  console.log(`Minimum output: ${minOutput} lamports`);
  console.log();

  // Validate actual output
  const actualOutput = BigInt(995_000_000);
  const isValid = oracle.validateSlippage(
    expectedOutput,
    actualOutput,
    slippageBps
  );
  console.log(`Actual output: ${actualOutput} lamports`);
  console.log(`Slippage valid: ${isValid ? '✅' : '❌'}`);

  const actualSlippage = oracle.calculateActualSlippage(
    expectedOutput,
    actualOutput
  );
  console.log(`Actual slippage: ${actualSlippage.toFixed(2)}%\n`);

  // ============================================================================
  // Example 4: Get Swap Quote with Oracle Validation
  // ============================================================================

  console.log('💰 Example 4: Swap Quote with Oracle Validation\n');

  try {
    const inputAmount = BigInt(10_000_000); // 0.01 SOL
    const quote = await swapManager.getQuoteWithOracle(
      new PublicKey(KNOWN_TOKENS.SOL),
      new PublicKey(KNOWN_TOKENS.USDC),
      inputAmount,
      50 // 0.5% slippage
    );

    console.log('🔮 Oracle Pricing:');
    if (quote.inputPrice) {
      console.log(
        `  SOL: $${formatPrice(quote.inputPrice.priceUsd)} (${
          quote.inputPrice.source
        })`
      );
    }
    if (quote.outputPrice) {
      console.log(
        `  USDC: $${formatPrice(quote.outputPrice.priceUsd)} (${
          quote.outputPrice.source
        })`
      );
    }
    if (quote.exchangeRate) {
      console.log(`  Oracle Rate: 1 SOL = ${formatPrice(quote.exchangeRate)} USDC`);
    }
    if (quote.priceDeviation !== undefined) {
      console.log(`  Price Deviation: ${quote.priceDeviation.toFixed(2)}%`);
    }

    console.log('\n📋 Quote Details:');
    console.log('─'.repeat(60));
    console.log(`Input:            ${quote.inputAmount} lamports (0.01 SOL)`);
    console.log(`Expected Output:  ${quote.outputAmount} (USDC)`);
    console.log(`Price Impact:     ${quote.priceImpactPct.toFixed(2)}%`);
    console.log(`Slippage:         ${formatSlippage(quote.slippageBps)}`);
    console.log(`Platform Fee:     ${formatSlippage(quote.platformFeeBps)}`);
    console.log();
  } catch (error) {
    console.error('Error getting quote:', error);
  }

  // ============================================================================
  // Example 5: Check Token Safety
  // ============================================================================

  console.log('🔒 Example 5: Token Safety Check (Jupiter Shield)\n');

  try {
    const warnings = await swapManager.checkTokenSafety([
      KNOWN_TOKENS.SOL,
      KNOWN_TOKENS.USDC,
      KNOWN_TOKENS.BONK, // Example memecoin
    ]);

    for (const warning of warnings) {
      console.log(`Token: ${warning.mint.slice(0, 8)}...`);
      console.log(`  Risk Level: ${warning.riskLevel}`);
      if (warning.warnings.length > 0) {
        console.log(`  Warnings:`);
        warning.warnings.forEach((w) => console.log(`    - ${w}`));
      }
      if (warning.freezeAuthority) {
        console.log(`  ⚠️ Has freeze authority`);
      }
      if (warning.mintAuthority) {
        console.log(`  ⚠️ Has mint authority`);
      }
      console.log();
    }
  } catch (error) {
    console.error('Error checking token safety:', error);
  }

  // ============================================================================
  // Example 6: Get Token Holdings
  // ============================================================================

  console.log('💼 Example 6: Get Token Holdings\n');

  try {
    const holdings = await swapManager.getHoldings(wallet.publicKey);

    if (holdings.length === 0) {
      console.log('No tokens found (demo wallet)\n');
    } else {
      console.log(`Found ${holdings.length} tokens:\n`);
      holdings.forEach((holding) => {
        console.log(`${holding.symbol} (${holding.name})`);
        console.log(`  Balance: ${holding.uiBalance}`);
        if (holding.priceUsd) {
          console.log(`  Price: $${formatPrice(holding.priceUsd)}`);
          console.log(`  Value: $${formatPrice(holding.valueUsd || 0)}`);
        }
        console.log();
      });
    }
  } catch (error) {
    console.error('Error fetching holdings:', error);
  }

  // ============================================================================
  // Example 7: Execute Swap with Oracle Validation
  // ============================================================================

  console.log('⚡ Example 7: Execute Swap with Oracle Protection\n');

  try {
    // This is a simulation - would execute on mainnet with real wallet
    console.log('Simulating swap execution...\n');

    const inputAmount = BigInt(10_000_000); // 0.01 SOL
    const slippageBps = 50; // 0.5%

    // Get quote first
    const quote = await swapManager.getQuoteWithOracle(
      new PublicKey(KNOWN_TOKENS.SOL),
      new PublicKey(KNOWN_TOKENS.USDC),
      inputAmount,
      slippageBps
    );

    // Calculate minimum output
    const minOutput = oracle.calculateMinOutput(quote.outputAmount, slippageBps);

    console.log('Swap Parameters:');
    console.log(`  Input: 0.01 SOL`);
    console.log(`  Expected Output: ${Number(quote.outputAmount) / 1e6} USDC`);
    console.log(`  Min Output: ${Number(minOutput) / 1e6} USDC`);
    console.log(`  Slippage: ${formatSlippage(slippageBps)}`);
    console.log(`  Oracle Validation: ✅`);
    console.log();

    // Would execute swap here in production
    // const signature = await swapManager.executePrivateSwap({
    //   inputMint: new PublicKey(KNOWN_TOKENS.SOL),
    //   outputMint: new PublicKey(KNOWN_TOKENS.USDC),
    //   inputAmount,
    //   minOutputAmount: minOutput,
    //   slippageBps,
    //   userPublicKey: wallet.publicKey,
    //   validateWithOracle: true,
    // });

    console.log('✅ Swap would be executed with full oracle protection!');
  } catch (error) {
    console.error('Error executing swap:', error);
  }

  // ============================================================================
  // Example 8: Volatility-Based Slippage
  // ============================================================================

  console.log('\n📈 Example 8: Volatility-Based Slippage Recommendations\n');

  const volatilities = [3.2, 8.5, 22.1, 45.8, 67.3];

  volatilities.forEach((volatility) => {
    const recommendedSlippage = PriceOracle.getRecommendedSlippage(volatility);
    console.log(
      `Volatility ${volatility.toFixed(1)}%: ` +
        `Recommended slippage = ${formatSlippage(recommendedSlippage)}`
    );
  });

  console.log('\n✅ Oracle integration examples complete!\n');
  console.log('🔗 Next steps:');
  console.log('  1. Set up your API keys (BIRDEYE_API_KEY, JUPITER_API_KEY)');
  console.log('  2. Fund your wallet with SOL');
  console.log('  3. Execute real swaps with oracle protection');
  console.log('  4. Monitor slippage and price deviations');
  console.log();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
