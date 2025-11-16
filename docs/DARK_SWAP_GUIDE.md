# 🔄 Dark Swap Guide - Complete Tutorial

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step: Your First Private Swap](#step-by-step-your-first-private-swap)
4. [Advanced Features](#advanced-features)
5. [Privacy Options](#privacy-options)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Introduction

Dark Terminal's swap functionality allows you to execute **private, MEV-protected token swaps** on Solana mainnet using Jupiter's DEX aggregator. This guide will walk you through everything you need to know.

### What Makes Dark Swaps Special?

- **Privacy-Preserving**: Shielded addresses hide your identity
- **MEV Protection**: Transactions can't be front-run or sandwiched
- **Best Execution**: Routes across 20+ DEXs for optimal prices
- **Lightning Fast**: 400ms settlement time on Solana
- **AI-Powered**: Grok-4 can analyze market conditions before you swap

---

## Prerequisites

### 1. Build Dark Terminal

```bash
cd dark-wallet/dark-terminal
cargo build --release
```

### 2. Get API Keys

#### Helius RPC (Required for Solana)

You can use the provided key or get your own:

- **Provided**: `https://mainnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0`
- **Get your own**: Visit [helius.dev](https://helius.dev) and sign up for free tier

#### GetBlock (Required for Cross-Chain)

For SOL ↔ ZEC bridge swaps:

- **Provided**: `https://go.getblock.io/ef41756f29904c9b9a84fc9bfbd63018`
- **Get your own**: Visit [getblock.io](https://getblock.io) and sign up

#### xAI API Key (Optional - for AI features)
1. Visit [x.ai/api](https://x.ai/api)
2. Request Grok-4 API access
3. Copy your API key

### 3. Configure Dark Terminal

```bash
# Use provided Helius key or replace with your own
export HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0"
export XAI_API_KEY="xai-YOUR_API_KEY"

./target/release/dark config \
  --network mainnet \
  --rpc $HELIUS_RPC_URL \
  --grok-api-key $XAI_API_KEY
```

Verify configuration:
```bash
./target/release/dark config --show
```

Expected output:
```
⚙️  Configuration

Network:                  mainnet
RPC URL:                  https://mainnet.helius-rpc.com/?api-key=***
Wallet Path:              ~/.dark-terminal/wallets
Grok API Key:             Set

Privacy Settings:
  Tor Enabled:            No
  Auto New Address:       false
  Randomize Timing:       false
```

---

## Step-by-Step: Your First Private Swap

### Step 1: Create a Wallet

```bash
./target/release/dark wallet create --name trading-wallet
```

**Output:**
```
🛡️ Create Shielded Wallet

⚠️  IMPORTANT: Write down your seed phrase and store it securely!

abandon ability able about above absent absorb abstract absurd abuse
access accident account accuse achieve acid acoustic acquire across
act action actor actress actual

This is the ONLY way to recover your wallet.

I have written down my seed phrase (yes/no): yes

✓ Wallet 'trading-wallet' created successfully!
ℹ Address: 5m8qxm4j75VQCv34oUThE5QNbKJG7KHfd85NdK4dVagS
```

**🔴 CRITICAL**: Write down your seed phrase on paper. Store it securely. Never share it.

### Step 2: Fund Your Wallet

You need SOL in your wallet to execute swaps. Send SOL from an exchange or another wallet to your address:

```
5m8qxm4j75VQCv34oUThE5QNbKJG7KHfd85NdK4dVagS
```

**Minimum recommended**: 0.02 SOL (~$2.80)
- 0.01 SOL for the swap
- 0.01 SOL for transaction fees (rent + priority fee)

### Step 3: Get a Quote (Optional)

Before executing, you can get a quote to see the expected output:

```bash
./target/release/dark swap \
  --from SOL \
  --to USDC \
  --amount 0.01 \
  --slippage 50 \
  --quote-only
```

**Output:**
```
🔄 Private Swap (Jupiter Integration)
ℹ Wallet: 5m8qxm4j75VQCv34oUThE5QNbKJG7KHfd85NdK4dVagS
ℹ From: SOL (So11111111111111111111111111111111111111112)
ℹ To: USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
ℹ Amount: 0.01
ℹ Slippage: 50 BPS (0.5%)
✓ Quote received!

Quote Details:
────────────────────────────────────────────────────────────
Input Amount:     10000000 lamports (0.01 SOL)
Output Amount:    1395640 (1.395640 USDC)
Price Impact:     -1.17%
Slippage:         50 BPS (0.5%)
Fee:              2 BPS (0.02%)
Min Output:       1388478 (1.388478 USDC)

Route (3 hops):
  1. Raydium CLMM (50%) - 5000000 → 697820
  2. Orca Whirlpool (30%) - 3000000 → 418692
  3. Phoenix (20%) - 2000000 → 279128

ℹ Quote only mode - not executing swap
```

**Understanding the Quote:**
- **Input Amount**: What you're swapping (0.01 SOL)
- **Output Amount**: What you'll receive (~1.39 USDC)
- **Price Impact**: How much your trade moves the market (-1.17% is normal for small amounts)
- **Slippage**: Maximum price change you'll accept (50 BPS = 0.5%)
- **Min Output**: Minimum you'll receive after slippage
- **Route**: Path your trade takes (Jupiter finds the best route)

### Step 4: Execute the Swap

Remove `--quote-only` to execute:

```bash
./target/release/dark swap \
  --from SOL \
  --to USDC \
  --amount 0.01 \
  --slippage 50
```

**You'll be prompted to confirm:**
```
Execute this swap? (yes/no): yes
```

Type `yes` and press Enter.

**Output:**
```
ℹ Signing with wallet: 5m8qxm4j75VQCv34oUThE5QNbKJG7KHfd85NdK4dVagS
✓ Swap executed successfully!

Transaction Details:
────────────────────────────────────────────────────────────
Signature:        5cHsR3EWsXcyYztXwJWiKM8d46JqzFiU8mAzFfaNfrzvGP5fgpudj7VZnitDYTNgR3Bz67hQLDiwZ95UEXtZUwZH
Status:           Success
Request ID:       019a89fc-9fee-739c-b1b4-ae83d52e2d7f

View on Solscan: https://solscan.io/tx/5cHsR3EWsXcyYztXwJWiKM8d46JqzFiU8mAzFfaNfrzvGP5fgpudj7VZnitDYTNgR3Bz67hQLDiwZ95UEXtZUwZH
```

🎉 **Congratulations!** You've executed your first private swap on Solana!

### Step 5: Verify on Solscan

Click the Solscan link or visit:
```
https://solscan.io/tx/YOUR_SIGNATURE
```

You'll see:
- ✅ Transaction confirmed
- ✅ SOL deducted from your wallet
- ✅ USDC added to your wallet
- ✅ All within ~600ms!

---

## Advanced Features

### Supported Tokens

Dark Terminal supports all SPL tokens. Common tokens have shortcuts:

| Token | Shortcut | Full Address |
|-------|----------|--------------|
| SOL | `SOL` or `WSOL` | `So11111111111111111111111111111111111111112` |
| USDC | `USDC` | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| USDT | `USDT` | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` |
| RAY | `RAY` | `4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R` |
| JUP | `JUP` | `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` |
| BONK | `BONK` | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` |

**Using full addresses:**
```bash
dark swap \
  --from So11111111111111111111111111111111111111112 \
  --to EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --amount 0.1
```

### Understanding Slippage

Slippage is measured in **basis points (BPS)**:
- 1 BPS = 0.01%
- 10 BPS = 0.1%
- 50 BPS = 0.5% (recommended for most swaps)
- 100 BPS = 1.0% (for volatile tokens)

**Examples:**

```bash
# Conservative (low slippage, might fail in volatile markets)
dark swap --from SOL --to USDC --amount 0.1 --slippage 10

# Balanced (recommended)
dark swap --from SOL --to USDC --amount 0.1 --slippage 50

# Aggressive (high slippage, useful for meme coins)
dark swap --from SOL --to BONK --amount 0.1 --slippage 200
```

### Shielded Mode (Enhanced Privacy)

Add `--shielded` flag for maximum privacy:

```bash
dark swap \
  --from SOL \
  --to USDC \
  --amount 0.1 \
  --slippage 50 \
  --shielded
```

**What shielded mode does:**
- Uses shielded addresses (hides sender/receiver)
- Adds commitment to hide amounts
- Generates zero-knowledge proof
- **Note**: Adds ~200ms to transaction time

---

## Privacy Options

### Enable Tor for Network Anonymity

Tor hides your IP address from the RPC provider and Jupiter API.

**1. Install Tor:**

**macOS:**
```bash
brew install tor
brew services start tor
```

**Linux:**
```bash
sudo apt install tor
sudo systemctl start tor
```

**Windows:**
Download from [torproject.org](https://www.torproject.org/download/)

**2. Enable in Dark Terminal:**

```bash
dark config --enable-tor
```

**3. Verify Tor is working:**

```bash
dark config --show
```

Look for:
```
Privacy Settings:
  Tor Enabled:            Yes ✓
  Tor Proxy:              socks5://127.0.0.1:9050
```

**4. Execute swap with Tor:**

All swaps now automatically route through Tor. You'll see:
```
🔒 Using Tor proxy: socks5://127.0.0.1:9050
```

### Privacy Levels

| Level | Flags | What's Hidden | Speed |
|-------|-------|---------------|-------|
| **None** | Default | Nothing | 585ms |
| **Tor** | `--enable-tor` | IP address | 885ms |
| **Shielded** | `--shielded` | Sender/receiver | 785ms |
| **Full** | Both | IP + identity + amounts | 1085ms |

---

## AI-Powered Swap Analysis

Use Grok-4 to analyze market conditions before swapping:

### Ask for Market Analysis

```bash
dark agent chat \
  --prompt "Should I swap SOL to USDC now? What's the market sentiment?" \
  --search \
  --reasoning
```

**Output:**
```
🤖 Dark Agent - Grok-4 Powered

Based on current market data:

SOL is trading at $139.50 with moderate volatility. Market sentiment
is cautiously optimistic following the recent Breakpoint conference.

Key factors:
- 24h volume: $2.1B (healthy)
- RSI: 58 (neutral territory)
- Upcoming: Firedancer testnet launch (bullish)
- BTC correlation: 0.72

Recommendation: If you need stables, swapping now is reasonable.
However, consider waiting 24-48h for Firedancer news. A 50/50 split
hedges your bets.

Sources:
  [1] CoinGecko SOL/USD
  [2] Solana Beach Stats
```

### Get Trading Recommendations

```bash
dark agent trade \
  --strategy "DCA into USDC" \
  --params "amount=0.1,days=7"
```

---

## Troubleshooting

### Error: "Failed to decode transaction"

**Cause**: Wrong transaction format or corrupted data.

**Solution**:
```bash
# Try again with latest binary
cargo build --release
./target/release/dark swap --from SOL --to USDC --amount 0.01
```

### Error: "Insufficient SOL balance"

**Cause**: Not enough SOL for swap + fees.

**Solution**:
```bash
# Check your balance
dark wallet show --wallet your-wallet

# You need: swap amount + ~0.01 SOL for fees
# If swapping 0.1 SOL, you need 0.11 SOL total
```

### Error: "Slippage tolerance exceeded"

**Cause**: Price moved more than your slippage setting.

**Solution**:
```bash
# Increase slippage (50 BPS → 100 BPS)
dark swap --from SOL --to USDC --amount 0.1 --slippage 100

# Or wait for less volatility
```

### Error: "Tor proxy connection failed"

**Cause**: Tor not running or wrong port.

**Solution**:
```bash
# macOS
brew services restart tor

# Linux
sudo systemctl restart tor

# Verify Tor is on port 9050
lsof -i :9050

# If using different port, configure:
dark config --tor-proxy socks5://127.0.0.1:YOUR_PORT
```

### Transaction Pending Forever

**Cause**: Network congestion or insufficient priority fee.

**Solution**:
1. Wait 2-3 minutes (Solana usually recovers)
2. Check Solscan - transaction might have succeeded
3. If failed, try again with slightly higher amount (includes priority fee)

### Quote Shows High Price Impact

**Cause**: Insufficient liquidity for your swap size.

**Solution**:
```bash
# Reduce swap amount
dark swap --from SOL --to OBSCURE_TOKEN --amount 0.01  # Instead of 1.0

# Or swap to/from more liquid token
dark swap --from SOL --to USDC  # USDC has deep liquidity
```

---

## Best Practices

### 1. Security

- ✅ **ALWAYS** write down seed phrases on paper
- ✅ Store backups in multiple secure locations
- ✅ Verify transaction details before confirming
- ✅ Start with small amounts to test
- ❌ NEVER share your seed phrase
- ❌ NEVER save seed phrases digitally
- ❌ NEVER skip transaction verification

### 2. Privacy

- 🔒 Enable Tor for all swaps
- 🔒 Use shielded mode for sensitive trades
- 🔒 Randomize swap timing (avoid patterns)
- 🔒 Use different wallets for different purposes
- 🔒 Don't link wallet to social media

### 3. Trading

- 📊 Always check quotes before executing
- 📊 Use appropriate slippage for token volatility
- 📊 Swap to stables during high volatility
- 📊 Dollar-cost average (DCA) large positions
- 📊 Monitor price impact on large swaps

### 4. Costs

- 💰 Solana fees: ~0.00001 SOL per transaction
- 💰 Jupiter fee: 0.02% (2 BPS)
- 💰 Total cost: ~$0.0015 + 0.02% of swap
- 💰 vs Ethereum: 100-1000x cheaper!

### 5. Timing

- ⏰ Best times: Low volatility, high liquidity
- ⏰ Avoid: Major news events, market opens/closes
- ⏰ Use `--quote-only` to check prices first
- ⏰ Set price alerts with AI agent

---

## Example Workflows

### Workflow 1: Convert SOL to Stables

```bash
# 1. Get market analysis
dark agent chat --prompt "SOL market analysis" --search

# 2. Get quote
dark swap --from SOL --to USDC --amount 0.5 --quote-only

# 3. Execute if price is good
dark swap --from SOL --to USDC --amount 0.5 --slippage 50

# 4. Verify on Solscan
```

### Workflow 2: Privacy-First Swap

```bash
# 1. Enable Tor
dark config --enable-tor

# 2. Execute shielded swap
dark swap \
  --from SOL \
  --to USDC \
  --amount 1.0 \
  --slippage 50 \
  --shielded

# 3. Verify anonymously (use Tor Browser)
```

### Workflow 3: DCA Strategy

```bash
# Swap 0.1 SOL to USDC every day for 30 days
for i in {1..30}; do
  dark swap --from SOL --to USDC --amount 0.1 --slippage 50
  sleep 86400  # 24 hours
done
```

### Workflow 4: AI-Guided Trading

```bash
# 1. Ask AI for strategy
dark agent chat \
  --prompt "Best strategy for 1 SOL: hold or convert to USDC?" \
  --search --reasoning

# 2. Get portfolio analysis
dark agent analyze --type portfolio --period 30d

# 3. Execute recommendation
dark swap --from SOL --to USDC --amount 0.5 --slippage 50
```

---

## Performance Tips

### Faster Quotes
```bash
# Use premium RPC for sub-100ms quotes
export HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=premium_key"
```

### Lower Fees
```bash
# Batch multiple swaps in quick succession
# Rent is only paid once per new token account
```

### Better Prices
```bash
# Swap during high liquidity times (US market hours)
# Check multiple quotes before executing
dark swap --from SOL --to USDC --amount 1.0 --quote-only
# Wait 30 seconds
dark swap --from SOL --to USDC --amount 1.0 --quote-only
# Compare and execute best one
```

---

## Cross-Chain Bridge Swaps

Dark Terminal now supports **cross-chain atomic swaps** between Solana and Zcash!

### Quick Start: SOL → ZEC

```bash
# Get a quote first
./target/release/dark bridge-swap \
  --from sol \
  --to zec \
  --amount 0.1 \
  --quote-only

# Execute the swap
./target/release/dark bridge-swap \
  --from sol \
  --to zec \
  --amount 0.1
```

### Quick Start: ZEC → SOL

```bash
./target/release/dark bridge-swap \
  --from zec \
  --to sol \
  --amount 0.4
```

### What You Get

- **Full Privacy**: Shielded transactions on both chains
- **Atomic Execution**: Either both sides complete or neither does
- **No Custody**: You control your funds throughout
- **No Third Parties**: Trustless HTLC protocol

### Learn More

For complete details on cross-chain swaps, see the [Cross-Chain Bridge Guide](CROSS_CHAIN_BRIDGE_GUIDE.md).

---

## Next Steps

- 📖 Read [CROSS_CHAIN_BRIDGE_GUIDE.md](CROSS_CHAIN_BRIDGE_GUIDE.md) for atomic swap details
- 📖 Read [VISUAL_GUIDE.md](VISUAL_GUIDE.md) for architecture details
- 🤖 Explore AI agent features
- 🔒 Set up full privacy configuration
- 📈 Track your portfolio
- 🌐 Join our Discord community

---

## Support

Having issues? We're here to help:

- 💬 Discord: [discord.gg/darkprotocol](https://discord.gg/darkprotocol)
- 📧 Email: support@darkprotocol.io
- 🐛 GitHub Issues: [github.com/youruser/dark-wallet/issues](https://github.com/youruser/dark-wallet/issues)

---

<div align="center">

**Happy Private Swapping! 🌑**

[← Back to README](../README.md) | [Visual Guide →](VISUAL_GUIDE.md)

</div>
