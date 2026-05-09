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
import { EventEmitter } from 'events';
export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1H' | '2H' | '4H' | '1D' | '1W';
export interface OHLCVData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    address: string;
    type: string;
    unixTime: number;
    value: number;
}
export interface PriceUpdate {
    price: number;
    change24h: number;
    changePercent24h: number;
    volume24h: number;
    timestamp: number;
    ohlcv?: OHLCVData;
}
/**
 * X402 Price WebSocket Client
 * Manages real-time price updates from Birdeye
 */
export declare class X402PriceWebSocket extends EventEmitter {
    private tokenAddress;
    private apiKey;
    private ws;
    private isConnected;
    private reconnectTimeout;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private subscribedTimeframes;
    private lastPrice;
    private lastOHLCV;
    constructor(tokenAddress?: string, apiKey?: string);
    /**
     * Connect to Birdeye WebSocket
     */
    connect(): void;
    /**
     * Disconnect from WebSocket
     */
    disconnect(): void;
    /**
     * Subscribe to price updates for a specific timeframe
     */
    subscribeToPrice(timeframe?: Timeframe): void;
    /**
     * Unsubscribe from price updates for a specific timeframe
     */
    unsubscribeFromPrice(timeframe: Timeframe): void;
    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage;
    /**
     * Handle price data updates
     */
    private handlePriceData;
    /**
     * Attempt to reconnect to WebSocket
     */
    private attemptReconnect;
    /**
     * Get current connection status
     */
    getStatus(): {
        connected: boolean;
        subscribedTimeframes: string[];
        lastPrice: number;
        reconnectAttempts: number;
    };
    /**
     * Get last received OHLCV data
     */
    getLastOHLCV(): OHLCVData | null;
    /**
     * Get last price
     */
    getLastPrice(): number;
}
export declare function getX402PriceWebSocket(): X402PriceWebSocket;
/**
 * Utility function to format price with proper decimals
 */
export declare function formatX402Price(price: number): string;
/**
 * Utility function to format price change percentage
 */
export declare function formatPriceChange(changePercent: number): string;
//# sourceMappingURL=x402-price-websocket.d.ts.map