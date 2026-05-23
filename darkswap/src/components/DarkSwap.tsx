"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowDown, ChevronDown, Settings, RefreshCw, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction, Transaction, Connection } from "@solana/web3.js";
import toast from "react-hot-toast";

import { TokenLogo } from "./TokenLogo";
import { TokenModal } from "./TokenModal";
import { OracleStatus } from "./OracleStatus";
import { SafetyModal } from "./SafetyModal";
import { PrivacyBar } from "./PrivacyBar";
import { EphemeralPanel } from "./EphemeralPanel";

import { WSOL, USDC, formatAmount, parseAmount } from "@/lib/tokens";
import type { Token, SwapState, QuoteApiResponse } from "@/types";

const SLIPPAGE_OPTIONS = [10, 50, 100, 200];

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

  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [quoteAge, setQuoteAge] = useState(0);
  const quoteTimestampRef = useRef<number>(0);

  // ── Quote fetching ──────────────────────────────────────────────────
  const fetchQuote = useCallback(async (
    inputToken: Token,
    outputToken: Token,
    inputAmount: string,
    slippageBps: number,
    oracleEnabled: boolean,
    safetyCheckEnabled: boolean,
  ) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setState((s) => ({ ...s, quote: null, oracleValidation: null, outputAmount: "", status: "idle" }));
      return;
    }

    const rawAmount = parseAmount(inputAmount, inputToken.decimals);
    setState((s) => ({ ...s, status: "quoting", error: null }));

    try {
      const params = new URLSearchParams({
        inputMint: inputToken.address,
        outputMint: outputToken.address,
        amount: rawAmount,
        slippageBps: slippageBps.toString(),
        skipOracle: (!oracleEnabled).toString(),
        skipSafety: (!safetyCheckEnabled).toString(),
      });

      const res = await fetch(`/api/quote?${params}`);
      const data: QuoteApiResponse & { error?: string } = await res.json();

      if (data.error) throw new Error(data.error);

      const outAmount = formatAmount(data.quote.outAmount, outputToken.decimals);
      quoteTimestampRef.current = Date.now();

      setState((s) => ({
        ...s,
        quote: data.quote,
        outputAmount: outAmount,
        oracleValidation: data.oracle,
        safetyCheck: data.safety,
        status: "ready",
        error: null,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get quote";
      setState((s) => ({ ...s, status: "error", error: msg, quote: null, outputAmount: "" }));
    }
  }, []);

  // Debounced quote on input change
  useEffect(() => {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    quoteTimerRef.current = setTimeout(() => {
      if (state.inputToken && state.outputToken && state.inputAmount) {
        fetchQuote(
          state.inputToken,
          state.outputToken,
          state.inputAmount,
          state.slippageBps,
          state.oracleEnabled,
          state.safetyCheckEnabled,
        );
      }
    }, 600);
    return () => { if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current); };
  }, [state.inputToken, state.outputToken, state.inputAmount, state.slippageBps, state.oracleEnabled, state.safetyCheckEnabled, fetchQuote]);

  // Quote age counter
  useEffect(() => {
    const interval = setInterval(() => {
      if (quoteTimestampRef.current > 0) {
        setQuoteAge(Math.floor((Date.now() - quoteTimestampRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSwapTokens = useCallback(() => {
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
    } catch {}
  }, [publicKey, state.inputToken, connection]);

  const handleRefreshQuote = useCallback(() => {
    if (state.inputToken && state.outputToken && state.inputAmount) {
      fetchQuote(state.inputToken, state.outputToken, state.inputAmount, state.slippageBps, state.oracleEnabled, state.safetyCheckEnabled);
    }
  }, [state, fetchQuote]);

  // ── Swap execution ───────────────────────────────────────────────────
  const executeSwap = useCallback(async () => {
    if (!state.quote || !publicKey || !signTransaction) return;

    setState((s) => ({ ...s, status: "swapping", error: null }));
    const toastId = toast.loading("Preparing transaction...");

    try {
      const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: state.quote,
          userPublicKey: publicKey.toString(),
          wrapAndUnwrapSol: true,
          prioritizationFeeLamports: "auto",
        }),
      });

      if (!swapRes.ok) throw new Error("Failed to build swap transaction");
      const { swapTransaction } = await swapRes.json();

      const txBuf = Buffer.from(swapTransaction, "base64");
      let tx: VersionedTransaction | Transaction;

      try {
        tx = VersionedTransaction.deserialize(txBuf);
      } catch {
        tx = Transaction.from(txBuf);
      }

      toast.loading("Sign in wallet...", { id: toastId });
      const signed = await signTransaction(tx as VersionedTransaction);

      toast.loading("Sending transaction...", { id: toastId });
      let sig: string;

      if (signed instanceof VersionedTransaction) {
        sig = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });
      } else {
        sig = await connection.sendRawTransaction((signed as Transaction).serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });
      }

      toast.loading("Confirming...", { id: toastId });
      const conf = await connection.confirmTransaction(sig, "confirmed");
      if (conf.value.err) throw new Error(`Transaction failed: ${JSON.stringify(conf.value.err)}`);

      toast.success("Swap successful!", { id: toastId });
      setState((s) => ({ ...s, status: "success", txSignature: sig, inputAmount: "", outputAmount: "", quote: null }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Swap failed";
      toast.error(msg, { id: toastId });
      setState((s) => ({ ...s, status: "error", error: msg }));
    }
  }, [state.quote, publicKey, signTransaction, connection]);

  const handleSwapClick = useCallback(() => {
    if (!state.safetyCheck || state.safetyCheck.safe) {
      executeSwap();
    } else {
      setShowSafetyModal(true);
    }
  }, [state.safetyCheck, executeSwap]);

  // ── Ephemeral balance refresh ─────────────────────────────────────
  const refreshEphemeralBalances = useCallback(async () => {
    if (!publicKey) return;
    setEphemeralBalances((b) => ({ ...b, isLoading: true }));
    try {
      const bal = await connection.getBalance(publicKey);
      setEphemeralBalances({
        baseBalance: bal / 1e9,
        ephemeralBalance: null,
        isLoading: false,
      });
    } catch {
      setEphemeralBalances((b) => ({ ...b, isLoading: false }));
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (publicKey) refreshEphemeralBalances();
  }, [publicKey, refreshEphemeralBalances]);

  // ── Derived state ────────────────────────────────────────────────────
  const oracleBlocked =
    state.oracleEnabled &&
    state.oracleValidation !== null &&
    !state.oracleValidation.approved;

  const canSwap =
    connected &&
    state.status === "ready" &&
    state.quote !== null &&
    !oracleBlocked;

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
      <div className="w-full max-w-md mx-auto">
        {/* Card */}
        <div className="glass neon-border-cyan rounded-2xl p-4 relative overflow-hidden">
          {/* Scanline */}
          <div className="scanline opacity-30" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-bold gradient-text-cyan tracking-wider">DARK SWAP</h1>
              <p className="text-xs text-slate-600 mt-0.5">Privacy-first DEX aggregation</p>
            </div>
            <div className="flex items-center gap-2">
              {state.quote && (
                <button
                  onClick={handleRefreshQuote}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-cyan-400 transition-colors"
                  title={`Quote ${quoteAge}s ago`}
                >
                  <RefreshCw size={14} className={state.status === "quoting" ? "animate-spin text-cyan-400" : ""} />
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${showSettings ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Settings size={14} />
              </button>
            </div>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="mb-4 p-3 bg-white/3 rounded-xl border border-white/8">
              <div className="text-xs font-semibold text-slate-400 tracking-wider mb-2">SLIPPAGE</div>
              <div className="flex gap-2">
                {SLIPPAGE_OPTIONS.map((bps) => (
                  <button
                    key={bps}
                    onClick={() => setState((s) => ({ ...s, slippageBps: bps }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      state.slippageBps === bps
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                        : "bg-white/5 text-slate-500 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    {(bps / 100).toFixed(1)}%
                  </button>
                ))}
              </div>
            </div>
          )}

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
          <div className="flex justify-center my-2">
            <button
              onClick={handleSwapTokens}
              className="swap-arrow-btn p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400"
            >
              <ArrowDown size={16} />
            </button>
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
          {state.quote && state.status !== "quoting" && (
            <QuoteDetails quote={state.quote} inputToken={state.inputToken} outputToken={state.outputToken} />
          )}

          {/* Oracle status */}
          <div className="mt-3">
            <OracleStatus
              oracle={state.oracleValidation}
              loading={state.status === "quoting"}
              enabled={state.oracleEnabled}
              onToggle={() => setState((s) => ({ ...s, oracleEnabled: !s.oracleEnabled }))}
            />
          </div>

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

          {/* Privacy bar */}
          <PrivacyBar
            shieldEnabled={state.privacyEnabled}
            oracleEnabled={state.oracleEnabled}
            onShieldToggle={() => setState((s) => ({ ...s, privacyEnabled: !s.privacyEnabled }))}
            onOracleToggle={() => setState((s) => ({ ...s, oracleEnabled: !s.oracleEnabled }))}
          />

          {/* Swap button */}
          <button
            onClick={connected ? handleSwapClick : undefined}
            disabled={connected && (state.status === "swapping" || state.status === "quoting" || (!canSwap && state.status !== "success" && state.status !== "error"))}
            className={`mt-4 w-full py-3.5 rounded-xl text-sm font-bold tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed ${swapBtnClass}`}
          >
            {state.status === "quoting" || state.status === "swapping" ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                {swapBtnLabel}
              </span>
            ) : state.status === "success" ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 size={15} />
                {swapBtnLabel}
              </span>
            ) : oracleBlocked ? (
              <span className="flex items-center justify-center gap-2">
                <AlertTriangle size={15} />
                {swapBtnLabel}
              </span>
            ) : !connected ? (
              <WalletMultiButton className="!bg-transparent !border-none !p-0 !w-full !h-auto !text-inherit !font-inherit !text-sm" />
            ) : (
              swapBtnLabel
            )}
          </button>

          {/* TX success link */}
          {state.txSignature && (
            <a
              href={`https://solscan.io/tx/${state.txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ExternalLink size={11} />
              View on Solscan
            </a>
          )}
        </div>
      </div>

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
    <div className="bg-white/3 rounded-xl p-3 border border-white/8 hover:border-white/12 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        {onMax && (
          <button onClick={onMax} className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors">
            MAX
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          readOnly={readonly}
          className={`flex-1 bg-transparent text-xl font-mono font-semibold text-white placeholder-slate-700 focus:outline-none ${
            loading ? "animate-pulse text-slate-500" : ""
          } ${readonly ? "cursor-default" : ""}`}
        />
        <button
          onClick={onTokenClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 hover:border-cyan-500/30 transition-all shrink-0"
        >
          {token ? (
            <>
              <TokenLogo logoURI={token.logoURI} symbol={token.symbol} size={22} />
              <span className="text-sm font-semibold text-white">{token.symbol}</span>
            </>
          ) : (
            <span className="text-sm text-slate-400">Select</span>
          )}
          <ChevronDown size={13} className="text-slate-500" />
        </button>
      </div>
    </div>
  );
}

function QuoteDetails({
  quote, inputToken, outputToken,
}: {
  quote: NonNullable<SwapState["quote"]>;
  inputToken: Token | null;
  outputToken: Token | null;
}) {
  const priceImpact = parseFloat(quote.priceImpactPct || "0");
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
    <div className="mt-3 p-3 bg-white/2 rounded-xl border border-white/6 space-y-1.5">
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
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-mono truncate max-w-[55%] ${valueClass}`}>{value}</span>
    </div>
  );
}
