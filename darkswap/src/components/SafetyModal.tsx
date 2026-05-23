"use client";

import { AlertTriangle, X, ShieldAlert, ShieldCheck, Flame } from "lucide-react";
import type { SafetyCheck } from "@/types";

interface Props {
  safety: SafetyCheck | null;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LEVEL_COLORS = {
  low: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", Icon: ShieldCheck },
  medium: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", Icon: AlertTriangle },
  high: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", Icon: ShieldAlert },
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", Icon: Flame },
};

export function SafetyModal({ safety, open, onConfirm, onCancel }: Props) {
  if (!open || !safety) return null;

  const level = safety.overallLevel;
  const { bg, border, text, Icon } = LEVEL_COLORS[level];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,3,8,0.9)", backdropFilter: "blur(10px)" }}
    >
      <div className="w-full max-w-md glass rounded-2xl overflow-hidden" style={{ border: `1px solid rgba(255,80,80,0.3)` }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-sm font-semibold text-red-400 tracking-wider">
              RISK WARNING
            </span>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Risks */}
        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
          {safety.risks.filter((r) => r.warnings.length > 0).map((risk) => {
            const c = LEVEL_COLORS[risk.level];
            const RiskIcon = c.Icon;
            return (
              <div key={risk.mint} className={`rounded-xl p-3 ${c.bg} border ${c.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <RiskIcon size={13} className={c.text} />
                  <span className={`text-xs font-semibold ${c.text}`}>
                    {risk.symbol} — {risk.level.toUpperCase()} RISK
                  </span>
                </div>
                <ul className="space-y-1">
                  {risk.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Cancel Swap
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 hover:border-amber-500/50 transition-all"
          >
            I Understand, Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
