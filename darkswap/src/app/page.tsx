"use client";

import { motion } from "framer-motion";
import { Shield, Activity, Zap, Lock } from "lucide-react";
import { DarkSwap } from "@/components/DarkSwap";
import { ParticleField, AmbientOrbs } from "@/components/ParticleField";
import { LiveTicker } from "@/components/LiveTicker";

/* ── Stagger container variants ─────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ── Feature cards data ─────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "🔮",
    emoji_bg: "from-cyan-500/10 to-blue-500/10",
    border: "border-cyan-500/15 hover:border-cyan-500/35",
    glow: "hover:shadow-[0_0_30px_rgba(0,245,255,0.08)]",
    title: "Multi-Oracle",
    desc: "Birdeye + Jupiter price validation blocks front-running",
    badge: "LIVE",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: "🛡️",
    emoji_bg: "from-green-500/10 to-emerald-500/10",
    border: "border-green-500/15 hover:border-green-500/35",
    glow: "hover:shadow-[0_0_30px_rgba(0,255,136,0.08)]",
    title: "Token Safety",
    desc: "Jupiter Shield risk scoring on every token",
    badge: "ACTIVE",
    badgeColor: "text-green-400 bg-green-500/10 border-green-500/20",
  },
  {
    icon: "⚡",
    emoji_bg: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-500/15 hover:border-amber-500/35",
    glow: "hover:shadow-[0_0_30px_rgba(255,170,0,0.08)]",
    title: "MEV Resist",
    desc: "Private TX pipeline — front-runners can't see your swap",
    badge: "ON",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: "🔵",
    emoji_bg: "from-purple-500/10 to-pink-500/10",
    border: "border-purple-500/15 hover:border-purple-500/35",
    glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]",
    title: "Ephemeral",
    desc: "MagicBlock rollup breaks the on-chain tx graph",
    badge: "BETA",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: "🌑",
    emoji_bg: "from-slate-500/10 to-zinc-500/10",
    border: "border-slate-500/15 hover:border-slate-500/35",
    glow: "hover:shadow-[0_0_30px_rgba(100,116,139,0.08)]",
    title: "Zcash Pool",
    desc: "Sapling shielded notes — commitment tree on Solana",
    badge: "MAINNET",
    badgeColor: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  },
  {
    icon: "🔗",
    emoji_bg: "from-blue-500/10 to-indigo-500/10",
    border: "border-blue-500/15 hover:border-blue-500/35",
    glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]",
    title: "Open SDK",
    desc: "@openclawdsol/dark-protocol-sdk — plug into any dApp",
    badge: "NPM",
    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
] as const;

const STAT_ITEMS = [
  { value: "E8zL7h9q", label: "Program ID", sub: "Solana Mainnet" },
  { value: "0.3.1",    label: "SDK Version", sub: "@openclawdsol" },
  { value: "< 400ms",  label: "Quote Time",  sub: "Multi-oracle avg" },
  { value: "100%",     label: "Open Source", sub: "MIT License" },
];

export default function SwapPage() {
  return (
    <main className="relative min-h-screen grid-bg flex flex-col overflow-x-hidden">
      {/* ── Animated background layers ─────────────────────────── */}
      <ParticleField />
      <AmbientOrbs />

      {/* ── Live price ticker ──────────────────────────────────── */}
      <div className="relative z-20">
        <LiveTicker />
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y:   0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-40 nav-glow"
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <motion.span
              className="text-xl"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              🌑
            </motion.span>
            <span className="text-sm font-bold gradient-text-cyan tracking-widest anim-flicker">
              DARK PROTOCOL
            </span>
          </div>

          {/* Status pills */}
          <div className="hidden sm:flex items-center gap-3">
            <NavPill icon={<Shield size={10} />}   label="ZK Privacy" color="cyan"   />
            <NavPill icon={<Activity size={10} />}  label="Oracle"     color="purple" />
            <NavPill icon={<Zap size={10} />}       label="MEV Shield" color="green"  />
            <NavPill icon={<Lock size={10} />}      label="Mainnet"    color="amber"  />
          </div>
        </div>
      </motion.nav>

      {/* ── Hero section ───────────────────────────────────────── */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="text-center pt-14 pb-10 px-4 relative z-10"
      >
        {/* Tag line */}
        <motion.div variants={item} className="inline-flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full border border-cyan-500/25 bg-cyan-500/8 text-[10px] text-cyan-400 tracking-widest font-semibold uppercase">
            ✦ Cypherpunk DeFi · Built on Solana
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="text-4xl sm:text-5xl font-black gradient-text-cyan mb-3 leading-tight"
        >
          Swap in the Dark.
        </motion.h1>
        <motion.p
          variants={item}
          className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed"
        >
          Oracle-validated · MEV-shielded · Zcash shielded notes · MagicBlock ephemeral rollup
        </motion.p>

        {/* Floating stat bar */}
        <motion.div
          variants={item}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          {STAT_ITEMS.map((s) => (
            <StatChip key={s.label} {...s} />
          ))}
        </motion.div>
      </motion.section>

      {/* ── Swap card ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center px-4 pb-16 relative z-10">
        <div className="w-full max-w-md">
          <DarkSwap />
        </div>
      </div>

      {/* ── Feature grid ───────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-5xl mx-auto w-full px-4 pb-20 relative z-10"
      >
        <div className="text-center mb-8">
          <p className="text-[10px] text-slate-600 tracking-widest uppercase font-semibold">
            ── Protocol Stack ──
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
            >
              <FeatureCard {...f} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 border-t border-white/5 py-8 text-center px-4"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-3">
          {["Jupiter", "Birdeye", "MagicBlock", "Helius", "Solana"].map((name) => (
            <span key={name} className="text-xs text-slate-600 hover:text-slate-400 transition-colors cursor-default">
              {name}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-slate-700 tracking-widest uppercase">
          Dark Swap v1.0 · Open Source · MIT License
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
          <span className="text-[10px] text-slate-600">Mainnet live</span>
        </div>
      </motion.footer>
    </main>
  );
}

/* ── NavPill ─────────────────────────────────────────────────────── */
function NavPill({
  icon, label, color,
}: {
  icon: React.ReactNode;
  label: string;
  color: "cyan" | "purple" | "green" | "amber";
}) {
  const map = {
    cyan:   "text-cyan-400   bg-cyan-500/8   border-cyan-500/20",
    purple: "text-purple-400 bg-purple-500/8 border-purple-500/20",
    green:  "text-green-400  bg-green-500/8  border-green-500/20",
    amber:  "text-amber-400  bg-amber-500/8  border-amber-500/20",
  };
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold tracking-wider ${map[color]}`}
    >
      <span className="pulse-dot-fast">{icon}</span>
      {label}
    </motion.div>
  );
}

/* ── StatChip ────────────────────────────────────────────────────── */
function StatChip({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -2 }}
      className="glass neon-border-cyan rounded-xl px-4 py-2.5 text-center cursor-default"
    >
      <div className="text-sm font-black gradient-text-cyan font-mono">{value}</div>
      <div className="text-[10px] text-slate-300 font-semibold mt-0.5">{label}</div>
      <div className="text-[9px] text-slate-600 mt-0.5 tracking-wider">{sub}</div>
    </motion.div>
  );
}

/* ── FeatureCard ─────────────────────────────────────────────────── */
function FeatureCard({
  icon, emoji_bg, border, glow, title, desc, badge, badgeColor,
}: {
  icon: string;
  emoji_bg: string;
  border: string;
  glow: string;
  title: string;
  desc: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`feature-card glass rounded-xl p-4 flex flex-col gap-2 border transition-all ${border} ${glow}`}
    >
      {/* Emoji in gradient bubble */}
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${emoji_bg} flex items-center justify-center text-lg`}>
        {icon}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-200">{title}</div>
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-wider ${badgeColor}`}>
          {badge}
        </span>
      </div>

      <div className="text-[10px] text-slate-600 leading-relaxed">{desc}</div>
    </motion.div>
  );
}
