"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.X402TokenDashboard = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const ws_1 = __importDefault(require("ws"));
const axios_1 = __importDefault(require("axios"));
const web3_js_1 = require("@solana/web3.js");
// Configuration
const CONFIG = {
    BIRDEYE_API_KEY: '16db9dc5f89b4d3eb1c8bd055399ae5a',
    BIRDEYE_WSS_URL: 'wss://public-api.birdeye.so/socket/solana?x-api-key=16db9dc5f89b4d3eb1c8bd055399ae5a',
    BIRDEYE_API_URL: 'https://public-api.birdeye.so',
    TOKEN_ADDRESS: '6H8uyJYrPVcra6Fi7iWh29DXSm8KctzhHRyXmPwKpump',
    TOKEN_SYMBOL: 'X402',
    HELIUS_RPC_URL: process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=',
    CHART_INTERVAL: '1m', // 1s, 15s, 30s, 1m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
};
class X402TokenDashboard {
    constructor() {
        this.ws = null;
        this.metadata = null;
        this.stats = null;
        this.ohlcvData = [];
        this.holders = [];
        this.recentTrades = [];
        this.isRunning = false;
        this.connection = new web3_js_1.Connection(CONFIG.HELIUS_RPC_URL, {
            commitment: 'confirmed',
        });
    }
    /**
     * Initialize and start the dashboard
     */
    async start() {
        console.log(chalk_1.default.cyan('🚀 X402 Token Dashboard - Initializing...'));
        console.log(chalk_1.default.dim(`Token: ${CONFIG.TOKEN_SYMBOL} (${CONFIG.TOKEN_ADDRESS})`));
        console.log(chalk_1.default.dim('─'.repeat(80)));
        this.isRunning = true;
        try {
            // Fetch initial data
            await this.fetchTokenMetadata();
            await this.fetchTokenStats();
            await this.fetchOHLCVData();
            await this.fetchHolders();
            await this.fetchRecentTrades();
            // Display initial dashboard
            this.displayDashboard();
            // Connect to WebSocket for real-time updates
            this.connectWebSocket();
            // Set up periodic data refresh
            setInterval(() => this.refreshData(), 30000); // Refresh every 30 seconds
        }
        catch (error) {
            console.error(chalk_1.default.red('❌ Error initializing dashboard:'), error);
            throw error;
        }
    }
    /**
     * Stop the dashboard
     */
    stop() {
        this.isRunning = false;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        console.log(chalk_1.default.yellow('\n👋 Dashboard stopped'));
    }
    /**
     * Fetch token metadata from Birdeye API
     */
    async fetchTokenMetadata() {
        const spinner = (0, ora_1.default)('Fetching token metadata...').start();
        try {
            const response = await axios_1.default.get(`${CONFIG.BIRDEYE_API_URL}/defi/v3/token/meta-data/single`, {
                params: { address: CONFIG.TOKEN_ADDRESS },
                headers: {
                    'X-API-KEY': CONFIG.BIRDEYE_API_KEY,
                    'x-chain': 'solana',
                },
            });
            if (response.data.success) {
                this.metadata = {
                    address: response.data.data.address,
                    name: response.data.data.name,
                    symbol: response.data.data.symbol,
                    decimals: response.data.data.decimals,
                    logoUri: response.data.data.logo_uri,
                    extensions: response.data.data.extensions,
                };
                spinner.succeed('Token metadata fetched');
            }
            else {
                spinner.fail('Failed to fetch token metadata');
            }
        }
        catch (error) {
            spinner.fail('Error fetching token metadata');
            console.error(error);
        }
    }
    /**
     * Fetch token statistics from Birdeye API
     */
    async fetchTokenStats() {
        const spinner = (0, ora_1.default)('Fetching token statistics...').start();
        try {
            const response = await axios_1.default.get(`${CONFIG.BIRDEYE_API_URL}/defi/token_overview`, {
                params: { address: CONFIG.TOKEN_ADDRESS },
                headers: {
                    'X-API-KEY': CONFIG.BIRDEYE_API_KEY,
                    'x-chain': 'solana',
                },
            });
            if (response.data.success) {
                const data = response.data.data;
                this.stats = {
                    price: data.price || 0,
                    priceChange24h: data.priceChange24hPercent || 0,
                    volume24h: data.volume24h || 0,
                    marketCap: data.marketCap || 0,
                    liquidity: data.liquidity || 0,
                    holders: data.holder || 0,
                    lastTradeTime: data.lastTradeHumanTime || 'N/A',
                };
                spinner.succeed('Token statistics fetched');
            }
            else {
                spinner.fail('Failed to fetch token statistics');
            }
        }
        catch (error) {
            spinner.fail('Error fetching token statistics');
            console.error(error);
        }
    }
    /**
     * Fetch OHLCV data for charting
     */
    async fetchOHLCVData() {
        const spinner = (0, ora_1.default)('Fetching OHLCV chart data...').start();
        try {
            const now = Math.floor(Date.now() / 1000);
            const timeFrom = now - (24 * 60 * 60); // Last 24 hours
            const response = await axios_1.default.get(`${CONFIG.BIRDEYE_API_URL}/defi/v3/ohlcv`, {
                params: {
                    address: CONFIG.TOKEN_ADDRESS,
                    type: CONFIG.CHART_INTERVAL,
                    currency: 'usd',
                    time_from: timeFrom,
                    time_to: now,
                },
                headers: {
                    'X-API-KEY': CONFIG.BIRDEYE_API_KEY,
                    'x-chain': 'solana',
                },
            });
            if (response.data.success && response.data.data.items) {
                this.ohlcvData = response.data.data.items.map((item) => ({
                    unixTime: item.unixTime,
                    open: item.o,
                    high: item.h,
                    low: item.l,
                    close: item.c,
                    volume: item.v,
                }));
                spinner.succeed(`Fetched ${this.ohlcvData.length} candles`);
            }
            else {
                spinner.warn('No OHLCV data available');
            }
        }
        catch (error) {
            spinner.fail('Error fetching OHLCV data');
            console.error(error);
        }
    }
    /**
     * Fetch token holders
     */
    async fetchHolders() {
        const spinner = (0, ora_1.default)('Fetching top holders...').start();
        try {
            const response = await axios_1.default.get(`${CONFIG.BIRDEYE_API_URL}/defi/v3/token/holder`, {
                params: {
                    address: CONFIG.TOKEN_ADDRESS,
                    offset: 0,
                    limit: 10,
                },
                headers: {
                    'X-API-KEY': CONFIG.BIRDEYE_API_KEY,
                    'x-chain': 'solana',
                },
            });
            if (response.data.success && response.data.data.items) {
                const totalSupply = response.data.data.items.reduce((sum, item) => sum + item.ui_amount, 0);
                this.holders = response.data.data.items.slice(0, 10).map((item) => ({
                    owner: item.owner,
                    uiAmount: item.ui_amount,
                    percentage: (item.ui_amount / totalSupply) * 100,
                }));
                spinner.succeed(`Fetched ${this.holders.length} top holders`);
            }
            else {
                spinner.warn('No holder data available');
            }
        }
        catch (error) {
            spinner.fail('Error fetching holders');
            console.error(error);
        }
    }
    /**
     * Fetch recent trades
     */
    async fetchRecentTrades() {
        const spinner = (0, ora_1.default)('Fetching recent trades...').start();
        try {
            const response = await axios_1.default.get(`${CONFIG.BIRDEYE_API_URL}/defi/txs/token`, {
                params: {
                    address: CONFIG.TOKEN_ADDRESS,
                    offset: 0,
                    limit: 20,
                    tx_type: 'swap',
                    sort_type: 'desc',
                },
                headers: {
                    'X-API-KEY': CONFIG.BIRDEYE_API_KEY,
                    'x-chain': 'solana',
                },
            });
            if (response.data.success && response.data.data.items) {
                this.recentTrades = response.data.data.items.map((item) => ({
                    txHash: item.txHash,
                    blockTime: item.blockUnixTime,
                    side: item.side || 'unknown',
                    fromAmount: item.from?.uiAmount || 0,
                    toAmount: item.to?.uiAmount || 0,
                    priceUSD: item.priceUSD || 0,
                    volumeUSD: item.volumeUSD || 0,
                }));
                spinner.succeed(`Fetched ${this.recentTrades.length} recent trades`);
            }
            else {
                spinner.warn('No trade data available');
            }
        }
        catch (error) {
            spinner.fail('Error fetching trades');
            console.error(error);
        }
    }
    /**
     * Connect to Birdeye WebSocket for real-time price updates
     */
    connectWebSocket() {
        console.log(chalk_1.default.cyan('\n🔌 Connecting to Birdeye WebSocket...'));
        this.ws = new ws_1.default(CONFIG.BIRDEYE_WSS_URL, 'echo-protocol');
        this.ws.on('open', () => {
            console.log(chalk_1.default.green('✅ WebSocket connected'));
            // Subscribe to token price updates
            const subscribeMessage = {
                type: 'SUBSCRIBE_PRICE',
                data: {
                    queryType: 'simple',
                    chartType: CONFIG.CHART_INTERVAL,
                    address: CONFIG.TOKEN_ADDRESS,
                    currency: 'usd',
                },
            };
            this.ws?.send(JSON.stringify(subscribeMessage));
            console.log(chalk_1.default.dim('📡 Subscribed to price updates'));
        });
        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.type === 'PRICE_DATA') {
                    this.handlePriceUpdate(message.data);
                }
            }
            catch (error) {
                console.error(chalk_1.default.red('Error parsing WebSocket message:'), error);
            }
        });
        this.ws.on('error', (error) => {
            console.error(chalk_1.default.red('WebSocket error:'), error);
        });
        this.ws.on('close', () => {
            console.log(chalk_1.default.yellow('WebSocket connection closed'));
            // Reconnect after 5 seconds if still running
            if (this.isRunning) {
                setTimeout(() => this.connectWebSocket(), 5000);
            }
        });
    }
    /**
     * Handle real-time price updates from WebSocket
     */
    handlePriceUpdate(data) {
        // Update OHLCV data
        const newCandle = {
            unixTime: data.unixTime,
            open: data.o,
            high: data.h,
            low: data.l,
            close: data.c,
            volume: data.v,
        };
        // Add or update candle
        const existingIndex = this.ohlcvData.findIndex(c => c.unixTime === data.unixTime);
        if (existingIndex >= 0) {
            this.ohlcvData[existingIndex] = newCandle;
        }
        else {
            this.ohlcvData.push(newCandle);
        }
        // Keep last 1000 candles
        if (this.ohlcvData.length > 1000) {
            this.ohlcvData.shift();
        }
        // Update current price in stats
        if (this.stats) {
            const prevPrice = this.stats.price;
            this.stats.price = data.c;
            // Calculate price change
            if (prevPrice > 0) {
                const change = ((data.c - prevPrice) / prevPrice) * 100;
                console.log(chalk_1.default.dim('\n💹 Price update:'), chalk_1.default.white(`$${data.c.toFixed(8)}`), change >= 0 ? chalk_1.default.green(`+${change.toFixed(2)}%`) : chalk_1.default.red(`${change.toFixed(2)}%`));
            }
        }
        // Refresh display
        this.displayDashboard();
    }
    /**
     * Refresh all data
     */
    async refreshData() {
        await Promise.all([
            this.fetchTokenStats(),
            this.fetchHolders(),
            this.fetchRecentTrades(),
        ]);
        this.displayDashboard();
    }
    /**
     * Display dashboard in terminal
     */
    displayDashboard() {
        // Clear console
        console.clear();
        console.log(chalk_1.default.cyan.bold('\n╔════════════════════════════════════════════════════════════════════════╗'));
        console.log(chalk_1.default.cyan.bold('║           X402 TOKEN DASHBOARD - REAL-TIME DEX ANALYTICS               ║'));
        console.log(chalk_1.default.cyan.bold('╚════════════════════════════════════════════════════════════════════════╝'));
        // Token Info
        if (this.metadata) {
            console.log(chalk_1.default.white.bold('\n📊 TOKEN INFORMATION'));
            console.log(chalk_1.default.dim('─'.repeat(80)));
            console.log(chalk_1.default.white(`  Name:        ${this.metadata.name}`));
            console.log(chalk_1.default.white(`  Symbol:      ${this.metadata.symbol}`));
            console.log(chalk_1.default.white(`  Address:     ${this.metadata.address}`));
            console.log(chalk_1.default.white(`  Decimals:    ${this.metadata.decimals}`));
            if (this.metadata.extensions?.description) {
                console.log(chalk_1.default.dim(`  Description: ${this.metadata.extensions.description.substring(0, 100)}...`));
            }
        }
        // Market Stats
        if (this.stats) {
            console.log(chalk_1.default.white.bold('\n💰 MARKET STATISTICS'));
            console.log(chalk_1.default.dim('─'.repeat(80)));
            const priceColor = this.stats.priceChange24h >= 0 ? chalk_1.default.green : chalk_1.default.red;
            const priceChange = this.stats.priceChange24h >= 0
                ? `+${this.stats.priceChange24h.toFixed(2)}%`
                : `${this.stats.priceChange24h.toFixed(2)}%`;
            console.log(chalk_1.default.white(`  Price:       $${this.stats.price.toFixed(8)} ${priceColor(priceChange)}`));
            console.log(chalk_1.default.white(`  Market Cap:  $${this.formatNumber(this.stats.marketCap)}`));
            console.log(chalk_1.default.white(`  24h Volume:  $${this.formatNumber(this.stats.volume24h)}`));
            console.log(chalk_1.default.white(`  Liquidity:   $${this.formatNumber(this.stats.liquidity)}`));
            console.log(chalk_1.default.white(`  Holders:     ${this.formatNumber(this.stats.holders)}`));
            console.log(chalk_1.default.white(`  Last Trade:  ${this.stats.lastTradeTime}`));
        }
        // Price Chart (ASCII)
        if (this.ohlcvData.length > 0) {
            console.log(chalk_1.default.white.bold('\n📈 PRICE CHART (Recent Candles)'));
            console.log(chalk_1.default.dim('─'.repeat(80)));
            this.displayASCIIChart();
        }
        // Top Holders
        if (this.holders.length > 0) {
            console.log(chalk_1.default.white.bold('\n👥 TOP HOLDERS'));
            console.log(chalk_1.default.dim('─'.repeat(80)));
            const holderTable = new cli_table3_1.default({
                head: ['Rank', 'Address', 'Amount', '% of Supply'],
                colWidths: [6, 46, 18, 14],
            });
            this.holders.slice(0, 5).forEach((holder, index) => {
                holderTable.push([
                    `#${index + 1}`,
                    `${holder.owner.substring(0, 8)}...${holder.owner.substring(holder.owner.length - 8)}`,
                    this.formatNumber(holder.uiAmount),
                    `${holder.percentage.toFixed(2)}%`,
                ]);
            });
            console.log(holderTable.toString());
        }
        // Recent Trades
        if (this.recentTrades.length > 0) {
            console.log(chalk_1.default.white.bold('\n🔄 RECENT TRADES'));
            console.log(chalk_1.default.dim('─'.repeat(80)));
            const tradeTable = new cli_table3_1.default({
                head: ['Time', 'Side', 'Price', 'Volume', 'TX'],
                colWidths: [20, 8, 16, 16, 22],
            });
            this.recentTrades.slice(0, 5).forEach((trade) => {
                const time = new Date(trade.blockTime * 1000).toLocaleTimeString();
                const sideColor = trade.side === 'buy' ? chalk_1.default.green : chalk_1.default.red;
                tradeTable.push([
                    time,
                    sideColor(trade.side.toUpperCase()),
                    `$${trade.priceUSD.toFixed(8)}`,
                    `$${this.formatNumber(trade.volumeUSD)}`,
                    `${trade.txHash.substring(0, 8)}...`,
                ]);
            });
            console.log(tradeTable.toString());
        }
        console.log(chalk_1.default.dim('\n' + '─'.repeat(80)));
        console.log(chalk_1.default.cyan('💡 Real-time updates via Birdeye WebSocket'));
        console.log(chalk_1.default.dim(`Last updated: ${new Date().toLocaleTimeString()}`));
        console.log(chalk_1.default.dim('\nPress Ctrl+C to exit\n'));
    }
    /**
     * Display simple ASCII price chart
     */
    displayASCIIChart() {
        if (this.ohlcvData.length === 0)
            return;
        const recentCandles = this.ohlcvData.slice(-60); // Last 60 candles
        const prices = recentCandles.map(c => c.close);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const priceRange = maxPrice - minPrice;
        const chartHeight = 10;
        const chartWidth = Math.min(prices.length, 60);
        console.log(chalk_1.default.dim(`  High: $${maxPrice.toFixed(8)}`));
        for (let row = chartHeight; row >= 0; row--) {
            const threshold = minPrice + (priceRange * row / chartHeight);
            let line = '  ';
            for (let i = 0; i < chartWidth; i++) {
                const price = prices[Math.floor(i * prices.length / chartWidth)];
                if (Math.abs(price - threshold) < (priceRange / chartHeight / 2)) {
                    const change = i > 0 ? price - prices[Math.floor((i - 1) * prices.length / chartWidth)] : 0;
                    line += change >= 0 ? chalk_1.default.green('█') : chalk_1.default.red('█');
                }
                else if (price > threshold) {
                    line += chalk_1.default.dim('│');
                }
                else {
                    line += ' ';
                }
            }
            console.log(line);
        }
        console.log(chalk_1.default.dim(`  Low:  $${minPrice.toFixed(8)}`));
        console.log(chalk_1.default.dim('  ' + '─'.repeat(chartWidth)));
    }
    /**
     * Format large numbers with K, M, B suffixes
     */
    formatNumber(num) {
        if (num >= 1e9)
            return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6)
            return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3)
            return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(2);
    }
    /**
     * Get TradingView datafeed configuration
     * This can be used to integrate with TradingView charting library
     */
    getTradingViewDatafeed() {
        return {
            onReady: (callback) => {
                setTimeout(() => callback({
                    supported_resolutions: ['1S', '15S', '30S', '1', '5', '15', '30', '60', '120', '240', 'D'],
                    exchanges: [{ value: 'Solana', name: 'Solana', desc: 'Solana DEXs' }],
                    symbols_types: [{ name: 'Token', value: 'token' }],
                }), 0);
            },
            searchSymbols: (userInput, exchange, symbolType, onResult) => {
                onResult([{
                        symbol: CONFIG.TOKEN_SYMBOL,
                        full_name: `Solana:${CONFIG.TOKEN_SYMBOL}`,
                        description: this.metadata?.name || CONFIG.TOKEN_SYMBOL,
                        exchange: 'Solana',
                        type: 'token',
                    }]);
            },
            resolveSymbol: (symbolName, onResolve, onError) => {
                const symbolInfo = {
                    name: CONFIG.TOKEN_SYMBOL,
                    description: this.metadata?.name || CONFIG.TOKEN_SYMBOL,
                    type: 'token',
                    session: '24x7',
                    timezone: 'Etc/UTC',
                    ticker: CONFIG.TOKEN_SYMBOL,
                    exchange: 'Solana',
                    minmov: 1,
                    pricescale: 100000000,
                    has_intraday: true,
                    has_seconds: true,
                    seconds_multipliers: ['1', '15', '30'],
                    supported_resolutions: ['1S', '15S', '30S', '1', '5', '15', '30', '60', '120', '240', 'D'],
                    volume_precision: 2,
                    data_status: 'streaming',
                };
                setTimeout(() => onResolve(symbolInfo), 0);
            },
            getBars: async (symbolInfo, resolution, periodParams, onResult, onError) => {
                try {
                    const bars = this.ohlcvData
                        .filter(c => c.unixTime >= periodParams.from && c.unixTime < periodParams.to)
                        .map(c => ({
                        time: c.unixTime * 1000,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                        volume: c.volume,
                    }));
                    onResult(bars, { noData: bars.length === 0 });
                }
                catch (error) {
                    onError(error);
                }
            },
            subscribeBars: (symbolInfo, resolution, onTick, listenerGuid, onResetCacheNeededCallback) => {
                // Real-time updates handled via WebSocket
                // When new price data arrives, call onTick with the new bar
            },
            unsubscribeBars: (listenerGuid) => {
                // Cleanup if needed
            },
        };
    }
    /**
     * Export data for analysis
     */
    exportData() {
        return {
            metadata: this.metadata,
            stats: this.stats,
            ohlcv: this.ohlcvData,
            holders: this.holders,
            trades: this.recentTrades,
        };
    }
}
exports.X402TokenDashboard = X402TokenDashboard;
// CLI entry point
if (require.main === module) {
    const dashboard = new X402TokenDashboard();
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        dashboard.stop();
        process.exit(0);
    });
    dashboard.start().catch((error) => {
        console.error(chalk_1.default.red('Fatal error:'), error);
        process.exit(1);
    });
}
exports.default = X402TokenDashboard;
//# sourceMappingURL=x402-token-dashboard.js.map