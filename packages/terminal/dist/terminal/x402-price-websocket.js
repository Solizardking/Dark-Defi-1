"use strict";
/**
 * X402 Token Real-time Price WebSocket
 * Connects to Birdeye WebSocket API for live price updates
 *
 * Features:
 * - Real-time OHLCV data streaming
 * - Multiple timeframe support (1m to 1W)
 * - Automatic reconnection
 * - Price change notifications
 * - Event-based architecture
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.X402PriceWebSocket = void 0;
exports.getX402PriceWebSocket = getX402PriceWebSocket;
exports.formatX402Price = formatX402Price;
exports.formatPriceChange = formatPriceChange;
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
// Configuration from .env
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY || '16db9dc5f89b4d3eb1c8bd055399ae5a';
const X402_TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || '6H8uyJYrPVcra6Fi7iWh29DXSm8KctzhHRyXmPwKpump';
const BIRDEYE_WS_URL = 'wss://public-api.birdeye.so/socket/solana';
/**
 * X402 Price WebSocket Client
 * Manages real-time price updates from Birdeye
 */
class X402PriceWebSocket extends events_1.EventEmitter {
    constructor(tokenAddress = X402_TOKEN_ADDRESS, apiKey = BIRDEYE_API_KEY) {
        super();
        this.tokenAddress = tokenAddress;
        this.apiKey = apiKey;
        this.ws = null;
        this.isConnected = false;
        this.reconnectTimeout = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000; // 5 seconds
        this.subscribedTimeframes = new Set();
        this.lastPrice = 0;
        this.lastOHLCV = null;
    }
    /**
     * Connect to Birdeye WebSocket
     */
    connect() {
        if (this.ws && this.isConnected) {
            console.log('[X402 WS] Already connected');
            return;
        }
        const wsUrl = `${BIRDEYE_WS_URL}?x-api-key=${this.apiKey}`;
        console.log('[X402 WS] Connecting to Birdeye WebSocket...');
        this.ws = new ws_1.default(wsUrl);
        this.ws.on('open', () => {
            console.log('[X402 WS] Connected successfully');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
            // Resubscribe to all previously subscribed timeframes
            if (this.subscribedTimeframes.size > 0) {
                this.subscribedTimeframes.forEach(timeframe => {
                    this.subscribeToPrice(timeframe);
                });
            }
        });
        this.ws.on('message', (data) => {
            this.handleMessage(data);
        });
        this.ws.on('error', (error) => {
            console.error('[X402 WS] Error:', error.message);
            this.emit('error', error);
        });
        this.ws.on('close', () => {
            console.log('[X402 WS] Connection closed');
            this.isConnected = false;
            this.ws = null;
            this.emit('disconnected');
            // Attempt to reconnect
            this.attemptReconnect();
        });
        this.ws.on('ping', () => {
            if (this.ws) {
                this.ws.pong();
            }
        });
    }
    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.ws) {
            this.subscribedTimeframes.clear();
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }
    /**
     * Subscribe to price updates for a specific timeframe
     */
    subscribeToPrice(timeframe = '15m') {
        if (!this.isConnected || !this.ws) {
            console.warn('[X402 WS] Not connected. Waiting for connection...');
            this.subscribedTimeframes.add(timeframe);
            if (!this.ws) {
                this.connect();
            }
            return;
        }
        const subscribeMsg = {
            type: 'SUBSCRIBE_PRICE',
            data: {
                chartType: timeframe,
                address: this.tokenAddress,
                currency: 'usd'
            }
        };
        this.ws.send(JSON.stringify(subscribeMsg));
        this.subscribedTimeframes.add(timeframe);
        console.log(`[X402 WS] Subscribed to ${timeframe} price updates`);
        this.emit('subscribed', timeframe);
    }
    /**
     * Unsubscribe from price updates for a specific timeframe
     */
    unsubscribeFromPrice(timeframe) {
        if (!this.isConnected || !this.ws) {
            this.subscribedTimeframes.delete(timeframe);
            return;
        }
        const unsubscribeMsg = {
            type: 'UNSUBSCRIBE_PRICE',
            data: {
                chartType: timeframe,
                address: this.tokenAddress,
                currency: 'usd'
            }
        };
        this.ws.send(JSON.stringify(unsubscribeMsg));
        this.subscribedTimeframes.delete(timeframe);
        console.log(`[X402 WS] Unsubscribed from ${timeframe} price updates`);
        this.emit('unsubscribed', timeframe);
    }
    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            // Handle different message types
            switch (message.type) {
                case 'PRICE_DATA':
                    this.handlePriceData(message.data);
                    break;
                case 'SUBSCRIBED':
                    console.log('[X402 WS] Subscription confirmed:', message.data);
                    break;
                case 'UNSUBSCRIBED':
                    console.log('[X402 WS] Unsubscription confirmed:', message.data);
                    break;
                case 'ERROR':
                    console.error('[X402 WS] Server error:', message.data);
                    this.emit('error', new Error(message.data));
                    break;
                default:
                    // console.log('[X402 WS] Unknown message type:', message.type);
                    break;
            }
        }
        catch (error) {
            console.error('[X402 WS] Failed to parse message:', error);
        }
    }
    /**
     * Handle price data updates
     */
    handlePriceData(data) {
        try {
            // Extract OHLCV data
            const ohlcv = {
                time: data.o?.t || data.unixTime || Date.now(),
                open: data.o?.o || data.open || 0,
                high: data.o?.h || data.high || 0,
                low: data.o?.l || data.low || 0,
                close: data.o?.c || data.close || data.value || 0,
                volume: data.o?.v || data.volume || 0,
                address: data.address || this.tokenAddress,
                type: data.type || 'price_update',
                unixTime: data.unixTime || Date.now(),
                value: data.value || data.o?.c || 0
            };
            // Calculate price change if we have a previous price
            const currentPrice = ohlcv.close || ohlcv.value;
            const priceChange = this.lastPrice > 0 ? currentPrice - this.lastPrice : 0;
            const priceChangePercent = this.lastPrice > 0
                ? ((currentPrice - this.lastPrice) / this.lastPrice) * 100
                : 0;
            // Update last price
            this.lastPrice = currentPrice;
            this.lastOHLCV = ohlcv;
            // Create price update event
            const priceUpdate = {
                price: currentPrice,
                change24h: priceChange,
                changePercent24h: priceChangePercent,
                volume24h: ohlcv.volume,
                timestamp: ohlcv.time,
                ohlcv
            };
            // Emit events
            this.emit('price', priceUpdate);
            this.emit('ohlcv', ohlcv);
            // Emit specific events for significant changes
            if (Math.abs(priceChangePercent) >= 5) {
                this.emit('significant-change', priceUpdate);
            }
            if (priceChangePercent > 0) {
                this.emit('price-up', priceUpdate);
            }
            else if (priceChangePercent < 0) {
                this.emit('price-down', priceUpdate);
            }
        }
        catch (error) {
            console.error('[X402 WS] Failed to handle price data:', error);
        }
    }
    /**
     * Attempt to reconnect to WebSocket
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[X402 WS] Max reconnect attempts reached');
            this.emit('max-reconnects-reached');
            return;
        }
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        console.log(`[X402 WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.reconnectTimeout = setTimeout(() => {
            console.log('[X402 WS] Attempting to reconnect...');
            this.connect();
        }, delay);
    }
    /**
     * Get current connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            subscribedTimeframes: Array.from(this.subscribedTimeframes),
            lastPrice: this.lastPrice,
            reconnectAttempts: this.reconnectAttempts
        };
    }
    /**
     * Get last received OHLCV data
     */
    getLastOHLCV() {
        return this.lastOHLCV;
    }
    /**
     * Get last price
     */
    getLastPrice() {
        return this.lastPrice;
    }
}
exports.X402PriceWebSocket = X402PriceWebSocket;
/**
 * Create a singleton instance for easy access
 */
let x402PriceWS = null;
function getX402PriceWebSocket() {
    if (!x402PriceWS) {
        x402PriceWS = new X402PriceWebSocket();
    }
    return x402PriceWS;
}
/**
 * Utility function to format price with proper decimals
 */
function formatX402Price(price) {
    if (Math.abs(price) < 0.000001) {
        return price.toExponential(6);
    }
    if (Math.abs(price) < 0.01) {
        return price.toFixed(10);
    }
    if (Math.abs(price) < 1) {
        return price.toFixed(6);
    }
    return price.toFixed(2);
}
/**
 * Utility function to format price change percentage
 */
function formatPriceChange(changePercent) {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
}
//# sourceMappingURL=x402-price-websocket.js.map