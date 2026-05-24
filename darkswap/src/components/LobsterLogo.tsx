"use client";

import { motion } from "framer-motion";

const CLAWD_MINT = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump";

// ── Animated cypherpunk lobster ────────────────────────────────────────────────

export function LobsterLogo({ size = 48 }: { size?: number }) {
  const scale = size / 48;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 6px #ff3b3b88) drop-shadow(0 0 12px #00f5ff44)" }}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff4444" />
          <stop offset="100%" stopColor="#8b0000" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Left antenna ── */}
      <motion.path
        d="M16 10 Q12 4 8 2"
        stroke="#00f5ff"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
        style={{ transformOrigin: "16px 10px" }}
      />
      {/* ── Right antenna ── */}
      <motion.path
        d="M32 10 Q36 4 40 2"
        stroke="#00f5ff"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={{ rotate: [8, -8, 8] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        style={{ transformOrigin: "32px 10px" }}
      />

      {/* ── Body ── */}
      <ellipse cx="24" cy="26" rx="10" ry="13" fill="url(#bodyGrad)" stroke="#ff6666" strokeWidth="0.8" filter="url(#glow)" />

      {/* ── Shell segments ── */}
      <path d="M14 22 Q24 19 34 22" stroke="#ff8888" strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d="M14 26 Q24 23 34 26" stroke="#ff8888" strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d="M15 30 Q24 27 33 30" stroke="#ff8888" strokeWidth="0.6" fill="none" opacity="0.7" />

      {/* ── Head ── */}
      <ellipse cx="24" cy="14" rx="7" ry="6" fill="url(#bodyGrad)" stroke="#ff6666" strokeWidth="0.8" filter="url(#glow)" />

      {/* ── Eyes ── */}
      <circle cx="20.5" cy="13" r="1.8" fill="#0a0a0a" stroke="#00f5ff" strokeWidth="0.8" />
      <circle cx="27.5" cy="13" r="1.8" fill="#0a0a0a" stroke="#00f5ff" strokeWidth="0.8" />
      <motion.circle
        cx="20.5" cy="13" r="0.7"
        fill="#00f5ff"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0 }}
      />
      <motion.circle
        cx="27.5" cy="13" r="0.7"
        fill="#00f5ff"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
      />

      {/* ── Left claw (snapping) ── */}
      <motion.g
        animate={{ rotate: [-6, 6, -6] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "10px 22px" }}
      >
        <path d="M14 22 Q8 18 6 14" stroke="#cc2200" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#glow)" />
        {/* claw top */}
        <path d="M6 14 Q3 11 4 8" stroke="#ff4444" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        {/* claw bottom */}
        <path d="M6 14 Q2 14 3 17" stroke="#ff4444" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </motion.g>

      {/* ── Right claw (snapping, offset phase) ── */}
      <motion.g
        animate={{ rotate: [6, -6, 6] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        style={{ transformOrigin: "38px 22px" }}
      >
        <path d="M34 22 Q40 18 42 14" stroke="#cc2200" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#glow)" />
        <path d="M42 14 Q45 11 44 8" stroke="#ff4444" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M42 14 Q46 14 45 17" stroke="#ff4444" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </motion.g>

      {/* ── Legs (3 per side, wiggling) ── */}
      {[-2, 0, 2].map((offset, i) => (
        <motion.g key={`legL${i}`}
          animate={{ rotate: [offset - 4, offset + 4, offset - 4] }}
          transition={{ duration: 0.8 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
          style={{ transformOrigin: "14px " + (27 + i * 4) + "px" }}
        >
          <line x1="14" y1={27 + i * 4} x2="8" y2={31 + i * 4} stroke="#cc3300" strokeWidth="1.2" strokeLinecap="round" />
        </motion.g>
      ))}
      {[-2, 0, 2].map((offset, i) => (
        <motion.g key={`legR${i}`}
          animate={{ rotate: [-(offset - 4), -(offset + 4), -(offset - 4)] }}
          transition={{ duration: 0.8 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 + 0.1 }}
          style={{ transformOrigin: "34px " + (27 + i * 4) + "px" }}
        >
          <line x1="34" y1={27 + i * 4} x2="40" y2={31 + i * 4} stroke="#cc3300" strokeWidth="1.2" strokeLinecap="round" />
        </motion.g>
      ))}

      {/* ── Tail fan ── */}
      <path d="M24 39 Q18 44 14 46" stroke="#cc2200" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M24 39 Q24 45 24 47" stroke="#cc2200" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M24 39 Q30 44 34 46" stroke="#cc2200" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M24 39 Q21 43 20 46" stroke="#ff4444" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M24 39 Q27 43 28 46" stroke="#ff4444" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* ── Neon cyan accent lines (cypherpunk grid) ── */}
      <motion.line
        x1="12" y1="26" x2="14" y2="26"
        stroke="#00f5ff" strokeWidth="0.8" opacity="0.6"
        animate={{ opacity: [0.6, 0.1, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
      />
      <motion.line
        x1="34" y1="26" x2="36" y2="26"
        stroke="#00f5ff" strokeWidth="0.8" opacity="0.6"
        animate={{ opacity: [0.6, 0.1, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.8 }}
      />

      {/* ── Glitch scanline ── */}
      <motion.rect
        x="12" y="0" width="24" height="1"
        fill="#00f5ff" opacity="0"
        animate={{ opacity: [0, 0.15, 0], y: [10, 38, 10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* ── Scale indicator ── used only to satisfy the prop (invisible) */}
      <text x="0" y="0" fontSize="0" fill="none">{scale}</text>
    </motion.svg>
  );
}

// ── Buy CLAWD button ───────────────────────────────────────────────────────────

export function BuyClawdButton() {
  const jupUrl = `https://jup.ag/swap/SOL-${CLAWD_MINT}`;
  const pumpUrl = `https://pump.fun/coin/${CLAWD_MINT}`;

  return (
    <motion.div className="flex items-center gap-1.5">
      <motion.a
        href={jupUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase
          bg-gradient-to-r from-red-900/60 to-red-800/40 border border-red-500/40
          text-red-300 hover:text-red-200 hover:border-red-400/60
          shadow-[0_0_10px_rgba(255,60,60,0.2)] hover:shadow-[0_0_16px_rgba(255,60,60,0.35)]
          transition-all duration-200"
        title="Buy $CLAWD on Jupiter"
      >
        <span className="text-base leading-none">🦞</span>
        <span>BUY CLAWD</span>
      </motion.a>
      <motion.a
        href={pumpUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center px-1.5 py-1 rounded-lg text-[10px] font-bold
          bg-white/5 border border-white/10 text-slate-500
          hover:text-purple-400 hover:border-purple-500/30
          transition-all duration-200"
        title="View on pump.fun"
      >
        pump
      </motion.a>
    </motion.div>
  );
}
