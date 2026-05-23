/**
 * Phoenix Perps Client
 *
 * Fetches live perpetuals data from Phoenix (https://perp-api.phoenix.trade)
 * via the Vulcan CLI (installed locally) or directly from the public API.
 *
 * API reference: https://docs.phoenix.trade/llms.txt
 * Rise SDK docs: https://github.com/Ellipsis-Labs/rise-public
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as https from 'node:https';

const execFileAsync = promisify(execFile);

const PHOENIX_API = 'https://perp-api.phoenix.trade';
const VULCAN_BIN = process.env.VULCAN_BIN ?? 'vulcan';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MarketTicker {
  symbol: string;
  markPrice: number;
  midPrice: number;
  oraclePrice: number;
  prevDayPrice: number;
  change24hPct: number;
  volume24hUsd: number;
  openInterest: number;
  fundingRate: number;       // per-interval rate (annualized = ×8760 if 1h interval)
}

export interface OrderbookLevel {
  price: number;
  quantity: number;
}

export interface Orderbook {
  symbol: string;
  midPrice: number;
  spread: number;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketInfo {
  symbol: string;
  status: string;
  takerFee: number;
  makerFee: number;
  maxLeverage: number;
  isolatedOnly: boolean;
  fundingIntervalSeconds: number;
}

export interface PhoenixSnapshot {
  slot: number;
  markets: MarketInfo[];
  fetchedAt: number;
}

// ── Vulcan CLI runner ──────────────────────────────────────────────────────

async function vulcan(args: string[]): Promise<unknown> {
  const { stdout } = await execFileAsync(VULCAN_BIN, [...args, '-o', 'json'], {
    timeout: 10_000,
  });
  const parsed = JSON.parse(stdout) as { ok: boolean; data?: unknown; error?: { message: string } };
  if (!parsed.ok) {
    throw new Error(`Vulcan error: ${parsed.error?.message ?? 'unknown'}`);
  }
  return parsed.data;
}

// ── Direct HTTP fallback ───────────────────────────────────────────────────

function httpGet(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, PHOENIX_API);
    const req = https.get(url.toString(), { timeout: 10_000 }, (res) => {
      let body = '';
      res.on('data', (c: Buffer) => (body += c.toString()));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error(`JSON parse error from ${path}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('HTTP timeout')); });
  });
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Get ticker for a single market (mark price, funding, OI, 24h change).
 * Uses Vulcan CLI → falls back to snapshot if unavailable.
 */
export async function getTicker(symbol: string): Promise<MarketTicker> {
  try {
    const data = await vulcan(['market', 'ticker', symbol]) as Record<string, number | string>;
    return {
      symbol: String(data.symbol ?? symbol),
      markPrice: Number(data.mark_price ?? 0),
      midPrice: Number(data.mid_price ?? 0),
      oraclePrice: Number(data.oracle_price ?? 0),
      prevDayPrice: Number(data.prev_day_price ?? 0),
      change24hPct: Number(data.change_24h_pct ?? 0),
      volume24hUsd: Number(data.volume_24h_usd ?? 0),
      openInterest: Number(data.open_interest ?? 0),
      fundingRate: Number(data.funding_rate ?? 0),
    };
  } catch {
    // Fallback: derive from snapshot
    const snapshot = await getExchangeSnapshot();
    const m = snapshot.markets.find(mk => mk.symbol === symbol.toUpperCase());
    return {
      symbol: symbol.toUpperCase(),
      markPrice: 0,
      midPrice: 0,
      oraclePrice: 0,
      prevDayPrice: 0,
      change24hPct: 0,
      volume24hUsd: 0,
      openInterest: 0,
      fundingRate: 0,
      ...m && { symbol: m.symbol },
    };
  }
}

/**
 * Get tickers for all major markets in parallel.
 */
export async function getAllTickers(
  symbols = ['SOL', 'BTC', 'ETH', 'SUI', 'DOGE', 'FARTCOIN', 'JUP', 'HYPE']
): Promise<MarketTicker[]> {
  const results = await Promise.allSettled(symbols.map(s => getTicker(s)));
  return results
    .filter((r): r is PromiseFulfilledResult<MarketTicker> => r.status === 'fulfilled')
    .map(r => r.value);
}

/**
 * Get L2 orderbook for a market.
 */
export async function getOrderbook(symbol: string, depth = 10): Promise<Orderbook> {
  try {
    const data = await vulcan(['market', 'orderbook', symbol]) as {
      symbol: string;
      mid_price: number;
      spread: number;
      bids: Array<{ price: number; quantity: number }>;
      asks: Array<{ price: number; quantity: number }>;
    };
    return {
      symbol: data.symbol,
      midPrice: data.mid_price,
      spread: data.spread,
      bids: (data.bids ?? []).slice(0, depth),
      asks: (data.asks ?? []).slice(0, depth),
    };
  } catch {
    return { symbol, midPrice: 0, spread: 0, bids: [], asks: [] };
  }
}

/**
 * Get OHLCV candles for a market.
 */
export async function getCandles(
  symbol: string,
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
  limit = 24
): Promise<Candle[]> {
  try {
    const args = ['market', 'candles', symbol, '--interval', interval, '--limit', String(limit)];
    const data = await vulcan(args) as { candles: Candle[] };
    return data.candles ?? [];
  } catch {
    return [];
  }
}

/**
 * Get the exchange snapshot — market configs, fees, leverage tiers.
 * Fetched directly from the Phoenix API (no auth needed).
 */
export async function getExchangeSnapshot(): Promise<PhoenixSnapshot> {
  try {
    const data = await httpGet('/v1/exchange/snapshot') as {
      slot: number;
      markets: Array<{
        symbol: string;
        marketStatus: string;
        takerFee: number;
        makerFee: number;
        isolatedOnly: boolean;
        fundingConfig: { fundingIntervalSeconds: number };
        leverageTiers: Array<{ maxLeverage: number }>;
      }>;
    };
    return {
      slot: data.slot,
      fetchedAt: Date.now(),
      markets: (data.markets ?? []).map(m => ({
        symbol: m.symbol,
        status: m.marketStatus,
        takerFee: m.takerFee,
        makerFee: m.makerFee,
        maxLeverage: Math.max(...(m.leverageTiers ?? []).map(t => t.maxLeverage)),
        isolatedOnly: m.isolatedOnly ?? false,
        fundingIntervalSeconds: m.fundingConfig?.fundingIntervalSeconds ?? 3600,
      })),
    };
  } catch (err: unknown) {
    throw new Error(`Failed to fetch Phoenix snapshot: ${(err as Error).message}`);
  }
}

/**
 * Get market list via Vulcan (includes live status).
 */
export async function getMarketList(): Promise<MarketInfo[]> {
  try {
    const data = await vulcan(['market', 'list']) as {
      markets: Array<{
        symbol: string;
        status: string;
        taker_fee: number;
        maker_fee: number;
        max_leverage: number;
        isolated_only: boolean;
      }>;
    };
    return (data.markets ?? []).map(m => ({
      symbol: m.symbol,
      status: m.status,
      takerFee: m.taker_fee,
      makerFee: m.maker_fee,
      maxLeverage: m.max_leverage,
      isolatedOnly: m.isolated_only,
      fundingIntervalSeconds: 3600, // default
    }));
  } catch {
    const snap = await getExchangeSnapshot();
    return snap.markets;
  }
}

/**
 * Format an annualized funding rate as a human-readable string.
 * Phoenix rate is per-interval (1h). Annual = rate × 24 × 365.
 */
export function formatFundingRate(rate: number, intervalSeconds = 3600): string {
  const intervalsPerYear = (365 * 24 * 3600) / intervalSeconds;
  const annualized = rate * intervalsPerYear * 100;
  const sign = annualized >= 0 ? '+' : '';
  return `${sign}${annualized.toFixed(4)}% APR`;
}

/**
 * Format a raw funding rate for display as hourly bps.
 */
export function formatFundingBps(rate: number): string {
  const bps = rate * 10000;
  const sign = bps >= 0 ? '+' : '';
  return `${sign}${bps.toFixed(4)} bps/hr`;
}
