"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Loader2, XCircle, Zap, Shield, Send, Eye } from "lucide-react";
import type { SwapStatus } from "@/types";

interface Step {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: "quoting",
    label: "Fetching Quote",
    sublabel: "Jupiter aggregator + oracle validation",
    icon: <Eye size={14} />,
  },
  {
    id: "signing",
    label: "Sign Transaction",
    sublabel: "Approve in your wallet",
    icon: <Shield size={14} />,
  },
  {
    id: "sending",
    label: "Sending Transaction",
    sublabel: "Broadcasting to Solana network",
    icon: <Send size={14} />,
  },
  {
    id: "confirming",
    label: "Confirming",
    sublabel: "Waiting for block confirmation",
    icon: <Zap size={14} />,
  },
];

const BURST_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  color: i % 3 === 0 ? "#00f5ff" : i % 3 === 1 ? "#a855f7" : "#00ff88",
  angle: (i / 20) * 360,
  distance: 44 + ((i * 37) % 56),
  delay: ((i * 13) % 10) / 100,
  size: 3 + (i % 5),
}));

type ProgressStep = "idle" | "quoting" | "signing" | "sending" | "confirming" | "success" | "error";

interface Props {
  status: SwapStatus;
  progressStep: ProgressStep;
  error: string | null;
  txSignature: string | null;
}

export function SwapProgress({ status, progressStep, error, txSignature }: Props) {
  const isActive = status === "swapping" || progressStep === "confirming";
  const isDone = status === "success";
  const isFailed = status === "error" && progressStep !== "idle";

  const activeIdx = STEPS.findIndex((s) => s.id === progressStep);

  if (!isActive && !isDone && !isFailed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mt-3 p-3 rounded-xl border border-white/8 bg-black/20 space-y-2 overflow-hidden relative"
      >
        {/* Background pulse strip */}
        {isActive && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.03, 0.07, 0.03] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "linear-gradient(135deg, rgba(0,245,255,0.05), rgba(168,85,247,0.05))",
            }}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            {isDone ? "Swap Complete" : isFailed ? "Swap Failed" : "Swap Progress"}
          </span>
          {isDone && (
            <span className="text-[10px] text-green-400 font-mono">✓ Confirmed</span>
          )}
          {isFailed && (
            <span className="text-[10px] text-red-400 font-mono">✗ Failed</span>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-1.5">
          {STEPS.map((step, i) => {
            const isStepDone = isDone || (activeIdx > i);
            const isStepActive = !isDone && !isFailed && activeIdx === i && isActive;
            const isStepFailed = isFailed && activeIdx === i;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.2 }}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all ${
                  isStepActive
                    ? "bg-cyan-500/8 border border-cyan-500/15"
                    : isStepDone
                    ? "bg-green-500/5"
                    : isStepFailed
                    ? "bg-red-500/8 border border-red-500/15"
                    : "opacity-30"
                }`}
              >
                {/* Icon */}
                <div
                  className={`shrink-0 w-5 h-5 flex items-center justify-center rounded-full ${
                    isStepDone
                      ? "text-green-400"
                      : isStepActive
                      ? "text-cyan-400"
                      : isStepFailed
                      ? "text-red-400"
                      : "text-slate-600"
                  }`}
                >
                  {isStepDone ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <CheckCircle2 size={14} />
                    </motion.div>
                  ) : isStepActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 size={14} />
                    </motion.div>
                  ) : isStepFailed ? (
                    <XCircle size={14} />
                  ) : (
                    <Circle size={14} />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-semibold truncate ${
                      isStepDone
                        ? "text-green-400"
                        : isStepActive
                        ? "text-cyan-300"
                        : isStepFailed
                        ? "text-red-400"
                        : "text-slate-600"
                    }`}
                  >
                    {step.label}
                  </div>
                  {isStepActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-[10px] text-slate-500 truncate mt-0.5"
                    >
                      {step.sublabel}
                    </motion.div>
                  )}
                </div>

                {/* Active pulse bar */}
                {isStepActive && (
                  <motion.div
                    className="w-12 h-0.5 rounded-full bg-cyan-500/30 overflow-hidden shrink-0"
                  >
                    <motion.div
                      className="h-full bg-cyan-400 rounded-full"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                )}

                {/* Done timestamp effect */}
                {isStepDone && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[9px] font-mono text-green-500/60 shrink-0"
                  >
                    ✓
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Error message */}
        {isFailed && error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-2 py-1.5 rounded-lg bg-red-500/8 border border-red-500/15"
          >
            <p className="text-[10px] text-red-400 font-mono break-all">{error}</p>
          </motion.div>
        )}

        {/* Success tx link */}
        {isDone && txSignature && (
          <motion.a
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            href={`https://solscan.io/tx/${txSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-500/8 border border-green-500/20 text-[10px] text-green-400 hover:text-green-300 transition-colors font-mono"
          >
            🔗 View on Solscan → {txSignature.slice(0, 8)}...{txSignature.slice(-6)}
          </motion.a>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* Burst of particles on success */
export function SuccessBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {BURST_PARTICLES.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: p.delay }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: p.color,
              boxShadow: `0 0 6px ${p.color}`,
            }}
          />
        );
      })}
    </div>
  );
}
