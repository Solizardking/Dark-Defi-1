"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { History, ExternalLink, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { api } from "../../convex/_generated/api";

interface Props {
  walletAddress: string;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function truncateSig(sig: string): string {
  return `${sig.slice(0, 8)}…${sig.slice(-6)}`;
}

export function SwapHistoryPanel({ walletAddress }: Props) {
  const [expanded, setExpanded] = useState(false);
  const swaps = useQuery(api.swaps.getSwapsByWallet, { walletAddress });

  const count = swaps?.length ?? 0;

  return (
    <div className="glass rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
      <div className="w-full flex items-center justify-between p-3">
        <div className="flex items-center gap-2 flex-1">
          <History size={13} className="text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-400 tracking-wider">SWAP HISTORY</span>
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
            <div className="text-xs text-slate-600 py-3 text-center animate-pulse">Loading…</div>
          )}

          {swaps?.length === 0 && (
            <div className="text-xs text-slate-600 py-3 text-center">No swaps yet</div>
          )}

          {swaps && swaps.length > 0 && (
            <div className="space-y-0.5 mt-2 max-h-56 overflow-y-auto">
              {swaps.map((swap) => (
                <div
                  key={swap._id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/3 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-white">
                          {swap.inputAmount} {swap.inputSymbol}
                        </span>
                        <span className="text-[10px] text-slate-600">→</span>
                        <span className="text-xs font-mono text-cyan-300">
                          {swap.outputAmount} {swap.outputSymbol}
                        </span>
                        {swap.privacyEnabled && (
                          <span title="Privacy enabled">
                            <Shield size={9} className="text-purple-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-600">
                          {timeAgo(swap._creationTime)}
                        </span>
                        <span className="text-[10px] text-slate-700">·</span>
                        <span className="text-[10px] text-slate-600 capitalize">{swap.source}</span>
                        {swap.route && (
                          <>
                            <span className="text-[10px] text-slate-700">·</span>
                            <span className="text-[10px] text-slate-600 truncate max-w-[80px]">{swap.route}</span>
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
