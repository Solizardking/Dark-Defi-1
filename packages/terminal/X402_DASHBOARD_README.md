# X402 Token Dashboard

## Real-Time Streaming DEX and Charting System

A comprehensive, real-time token dashboard for the X402 Protocol token on Solana, featuring live price updates, market analytics, trade history, and holder tracking.

![X402 Dashboard](https://img.shields.io/badge/Status-Live-brightgreen)
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

## 🎯 Quick Start

### Method 1: NPM Script (Recommended)

```bash
# Build and run the dashboard
cd terminal
npm run dashboard

# Or use the shortcut
npm run x402
```

### Method 2: Direct Execution

```bash
# Build TypeScript first
cd terminal
npm run build

# Run the compiled dashboard
node dist/terminal/x402-token-dashboard.js
```

### Method 3: Development Mode

```bash
# Run with ts-node (no build required)
cd terminal
npx ts-node x402-token-dashboard.ts
```

---

## ⚙️ Configuration

The dashboard is pre-configured for the X402 token. Configuration is located in `x402-token-dashboard.ts`:

```typescript
const CONFIG = {
  BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY || '',
  BIRDEYE_WSS_URL: 'wss://public-api.birdeye.so/socket/solana',
  BIRDEYE_API_URL: 'https://public-api.birdeye.so',
  TOKEN_ADDRESS: '6H8uyJYrPVcra6Fi7iWh29DXSm8KctzhHRyXmPwKpump',
  TOKEN_SYMBOL: 'X402',
  HELIUS_RPC_URL: process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com/',
  CHART_INTERVAL: '1m', // Chart candle interval
};
```

### Customization

To monitor a different token, modify the configuration:

1. Update `TOKEN_ADDRESS` to your token's mint address
2. Update `TOKEN_SYMBOL` to your token's symbol
3. Optionally adjust `CHART_INTERVAL` for different timeframes

### Environment Variables

Create a `.env` file in the `terminal/` directory:

```bash
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
BIRDEYE_API_KEY=your_birdeye_api_key  # Optional: use your own key
```

---

## 📊 Dashboard Display

### Token Information Section
```
📊 TOKEN INFORMATION
────────────────────────────────────────────────────────
  Name:        X402
  Symbol:      X402
  Address:     6H8uyJYrPVcra6Fi7iWh29DXSm8KctzhHRyXmPwKpump
  Decimals:    6
  Description: The official Ticker of the X402 Protocol...
```

### Market Statistics Section
```
💰 MARKET STATISTICS
────────────────────────────────────────────────────────
  Price:       $0.00014057 +15.97%
  Market Cap:  $140.49K
  24h Volume:  $0.00
  Liquidity:   $49.50K
  Holders:     1.91K
  Last Trade:  2025-11-16T15:05:57
```

### ASCII Price Chart
```
📈 PRICE CHART (Recent Candles)
────────────────────────────────────────────────────────
  High: $0.00014161
                                       ██            █
                                    ███││█         ██│
                                 ███││││││█      █ │││
                            █████││││││││││     █│█│││
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

### Recent Trades Table
```
🔄 RECENT TRADES
┌──────────────┬────────┬────────────┬──────────┬────────┐
│ Time         │ Side   │ Price      │ Volume   │ TX     │
├──────────────┼────────┼────────────┼──────────┼────────┤
│ 10:05:57 AM  │ BUY    │ $0.000000  │ $0.00    │ vSW8...│
│ 10:02:45 AM  │ BUY    │ $0.000000  │ $0.00    │ 43P3...│
└──────────────┴────────┴────────────┴──────────┴────────┘
```

---

## 🔌 WebSocket Connection

The dashboard maintains a persistent WebSocket connection to Birdeye for real-time updates:

### Connection Flow
1. Connects to `wss://public-api.birdeye.so/socket/solana`
2. Subscribes to price updates for X402 token
3. Receives real-time OHLCV candle data
4. Auto-reconnects on connection loss

### Subscription Message
```json
{
  "type": "SUBSCRIBE_PRICE",
  "data": {
    "queryType": "simple",
    "chartType": "1m",
    "address": "6H8uyJYrPVcra6Fi7iWh29DXSm8KctzhHRyXmPwKpump",
    "currency": "usd"
  }
}
```

### Price Update Format
When a new price update arrives:
```
💹 Price update: $0.00014057 +0.80%
```

---

## 🔗 API Integration

### Birdeye API Endpoints

The dashboard uses the following Birdeye API endpoints:

| Endpoint | Purpose | Refresh Rate |
|----------|---------|--------------|
| `/defi/v3/token/meta-data/single` | Token metadata | On startup |
| `/defi/token_overview` | Market statistics | Every 30s |
| `/defi/v3/ohlcv` | Chart data | On startup |
| `/defi/v3/token/holder` | Holder information | Every 30s |
| `/defi/txs/token` | Recent trades | Every 30s |

### API Authentication

All API requests include these headers:
```javascript
{
  'X-API-KEY': 'YOUR_API_KEY',
  'x-chain': 'solana'
}
```

---

## 📈 TradingView Integration

The dashboard provides a ready-to-use TradingView datafeed:

```typescript
import { X402TokenDashboard } from './x402-token-dashboard';

const dashboard = new X402TokenDashboard();
await dashboard.start();

// Get TradingView datafeed
const datafeed = dashboard.getTradingViewDatafeed();

// Use with TradingView widget
const widget = new TradingView.widget({
  datafeed: datafeed,
  symbol: 'X402',
  interval: '1',
  container: 'tv_chart_container',
  // ... other options
});
```

### Supported Features
- ✅ Real-time data streaming
- ✅ Historical data (24h+)
- ✅ Multiple timeframes
- ✅ OHLCV data
- ✅ Volume data
- ✅ Symbol search

---

## 🛠️ Programmatic Usage

### Basic Usage

```typescript
import { X402TokenDashboard } from './x402-token-dashboard';

const dashboard = new X402TokenDashboard();

// Start the dashboard
await dashboard.start();

// Stop the dashboard
dashboard.stop();
```

### Export Data

```typescript
// Get all current data
const data = dashboard.exportData();

console.log(data.metadata);  // Token metadata
console.log(data.stats);     // Market statistics
console.log(data.ohlcv);     // OHLCV candle data
console.log(data.holders);   // Holder information
console.log(data.trades);    // Recent trades
```

### Custom Integration

```typescript
import { X402TokenDashboard } from './x402-token-dashboard';

const dashboard = new X402TokenDashboard();

// Start without display (programmatic use)
await dashboard.start();

// Use the data in your own application
setInterval(() => {
  const data = dashboard.exportData();
  
  // Process the data
  if (data.stats) {
    console.log(`Current price: $${data.stats.price}`);
    console.log(`24h change: ${data.stats.priceChange24h}%`);
  }
}, 5000);
```

---

## 🎮 Controls

- **Ctrl+C**: Gracefully shutdown the dashboard
- **Auto-refresh**: Data refreshes every 30 seconds
- **Real-time updates**: Price updates via WebSocket

---

## 📁 File Structure

```
terminal/
├── x402-token-dashboard.ts       # Main dashboard implementation
├── x402-dashboard-launcher.ts    # Standalone launcher
├── X402_DASHBOARD_README.md      # This file
├── package.json                  # Updated with dashboard scripts
└── dist/
    └── terminal/
        └── x402-token-dashboard.js  # Compiled output
```

---

## 🐛 Troubleshooting

### WebSocket Connection Issues

**Problem**: WebSocket fails to connect
```
WebSocket error: ...
```

**Solution**:
- Check internet connection
- Verify Birdeye API key is valid
- Check firewall settings for WebSocket connections

### API Rate Limiting

**Problem**: API requests are being rate limited
```
Error: 429 Too Many Requests
```

**Solution**:
- Use your own Birdeye API key
- Increase refresh intervals in the code
- Implement request queuing

### Missing Data

**Problem**: Some data sections show "No data available"
```
⚠ No OHLCV data available
```

**Solution**:
- Check if the token has recent trading activity
- Verify the token address is correct
- Try a different time interval

### Build Errors

**Problem**: TypeScript compilation fails

**Solution**:
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

---

## 🔐 Security Notes

- The Birdeye API key is included for demo purposes
- **For production use**: Replace with your own API key
- Store sensitive keys in `.env` file
- Never commit API keys to version control

---

## 📝 License

Apache-2.0 - See LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review Birdeye API documentation

---

## 🔮 Future Enhancements

- [ ] Add Google AI market analysis integration
- [ ] Support for multiple tokens simultaneously
- [ ] Portfolio tracking features
- [ ] Price alerts and notifications
- [ ] Export data to CSV/JSON
- [ ] Advanced charting with indicators
- [ ] Mobile app version
- [ ] Web UI dashboard

---

## 📊 Performance

- Memory usage: ~50-100MB
- WebSocket latency: <100ms
- API refresh rate: 30 seconds
- Chart data: Up to 1000 candles cached

---

## 🌟 Credits

- **Birdeye API**: Real-time Solana DEX data
- **Helius RPC**: Solana blockchain connectivity
- **TradingView**: Charting library integration
- **Dark Protocol Team**: Development and maintenance

---

**Happy Trading! 🚀**
