"use client";

import { Shield, Eye, Zap } from "lucide-react";

interface Props {
  shieldEnabled: boolean;
  oracleEnabled: boolean;
  onShieldToggle: () => void;
  onOracleToggle: () => void;
}

export function PrivacyBar({ shieldEnabled, oracleEnabled, onShieldToggle, onOracleToggle }: Props) {
  return (
    <div className="mt-3">
      {/* Toggle row */}
      <div className="flex items-center gap-2 mb-3">
        <ToggleChip
          icon={<Shield size={12} />}
          label="ZK Shield"
          active={shieldEnabled}
          onClick={onShieldToggle}
          color="cyan"
        />
        <ToggleChip
          icon={<Eye size={12} />}
          label="Oracle"
          active={oracleEnabled}
          onClick={onOracleToggle}
          color="purple"
        />
      </div>

      {/* Status footer */}
      <div className="flex items-center justify-center gap-4 py-2 border-t border-white/5">
        <StatusDot color="green" label="MEV Protected" active />
        <StatusDot color="cyan" label="Oracle Validated" active={oracleEnabled} />
        <StatusDot color="purple" label="Zcash Privacy" active={shieldEnabled} />
      </div>
      <div className="text-center mt-1">
        <span className="text-xs text-slate-600 tracking-widest uppercase">
          Powered by Dark Protocol
        </span>
      </div>
    </div>
  );
}

function ToggleChip({
  icon, label, active, onClick, color,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  color: "cyan" | "purple";
}) {
  const activeStyles =
    color === "cyan"
      ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:border-cyan-500/50"
      : "bg-purple-500/15 text-purple-400 border-purple-500/30 hover:border-purple-500/50";
  const inactiveStyles = "bg-white/5 text-slate-500 border-white/10 hover:border-white/20";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wider transition-all ${
        active ? activeStyles : inactiveStyles
      }`}
    >
      {icon}
      {label}
      <span className={`text-xs ${active ? "opacity-100" : "opacity-40"}`}>
        {active ? "ON" : "OFF"}
      </span>
    </button>
  );
}

function StatusDot({ color, label, active }: { color: string; label: string; active: boolean }) {
  const dotColors: Record<string, string> = {
    green: "bg-green-400",
    cyan: "bg-cyan-400",
    purple: "bg-purple-400",
  };
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-1.5 h-1.5 rounded-full pulse-dot ${
          active ? dotColors[color] : "bg-slate-600"
        }`}
      />
      <span className={`text-xs ${active ? "text-slate-400" : "text-slate-600"}`}>
        {label}
      </span>
    </div>
  );
}
