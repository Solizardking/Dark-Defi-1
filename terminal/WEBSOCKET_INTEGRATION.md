# X402 Token WebSocket Integration

Real-time price streaming for X402 token using Birdeye WebSocket API.

## 🚀 Quick Start

### 1. Run the Test

```bash
cd terminal
npm run build
node dist/terminal/test-websocket.js
```

You should see live price updates like:
```
[2.3s] │ #1 │ $0.0001318629 │ +2.45% │ Vol: $125.32K
[4.1s] │ #2 │ $0.0001320145 │ +2.51% │ Vol: $125.89K
[6.5s] │ #3 │ $0.0001319887 │ +2.49% │ Vol: $126.11K
```

### 2. Run the Dashboard

```bash
npm run dashboard
```

Or with a specific timeframe:
```bash
npm run dashboard 1m   # 1 minute candles
npm run dashboard 5m   # 5 minute candles
npm run dashboard 1H   # 1 hour candles
```

## 📦 Components

### 1. WebSocket Client ([x402-price-websocket.ts](x402-price-websocket.ts))

Core WebSocket client for Birdeye price streaming.

**Features:**
- ✅ Real-time OHLCV data
- ✅ Multiple timeframe support
- ✅ Automatic reconnection
- ✅ Event-based architecture
- ✅ Price change notifications

**Usage:**
```typescript
import { getX402PriceWebSocket } from './x402-price-websocket';

const ws = getX402PriceWebSocket();

// Listen for price updates
ws.on('price', (update) => {
  console.log(`Price: $${update.price}`);
  console.log(`Change: ${update.changePercent24h}%`);
});

// Connect and subscribe
ws.connect();
ws.subscribeToPrice('15m');
```

### 2. Token Dashboard ([x402-token-dashboard.ts](x402-token-dashboard.ts))

Interactive terminal dashboard with real-time price monitoring.

**Features:**
- ✅ Live price display
- ✅ OHLCV tables
- ✅ ASCII price charts
- ✅ Volume monitoring
- ✅ Price alerts
- ✅ Statistics

**Usage:**
```typescript
import X402TokenDashboard from './x402-token-dashboard';

const dashboard = new X402TokenDashboard();
await dashboard.start('15m');
```

### 3. Test Script ([test-websocket.ts](test-websocket.ts))

Simple test to verify WebSocket connection.

## 🔌 WebSocket API

### Connection

```
wss://public-api.birdeye.so/socket/solana?x-api-key=YOUR_KEY
```

### Subscribe to Price Updates

```json
{
  "type": "SUBSCRIBE_PRICE",
  "data": {
    "chartType": "15m",
    "address": "6H8uyJYrPVcra6Fi7iWh29DXSm8KctzhHRyXmPwKpump",
    "currency": "usd"
  }
}
```

### Unsubscribe

```json
{
  "type": "UNSUBSCRIBE_PRICE",
  "data": {
    "chartType": "15m",
    "address": "6H8uyJYrPVcra6Fi7iWh29DXSm8KctzhHRyXmPwKpump",
    "currency": "usd"
  }
}
```

### Price Data Response

```json
{
  "type": "PRICE_DATA",
  "data": {
    "o": {
      "t": 1700000000000,
      "o": 0.0001318629,
      "h": 0.0001320145,
      "l": 0.0001315287,
      "c": 0.0001319887,
      "v": 125320.45
    },
    "address": "6H8uyJYrPVcra6Fi7iWh29DXSm8KctzhHRyXmPwKpump",
    "type": "price_update",
    "unixTime": 1700000000000,
    "value": 0.0001319887
  }
}
```

## 📊 Supported Timeframes

| Timeframe | Description |
|-----------|-------------|
| `1m` | 1 minute |
| `3m` | 3 minutes |
| `5m` | 5 minutes |
| `15m` | 15 minutes (default) |
| `30m` | 30 minutes |
| `1H` | 1 hour |
| `2H` | 2 hours |
| `4H` | 4 hours |
| `1D` | 1 day |
| `1W` | 1 week |

## 🎯 Events

The WebSocket client emits the following events:

### `connected`
Fired when WebSocket connection is established.

```typescript
ws.on('connected', () => {
  console.log('Connected to Birdeye');
});
```

### `disconnected`
Fired when WebSocket connection is closed.

```typescript
ws.on('disconnected', () => {
  console.log('Disconnected from Birdeye');
});
```

### `error`
Fired when an error occurs.

```typescript
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### `price`
Fired when a new price update is received.

```typescript
ws.on('price', (update: PriceUpdate) => {
  console.log(`Price: $${update.price}`);
  console.log(`Change: ${update.changePercent24h}%`);
  console.log(`Volume: $${update.volume24h}`);
});
```

### `ohlcv`
Fired when OHLCV data is received.

```typescript
ws.on('ohlcv', (ohlcv: OHLCVData) => {
  console.log(`Open: ${ohlcv.open}`);
  console.log(`High: ${ohlcv.high}`);
  console.log(`Low: ${ohlcv.low}`);
  console.log(`Close: ${ohlcv.close}`);
  console.log(`Volume: ${ohlcv.volume}`);
});
```

### `significant-change`
Fired when price changes by ±5% or more.

```typescript
ws.on('significant-change', (update: PriceUpdate) => {
  console.log(`ALERT: ${update.changePercent24h}% change!`);
});
```

### `price-up`
Fired when price increases.

```typescript
ws.on('price-up', (update: PriceUpdate) => {
  console.log(`Price up: ${update.changePercent24h}%`);
});
```

### `price-down`
Fired when price decreases.

```typescript
ws.on('price-down', (update: PriceUpdate) => {
  console.log(`Price down: ${update.changePercent24h}%`);
});
```

### `subscribed`
Fired when subscription is confirmed.

```typescript
ws.on('subscribed', (timeframe: string) => {
  console.log(`Subscribed to ${timeframe} updates`);
});
```

### `unsubscribed`
Fired when unsubscription is confirmed.

```typescript
ws.on('unsubscribed', (timeframe: string) => {
  console.log(`Unsubscribed from ${timeframe} updates`);
});
```

## 💡 Examples

### Example 1: Simple Price Monitor

```typescript
import { getX402PriceWebSocket } from './x402-price-websocket';

const ws = getX402PriceWebSocket();

ws.on('connected', () => {
  console.log('🟢 Connected');
});

ws.on('price', (update) => {
  console.log(`💰 $${update.price.toFixed(10)} (${update.changePercent24h.toFixed(2)}%)`);
});

ws.connect();
ws.subscribeToPrice('1m');
```

### Example 2: Price Alert Bot

```typescript
import { getX402PriceWebSocket } from './x402-price-websocket';

const ws = getX402PriceWebSocket();

ws.on('significant-change', (update) => {
  const emoji = update.changePercent24h > 0 ? '🚀' : '📉';
  const alert = `${emoji} X402 ${update.changePercent24h > 0 ? 'PUMP' : 'DUMP'}: ${update.changePercent24h.toFixed(2)}%`;

  // Send notification (Discord, Telegram, etc.)
  console.log(alert);
});

ws.connect();
ws.subscribeToPrice('5m');
```

### Example 3: Multi-Timeframe Monitor

```typescript
import { getX402PriceWebSocket } from './x402-price-websocket';

const ws = getX402PriceWebSocket();

const timeframes = ['1m', '5m', '15m', '1H'];

ws.on('connected', () => {
  timeframes.forEach(tf => {
    ws.subscribeToPrice(tf as any);
  });
});

ws.on('price', (update) => {
  // Process updates from all timeframes
  console.log(update);
});

ws.connect();
```

### Example 4: Volume Tracker

```typescript
import { getX402PriceWebSocket } from './x402-price-websocket';

const ws = getX402PriceWebSocket();
const volumes: number[] = [];

ws.on('price', (update) => {
  volumes.push(update.volume24h);

  if (volumes.length > 10) {
    const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
    const currentVolume = update.volume24h;

    if (currentVolume > avgVolume * 2) {
      console.log('🔥 Volume spike detected!');
    }

    volumes.shift(); // Keep last 10
  }
});

ws.connect();
ws.subscribeToPrice('5m');
```

## 🔧 Integration with Dark Terminal

### Add to Main Terminal

In `x402-terminal.ts`, add price monitoring:

```typescript
import { getX402PriceWebSocket } from './x402-price-websocket';

export class X402Terminal {
  private priceWS?: X402PriceWebSocket;

  async initialize() {
    // ... existing code

    // Initialize price WebSocket
    this.priceWS = getX402PriceWebSocket();
    this.priceWS.on('price', (update) => {
      // Update terminal UI with latest price
      this.updatePriceDisplay(update);
    });
    this.priceWS.connect();
    this.priceWS.subscribeToPrice('15m');
  }

  private updatePriceDisplay(update: PriceUpdate) {
    // Display price in terminal
    console.log(`X402: $${update.price.toFixed(10)} (${update.changePercent24h.toFixed(2)}%)`);
  }
}
```

### Add Dashboard Option to Menu

```typescript
const mainMenuChoices = [
  '🤖 X402 AI Agents',
  '🔄 Dark Swaps',
  '💼 Wallet Manager',
  '📊 Dashboard',
  '📈 X402 Token Dashboard', // <-- Add this
  '⚙️  Settings',
  '🚪 Exit'
];
```

## 🐛 Troubleshooting

### WebSocket not connecting

1. Check API key in `.env`:
   ```bash
   BIRDEYE_API_KEY=16db9dc5f89b4d3eb1c8bd055399ae5a
   ```

2. Test connection manually:
   ```bash
   node dist/terminal/test-websocket.js
   ```

3. Verify Birdeye API status:
   ```bash
   curl -H "X-API-KEY: YOUR_KEY" \
     "https://public-api.birdeye.so/defi/price?address=6H8uyJYrPVcra6Fi7iWh29DXSm8KctzhHRyXmPwKpump"
   ```

### No price updates

1. Check if subscribed:
   ```typescript
   const status = ws.getStatus();
   console.log(status.subscribedTimeframes);
   ```

2. Listen for subscription confirmation:
   ```typescript
   ws.on('subscribed', (timeframe) => {
     console.log(`Subscribed to ${timeframe}`);
   });
   ```

3. Check WebSocket messages:
   ```typescript
   ws.on('error', (error) => {
     console.error('WebSocket error:', error);
   });
   ```

### Reconnection issues

The WebSocket automatically reconnects with exponential backoff:
- Attempt 1: 5 seconds
- Attempt 2: 10 seconds
- Attempt 3: 15 seconds
- ... up to 10 attempts

To customize:
```typescript
const ws = new X402PriceWebSocket();
ws.maxReconnectAttempts = 20;  // Increase max attempts
ws.reconnectDelay = 3000;      // Decrease initial delay
```

## 📚 Resources

- [Birdeye WebSocket API Docs](https://docs.birdeye.so/docs/websocket-api)
- [X402 Token on Birdeye](https://birdeye.so/token/6H8uyJYrPVcra6Fi7iWh29DXSm8KctzhHRyXmPwKpump)
- [WebSocket npm package](https://github.com/websockets/ws)

## ✅ Status

**Implementation**: Complete ✅
**Testing**: Verified ✅
**Documentation**: Complete ✅
**Integration**: Ready ✅

---

**Built for Dark X402 Terminal** 🌑🚀

Real-time price data powered by Birdeye API
