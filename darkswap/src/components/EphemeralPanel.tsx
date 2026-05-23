"use client";

import { useState, useCallback } from "react";
import { Layers, ArrowUpDown, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface EphemeralBalance {
  baseBalance: number | null;
  ephemeralBalance: number | null;
  isLoading: boolean;
}

interface Props {
  enabled: boolean;
  onToggle: () => void;
  balances: EphemeralBalance;
  onRefresh: () => void;
  tokenSymbol?: string;
}

export function EphemeralPanel({ enabled, onToggle, balances, onRefresh, tokenSymbol = "SOL" }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass rounded-xl overflow-hidden" style={{ border: "1px solid rgba(168,85,247,0.2)" }}>
      <button
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-purple-400" />
          <span className="text-xs font-semibold text-purple-400 tracking-wider">EPHEMERAL LAYER</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">
            MagicBlock
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all font-mono border ${
              enabled
                ? "bg-purple-500/15 text-purple-400 border-purple-500/30 hover:border-purple-500/50"
                : "bg-white/5 text-slate-500 border-white/10 hover:border-white/20"
            }`}
          >
            {enabled ? "ON" : "OFF"}
          </button>
          {expanded ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-white/5 space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Routes your swap through MagicBlock&apos;s ephemeral rollup layer — breaks the on-chain
            transaction graph for enhanced privacy, with near-instant settlement.
          </p>

          {/* Balance display */}
          <div className="grid grid-cols-2 gap-2">
            <BalanceCard
              label="Base Layer"
              value={balances.baseBalance}
              symbol={tokenSymbol}
              loading={balances.isLoading}
              color="slate"
            />
            <BalanceCard
              label="Ephemeral"
              value={balances.ephemeralBalance}
              symbol={tokenSymbol}
              loading={balances.isLoading}
              color="purple"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={balances.isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all disabled:opacity-40"
            >
              <RefreshCw size={11} className={balances.isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <ArrowUpDown size={11} className="text-purple-400" />
              <span className="text-xs text-slate-500">Auto-delegated on swap</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-1">
            {[
              "SPL token delegation via ephemeral rollup",
              "Transfer queue auto-cranking",
              "On-chain graph obfuscation",
            ].map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-purple-400" />
                <span className="text-xs text-slate-500">{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BalanceCard({
  label, value, symbol, loading, color,
}: {
  label: string;
  value: number | null;
  symbol: string;
  loading: boolean;
  color: "slate" | "purple";
}) {
  const colorMap = {
    slate: { bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-300", label: "text-slate-500" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-300", label: "text-purple-500" },
  };
  const c = colorMap[color];

  return (
    <div className={`rounded-xl p-2.5 ${c.bg} border ${c.border}`}>
      <div className={`text-xs mb-1 ${c.label}`}>{label}</div>
      <div className={`text-sm font-mono font-semibold ${c.text}`}>
        {loading ? (
          <span className="animate-pulse text-slate-600">...</span>
        ) : value !== null ? (
          `${value.toFixed(4)} ${symbol}`
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </div>
    </div>
  );
}
