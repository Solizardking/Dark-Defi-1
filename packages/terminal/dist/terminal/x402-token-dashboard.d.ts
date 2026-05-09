/**
 * X402 Token Dashboard
 * Real-time streaming DEX and charting system
 *
 * Features:
 * - Live price updates via Birdeye WebSocket
 * - TradingView charting integration
 * - Token metadata and statistics
 * - Trade history tracking
 * - Holder information
 * - Google AI market analysis
 */
interface TokenMetadata {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoUri: string;
    extensions?: {
        description?: string;
    };
}
interface TokenStats {
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
    liquidity: number;
    holders: number;
    lastTradeTime: string;
}
interface OHLCVData {
    unixTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
interface TokenHolder {
    owner: string;
    uiAmount: number;
    percentage: number;
}
interface Trade {
    txHash: string;
    blockTime: number;
    side: 'buy' | 'sell';
    fromAmount: number;
    toAmount: number;
    priceUSD: number;
    volumeUSD: number;
}
export declare class X402TokenDashboard {
    private ws;
    private connection;
    private metadata;
    private stats;
    private ohlcvData;
    private holders;
    private recentTrades;
    private isRunning;
    constructor();
    /**
     * Initialize and start the dashboard
     */
    start(): Promise<void>;
    /**
     * Stop the dashboard
     */
    stop(): void;
    /**
     * Fetch token metadata from Birdeye API
     */
    private fetchTokenMetadata;
    /**
     * Fetch token statistics from Birdeye API
     */
    private fetchTokenStats;
    /**
     * Fetch OHLCV data for charting
     */
    private fetchOHLCVData;
    /**
     * Fetch token holders
     */
    private fetchHolders;
    /**
     * Fetch recent trades
     */
    private fetchRecentTrades;
    /**
     * Connect to Birdeye WebSocket for real-time price updates
     */
    private connectWebSocket;
    /**
     * Handle real-time price updates from WebSocket
     */
    private handlePriceUpdate;
    /**
     * Refresh all data
     */
    private refreshData;
    /**
     * Display dashboard in terminal
     */
    private displayDashboard;
    /**
     * Display simple ASCII price chart
     */
    private displayASCIIChart;
    /**
     * Format large numbers with K, M, B suffixes
     */
    private formatNumber;
    /**
     * Get TradingView datafeed configuration
     * This can be used to integrate with TradingView charting library
     */
    getTradingViewDatafeed(): any;
    /**
     * Export data for analysis
     */
    exportData(): {
        metadata: TokenMetadata | null;
        stats: TokenStats | null;
        ohlcv: OHLCVData[];
        holders: TokenHolder[];
        trades: Trade[];
    };
}
export default X402TokenDashboard;
//# sourceMappingURL=x402-token-dashboard.d.ts.map