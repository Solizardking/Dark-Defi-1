"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { History, ExternalLink, ChevronDown, ChevronUp, Shield, Radio } from "lucide-react";
import { api } from "../../convex/_generated/api";

interface Props {
  walletAddress?: string;
  variant?: "wallet" | "live";
  defaultExpanded?: boolean;
  limit?: number;
}

function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function truncateSig(sig: string): string {
  return `${sig.slice(0, 8)}...${sig.slice(-6)}`;
}

function truncateWallet(wallet: string): string {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export function SwapHistoryPanel({
  walletAddress,
  variant = "wallet",
  defaultExpanded,
  limit,
}: Props) {
  const isLive = variant === "live" || !walletAddress;
  const [expanded, setExpanded] = useState(defaultExpanded ?? isLive);
  const [now, setNow] = useState(0);
  const queryArgs: { walletAddress?: string; limit: number } = isLive
    ? { limit: limit ?? 12 }
    : { walletAddress, limit: limit ?? 50 };
  const swaps = useQuery(api.swaps.listSwaps, queryArgs);

  useEffect(() => {
    if (!expanded) return undefined;

    const update = () => setNow(Date.now());
    const tick = setTimeout(update, 0);
    const interval = setInterval(update, 1000);

    return () => {
      clearTimeout(tick);
      clearInterval(interval);
    };
  }, [expanded]);

  const count = swaps?.length ?? 0;
  const title = isLive ? "LIVE SWAPS" : "SWAP HISTORY";
  const Icon = isLive ? Radio : History;

  return (
    <div className="glass rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
      <div className="w-full flex items-center justify-between p-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon size={13} className={isLive ? "text-green-400" : "text-cyan-400"} />
          <span className={`text-xs font-semibold tracking-wider ${isLive ? "text-green-400" : "text-cyan-400"}`}>
            {title}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] text-green-400/80 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              realtime
            </span>
          )}
          {count > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 font-mono">
              {count}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-white/5">
          {swaps === undefined && (
            <div className="text-xs text-slate-600 py-3 text-center animate-pulse">Loading...</div>
          )}

          {swaps?.length === 0 && (
            <div className="text-xs text-slate-600 py-3 text-center">
              {isLive ? "No recorded swaps yet" : "No swaps yet"}
            </div>
          )}

          {swaps && swaps.length > 0 && (
            <div className="space-y-0.5 mt-2 max-h-64 overflow-y-auto">
              {swaps.map((swap, index) => (
                <div
                  key={swap._id}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
                    isLive && index === 0 ? "bg-green-500/5 border border-green-500/10" : "hover:bg-white/3"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-mono text-white truncate">
                          {swap.inputAmount} {swap.inputSymbol}
                        </span>
                        <span className="text-[10px] text-slate-600">-&gt;</span>
                        <span className="text-xs font-mono text-cyan-300 truncate">
                          {swap.outputAmount} {swap.outputSymbol}
                        </span>
                        {swap.privacyEnabled && (
                          <span title="Privacy enabled">
                            <Shield size={9} className="text-purple-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 min-w-0">
                        <span className="text-[10px] text-slate-600">
                          {timeAgo(swap._creationTime, now)}
                        </span>
                        <span className="text-[10px] text-slate-700">.</span>
                        <span className="text-[10px] text-slate-600 capitalize">{swap.source}</span>
                        {isLive && (
                          <>
                            <span className="text-[10px] text-slate-700">.</span>
                            <span className="text-[10px] text-slate-600">{truncateWallet(swap.walletAddress)}</span>
                          </>
                        )}
                        {swap.route && (
                          <>
                            <span className="text-[10px] text-slate-700">.</span>
                            <span className="text-[10px] text-slate-600 truncate max-w-[96px]">{swap.route}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <a
                    href={`https://solscan.io/tx/${swap.txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-cyan-400 transition-colors shrink-0 ml-2"
                    title={swap.txSignature}
                  >
                    {truncateSig(swap.txSignature)}
                    <ExternalLink size={9} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
