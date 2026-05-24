"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceTick {
  symbol: string;
  price: number;
  change24h: number;
  mint: string;
}

const SEED_TICKS: PriceTick[] = [
  { symbol: "SOL",  price: 0,   change24h: 0, mint: "So11111111111111111111111111111111111111112" },
  { symbol: "USDC", price: 1,   change24h: 0, mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { symbol: "JUP",  price: 0,   change24h: 0, mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
  { symbol: "BONK", price: 0,   change24h: 0, mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { symbol: "WIF",  price: 0,   change24h: 0, mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
  { symbol: "PYTH", price: 0,   change24h: 0, mint: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3" },
];

export function LiveTicker() {
  const [ticks, setTicks] = useState<PriceTick[]>(SEED_TICKS);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let timer: ReturnType<typeof setTimeout>;

    const fetchPrices = async () => {
      try {
        const mints = SEED_TICKS.map((t) => t.mint).join(",");
        const res = await fetch(
          `https://api.jup.ag/price/v2?ids=${mints}`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current) return;
        setTicks((prev) =>
          prev.map((t) => {
            const d = json?.data?.[t.mint];
            if (!d) return t;
            return { ...t, price: parseFloat(d.price ?? "0") };
          })
        );
      } catch {
        /* silent — ticker is decorative */
      } finally {
        if (mountedRef.current) timer = setTimeout(fetchPrices, 15_000);
      }
    };

    fetchPrices();
    return () => { mountedRef.current = false; clearTimeout(timer); };
  }, []);

  const items = [...ticks, ...ticks]; // duplicate for seamless loop

  return (
    <div className="ticker-wrap h-7 flex items-center border-b border-white/5 bg-black/20">
      <div className="ticker-inner flex items-center gap-8 px-4">
        {items.map((t, i) => (
          <TickItem key={`${t.symbol}-${i}`} tick={t} />
        ))}
      </div>
    </div>
  );
}

function TickItem({ tick }: { tick: PriceTick }) {
  const up = tick.change24h >= 0;
  const priceStr =
    tick.price === 0
      ? "—"
      : tick.price < 0.001
      ? `$${tick.price.toExponential(2)}`
      : tick.price < 1
      ? `$${tick.price.toFixed(5)}`
      : `$${tick.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <span className="flex items-center gap-1.5 shrink-0">
      <span className="text-[10px] font-bold text-slate-400 tracking-wider">{tick.symbol}</span>
      <span className="text-[10px] font-mono text-slate-300">{priceStr}</span>
      {tick.change24h !== 0 && (
        <span className={`flex items-center gap-0.5 text-[9px] font-mono ${up ? "text-green-400" : "text-red-400"}`}>
          {up ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
          {Math.abs(tick.change24h).toFixed(2)}%
        </span>
      )}
      <span className="text-slate-700 text-[10px]">·</span>
    </span>
  );
}
