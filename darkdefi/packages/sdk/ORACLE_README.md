# 🔮 Price Oracle & Jupiter Ultra API Integration

Complete TypeScript SDK integration for real-time price oracles and Jupiter Ultra API.

## Features

✅ **Multi-Source Price Oracles**
- Birdeye API (primary) - Most accurate Solana prices
- Jupiter Price API (fallback) - Cross-DEX aggregation
- Automatic failover between sources

✅ **Jupiter Ultra API Integration**
- Order endpoint - Get unsigned transactions
- Execute endpoint - Submit signed transactions
- Holdings endpoint - Token balances with DAS API
- Shield endpoint - Token safety warnings
- Search endpoint - Token discovery
- Routers endpoint - Available DEX routers

✅ **Slippage Protection**
- BPS-based slippage calculation
- Validation against oracle prices
- Volatility-based recommendations
- Price deviation detection

✅ **Type-Safe API**
- Full TypeScript support
- Comprehensive interfaces
- JSDoc documentation

---

## Installation

The oracle module is included in the Dark Protocol SDK:

```bash
npm install @dark-protocol/sdk
```

---

## Quick Start

### 1. Setup API Keys

```bash
# Required for Birdeye price oracle
export BIRDEYE_API_KEY="your_birdeye_api_key"

# Optional - for higher Jupiter rate limits
export JUPITER_API_KEY="your_jupiter_api_key"

# Required for Helius RPC and DAS API
export HELIUS_API_KEY="your_helius_api_key"
export HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
```

### 2. Initialize Client

```typescript
import { DarkProtocolClient, PrivateSwapManager, PriceOracle } from '@dark-protocol/sdk';

// Create client
const client = await DarkProtocolClient.create({
  heliusApiKey: process.env.HELIUS_API_KEY!,
  rpcUrl: process.env.HELIUS_RPC_URL!,
});

// Create swap manager with oracle
const swapManager = new PrivateSwapManager(client, {
  jupiterApiKey: process.env.JUPITER_API_KEY,
  birdeyeApiKey: process.env.BIRDEYE_API_KEY,
  heliusApiKey: process.env.HELIUS_API_KEY,
});

// Get oracle instance
const oracle = swapManager.getOracle();
```

---

## Usage Examples

### Get Real-Time Token Price

```typescript
import { KNOWN_TOKENS, formatPrice } from '@dark-protocol/sdk';

// Get SOL price
const price = await oracle.getPrice(KNOWN_TOKENS.SOL);

console.log(`SOL: $${formatPrice(price.priceUsd)}`);
console.log(`24h Change: ${price.priceChange24h.toFixed(2)}%`);
console.log(`Liquidity: $${formatPrice(price.liquidityUsd)}`);
console.log(`Source: ${price.source}`); // "birdeye" or "jupiter"
```

### Calculate Exchange Rate

```typescript
// Get real-time SOL/USDC rate
const rate = await oracle.getExchangeRate(
  KNOWN_TOKENS.SOL,
  KNOWN_TOKENS.USDC
);

console.log(`1 SOL = ${rate} USDC`);
```

### Slippage Protection

```typescript
const expectedOutput = BigInt(1_000_000_000); // 1 SOL
const slippageBps = 50; // 0.5%

// Calculate minimum acceptable output
const minOutput = oracle.calculateMinOutput(expectedOutput, slippageBps);
// Returns: 995_000_000 (0.995 SOL)

// Validate actual output
const actualOutput = BigInt(994_000_000);
const isValid = oracle.validateSlippage(expectedOutput, actualOutput, slippageBps);
// Returns: false (slippage exceeded 0.5%)

// Get actual slippage percentage
const actualSlippage = oracle.calculateActualSlippage(expectedOutput, actualOutput);
// Returns: -0.6
```

### Get Swap Quote with Oracle Validation

```typescript
const quote = await swapManager.getQuoteWithOracle(
  new PublicKey(KNOWN_TOKENS.SOL),
  new PublicKey(KNOWN_TOKENS.USDC),
  BigInt(10_000_000), // 0.01 SOL
  50 // 0.5% slippage
);

console.log('Oracle Pricing:');
console.log(`  SOL: $${quote.inputPrice?.priceUsd}`);
console.log(`  USDC: $${quote.outputPrice?.priceUsd}`);
console.log(`  Rate: ${quote.exchangeRate}`);
console.log(`  Deviation: ${quote.priceDeviation}%`);

console.log('\nQuote Details:');
console.log(`  Expected Output: ${quote.outputAmount}`);
console.log(`  Price Impact: ${quote.priceImpactPct}%`);
```

### Execute Swap with Oracle Protection

```typescript
const signature = await swapManager.executePrivateSwap({
  inputMint: new PublicKey(KNOWN_TOKENS.SOL),
  outputMint: new PublicKey(KNOWN_TOKENS.USDC),
  inputAmount: BigInt(10_000_000),
  minOutputAmount: minOutput,
  slippageBps: 50,
  userPublicKey: wallet.publicKey,
  validateWithOracle: true, // Validates against oracle prices
});

console.log('Swap executed:', signature);
```

### Check Token Safety

```typescript
const warnings = await swapManager.checkTokenSafety([
  KNOWN_TOKENS.SOL,
  'some_unknown_token_mint'
]);

warnings.forEach(warning => {
  console.log(`Token: ${warning.mint}`);
  console.log(`Risk: ${warning.riskLevel}`);
  console.log(`Warnings: ${warning.warnings.join(', ')}`);

  if (warning.freezeAuthority) {
    console.warn('⚠️ Token has freeze authority!');
  }
});
```

### Get Token Holdings

```typescript
const holdings = await swapManager.getHoldings(wallet.publicKey);

holdings.forEach(holding => {
  console.log(`${holding.symbol}: ${holding.uiBalance}`);
  if (holding.priceUsd) {
    console.log(`  Value: $${holding.valueUsd}`);
  }
});
```

### Jupiter Ultra API - Full Workflow

```typescript
// Step 1: Get unsigned transaction
const order = await swapManager.getOrder(
  new PublicKey(KNOWN_TOKENS.SOL),
  new PublicKey(KNOWN_TOKENS.USDC),
  BigInt(10_000_000),
  wallet.publicKey,
  50 // slippage BPS
);

console.log('Request ID:', order.requestId);
console.log('Expected output:', order.outAmount);

// Step 2: Decode, sign, and serialize transaction
const txBuffer = Buffer.from(order.order, 'base64');
const transaction = VersionedTransaction.deserialize(txBuffer);
const signedTx = await wallet.signTransaction(transaction);
const signedTxBase64 = Buffer.from(signedTx.serialize()).toString('base64');

// Step 3: Execute signed transaction
const result = await swapManager.executeOrder(signedTxBase64, order.requestId);

console.log('Signature:', result.signature);
console.log('Status:', result.status);
```

---

## API Reference

### PriceOracle Class

#### Constructor

```typescript
new PriceOracle(config?: OracleConfig)
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getPrice(mint)` | Get token price from oracles | `Promise<TokenPrice>` |
| `getBirdeyePrice(mint)` | Get price from Birdeye | `Promise<TokenPrice>` |
| `getJupiterPrice(mint)` | Get price from Jupiter | `Promise<TokenPrice>` |
| `getPrices(mints[])` | Get multiple prices | `Promise<TokenPrice[]>` |
| `getExchangeRate(from, to)` | Calculate exchange rate | `Promise<number>` |
| `getBirdeyeMarketData(mint)` | Get detailed market data | `Promise<MarketData>` |
| `calculateMinOutput(amount, bps)` | Min output with slippage | `bigint` |
| `validateSlippage(expected, actual, bps)` | Validate slippage | `boolean` |
| `calculateActualSlippage(expected, actual)` | Get actual slippage % | `number` |

#### Static Methods

| Method | Description |
|--------|-------------|
| `bpsToPercentage(bps)` | Convert BPS to percentage |
| `percentageToBps(pct)` | Convert percentage to BPS |
| `getRecommendedSlippage(volatility)` | Get recommended slippage based on volatility |

### PrivateSwapManager Class

#### Jupiter Ultra API Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getOrder(input, output, amount, taker, slippage)` | Get unsigned transaction | `Promise<JupiterUltraOrder>` |
| `executeOrder(signedTx, requestId)` | Execute signed transaction | `Promise<JupiterUltraExecuteResult>` |
| `getHoldings(wallet)` | Get token balances | `Promise<TokenHolding[]>` |
| `checkTokenSafety(mints[])` | Check token warnings | `Promise<TokenShieldWarning[]>` |
| `searchTokens(query)` | Search for tokens | `Promise<any[]>` |
| `getRouters()` | Get available DEX routers | `Promise<string[]>` |

#### Quote Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getQuote(input, output, amount, slippage)` | Get Jupiter quote | `Promise<JupiterSwapRoute>` |
| `getQuoteWithOracle(...)` | Get quote + oracle pricing | `Promise<SwapQuoteWithOracle>` |
| `displaySwapQuote(...)` | Display formatted quote | `Promise<void>` |

#### Swap Execution

| Method | Description | Returns |
|--------|-------------|---------|
| `executePrivateSwap(params)` | Execute with privacy + oracle | `Promise<string>` |
| `executeUltraSwap(params)` | Execute via Jupiter Ultra | `Promise<string>` |

---

## Type Definitions

### TokenPrice

```typescript
interface TokenPrice {
  mint: string;
  symbol: string;
  priceUsd: number;
  priceChange24h: number;
  liquidityUsd: number;
  volume24h: number;
  source: 'birdeye' | 'jupiter' | 'helius';
  timestamp: number;
}
```

### MarketData

```typescript
interface MarketData {
  price: number;
  volume24h: number;
  liquidity: number;
  priceChange24h: number;
  holders?: number;
  supply?: number;
  marketCap?: number;
}
```

### SwapQuoteWithOracle

```typescript
interface SwapQuoteWithOracle extends JupiterSwapRoute {
  inputPrice?: TokenPrice;
  outputPrice?: TokenPrice;
  exchangeRate?: number;
  priceDeviation?: number;
}
```

---

## Slippage Guidelines

| BPS | Percentage | Use Case |
|-----|------------|----------|
| 10  | 0.1%       | Stablecoins (USDC/USDT) |
| 50  | 0.5%       | Major pairs (SOL/USDC) |
| 100 | 1.0%       | Volatile tokens |
| 200 | 2.0%       | Meme coins |
| 500 | 5.0%       | Extreme volatility |

---

## Known Token Addresses

```typescript
import { KNOWN_TOKENS } from '@dark-protocol/sdk';

KNOWN_TOKENS.SOL   // So11111111111111111111111111111111111111112
KNOWN_TOKENS.USDC  // EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
KNOWN_TOKENS.USDT  // Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
KNOWN_TOKENS.BONK  // DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
KNOWN_TOKENS.JUP   // JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN
```

---

## Environment Variables

```bash
# Birdeye API (required for oracle pricing)
BIRDEYE_API_KEY=your_birdeye_api_key

# Jupiter API (optional - for higher rate limits)
JUPITER_API_KEY=your_jupiter_api_key

# Helius RPC & DAS API (required for Solana RPC)
HELIUS_API_KEY=your_helius_api_key
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

---

## Error Handling

```typescript
try {
  const price = await oracle.getPrice(tokenMint);
  console.log(`Price: $${price.priceUsd}`);
} catch (error) {
  if (error.message.includes('Birdeye API error')) {
    console.warn('Birdeye unavailable, trying Jupiter...');
  } else if (error.message.includes('Failed to get price from any oracle')) {
    console.error('All oracle sources failed!');
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## Rate Limits

### Birdeye
- Free tier: 100 requests/minute
- Pro tier: 1,000 requests/minute

### Jupiter
- Free tier: Rate limited
- With API key: Higher limits

### Helius
- Varies by plan

---

## Testing

Run the example:

```bash
cd sdk/typescript
npm install
npm run build

# Set environment variables
export BIRDEYE_API_KEY=your_key
export JUPITER_API_KEY=your_key
export HELIUS_API_KEY=your_key
export HELIUS_RPC_URL=your_rpc_url

# Run example
node examples/oracle-swap-example.js
```

---

## Integration Checklist

- [ ] Set up Birdeye API key
- [ ] Set up Jupiter API key (optional)
- [ ] Set up Helius RPC URL and API key
- [ ] Initialize DarkProtocolClient
- [ ] Create PrivateSwapManager with oracle config
- [ ] Test price fetching
- [ ] Test slippage protection
- [ ] Execute test swap with oracle validation
- [ ] Monitor price deviations
- [ ] Implement error handling

---

## Best Practices

1. **Always validate with oracle** when executing large swaps
2. **Check token safety** before swapping unknown tokens
3. **Use appropriate slippage** based on token volatility
4. **Monitor price deviation** - reject if > 2% from oracle
5. **Handle API failures** gracefully with fallbacks
6. **Cache prices** for frequent queries (but not too long)
7. **Log all oracle calls** for debugging

---

## Support

- 📖 [Full SDK Documentation](../README.md)
- 🔮 [Oracle Integration Guide](../../dark-terminal/docs/ORACLE_INTEGRATION_GUIDE.md)
- 💬 [Discord](https://discord.gg/darkprotocol)
- 🐦 [Twitter](https://twitter.com/DarkProtocol)

---

**Built with privacy in mind. Trade with confidence. 🔒**
