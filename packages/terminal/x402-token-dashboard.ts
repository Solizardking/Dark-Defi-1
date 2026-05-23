/**
 * CLAWD Token Dashboard
 * Real-time streaming DEX and charting system
 *
 * Token: CLAWD (8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)
 *
 * Features:
 * - Live price updates via Birdeye WebSocket
 * - TradingView charting integration
 * - Token metadata and statistics
 * - Trade history tracking
 * - Holder information
 * - Google AI market analysis
 */

import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import WebSocket from 'ws';
import axios from 'axios';
import { Connection } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';
dotenv.config({ path: resolve(__dirname, '.env') });
dotenv.config();

// Configuration — all values can be overridden via .env
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY || '';
const CONFIG = {
  BIRDEYE_API_KEY,
  BIRDEYE_WSS_URL: `wss://public-api.birdeye.so/socket/solana?x-api-key=${BIRDEYE_API_KEY}`,
  BIRDEYE_API_URL: 'https://public-api.birdeye.so',
  // Default: CLAWD token — override with TOKEN_ADDRESS= in .env
  TOKEN_ADDRESS: process.env.TOKEN_ADDRESS || '8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump',
  TOKEN_SYMBOL: process.env.TOKEN_SYMBOL || 'CLAWD',
  HELIUS_RPC_URL: process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=',
  CHART_INTERVAL: process.env.CHART_INTERVAL || '1m', // 1s, 15s, 30s, 1m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
};

// Interfaces
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

export class ClawdTokenDashboard {
  private ws: WebSocket | null = null;
  private connection: Connection;
  private metadata: TokenMetadata | null = null;
  private stats: TokenStats | null = null;
  private ohlcvData: OHLCVData[] = [];
  private holders: TokenHolder[] = [];
  private recentTrades: Trade[] = [];
  private isRunning = false;

  constructor() {
    this.connection = new Connection(CONFIG.HELIUS_RPC_URL, {
      commitment: 'confirmed',
    });
  }

  /**
   * Initialize and start the dashboard
   */
  async start(): Promise<void> {
    console.log(chalk.cyan('🐾 CLAWD Token Dashboard - Initializing...'));
    console.log(chalk.dim(`Token: ${CONFIG.TOKEN_SYMBOL} (${CONFIG.TOKEN_ADDRESS})`));
    console.log(chalk.dim('─'.repeat(80)));

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
    } catch (error) {
      console.error(chalk.red('❌ Error initializing dashboard:'), error);
      throw error;
    }
  }

  /**
   * Stop the dashboard
   */
  stop(): void {
    this.isRunning = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log(chalk.yellow('\n👋 Dashboard stopped'));
  }

  /**
   * Fetch token metadata from Birdeye API
   */
  private async fetchTokenMetadata(): Promise<void> {
    const spinner = ora('Fetching token metadata...').start();
    try {
      const response = await axios.get(
        `${CONFIG.BIRDEYE_API_URL}/defi/v3/token/meta-data/single`,
        {
          params: { address: CONFIG.TOKEN_ADDRESS },
          headers: {
            'X-API-KEY': CONFIG.BIRDEYE_API_KEY,
            'x-chain': 'solana',
          },
        }
      );

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
      } else {
        spinner.fail('Failed to fetch token metadata');
      }
    } catch (error: any) {
      spinner.fail('Error fetching token metadata');
      console.error(error);
    }
  }

  /**
   * Fetch token statistics from Birdeye API
   */
  private async fetchTokenStats(): Promise<void> {
    const spinner = ora('Fetching token statistics...').start();
    try {
      const response = await axios.get(
        `${CONFIG.BIRDEYE_API_URL}/defi/token_overview`,
        {
          params: { address: CONFIG.TOKEN_ADDRESS },
          headers: {
            'X-API-KEY': CONFIG.BIRDEYE_API_KEY,
            'x-chain': 'solana',
          },
        }
      );

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
      } else {
        spinner.fail('Failed to fetch token statistics');
      }
    } catch (error: any) {
      spinner.fail('Error fetching token statistics');
      console.error(error);
    }
  }

  /**
   * Fetch OHLCV data for charting
   */
  private async fetchOHLCVData(): Promise<void> {
    const spinner = ora('Fetching OHLCV chart data...').start();
    try {
      const now = Math.floor(Date.now() / 1000);
      const timeFrom = now - (24 * 60 * 60); // Last 24 hours

      const response = await axios.get(
        `${CONFIG.BIRDEYE_API_URL}/defi/v3/ohlcv`,
        {
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
        }
      );

      if (response.data.success && response.data.data.items) {
        this.ohlcvData = response.data.data.items.map((item: any) => ({
          unixTime: item.unixTime,
          open: item.o,
          high: item.h,
          low: item.l,
          close: item.c,
          volume: item.v,
        }));
        spinner.succeed(`Fetched ${this.ohlcvData.length} candles`);
      } else {
        spinner.warn('No OHLCV data available');
      }
    } catch (error: any) {
      spinner.fail('Error fetching OHLCV data');
      console.error(error);
    }
  }

  /**
   * Fetch token holders
   */
  private async fetchHolders(): Promise<void> {
    const spinner = ora('Fetching top holders...').start();
    try {
      const response = await axios.get(
        `${CONFIG.BIRDEYE_API_URL}/defi/v3/token/holder`,
        {
          params: {
            address: CONFIG.TOKEN_ADDRESS,
            offset: 0,
            limit: 10,
          },
          headers: {
            'X-API-KEY': CONFIG.BIRDEYE_API_KEY,
            'x-chain': 'solana',
          },
        }
      );

      if (response.data.success && response.data.data.items) {
        const totalSupply = response.data.data.items.reduce(
          (sum: number, item: any) => sum + item.ui_amount,
          0
        );

        this.holders = response.data.data.items.slice(0, 10).map((item: any) => ({
          owner: item.owner,
          uiAmount: item.ui_amount,
          percentage: (item.ui_amount / totalSupply) * 100,
        }));
        spinner.succeed(`Fetched ${this.holders.length} top holders`);
      } else {
        spinner.warn('No holder data available');
      }
    } catch (error: any) {
      spinner.fail('Error fetching holders');
      console.error(error);
    }
  }

  /**
   * Fetch recent trades
   */
  private async fetchRecentTrades(): Promise<void> {
    const spinner = ora('Fetching recent trades...').start();
    try {
      const response = await axios.get(
        `${CONFIG.BIRDEYE_API_URL}/defi/txs/token`,
        {
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
        }
      );

      if (response.data.success && response.data.data.items) {
        this.recentTrades = response.data.data.items.map((item: any) => ({
          txHash: item.txHash,
          blockTime: item.blockUnixTime,
          side: item.side || 'unknown',
          fromAmount: item.from?.uiAmount || 0,
          toAmount: item.to?.uiAmount || 0,
          priceUSD: item.priceUSD || 0,
          volumeUSD: item.volumeUSD || 0,
        }));
        spinner.succeed(`Fetched ${this.recentTrades.length} recent trades`);
      } else {
        spinner.warn('No trade data available');
      }
    } catch (error: any) {
      spinner.fail('Error fetching trades');
      console.error(error);
    }
  }

  /**
   * Connect to Birdeye WebSocket for real-time price updates
   */
  private connectWebSocket(): void {
    console.log(chalk.cyan('\n🔌 Connecting to Birdeye WebSocket...'));

    this.ws = new WebSocket(CONFIG.BIRDEYE_WSS_URL, 'echo-protocol');

    this.ws.on('open', () => {
      console.log(chalk.green('✅ WebSocket connected'));

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
      console.log(chalk.dim('📡 Subscribed to price updates'));
    });

    this.ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'PRICE_DATA') {
          this.handlePriceUpdate(message.data);
        }
      } catch (error: any) {
        console.error(chalk.red('Error parsing WebSocket message:'), error);
      }
    });

    this.ws.on('error', (error) => {
      console.error(chalk.red('WebSocket error:'), error);
    });

    this.ws.on('close', () => {
      console.log(chalk.yellow('WebSocket connection closed'));
      
      // Reconnect after 5 seconds if still running
      if (this.isRunning) {
        setTimeout(() => this.connectWebSocket(), 5000);
      }
    });
  }

  /**
   * Handle real-time price updates from WebSocket
   */
  private handlePriceUpdate(data: any): void {
    // Update OHLCV data
    const newCandle: OHLCVData = {
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
    } else {
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
        console.log(
          chalk.dim('\n💹 Price update:'),
          chalk.white(`$${data.c.toFixed(8)}`),
          change >= 0 ? chalk.green(`+${change.toFixed(2)}%`) : chalk.red(`${change.toFixed(2)}%`)
        );
      }
    }

    // Refresh display
    this.displayDashboard();
  }

  /**
   * Refresh all data
   */
  private async refreshData(): Promise<void> {
    await Promise.all([
      this.fetchTokenStats(),
      this.fetchHolders(),
      this.fetchRecentTrades(),
    ]);
    this.displayDashboard();
  }

  /** Render the token info section */
  private renderTokenInfo(): void {
    if (!this.metadata) return;
    console.log(chalk.white.bold('\n📊 TOKEN INFORMATION'));
    console.log(chalk.dim('─'.repeat(80)));
    console.log(chalk.white(`  Name:        ${this.metadata.name}`));
    console.log(chalk.white(`  Symbol:      ${this.metadata.symbol}`));
    console.log(chalk.white(`  Address:     ${this.metadata.address}`));
    console.log(chalk.white(`  Decimals:    ${this.metadata.decimals}`));
    if (this.metadata.extensions?.description) {
      console.log(chalk.dim(`  Description: ${this.metadata.extensions.description.substring(0, 100)}...`));
    }
  }

  /** Render the market stats section */
  private renderMarketStats(): void {
    if (!this.stats) return;
    console.log(chalk.white.bold('\n💰 MARKET STATISTICS'));
    console.log(chalk.dim('─'.repeat(80)));
    const priceColor = this.stats.priceChange24h >= 0 ? chalk.green : chalk.red;
    const sign = this.stats.priceChange24h >= 0 ? '+' : '';
    const priceChange = `${sign}${this.stats.priceChange24h.toFixed(2)}%`;
    console.log(chalk.white(`  Price:       $${this.stats.price.toFixed(8)} ${priceColor(priceChange)}`));
    console.log(chalk.white(`  Market Cap:  $${this.formatNumber(this.stats.marketCap)}`));
    console.log(chalk.white(`  24h Volume:  $${this.formatNumber(this.stats.volume24h)}`));
    console.log(chalk.white(`  Liquidity:   $${this.formatNumber(this.stats.liquidity)}`));
    console.log(chalk.white(`  Holders:     ${this.formatNumber(this.stats.holders)}`));
    console.log(chalk.white(`  Last Trade:  ${this.stats.lastTradeTime}`));
  }

  /** Render the top holders table */
  private renderHolders(): void {
    if (this.holders.length === 0) return;
    console.log(chalk.white.bold('\n👥 TOP HOLDERS'));
    console.log(chalk.dim('─'.repeat(80)));
    const table = new Table({
      head: ['Rank', 'Address', 'Amount', '% of Supply'],
      colWidths: [6, 46, 18, 14],
    });
    let idx = 0;
    for (const holder of this.holders.slice(0, 5)) {
      idx++;
      table.push([
        `#${idx}`,
        `${holder.owner.substring(0, 8)}...${holder.owner.substring(holder.owner.length - 8)}`,
        this.formatNumber(holder.uiAmount),
        `${holder.percentage.toFixed(2)}%`,
      ]);
    }
    console.log(table.toString());
  }

  /** Render the recent trades table */
  private renderTrades(): void {
    if (this.recentTrades.length === 0) return;
    console.log(chalk.white.bold('\n🔄 RECENT TRADES'));
    console.log(chalk.dim('─'.repeat(80)));
    const table = new Table({
      head: ['Time', 'Side', 'Price', 'Volume', 'TX'],
      colWidths: [20, 8, 16, 16, 22],
    });
    for (const trade of this.recentTrades.slice(0, 5)) {
      const time = new Date(trade.blockTime * 1000).toLocaleTimeString();
      const sideColor = trade.side === 'buy' ? chalk.green : chalk.red;
      table.push([
        time,
        sideColor(trade.side.toUpperCase()),
        `$${trade.priceUSD.toFixed(8)}`,
        `$${this.formatNumber(trade.volumeUSD)}`,
        `${trade.txHash.substring(0, 8)}...`,
      ]);
    }
    console.log(table.toString());
  }

  /**
   * Display dashboard in terminal
   */
  private displayDashboard(): void {
    console.clear();
    console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║          CLAWD TOKEN DASHBOARD - REAL-TIME DEX ANALYTICS  🐾           ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════════════════╝'));

    this.renderTokenInfo();
    this.renderMarketStats();

    if (this.ohlcvData.length > 0) {
      console.log(chalk.white.bold('\n📈 PRICE CHART (Recent Candles)'));
      console.log(chalk.dim('─'.repeat(80)));
      this.displayASCIIChart();
    }

    this.renderHolders();
    this.renderTrades();

    console.log(chalk.dim(`\n${'─'.repeat(80)}`));
    console.log(chalk.cyan('💡 Real-time updates via Birdeye WebSocket'));
    console.log(chalk.dim(`Last updated: ${new Date().toLocaleTimeString()}`));
    console.log(chalk.dim('\nPress Ctrl+C to exit\n'));
  }

  /**
   * Display simple ASCII price chart
   */
  private displayASCIIChart(): void {
    if (this.ohlcvData.length === 0) return;

    const recentCandles = this.ohlcvData.slice(-60); // Last 60 candles
    const prices = recentCandles.map(c => c.close);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;

    const chartHeight = 10;
    const chartWidth = Math.min(prices.length, 60);

    console.log(chalk.dim(`  High: $${maxPrice.toFixed(8)}`));
    
    for (let row = chartHeight; row >= 0; row--) {
      const threshold = minPrice + (priceRange * row / chartHeight);
      let line = '  ';
      
      for (let i = 0; i < chartWidth; i++) {
        const price = prices[Math.floor(i * prices.length / chartWidth)];
        if (Math.abs(price - threshold) < (priceRange / chartHeight / 2)) {
          const change = i > 0 ? price - prices[Math.floor((i - 1) * prices.length / chartWidth)] : 0;
          line += change >= 0 ? chalk.green('█') : chalk.red('█');
        } else if (price > threshold) {
          line += chalk.dim('│');
        } else {
          line += ' ';
        }
      }
      console.log(line);
    }
    
    console.log(chalk.dim(`  Low:  $${minPrice.toFixed(8)}`));
    console.log(chalk.dim('  ' + '─'.repeat(chartWidth)));
  }

  /**
   * Format large numbers with K, M, B suffixes
   */
  private formatNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  /**
   * Get TradingView datafeed configuration
   * This can be used to integrate with TradingView charting library
   */
  public getTradingViewDatafeed(): Record<string, unknown> {
    type AnyFn = (...args: unknown[]) => unknown;
    return {
      onReady: (callback: AnyFn) => {
        setTimeout(() => callback({
          supported_resolutions: ['1S', '15S', '30S', '1', '5', '15', '30', '60', '120', '240', 'D'],
          exchanges: [{ value: 'Solana', name: 'Solana', desc: 'Solana DEXs' }],
          symbols_types: [{ name: 'Token', value: 'token' }],
        }), 0);
      },

      searchSymbols: (_userInput: string, _exchange: string, _symbolType: string, onResult: AnyFn) => {
        onResult([{
          symbol: CONFIG.TOKEN_SYMBOL,
          full_name: `Solana:${CONFIG.TOKEN_SYMBOL}`,
          description: this.metadata?.name ?? CONFIG.TOKEN_SYMBOL,
          exchange: 'Solana',
          type: 'token',
        }]);
      },

      resolveSymbol: (_symbolName: string, onResolve: AnyFn, _onError: AnyFn) => {
        const symbolInfo = {
          name: CONFIG.TOKEN_SYMBOL,
          description: this.metadata?.name ?? CONFIG.TOKEN_SYMBOL,
          type: 'token',
          session: '24x7',
          timezone: 'Etc/UTC',
          ticker: CONFIG.TOKEN_SYMBOL,
          exchange: 'Solana',
          minmov: 1,
          pricescale: 100_000_000,
          has_intraday: true,
          has_seconds: true,
          seconds_multipliers: ['1', '15', '30'],
          supported_resolutions: ['1S', '15S', '30S', '1', '5', '15', '30', '60', '120', '240', 'D'],
          volume_precision: 2,
          data_status: 'streaming',
        };
        setTimeout(() => onResolve(symbolInfo), 0);
      },

      getBars: async (
        _symbolInfo: unknown,
        _resolution: string,
        periodParams: { from: number; to: number },
        onResult: AnyFn,
        onError: AnyFn
      ) => {
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
        } catch (error: unknown) {
          onError(error);
        }
      },

      subscribeBars: (
        _symbolInfo: unknown,
        _resolution: string,
        _onTick: AnyFn,
        _listenerGuid: string,
        _onResetCacheNeededCallback: AnyFn
      ) => {
        // Real-time updates handled via WebSocket
      },

      unsubscribeBars: (_listenerGuid: string) => {
        // Cleanup if needed
      },
    };
  }

  /**
   * Export data for analysis
   */
  public exportData(): {
    metadata: TokenMetadata | null;
    stats: TokenStats | null;
    ohlcv: OHLCVData[];
    holders: TokenHolder[];
    trades: Trade[];
  } {
    return {
      metadata: this.metadata,
      stats: this.stats,
      ohlcv: this.ohlcvData,
      holders: this.holders,
      trades: this.recentTrades,
    };
  }
}

// CLI entry point
if (require.main === module) {
  const dashboard = new ClawdTokenDashboard();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    dashboard.stop();
    process.exit(0);
  });

  dashboard.start().catch((error) => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

// Keep backward-compatible alias
export { ClawdTokenDashboard as X402TokenDashboard };
export default ClawdTokenDashboard;
