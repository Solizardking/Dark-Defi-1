# CLAWD Token Dashboard

## Real-Time Streaming DEX and Charting System

A comprehensive, real-time token dashboard for **CLAWD** on Solana, featuring live price updates, market analytics, trade history, and holder tracking.

**Token:** `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`

![CLAWD Dashboard](https://img.shields.io/badge/Token-CLAWD-purple)
![Birdeye API](https://img.shields.io/badge/Birdeye-Integrated-blue)
![WebSocket](https://img.shields.io/badge/WebSocket-Streaming-orange)

---

## 🚀 Features

### Real-Time Data Streaming
- **Live Price Updates**: WebSocket connection to Birdeye API for real-time price feeds
- **Market Statistics**: Current price, 24h change, volume, market cap, liquidity
- **Auto-Refresh**: Updates every 30 seconds for latest market data

### Market Analytics
- **OHLCV Chart Data**: Candlestick data with customizable intervals
- **ASCII Price Chart**: Beautiful terminal-based price visualization
- **Volume Analysis**: Track trading volume and market activity

### Token Information
- **Token Metadata**: Name, symbol, decimals, logo, description
- **Holder Tracking**: Top 10 token holders with percentage ownership
- **Trade History**: Real-time trade feed with buy/sell indicators

### TradingView Integration
- **Ready-to-Use Datafeed**: Full TradingView charting library integration
- **Multiple Timeframes**: Support for 1s, 15s, 30s, 1m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
- **Real-Time Updates**: Live streaming data for advanced charting

---

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

### Install Dependencies

```bash
cd terminal
npm install
```

**Required packages** (automatically installed):
- `axios` - HTTP client for API requests
- `ws` - WebSocket client for real-time streaming
- `cli-table3` - Terminal table formatting
- `chalk` - Terminal text styling
- `ora` - Terminal spinners
- `@solana/web3.js` - Solana blockchain integration

---

## ⚙️ Configuration

Copy `.env.example` → `.env` and fill in your keys:

```bash
cp .env.example .env
```

**Required for CLAWD dashboard:**
```bash
HELIUS_API_KEY=your_helius_api_key
BIRDEYE_API_KEY=your_birdeye_api_key
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

> ⚠️ **NEVER commit `.env`** — it's in `.gitignore`. Use `.env.example` for sharing setup instructions.

The dashboard is pre-configured for the CLAWD token. Configuration in `x402-token-dashboard.ts`:

```typescript
const CONFIG = {
  BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY || '',
  BIRDEYE_WSS_URL: 'wss://public-api.birdeye.so/socket/solana?x-api-key=...',
  BIRDEYE_API_URL: 'https://public-api.birdeye.so',
  TOKEN_ADDRESS: '8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump',  // CLAWD
  TOKEN_SYMBOL: 'CLAWD',
  HELIUS_RPC_URL: process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com/',
  CHART_INTERVAL: '1m',
};
```

---

## 🎯 Quick Start

### Method 1: Local Web Server (Recommended — keeps keys private)

```bash
cd terminal
npm run serve          # starts http://localhost:3333
```

Open browser to `http://localhost:3333` — the AI chat and API calls run server-side only.

### Method 2: CLI Dashboard

```bash
# Build and run
cd terminal
npm run dashboard
```

### Method 3: Development Mode

```bash
cd terminal
npm run dev
```

---

## 📊 Dashboard Display

### Token Information Section
```
📊 TOKEN INFORMATION
────────────────────────────────────────────────────────
  Name:        CLAWD
  Symbol:      CLAWD
  Address:     8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
  Decimals:    6
  Description: The official CLAWD token on Solana...
```

### Market Statistics Section
```
💰 MARKET STATISTICS
────────────────────────────────────────────────────────
  Price:       $0.00014057 +15.97%
  Market Cap:  $140.49K
  24h Volume:  $52.3K
  Liquidity:   $49.50K
  Holders:     1.91K
  Last Trade:  2026-05-23T15:05:57
```

### ASCII Price Chart
```
📈 PRICE CHART (Recent Candles)
────────────────────────────────────────────────────────
  High: $0.00014161
                                       ██            █
                                    ███││█         ██│
  ...chart visualization...
  Low:  $0.00011594
```

### Top Holders Table
```
👥 TOP HOLDERS
┌──────┬──────────────────────┬──────────┬─────────────┐
│ Rank │ Address              │ Amount   │ % of Supply │
├──────┼──────────────────────┼──────────┼─────────────┤
│ #1   │ 3W8dzjBB...tv6J6Weh │ 177.58M  │ 47.58%      │
│ #2   │ 23H2XxkH...mhod6f3P │ 50.00M   │ 13.40%      │
└──────┴──────────────────────┴──────────┴─────────────┘
```

---

## 🔌 WebSocket Connection

The dashboard maintains a persistent WebSocket connection to Birdeye for real-time updates:

### Connection Flow
1. Connects to `wss://public-api.birdeye.so/socket/solana?x-api-key=<key>`
2. Subscribes to price updates for CLAWD token
3. Receives real-time OHLCV candle data
4. Auto-reconnects on connection loss

### Subscription Message
```json
{
  "type": "SUBSCRIBE_PRICE",
  "data": {
    "queryType": "simple",
    "chartType": "1m",
    "address": "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
    "currency": "usd"
  }
}
```

---

## 🔗 API Integration

### Birdeye API Endpoints

| Endpoint | Purpose | Refresh Rate |
|----------|---------|--------------|
| `/defi/v3/token/meta-data/single` | Token metadata | On startup |
| `/defi/token_overview` | Market statistics | Every 30s |
| `/defi/v3/ohlcv` | Chart data | On startup |
| `/defi/v3/token/holder` | Holder information | Every 30s |
| `/defi/txs/token` | Recent trades | Every 30s |

### API Authentication

```javascript
headers: {
  'X-API-KEY': process.env.BIRDEYE_API_KEY,
  'x-chain': 'solana'
}
```

Get your free Birdeye API key at: https://birdeye.so

---

## 🛠️ Programmatic Usage

```typescript
import { ClawdTokenDashboard } from './x402-token-dashboard';

const dashboard = new ClawdTokenDashboard();
await dashboard.start();

// Export all data
const data = dashboard.exportData();
console.log(data.stats?.price);  // CLAWD current price

// Stop the dashboard
dashboard.stop();
```

---

## 🔐 Security Notes

- All API keys are loaded from `.env` — **never hardcoded**
- `.env` is in `.gitignore` — **never committed**
- Use `.env.example` to share key names with collaborators
- The local web server (`npm run serve`) keeps keys server-side — the browser never sees them

---

## 🐛 Troubleshooting

### WebSocket connection fails (400 error)

**Cause**: Missing or invalid Birdeye API key.

**Fix**: Add `BIRDEYE_API_KEY` to your `.env` file:
```bash
BIRDEYE_API_KEY=your_birdeye_api_key_here
```

### API returns 401 Unauthorized

**Cause**: API key is empty or invalid.

**Fix**: Get a Birdeye API key at https://birdeye.so and add it to `.env`.

### `npm run dev` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`

**Cause**: `@noble/ciphers` package path mismatch.

**Fix**: Already patched in `packages/protocol/dist/note-encryption.js` (changed `./chacha.js` → `./chacha`).

### Build Errors

```bash
npm run clean
npm install
npm run build
```

---

## 📁 File Structure

```
terminal/
├── x402-token-dashboard.ts       # CLAWD dashboard implementation
├── x402-dashboard-launcher.ts    # Standalone launcher
├── X402_DASHBOARD_README.md      # This file
├── local-server.ts               # Local web server (keeps keys private)
├── .env.example                  # Key names — safe to commit
├── .env                          # Real keys — NEVER commit
├── .gitignore                    # Blocks .env from git
└── web/
    └── dark-defi-terminal.html   # Browser UI
```

---

## 📝 License

Apache-2.0 — See LICENSE file for details

---

## 🌟 Credits

- **Birdeye API**: Real-time Solana DEX data
- **Helius RPC**: Solana blockchain connectivity
- **Dark Protocol Team**: Development and maintenance

---

**Happy Trading! 🐾 CLAWD to the moon! 🚀**
