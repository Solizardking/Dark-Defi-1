"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown, ChevronDown, Settings, RefreshCw,
  Loader2, CheckCircle2, AlertTriangle, ExternalLink,
} from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction, type Connection } from "@solana/web3.js";
import toast from "react-hot-toast";

import { TokenLogo } from "./TokenLogo";
import { TokenModal } from "./TokenModal";
import { OracleStatus } from "./OracleStatus";
import { SafetyModal } from "./SafetyModal";
import { PrivacyBar } from "./PrivacyBar";
import { EphemeralPanel } from "./EphemeralPanel";
import { ShieldedWalletPanel } from "./ShieldedWalletPanel";
import { SwapHistoryPanel } from "./SwapHistoryPanel";
import { SwapProgress, SuccessBurst } from "./SwapProgress";
import { LobsterLogo, BuyClawdButton } from "./LobsterLogo";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

import { WSOL, USDC, formatAmount, parseAmount } from "@/lib/tokens";
import type {
  Token,
  SwapState,
  QuoteApiResponse,
  SwapApiResponse,
  ExecuteApiResponse,
  ProgressStep,
  RecordedSwapInput,
} from "@/types";

const SLIPPAGE_OPTIONS = [10, 50, 100, 200];

// ── Module-level swap execution helpers ──────────────────────────────────────

async function buildSwapTx(
  inputMint: string, outputMint: string, inAmount: string,
  taker: string, slippageBps: number,
): Promise<SwapApiResponse> {
  const res = await fetch("/api/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputMint, outputMint, amount: inAmount, taker, slippageBps }),
  });
  const data: SwapApiResponse & { error?: string } = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to build swap transaction");
  return data;
}

async function executeViaJupiter(signed: VersionedTransaction, requestId: string): Promise<string> {
  const res = await fetch("/api/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      signedTransaction: Buffer.from(signed.serialize()).toString("base64"),
      requestId,
    }),
  });
  const data: ExecuteApiResponse & { error?: string } = await res.json();
  if (!res.ok || data.error || data.status !== "Success")
    throw new Error(data.error ?? `Execute failed (code ${data.code})`);
  return data.signature;
}

async function executeViaRpc(signed: VersionedTransaction, connection: Connection): Promise<string> {
  const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, maxRetries: 3 });
  const conf = await connection.confirmTransaction(sig, "confirmed");
  if (conf.value.err) throw new Error(`Transaction failed: ${JSON.stringify(conf.value.err)}`);
  return sig;
}

type RecordSwapFn = (args: RecordedSwapInput) => Promise<unknown>;

function persistSwap(fn: RecordSwapFn, sig: string, router: string, state: SwapState, walletAddress: string, ephemeralEnabled: boolean) {
  const route = state.quote?.routePlan.map((r) => r.swapInfo.label).filter(Boolean).slice(0, 3).join(" → ") ?? "";
  fn({
    walletAddress,
    inputMint: state.inputToken?.address ?? "",
    outputMint: state.outputToken?.address ?? "",
    inputSymbol: state.inputToken?.symbol ?? "",
    outputSymbol: state.outputToken?.symbol ?? "",
    inputAmount: state.inputAmount,
    outputAmount: state.outputAmount,
    txSignature: sig,
    slippageBps: state.slippageBps,
    priceImpactPct: state.quote?.priceImpactPct ?? "",
    source: router,
    route,
    privacyEnabled: state.privacyEnabled,
    ephemeralEnabled,
  }).catch(() => { /* non-critical */ });
}

export function DarkSwap() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const [state, setState] = useState<SwapState>({
    inputToken: WSOL,
    outputToken: USDC,
    inputAmount: "",
    outputAmount: "",
    slippageBps: 50,
    quote: null,
    oracleValidation: null,
    safetyCheck: null,
    privacyEnabled: true,
    oracleEnabled: true,
    safetyCheckEnabled: true,
    status: "idle",
    error: null,
    txSignature: null,
  });

  const [showTokenModal, setShowTokenModal] = useState<"input" | "output" | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [ephemeralEnabled, setEphemeralEnabled] = useState(false);
  const [ephemeralBalances, setEphemeralBalances] = useState({
    baseBalance: null as number | null,
    ephemeralBalance: null as number | null,
    isLoading: false,
  });
  const [progressStep, setProgressStep] = useState<ProgressStep>("idle");
  const [showBurst, setShowBurst] = useState(false);
  const [swapArrowFlipped, setSwapArrowFlipped] = useState(false);

  const recordSwap = useMutation(api.swaps.recordSwap);
  const quoteSourceRef = useRef<string>("jupiter");

  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quoteAbortRef = useRef<AbortController | null>(null);
  const [quoteAge, setQuoteAge] = useState(0);
  const quoteTimestampRef = useRef<number>(0);

  // ── Quote fetching (debounce 300ms for snappiness) ──────────────────
  const fetchQuote = useCallback(async (
    inputToken: Token,
    outputToken: Token,
    inputAmount: string,
    slippageBps: number,
    oracleEnabled: boolean,
    safetyCheckEnabled: boolean,
  ) => {
    quoteAbortRef.current?.abort();
    quoteAbortRef.current = null;

    if (!inputAmount || Number.parseFloat(inputAmount) <= 0) {
      quoteTimestampRef.current = 0;
      setQuoteAge(0);
      setState((s) => ({ ...s, quote: null, oracleValidation: null, outputAmount: "", status: "idle" }));
      setProgressStep("idle");
      return;
    }

    const controller = new AbortController();
    quoteAbortRef.current = controller;
    const rawAmount = parseAmount(inputAmount, inputToken.decimals);
    setState((s) => ({ ...s, status: "quoting", error: null }));
    setProgressStep("quoting");

    try {
      const params = new URLSearchParams({
        inputMint: inputToken.address,
        outputMint: outputToken.address,
        amount: rawAmount,
        slippageBps: slippageBps.toString(),
        skipOracle: (!oracleEnabled).toString(),
        skipSafety: (!safetyCheckEnabled).toString(),
      });

      const res = await fetch(`/api/quote?${params}`, { signal: controller.signal });
      const data: QuoteApiResponse & { error?: string } = await res.json();
      if (quoteAbortRef.current !== controller) return;

      if (data.error) throw new Error(data.error);

      const outAmount = formatAmount(data.quote.outAmount, outputToken.decimals);
      quoteTimestampRef.current = Date.now();
      quoteSourceRef.current = (data as QuoteApiResponse & { source?: string }).source ?? "jupiter";

      setState((s) => ({
        ...s,
        quote: data.quote,
        outputAmount: outAmount,
        oracleValidation: data.oracle,
        safetyCheck: data.safety,
        status: "ready",
        error: null,
      }));
      setProgressStep("idle");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Failed to get quote";
      setState((s) => ({ ...s, status: "error", error: msg, quote: null, outputAmount: "" }));
      setProgressStep("error");
    } finally {
      if (quoteAbortRef.current === controller) quoteAbortRef.current = null;
    }
  }, []);

  // Debounced quote on input change (300ms)
  useEffect(() => {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    quoteTimerRef.current = setTimeout(() => {
      if (state.inputToken && state.outputToken && state.inputAmount) {
        fetchQuote(
          state.inputToken, state.outputToken, state.inputAmount,
          state.slippageBps, state.oracleEnabled, state.safetyCheckEnabled,
        );
      }
    }, 300);
    return () => { if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current); };
  }, [state.inputToken, state.outputToken, state.inputAmount, state.slippageBps,
      state.oracleEnabled, state.safetyCheckEnabled, fetchQuote]);

  useEffect(() => {
    return () => quoteAbortRef.current?.abort();
  }, []);

  // Quote age counter
  useEffect(() => {
    const interval = setInterval(() => {
      if (quoteTimestampRef.current > 0)
        setQuoteAge(Math.floor((Date.now() - quoteTimestampRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSwapTokens = useCallback(() => {
    setSwapArrowFlipped((f) => !f);
    setState((s) => ({
      ...s,
      inputToken: s.outputToken,
      outputToken: s.inputToken,
      inputAmount: s.outputAmount,
      outputAmount: s.inputAmount,
      quote: null,
      oracleValidation: null,
      status: "idle",
    }));
  }, []);

  const handleInputAmountChange = useCallback((value: string) => {
    if (!/^[0-9]*\.?[0-9]*$/.test(value) && value !== "") return;
    setState((s) => ({ ...s, inputAmount: value, outputAmount: "", status: value ? "loading" : "idle" }));
  }, []);

  const handleMaxClick = useCallback(async () => {
    if (!publicKey || !state.inputToken) return;
    try {
      if (state.inputToken.address === "So11111111111111111111111111111111111111112") {
        const bal = await connection.getBalance(publicKey);
        const max = Math.max(0, (bal - 10_000_000) / 1e9);
        setState((s) => ({ ...s, inputAmount: max.toFixed(6) }));
      }
    } catch { /* silent */ }
  }, [publicKey, state.inputToken, connection]);

  const handleRefreshQuote = useCallback(() => {
    if (state.inputToken && state.outputToken && state.inputAmount)
      fetchQuote(state.inputToken, state.outputToken, state.inputAmount,
        state.slippageBps, state.oracleEnabled, state.safetyCheckEnabled);
  }, [state, fetchQuote]);

  // ── Swap execution with granular progress ───────────────────────────
  const executeSwap = useCallback(async () => {
    if (!state.quote || !publicKey || !signTransaction) return;

    setState((s) => ({ ...s, status: "swapping", error: null }));
    const toastId = toast.loading("Building transaction...");

    try {
      setProgressStep("signing");
      const swapData = await buildSwapTx(
        state.inputToken?.address ?? "",
        state.outputToken?.address ?? "",
        state.quote.inAmount,
        publicKey.toString(),
        state.slippageBps,
      );
      const { transaction, requestId, sponsored } = swapData;
      const router = swapData.router ?? quoteSourceRef.current;

      const tx = VersionedTransaction.deserialize(Buffer.from(transaction, "base64"));
      toast.loading("Sign in wallet...", { id: toastId });
      const signed = await signTransaction(tx);

      setProgressStep("sending");
      let sig: string;
      if (requestId) {
        toast.loading("Broadcasting via Jupiter...", { id: toastId });
        sig = await executeViaJupiter(signed, requestId);
      } else {
        toast.loading("Broadcasting to Solana...", { id: toastId });
        sig = await executeViaRpc(signed, connection);
      }

      setProgressStep("success");
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 1000);
      toast.success(`🌑 Swap complete via ${router}${sponsored ? " (gasless)" : ""}!`, { id: toastId, duration: 4000 });
      setState((s) => ({ ...s, status: "success", txSignature: sig, inputAmount: "", outputAmount: "", quote: null }));

      persistSwap(recordSwap, sig, router, state, publicKey.toString(), ephemeralEnabled);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Swap failed";
      toast.error(msg, { id: toastId });
      setState((s) => ({ ...s, status: "error", error: msg }));
      setProgressStep("error");
    }
  }, [state, publicKey, signTransaction, connection, recordSwap, ephemeralEnabled]);

  const handleSwapClick = useCallback(() => {
    if (!state.safetyCheck || state.safetyCheck.safe) executeSwap();
    else setShowSafetyModal(true);
  }, [state.safetyCheck, executeSwap]);

  // ── Ephemeral balance refresh ─────────────────────────────────────
  const refreshEphemeralBalances = useCallback(async () => {
    if (!publicKey) return;
    setEphemeralBalances((b) => ({ ...b, isLoading: true }));
    try {
      const bal = await connection.getBalance(publicKey);
      setEphemeralBalances({ baseBalance: bal / 1e9, ephemeralBalance: null, isLoading: false });
    } catch {
      setEphemeralBalances((b) => ({ ...b, isLoading: false }));
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (!publicKey) return undefined;

    const id = setTimeout(() => {
      void refreshEphemeralBalances();
    }, 0);

    return () => clearTimeout(id);
  }, [publicKey, refreshEphemeralBalances]);

  // ── Derived state ────────────────────────────────────────────────────
  const oracleBlocked = state.oracleEnabled && state.oracleValidation !== null && !state.oracleValidation.approved;
  const canSwap = connected && state.status === "ready" && state.quote !== null && !oracleBlocked;

  const swapBtnClass = !connected
    ? "swap-btn-ready"
    : oracleBlocked
    ? "swap-btn-error"
    : state.status === "error"
    ? "swap-btn-error"
    : "swap-btn-ready";

  const swapBtnLabel =
    !connected ? "Connect Wallet"
    : state.status === "quoting" ? "Getting Quote..."
    : state.status === "swapping" ? "Swapping..."
    : state.status === "success" ? "Swap Complete ✓"
    : oracleBlocked ? "Oracle Rejected — Price Too Far"
    : state.status === "error" ? state.error?.slice(0, 40) ?? "Error"
    : state.quote ? `Swap ${state.inputToken?.symbol} → ${state.outputToken?.symbol}`
    : "Enter Amount";

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md mx-auto"
      >
        {/* Card */}
        <div className="glass-card neon-border-cyan rounded-2xl p-4 relative overflow-hidden">
          {/* Animated scanline */}
          <div className="scanline opacity-20" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-cyan-500/30 rounded-tl-2xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-500/20 rounded-tr-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-purple-500/20 rounded-bl-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-purple-500/15 rounded-br-2xl pointer-events-none" />

          {/* Success burst */}
          <AnimatePresence>
            {showBurst && <SuccessBurst />}
          </AnimatePresence>

          {/* Header */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <LobsterLogo size={36} />
              <div>
                <h1 className="text-base font-bold gradient-text-cyan tracking-wider anim-flicker">
                  DARK SWAP
                </h1>
                <p className="text-[10px] text-slate-600 mt-0.5 tracking-widest">
                  Privacy-first DEX · 🦞 powered
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BuyClawdButton />
              {state.quote && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRefreshQuote}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-cyan-400 transition-colors"
                  title={`Quote ${quoteAge}s ago`}
                >
                  <motion.div
                    animate={state.status === "quoting" ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.8, repeat: state.status === "quoting" ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
                  >
                    <RefreshCw size={14} className={state.status === "quoting" ? "text-cyan-400" : ""} />
                  </motion.div>
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${showSettings ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}
              >
                <motion.div
                  animate={{ rotate: showSettings ? 45 : 0 }}
                  transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                >
                  <Settings size={14} />
                </motion.div>
              </motion.button>
            </div>
          </div>

          {/* Settings panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <div className="p-3 bg-white/3 rounded-xl border border-white/8 overflow-hidden">
                  <div className="text-[10px] font-semibold text-slate-400 tracking-widest mb-2">
                    SLIPPAGE TOLERANCE
                  </div>
                  <div className="flex gap-2">
                    {SLIPPAGE_OPTIONS.map((bps) => (
                      <motion.button
                        key={bps}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setState((s) => ({ ...s, slippageBps: bps }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          state.slippageBps === bps
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,245,255,0.15)]"
                            : "bg-white/5 text-slate-500 border border-white/10 hover:border-white/20"
                        }`}
                      >
                        {(bps / 100).toFixed(1)}%
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <TokenInput
            label="You Pay"
            token={state.inputToken}
            amount={state.inputAmount}
            onAmountChange={handleInputAmountChange}
            onTokenClick={() => setShowTokenModal("input")}
            onMax={connected ? handleMaxClick : undefined}
          />

          {/* Swap arrow */}
          <div className="flex justify-center my-2 relative z-10">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleSwapTokens}
              className="swap-arrow-btn p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400"
            >
              <motion.div
                animate={{ rotate: swapArrowFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <ArrowDown size={16} />
              </motion.div>
            </motion.button>
          </div>

          {/* Output */}
          <TokenInput
            label="You Receive"
            token={state.outputToken}
            amount={state.outputAmount}
            onAmountChange={() => {}}
            onTokenClick={() => setShowTokenModal("output")}
            readonly
            loading={state.status === "quoting"}
          />

          {/* Quote details */}
          <AnimatePresence mode="wait">
            {state.quote && state.status !== "quoting" && (
              <motion.div
                key="quote"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <QuoteDetails
                  quote={state.quote}
                  outputToken={state.outputToken}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Oracle status */}
          <motion.div
            className="mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <OracleStatus
              oracle={state.oracleValidation}
              loading={state.status === "quoting"}
              enabled={state.oracleEnabled}
              onToggle={() => setState((s) => ({ ...s, oracleEnabled: !s.oracleEnabled }))}
            />
          </motion.div>

          {/* Ephemeral panel */}
          <div className="mt-2">
            <EphemeralPanel
              enabled={ephemeralEnabled}
              onToggle={() => setEphemeralEnabled((e) => !e)}
              balances={ephemeralBalances}
              onRefresh={refreshEphemeralBalances}
              tokenSymbol={state.inputToken?.symbol}
            />
          </div>

          {/* Shielded wallet — visible when privacy shield is ON */}
          {state.privacyEnabled && (
            <div className="mt-2">
              <ShieldedWalletPanel />
            </div>
          )}

          {/* Privacy bar */}
          <PrivacyBar
            shieldEnabled={state.privacyEnabled}
            oracleEnabled={state.oracleEnabled}
            onShieldToggle={() => setState((s) => ({ ...s, privacyEnabled: !s.privacyEnabled }))}
            onOracleToggle={() => setState((s) => ({ ...s, oracleEnabled: !s.oracleEnabled }))}
          />

          {/* Swap progress tracker */}
          <SwapProgress
            status={state.status}
            progressStep={progressStep}
            error={state.error}
            txSignature={state.txSignature}
          />

          {/* Connect wallet (disconnected state — standalone, never nested in button) */}
          {!connected && (
            <WalletMultiButton
              className="mt-4 w-full !py-3.5 !rounded-xl !text-sm !font-bold !tracking-wider swap-btn-ready !justify-center !h-auto"
            />
          )}

          {/* Swap button (connected state only) */}
          {connected && (
            <motion.button
              whileTap={canSwap ? { scale: 0.98 } : {}}
              onClick={handleSwapClick}
              disabled={
                state.status === "swapping" ||
                state.status === "quoting" ||
                (!canSwap && state.status !== "success" && state.status !== "error")
              }
              className={`mt-4 w-full py-3.5 rounded-xl text-sm font-bold tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed ${swapBtnClass}`}
            >
              {state.status === "quoting" || state.status === "swapping" ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Loader2 size={15} />
                  </motion.div>
                  {swapBtnLabel}
                </span>
              ) : state.status === "success" ? (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={15} />
                  {swapBtnLabel}
                </motion.span>
              ) : oracleBlocked ? (
                <span className="flex items-center justify-center gap-2">
                  <AlertTriangle size={15} />
                  {swapBtnLabel}
                </span>
              ) : (
                swapBtnLabel
              )}
            </motion.button>
          )}

          {/* TX success link */}
          <AnimatePresence>
            {state.txSignature && state.status === "success" && (
              <motion.a
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                href={`https://solscan.io/tx/${state.txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <ExternalLink size={11} />
                View on Solscan
              </motion.a>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Convex subscriptions update this feed as soon as swaps are recorded. */}
      <div className="w-full max-w-md mx-auto mt-3">
        <SwapHistoryPanel variant="live" defaultExpanded limit={12} />
      </div>

      {/* Wallet history — persistent, shown below the live feed when connected */}
      {connected && publicKey && (
        <div className="w-full max-w-md mx-auto mt-3">
          <SwapHistoryPanel walletAddress={publicKey.toString()} variant="wallet" />
        </div>
      )}

      {/* Modals */}
      <TokenModal
        open={showTokenModal === "input"}
        onClose={() => setShowTokenModal(null)}
        onSelect={(t) => setState((s) => ({ ...s, inputToken: t, quote: null, outputAmount: "", status: "idle" }))}
        excludeMint={state.outputToken?.address}
      />
      <TokenModal
        open={showTokenModal === "output"}
        onClose={() => setShowTokenModal(null)}
        onSelect={(t) => setState((s) => ({ ...s, outputToken: t, quote: null, outputAmount: "", status: "idle" }))}
        excludeMint={state.inputToken?.address}
      />
      <SafetyModal
        safety={state.safetyCheck}
        open={showSafetyModal}
        onConfirm={() => { setShowSafetyModal(false); executeSwap(); }}
        onCancel={() => setShowSafetyModal(false)}
      />
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function TokenInput({
  label, token, amount, onAmountChange, onTokenClick, onMax, readonly, loading,
}: {
  label: string;
  token: Token | null;
  amount: string;
  onAmountChange: (v: string) => void;
  onTokenClick: () => void;
  onMax?: () => void;
  readonly?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="token-input-box bg-white/3 rounded-xl p-3 border border-white/8 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-slate-500 tracking-widest uppercase">{label}</span>
        {onMax && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onMax}
            className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 transition-colors tracking-wider"
          >
            MAX
          </motion.button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center gap-1.5"
            >
              {[0,1,2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-500/40"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.input
              key="input"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              readOnly={readonly}
              className={`flex-1 bg-transparent text-2xl font-mono font-bold text-white placeholder-slate-700 focus:outline-none ${
                readonly ? "cursor-default" : ""
              }`}
            />
          )}
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onTokenClick}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 hover:border-cyan-500/30 transition-all shrink-0"
        >
          {token ? (
            <>
              <TokenLogo logoURI={token.logoURI} symbol={token.symbol} size={22} />
              <span className="text-sm font-bold text-white">{token.symbol}</span>
            </>
          ) : (
            <span className="text-sm text-slate-400">Select</span>
          )}
          <ChevronDown size={13} className="text-slate-500" />
        </motion.button>
      </div>
    </div>
  );
}

function QuoteDetails({
  quote, outputToken,
}: {
  quote: NonNullable<SwapState["quote"]>;
  outputToken: Token | null;
}) {
  const priceImpact = Number.parseFloat(quote.priceImpactPct || "0");
  const impactColor =
    priceImpact < 0.5 ? "text-green-400"
    : priceImpact < 2 ? "text-amber-400"
    : "text-red-400";

  const route = quote.routePlan
    .map((r) => r.swapInfo.label)
    .filter(Boolean)
    .slice(0, 3)
    .join(" → ");

  return (
    <div className="mt-3 p-3 bg-white/2 rounded-xl border border-white/6 space-y-1.5 anim-quote">
      <Row label="Price impact" value={`${priceImpact.toFixed(3)}%`} valueClass={impactColor} />
      <Row
        label="Min received"
        value={`${formatAmount(quote.otherAmountThreshold, outputToken?.decimals ?? 6)} ${outputToken?.symbol ?? ""}`}
      />
      <Row label="Slippage" value={`${(quote.slippageBps / 100).toFixed(1)}%`} />
      {route && <Row label="Route" value={route} />}
    </div>
  );
}

function Row({ label, value, valueClass = "text-slate-300" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className={`text-[10px] font-mono truncate max-w-[55%] ${valueClass}`}>{value}</span>
    </div>
  );
}
