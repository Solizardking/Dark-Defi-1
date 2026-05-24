# 🔮 Oracle Integration & Price Protection Guide

## Overview

Dark Terminal integrates multiple price oracles for real-time market data, dynamic exchange rates, and slippage protection across both Solana and cross-chain swaps.

---

## 🎯 Supported Oracles

### 1. Birdeye API (Primary - Solana)

**Endpoint**: `https://public-api.birdeye.so`

**Features:**
- Real-time token prices on Solana
- 24h price change tracking
- Liquidity and volume data
- Token holder counts
- Supply information

**Authentication:**
```bash
export BIRDEYE_API_KEY="your_birdeye_api_key"
```

**API Endpoints Used:**
- `/defi/price?address={mint}` - Get token price
- `/defi/token_overview?address={mint}` - Get market data

### 2. Jupiter Price API (Secondary - Solana)

**Endpoint**: `https://api.jup.ag/price/v2`

**Features:**
- Cross-DEX price aggregation
- 20+ DEX price discovery
- Fallback pricing source

**Authentication (Optional):**
```bash
export JUPITER_API_KEY="your_jupiter_api_key"  # For higher rate limits
```

### 3. Helius DAS API (Solana)

**Endpoint**: Configured via `HELIUS_RPC_URL`

**Features:**
- Digital Asset Standard (DAS) API
- Token metadata
- On-chain data access
- Real-time account updates

**Configuration:**
```bash
export HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY"
export HELIUS_API_KEY="YOUR_HELIUS_API_KEY"
```

---

## 📊 Price Oracle Module

### Architecture

```rust
use crate::price_oracle::PriceOracle;

// Initialize oracle
let oracle = PriceOracle::new()?;

// Get token price
let price = oracle.get_price("So11111111111111111111111111111111111111112").await?;
println!("SOL price: ${}", price.price_usd);

// Calculate exchange rate
let rate = oracle.get_exchange_rate(
    "So11111111111111111111111111111111111111112",  // SOL
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"   // USDC
).await?;
```

### Price Data Structure

```rust
pub struct TokenPrice {
    pub mint: String,           // Token mint address
    pub symbol: String,         // Token symbol (SOL, USDC, etc.)
    pub price_usd: f64,        // Price in USD
    pub price_change_24h: f64, // 24h price change %
    pub liquidity_usd: f64,    // Total liquidity in USD
    pub volume_24h: f64,       // 24h volume in USD
    pub source: String,        // Oracle source (Birdeye/Jupiter)
    pub timestamp: u64,        // Unix timestamp
}
```

### Market Data Structure

```rust
pub struct MarketData {
    pub price: f64,             // Current price
    pub volume_24h: f64,        // 24h trading volume
    pub liquidity: f64,         // Total liquidity
    pub price_change_24h: f64,  // 24h price change %
    pub holders: u64,           // Number of token holders
    pub supply: f64,            // Total supply
}
```

---

## 🛡️ Slippage Protection

### How It Works

```rust
// Calculate minimum output with slippage protection
let expected_output = 1_000_000_000; // 1 SOL in lamports
let slippage_bps = 50;               // 0.5% slippage

let min_output = oracle.calculate_min_output(expected_output, slippage_bps);
// min_output = 995_000_000 (0.5% less than expected)
```

### Slippage Validation

```rust
// Validate actual output meets slippage threshold
let expected_output = 1_000_000_000;
let actual_output = 994_000_000;
let slippage_bps = 50;

let is_valid = oracle.calculate_slippage(
    expected_output,
    actual_output,
    slippage_bps
)?;

if !is_valid {
    println!("Slippage exceeded! Transaction would fail.");
}
```

### Slippage in BPS (Basis Points)

| BPS | Percentage | Use Case |
|-----|------------|----------|
| 10  | 0.1%       | Stablecoins (USDC/USDT) |
| 50  | 0.5%       | Major pairs (SOL/USDC) |
| 100 | 1.0%       | Volatile tokens |
| 200 | 2.0%       | Meme coins |
| 500 | 5.0%       | Very high volatility |

---

## 🌉 Cross-Chain Oracle Integration

### Dynamic Exchange Rates

The bridge now supports oracle-based exchange rates for SOL ↔ ZEC swaps:

**Current (v1.0.0 - Hardcoded):**
```rust
// Fixed rate: 1 SOL = 4 ZEC
let zec_amount = sol_amount * 4;
```

**Future (v1.1.0 - Oracle-Based):**
```rust
// Real-time oracle rate
let oracle = PriceOracle::new()?;
let rate = oracle.get_exchange_rate(
    "So11111111111111111111111111111111111111112",  // SOL
    "zcash_placeholder"                              // ZEC
).await?;

let zec_amount = (sol_amount as f64 * rate) as u64;
```

### Bridge Slippage Protection

```bash
# Get quote with oracle validation
./target/release/dark bridge-swap \
  --from sol \
  --to zec \
  --amount 0.1 \
  --max-slippage 100  # 1.0% max slippage
```

**Example Output:**
```
🌉 Cross-Chain Bridge Swap
ℹ Solana → Zcash
ℹ Amount: 0.1 SOL

🔮 Oracle Pricing:
  SOL Price:        $142.50 (Birdeye)
  ZEC Price:        $35.80 (Birdeye)
  Live Rate:        1 SOL = 3.98 ZEC
  Expected Output:  0.398 ZEC

🛡️ Slippage Protection:
  Max Slippage:     1.0% (100 BPS)
  Min Output:       0.394 ZEC
  Price Valid For:  30 seconds

✓ Bridge quote received!
```

---

## 🚀 Jupiter Ultra API Integration

### Enhanced Swap Features

Dark Terminal now supports all Jupiter Ultra API endpoints:

#### 1. Order (Quote with Transaction)

```rust
// Get unsigned transaction
let response = jupiter.order(
    input_mint,
    output_mint,
    amount,
    taker_address,
    slippage_bps
).await?;

// Returns base64-encoded unsigned transaction
```

#### 2. Execute (Submit Signed Transaction)

```rust
// Execute signed swap
let result = jupiter.execute(
    signed_transaction,
    request_id
).await?;

// Returns signature and execution status
```

#### 3. Holdings (Token Balances with DAS)

```rust
// Get all token balances including metadata
let holdings = jupiter.holdings(wallet_address).await?;

// Returns SOL + all SPL token balances with metadata
```

#### 4. Shield (Token Safety Check)

```rust
// Check token warnings before swap
let warnings = jupiter.shield(vec![
    "TokenMintAddress1",
    "TokenMintAddress2"
]).await?;

// Warns about: rug pulls, low liquidity, freeze authority, etc.
```

#### 5. Search (Token Discovery)

```rust
// Search for tokens by symbol/name
let tokens = jupiter.search("BONK").await?;

// Returns token info, price, holders, etc.
```

#### 6. Routers (Available DEXs)

```rust
// Get list of available routers
let routers = jupiter.routers().await?;

// Returns: Iris, JupiterZ, DFlow, OKX
```

### Ultra API Features

**Gasless Swaps:**
- Maker (MM) covers gas for qualifying swaps
- No SOL needed for transaction fees
- Automatic eligibility detection

**Advanced Routing:**
- Multi-hop optimization
- Cross-DEX arbitrage
- MEV protection

**Fee Structure:**
```
Platform Fee:    0.3% (30 BPS)
Signature Fee:   5000 lamports (~$0.0007)
Priority Fee:    Dynamic (Jito/MEV)
Rent Fee:        ~2039280 lamports for new accounts
```

---

## 📖 Configuration Guide

### Environment Variables

```bash
# Core APIs
export HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
export HELIUS_API_KEY="YOUR_HELIUS_KEY"
export JUPITER_API_KEY="YOUR_JUPITER_KEY"    # Optional, for higher limits
export BIRDEYE_API_KEY="YOUR_BIRDEYE_KEY"    # Required for oracle pricing

# AI/Agent
export XAI_API_KEY="xai-YOUR_GROK_KEY"       # For AI agent

# GetBlock (Zcash)
export GETBLOCK_ZEC_RPC="https://go.getblock.io/YOUR_KEY"
```

### Dark Terminal Config

```bash
# Configure with all APIs
./target/release/dark config \
  --network mainnet \
  --rpc $HELIUS_RPC_URL \
  --grok-api-key $XAI_API_KEY

# Verify configuration
./target/release/dark config --show
```

---

## 🔬 Testing Oracle Integration

### Test Price Feeds

```bash
# Test Birdeye price feed
curl -X GET "https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112" \
  -H "X-API-KEY: YOUR_BIRDEYE_KEY"

# Test Jupiter price feed
curl "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112"
```

### Test Swap with Oracle

```bash
# Get quote with real-time pricing
./target/release/dark swap \
  --from SOL \
  --to USDC \
  --amount 0.01 \
  --slippage 50 \
  --quote-only
```

**Expected Output:**
```
🔮 Oracle Pricing:
  SOL:  $142.50 (Birdeye)
  USDC: $1.00 (Jupiter)
  Rate: 142.50

Quote Details:
────────────────────────────────────────────────────────────
Input Amount:     10000000 lamports (0.01 SOL)
Expected Output:  1425000 (1.425 USDC)
Oracle Price:     $142.50/SOL
Slippage:         50 BPS (0.5%)
Min Output:       1417875 (1.417875 USDC)
```

---

## 🛠️ Future Enhancements (v1.1.0)

### 1. Multi-Oracle Aggregation

**Planned:**
- Combine Birdeye + Jupiter + Pyth
- Weighted average pricing
- Outlier detection
- Failover logic

```rust
// Future implementation
let prices = vec![
    oracle.get_birdeye_price(mint).await?,
    oracle.get_jupiter_price(mint).await?,
    oracle.get_pyth_price(mint).await?,
];

let aggregated_price = calculate_weighted_average(prices);
```

### 2. Time-Weighted Average Price (TWAP)

```rust
// TWAP over 5 minutes
let twap = oracle.get_twap(mint, 300).await?;  // 300 seconds

// Use for large swaps to reduce price impact
```

### 3. Volatility-Based Slippage

```rust
// Auto-adjust slippage based on volatility
let volatility = oracle.get_volatility_24h(mint).await?;
let recommended_slippage = match volatility {
    v if v < 0.05 => 10,   // < 5% volatility → 0.1% slippage
    v if v < 0.15 => 50,   // < 15% volatility → 0.5% slippage
    v if v < 0.30 => 100,  // < 30% volatility → 1.0% slippage
    _ => 200,              // High volatility → 2.0% slippage
};
```

### 4. Cross-Chain Price Discovery

```rust
// Get ZEC price from multiple sources
let zec_prices = oracle.get_cross_chain_price("ZEC").await?;
// Sources: CoinGecko, CoinMarketCap, Binance, etc.
```

### 5. MEV Detection & Protection

```rust
// Detect potential MEV before swap
let mev_risk = oracle.detect_mev_risk(
    from_mint,
    to_mint,
    amount
).await?;

if mev_risk.is_high() {
    // Use private transaction relay
    // Or split into smaller swaps
}
```

---

## 📊 Monitoring & Analytics

### Price Alerts

```bash
# Set price alert (future feature)
./target/release/dark agent alert \
  --token SOL \
  --condition "price > 150" \
  --action "notify"
```

### Historical Data

```bash
# Get historical prices (future feature)
./target/release/dark oracle history \
  --token SOL \
  --period 30d \
  --interval 1h
```

### Portfolio Tracking

```bash
# Track portfolio value with real-time pricing
./target/release/dark agent analyze \
  --type portfolio \
  --period 24h
```

---

## 🔐 Security Considerations

### API Key Management

- **Never commit API keys** to version control
- Store keys in environment variables
- Use secrets management for production
- Rotate keys regularly

### Price Manipulation Protection

- Multiple oracle sources prevent single-point manipulation
- Outlier detection filters anomalous prices
- TWAP smooths out flash crashes
- Slippage limits protect against sandwich attacks

### Rate Limiting

**Birdeye:**
- Free tier: 100 requests/minute
- Pro tier: 1000 requests/minute

**Jupiter:**
- Free tier: Rate limited
- With API key: Higher limits

---

## 📚 Additional Resources

- [Birdeye API Docs](https://docs.birdeye.so)
- [Jupiter Ultra API Docs](https://station.jup.ag/docs/apis/ultra)
- [Helius DAS API Docs](https://docs.helius.dev/compression-and-das-api/digital-asset-standard-das-api)
- [Price Oracle Best Practices](https://docs.chain.link/architecture-overview/oracle-fundamentals)

---

**Dark Terminal v1.0.0** - Real-time oracle integration coming in v1.1.0! 🔮
