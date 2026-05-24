/**
 * Orderbook Proxy — Phoenix Rise
 *
 * GET /api/perps/orderbook?symbol=SOL&depth=10
 */

export const runtime = "edge";
export const dynamic = "force-dynamic";

const PHOENIX_API = "https://perp-api.phoenix.trade";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "SOL";
  const depth = Math.min(Number(searchParams.get("depth") || 10), 25);

  const res = await fetch(
    `${PHOENIX_API}/v1/orderbook/${symbol}-PERP`,
    { headers: { Accept: "application/json" }, next: { revalidate: 2 } }
  );

  if (!res.ok) {
    // Return synthetic orderbook for demo
    return Response.json(buildSyntheticBook(symbol, depth));
  }

  const raw = await res.json() as {
    bids?: Array<[string, string]>;
    asks?: Array<[string, string]>;
    timestamp?: number;
  };

  const bids = (raw.bids ?? []).slice(0, depth).map(([p, s]) => ({
    price: Number(p),
    size: Number(s),
  }));
  const asks = (raw.asks ?? []).slice(0, depth).map(([p, s]) => ({
    price: Number(p),
    size: Number(s),
  }));

  const midPrice = bids[0] && asks[0]
    ? (bids[0].price + asks[0].price) / 2
    : 0;

  return Response.json({ symbol, bids, asks, midPrice, timestamp: Date.now() });
}

// Synthetic orderbook for demo/fallback
function buildSyntheticBook(symbol: string, depth: number) {
  const BASE_PRICES: Record<string, number> = {
    SOL: 170.42, BTC: 95800, ETH: 3240, XAU: 2398,
  };
  const mid = BASE_PRICES[symbol] ?? 100;
  const spread = mid * 0.0002;
  const bids = Array.from({ length: depth }, (_, i) => ({
    price: +(mid - spread - i * spread * 2).toFixed(2),
    size: +(Math.random() * 2000 + 100).toFixed(0),
  }));
  const asks = Array.from({ length: depth }, (_, i) => ({
    price: +(mid + spread + i * spread * 2).toFixed(2),
    size: +(Math.random() * 2000 + 100).toFixed(0),
  }));
  return { symbol, bids, asks, midPrice: mid, timestamp: Date.now(), demo: true };
}
