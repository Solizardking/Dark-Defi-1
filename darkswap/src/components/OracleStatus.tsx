"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, AlertTriangle, Activity } from "lucide-react";
import type { OracleValidation } from "@/types";

interface Props {
  oracle:   OracleValidation | null;
  loading:  boolean;
  enabled:  boolean;
  onToggle: () => void;
}

export function OracleStatus({ oracle, loading, enabled, onToggle }: Props) {
  const approved = oracle?.approved ?? null;

  return (
    <div className="glass neon-border-cyan rounded-xl p-3 overflow-hidden">
      <OracleHeader loading={loading} enabled={enabled} oracle={oracle} approved={approved} onToggle={onToggle} />
      <AnimatePresence mode="wait">
        {enabled && <OracleBody key="body" oracle={oracle} loading={loading} />}
      </AnimatePresence>
    </div>
  );
}

function OracleHeader({ loading, enabled, oracle, approved, onToggle }: {
  loading: boolean; enabled: boolean; oracle: OracleValidation | null;
  approved: boolean | null; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <motion.div animate={{ rotate: loading ? 360 : 0 }} transition={{ duration: 1, repeat: loading ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}>
          <Activity size={13} className={loading ? "text-cyan-400" : "text-cyan-500"} />
        </motion.div>
        <span className="text-[10px] font-bold text-cyan-400 tracking-widest">ORACLE</span>
        {enabled && !loading && oracle && (
          <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            className={`text-[8px] px-1.5 py-0.5 rounded border font-bold tracking-wider ${
              approved ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"
            }`}
          >
            {approved ? "✓ VALID" : "✗ BLOCKED"}
          </motion.span>
        )}
      </div>
      <motion.button whileTap={{ scale: 0.92 }} onClick={onToggle}
        className={`text-[10px] px-2.5 py-1 rounded-lg transition-all font-mono border ${
          enabled ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:border-cyan-500/50"
                  : "bg-white/5 text-slate-500 border-white/10 hover:border-white/20"
        }`}
      >
        {enabled ? "ON" : "OFF"}
      </motion.button>
    </div>
  );
}

function OracleBody({ oracle, loading }: { oracle: OracleValidation | null; loading: boolean }) {
  const deviationColor = !oracle ? "text-slate-500"
    : oracle.deviation < 1 ? "text-green-400"
    : oracle.deviation < 2 ? "text-amber-400"
    : "text-red-400";

  if (loading) return (
    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: i * 0.15 }}
        />
      ))}
      <span className="text-[10px] text-slate-500">Validating prices…</span>
    </motion.div>
  );

  if (!oracle) return (
    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 py-1">
      <AlertTriangle size={11} className="text-amber-400" />
      <span className="text-[10px] text-amber-400">Awaiting quote</span>
    </motion.div>
  );

  return (
    <motion.div key="data" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="space-y-1">
      <OracleRow label="Deviation"  value={`${oracle.deviation.toFixed(2)}%`} valueClass={deviationColor} />
      {oracle.inputOraclePrice  && <OracleRow label="Input price"  value={`$${oracle.inputOraclePrice.toFixed(4)}`}  />}
      {oracle.outputOraclePrice && <OracleRow label="Output price" value={`$${oracle.outputOraclePrice.toFixed(4)}`} />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/5">
        {oracle.approved ? <ShieldCheck size={11} className="text-green-400 shrink-0" /> : <ShieldAlert size={11} className="text-red-400 shrink-0" />}
        <span className={`text-[10px] ${oracle.approved ? "text-green-400" : "text-red-400"}`}>{oracle.message}</span>
      </motion.div>
    </motion.div>
  );
}

function OracleRow({ label, value, valueClass = "text-slate-300" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-slate-500">{label}</span>
      <motion.span
        key={value}
        initial={{ opacity: 0, x: 4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
        className={`text-[10px] font-mono font-semibold ${valueClass}`}
      >
        {value}
      </motion.span>
    </div>
  );
}
