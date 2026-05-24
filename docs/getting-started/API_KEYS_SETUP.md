# 🔑 API Keys Setup Guide

Complete guide for setting up all API keys required for Dark Terminal and SDK.

---

## Required API Keys

### 1. Helius API (Solana RPC & DAS)

**Required for**: Solana mainnet RPC, DAS API, token metadata

**Get API Key**:
1. Go to [https://helius.dev](https://helius.dev)
2. Sign up for free account
3. Create new API key
4. Copy your API key

**Set Environment Variables**:
```bash
export HELIUS_API_KEY="your_helius_api_key_here"
export HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
```

> Earlier versions of this doc included a "provided test key" hardcoded
> here. That key was leaked publicly via this repo and has been rotated.
> Do not paste real API keys into docs — use `.env` (gitignored) only.

---

### 2. Birdeye API (Price Oracle)

**Required for**: Real-time Solana token prices, market data

**Get API Key**:
1. Go to [https://birdeye.so](https://birdeye.so)
2. Sign up for account
3. Navigate to API section
4. Generate API key
5. Copy your API key

**Set Environment Variable**:
```bash
export BIRDEYE_API_KEY="your_birdeye_api_key_here"
```

**Rate Limits**:
- Free tier: 100 requests/minute
- Pro tier: 1,000 requests/minute

---

### 3. Jupiter API (Optional - Higher Rate Limits)

**Required for**: Enhanced Jupiter Ultra API rate limits

**Get API Key**:
1. Go to [https://station.jup.ag](https://station.jup.ag)
2. Sign up for account
3. Request API key from documentation
4. Copy your API key

**Set Environment Variable**:
```bash
export JUPITER_API_KEY="your_jupiter_api_key_here"
```

**Note**: Jupiter API works without a key, but with reduced rate limits.

---

### 4. xAI Grok API (AI Agent)

**Required for**: AI-powered trading agent

**Get API Key**:
1. Go to [https://x.ai](https://x.ai)
2. Sign up for xAI account
3. Navigate to API section
4. Create API key
5. Copy key (starts with `xai-`)

**Set Environment Variable**:
```bash
export XAI_API_KEY="xai-your_grok_api_key_here"
```

---

### 5. GetBlock (Zcash RPC - Optional)

**Required for**: Zcash cross-chain bridge operations

**Get API Key**:
1. Go to [https://getblock.io](https://getblock.io)
2. Sign up for account
3. Create Zcash endpoint
4. Copy RPC URL

**Set Environment Variable**:
```bash
export GETBLOCK_ZEC_RPC="https://go.getblock.io/YOUR_KEY"
```

---

## Quick Setup

### For Bash/Zsh

Create `~/.dark-protocol-env`:

```bash
# Helius (Solana RPC)
export HELIUS_API_KEY="your_helius_key"
export HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"

# Birdeye (Price Oracle)
export BIRDEYE_API_KEY="your_birdeye_key"

# Jupiter (Optional - Higher Limits)
export JUPITER_API_KEY="your_jupiter_key"

# xAI Grok (AI Agent)
export XAI_API_KEY="xai-your_grok_key"

# GetBlock (Zcash - Optional)
export GETBLOCK_ZEC_RPC="https://go.getblock.io/YOUR_KEY"

# Local Zcash (Optional)
export ZCASH_RPC_URL="http://127.0.0.1:8232"
export ZCASH_RPC_USER="user"
export ZCASH_RPC_PASSWORD="password"
```

Then add to `~/.bashrc` or `~/.zshrc`:
```bash
source ~/.dark-protocol-env
```

---

## Verify Setup

### 1. Check Environment Variables

```bash
echo "Helius RPC: $HELIUS_RPC_URL"
echo "Helius API: $HELIUS_API_KEY"
echo "Birdeye: $BIRDEYE_API_KEY"
echo "Jupiter: $JUPITER_API_KEY"
echo "xAI: $XAI_API_KEY"
```

### 2. Test Helius RPC

```bash
curl "$HELIUS_RPC_URL" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

Expected: `{"jsonrpc":"2.0","result":"ok","id":1}`

### 3. Test Birdeye API

```bash
curl -X GET "https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112" \
  -H "X-API-KEY: $BIRDEYE_API_KEY"
```

Expected: JSON with SOL price data

### 4. Test Jupiter Price API

```bash
curl "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112"
```

Expected: JSON with SOL price

---

## Configure Dark Terminal

### Using Provided Helius Key

```bash
cd <path-to>/Dark-Defi/packages/terminal

# Configure with provided keys
./target/release/dark config \
  --network mainnet \
  --rpc "https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY" \
  --grok-api-key "$XAI_API_KEY"

# Verify configuration
./target/release/dark config --show
```

### Using Your Own Keys

```bash
# Set all environment variables first
export HELIUS_RPC_URL="your_helius_rpc_url"
export BIRDEYE_API_KEY="your_birdeye_key"
export JUPITER_API_KEY="your_jupiter_key"
export XAI_API_KEY="your_grok_key"

# Configure Dark Terminal
./target/release/dark config \
  --network mainnet \
  --rpc "$HELIUS_RPC_URL" \
  --grok-api-key "$XAI_API_KEY"
```

---

## Configure TypeScript SDK

```typescript
import { DarkProtocolClient, PrivateSwapManager } from '@dark-protocol/sdk';

// Initialize client
const client = await DarkProtocolClient.create({
  heliusApiKey: process.env.HELIUS_API_KEY!,
  rpcUrl: process.env.HELIUS_RPC_URL!,
});

// Initialize swap manager with all keys
const swapManager = new PrivateSwapManager(client, {
  jupiterApiKey: process.env.JUPITER_API_KEY,
  birdeyeApiKey: process.env.BIRDEYE_API_KEY,
  heliusApiKey: process.env.HELIUS_API_KEY,
});
```

---

## Security Best Practices

### ✅ DO

1. **Store keys in environment variables**
   ```bash
   export API_KEY="your_key"
   ```

2. **Use `.env` files for local development**
   ```bash
   # .env (add to .gitignore!)
   HELIUS_API_KEY=your_key
   BIRDEYE_API_KEY=your_key
   ```

3. **Use secrets management in production**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Google Secret Manager

4. **Rotate keys regularly**
   - Set calendar reminders
   - Rotate every 90 days
   - Update immediately if compromised

### ❌ DON'T

1. **Never commit API keys to git**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   *_env
   ```

2. **Never hardcode keys in source code**
   ```typescript
   // ❌ WRONG
   const apiKey = "abc123def456";

   // ✅ CORRECT
   const apiKey = process.env.BIRDEYE_API_KEY;
   ```

3. **Never share keys publicly**
   - Don't post in Discord/Slack
   - Don't include in screenshots
   - Don't share in documentation

4. **Never use production keys in development**
   - Use separate keys for dev/prod
   - Limit dev key permissions

---

## Troubleshooting

### "API key not found"

```bash
# Check if environment variable is set
echo $BIRDEYE_API_KEY

# If empty, set it
export BIRDEYE_API_KEY="your_key"

# Make permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export BIRDEYE_API_KEY="your_key"' >> ~/.bashrc
source ~/.bashrc
```

### "Unauthorized" or "403 Forbidden"

- Verify API key is correct (no extra spaces)
- Check if key has expired
- Verify rate limits haven't been exceeded
- Ensure proper headers are being sent

### Rate Limit Exceeded

```
Error: Too Many Requests (429)
```

**Solutions**:
1. Reduce request frequency
2. Implement caching
3. Upgrade to paid tier
4. Use multiple API sources with fallback

---

## Free Tier Limits

| Service | Free Tier | Rate Limit |
|---------|-----------|------------|
| Helius | ✅ Available | Varies by plan |
| Birdeye | ✅ Available | 100 req/min |
| Jupiter | ✅ Unlimited | Rate limited |
| xAI Grok | ⚠️ Credits-based | Varies |
| GetBlock | ✅ Available | 40,000 req/day |

---

## Paid Plans (Optional)

### Helius
- Developer: $0.01/request
- Pro: Custom pricing
- [Pricing](https://helius.dev/pricing)

### Birdeye
- Pro: $99/month (1,000 req/min)
- Enterprise: Custom pricing
- [Pricing](https://birdeye.so/pricing)

### xAI
- Usage-based pricing
- [Pricing](https://x.ai/pricing)

---

## Getting Help

### API Documentation

- **Helius**: [docs.helius.dev](https://docs.helius.dev)
- **Birdeye**: [docs.birdeye.so](https://docs.birdeye.so)
- **Jupiter**: [station.jup.ag/docs](https://station.jup.ag/docs)
- **xAI**: [docs.x.ai](https://docs.x.ai)

### Dark Protocol Support

- 💬 [Discord](https://discord.gg/darkprotocol)
- 🐦 [Twitter](https://twitter.com/DarkProtocol)
- 📧 [Email](mailto:hello@darkprotocol.io)

---

**Setup complete! You're ready to use Dark Terminal with full oracle integration. 🚀**
