"use client";

import { ShieldCheck, ShieldAlert, AlertTriangle, Activity } from "lucide-react";
import type { OracleValidation } from "@/types";

interface Props {
  oracle: OracleValidation | null;
  loading: boolean;
  enabled: boolean;
  onToggle: () => void;
}

export function OracleStatus({ oracle, loading, enabled, onToggle }: Props) {
  const deviationColor =
    !oracle ? "text-slate-500"
    : oracle.deviation < 1 ? "text-green-400"
    : oracle.deviation < 2 ? "text-amber-400"
    : "text-red-400";

  return (
    <div className="glass neon-border-cyan rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-400 tracking-wider">ORACLE</span>
        </div>
        <button
          onClick={onToggle}
          className={`text-xs px-2.5 py-1 rounded-lg transition-all font-mono ${
            enabled
              ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50"
              : "bg-white/5 text-slate-500 border border-white/10 hover:border-white/20"
          }`}
        >
          {enabled ? "ON" : "OFF"}
        </button>
      </div>

      {enabled && (
        <div className="space-y-1">
          {loading && (
            <div className="text-xs text-slate-500 animate-pulse">Validating prices...</div>
          )}
          {!loading && oracle && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Deviation</span>
                <span className={`text-xs font-mono font-semibold ${deviationColor}`}>
                  {oracle.deviation.toFixed(2)}%
                </span>
              </div>
              {oracle.inputOraclePrice && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Input price</span>
                  <span className="text-xs font-mono text-slate-300">
                    ${oracle.inputOraclePrice.toFixed(4)}
                  </span>
                </div>
              )}
              {oracle.outputOraclePrice && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Output price</span>
                  <span className="text-xs font-mono text-slate-300">
                    ${oracle.outputOraclePrice.toFixed(4)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/5">
                {oracle.approved ? (
                  <ShieldCheck size={11} className="text-green-400 shrink-0" />
                ) : (
                  <ShieldAlert size={11} className="text-red-400 shrink-0" />
                )}
                <span className={`text-xs ${oracle.approved ? "text-green-400" : "text-red-400"}`}>
                  {oracle.message}
                </span>
              </div>
            </>
          )}
          {!loading && !oracle && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={11} className="text-amber-400" />
              <span className="text-xs text-amber-400">Awaiting quote</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
