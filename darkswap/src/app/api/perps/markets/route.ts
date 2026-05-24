/**
 * Perps Market Data Aggregator
 *
 * Aggregates from Phoenix Rise API + Imperial funding rates.
 * Returns unified market snapshot for all tradeable perp pairs.
 */

export const runtime = "edge";
export const dynamic = "force-dynamic";

const PHOENIX_API = "https://perp-api.phoenix.trade";
const IMPERIAL_API = "https://api.imperial.space/api/v1";

// Symbols we display in the terminal
const TRACKED_SYMBOLS = ["SOL", "BTC", "ETH", "XAU"];

export async function GET() {
  const [phoenixRes, imperialRes] = await Promise.allSettled([
    fetch(`${PHOENIX_API}/v1/exchange/snapshot`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 5 },
    }),
    fetch(`${IMPERIAL_API}/funding-rates`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 10 },
    }),
  ]);

  // Parse Phoenix data
  let phoenixMarkets: Record<string, {
    lastPrice: number;
    change24h: number;
    openInterest: number;
    volume24h: number;
  }> = {};

  if (phoenixRes.status === "fulfilled" && phoenixRes.value.ok) {
    try {
      const raw = await phoenixRes.value.json() as {
        markets?: Record<string, {
          indexPrice?: number | string;
          lastPrice?: number | string;
          priceChange24h?: number | string;
          openInterest?: number | string;
          volume24h?: number | string;
        }>;
      };
      for (const [symbol, m] of Object.entries(raw.markets ?? {})) {
        const cleanSymbol = symbol.replace("-PERP", "").replace("-perp", "");
        phoenixMarkets[cleanSymbol] = {
          lastPrice: Number(m.lastPrice ?? m.indexPrice ?? 0),
          change24h: Number(m.priceChange24h ?? 0),
          openInterest: Number(m.openInterest ?? 0),
          volume24h: Number(m.volume24h ?? 0),
        };
      }
    } catch { /* ignore */ }
  }

  // Parse Imperial funding rates
  let imperialFunding: Record<string, { longRate: number; shortRate: number }> = {};
  if (imperialRes.status === "fulfilled" && imperialRes.value.ok) {
    try {
      const raw = await imperialRes.value.json() as {
        rates?: Array<{
          symbol: string;
          longFundingRatePerHourPercent?: number;
          shortFundingRatePerHourPercent?: number;
        }>;
      };
      for (const r of raw.rates ?? []) {
        imperialFunding[r.symbol] = {
          longRate: r.longFundingRatePerHourPercent ?? 0,
          shortRate: r.shortFundingRatePerHourPercent ?? 0,
        };
      }
    } catch { /* ignore */ }
  }

  // Fallback prices for demo if APIs are unavailable
  const FALLBACK: Record<string, { price: number; change: number }> = {
    SOL: { price: 170.42, change: 2.34 },
    BTC: { price: 95800, change: -0.82 },
    ETH: { price: 3240, change: 1.15 },
    XAU: { price: 2398, change: 0.41 },
  };

  const markets = TRACKED_SYMBOLS.map((symbol) => {
    const ph = phoenixMarkets[symbol];
    const imp = imperialFunding[symbol];
    const fb = FALLBACK[symbol];
    return {
      symbol,
      pair: `${symbol}-PERP`,
      price: ph?.lastPrice || fb?.price || 0,
      change24h: ph?.change24h ?? fb?.change ?? 0,
      openInterest: ph?.openInterest ?? 0,
      volume24h: ph?.volume24h ?? 0,
      fundingRate: imp?.longRate ?? 0,
      source: ph ? "phoenix" : "fallback",
    };
  });

  return Response.json({ markets, timestamp: Date.now() });
}
