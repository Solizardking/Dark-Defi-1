"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { TokenLogo } from "./TokenLogo";
import { POPULAR_TOKENS } from "@/lib/tokens";
import type { Token } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  excludeMint?: string;
}

export function TokenModal({ open, onClose, onSelect, excludeMint }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Token[]>(POPULAR_TOKENS);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults(POPULAR_TOKENS.filter((t) => t.address !== excludeMint));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/tokens?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(
        (Array.isArray(data) ? data : POPULAR_TOKENS).filter(
          (t: Token) => t.address !== excludeMint
        )
      );
    } catch {
      setResults(POPULAR_TOKENS.filter((t) => t.address !== excludeMint));
    } finally {
      setLoading(false);
    }
  }, [excludeMint]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    if (!open) return undefined;

    const id = setTimeout(() => {
      setQuery("");
      setResults(POPULAR_TOKENS.filter((t) => t.address !== excludeMint));
    }, 0);

    return () => clearTimeout(id);
  }, [open, excludeMint]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,3,8,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md glass neon-border-cyan rounded-2xl overflow-hidden"
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/10">
          <h2 className="text-sm font-semibold gradient-text-cyan tracking-wider">
            SELECT TOKEN
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              autoFocus
              type="text"
              placeholder="Search token name or address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
            />
          </div>
        </div>

        {/* Token list */}
        <div className="overflow-y-auto" style={{ maxHeight: "50vh" }}>
          {loading && (
            <div className="flex items-center justify-center py-8 text-xs text-slate-500">
              <span className="animate-pulse">Searching...</span>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="flex items-center justify-center py-8 text-xs text-slate-500">
              No tokens found
            </div>
          )}
          {!loading &&
            results.map((token) => (
              <button
                key={token.address}
                onClick={() => { onSelect(token); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left group"
              >
                <TokenLogo logoURI={token.logoURI} symbol={token.symbol} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {token.symbol}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{token.name}</div>
                </div>
                <div className="text-xs text-slate-600 font-mono shrink-0">
                  {token.address.slice(0, 4)}...{token.address.slice(-4)}
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
