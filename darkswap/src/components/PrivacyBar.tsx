"use client";

import { motion } from "framer-motion";
import { Shield, Eye } from "lucide-react";

interface Props {
  shieldEnabled: boolean;
  oracleEnabled: boolean;
  onShieldToggle: () => void;
  onOracleToggle: () => void;
}

export function PrivacyBar({ shieldEnabled, oracleEnabled, onShieldToggle, onOracleToggle }: Props) {
  return (
    <div className="mt-3">
      {/* Toggle chips */}
      <div className="flex items-center gap-2 mb-3">
        <ToggleChip icon={<Shield size={11} />} label="ZK Shield" active={shieldEnabled} onClick={onShieldToggle} color="cyan"   />
        <ToggleChip icon={<Eye    size={11} />} label="Oracle"    active={oracleEnabled} onClick={onOracleToggle} color="purple" />
      </div>

      {/* Status footer */}
      <div className="flex items-center justify-center gap-5 py-2 border-t border-white/5">
        <StatusDot color="green"  label="MEV Protected"    active />
        <StatusDot color="cyan"   label="Oracle Validated" active={oracleEnabled}  />
        <StatusDot color="purple" label="Zcash Privacy"    active={shieldEnabled} />
      </div>

      <div className="text-center mt-1.5">
        <span className="text-[9px] text-slate-700 tracking-widest uppercase">
          Powered by Dark Protocol
        </span>
      </div>
    </div>
  );
}

function ToggleChip({ icon, label, active, onClick, color }: {
  icon: React.ReactNode; label: string; active: boolean;
  onClick: () => void; color: "cyan" | "purple";
}) {
  const on  = color === "cyan"
    ? "bg-cyan-500/12 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(0,245,255,0.1)]"
    : "bg-purple-500/12 text-purple-400 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.1)]";
  const off = "bg-white/5 text-slate-500 border-white/10";

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-semibold tracking-wider transition-all ${active ? on : off}`}
    >
      <motion.span
        animate={{ scale: active ? 1 : 0.8, opacity: active ? 1 : 0.5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {icon}
      </motion.span>
      {label}
      <motion.span
        animate={{ opacity: active ? 1 : 0.35 }}
        className="font-mono text-[9px]"
      >
        {active ? "ON" : "OFF"}
      </motion.span>
    </motion.button>
  );
}

function StatusDot({ color, label, active }: { color: string; label: string; active: boolean }) {
  const dots: Record<string, string> = {
    green:  "bg-green-400  shadow-[0_0_6px_rgba(0,255,136,0.6)]",
    cyan:   "bg-cyan-400   shadow-[0_0_6px_rgba(0,245,255,0.6)]",
    purple: "bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]",
  };

  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        animate={{ opacity: active ? 1 : 0.2, scale: active ? 1 : 0.7 }}
        transition={{ duration: 0.25 }}
        className={`w-1.5 h-1.5 rounded-full ${active ? dots[color] : "bg-slate-600"} ${active ? "pulse-dot" : ""}`}
      />
      <motion.span
        animate={{ opacity: active ? 1 : 0.3 }}
        className={`text-[9px] tracking-wide ${active ? "text-slate-400" : "text-slate-600"}`}
      >
        {label}
      </motion.span>
    </div>
  );
}
