"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction, type Connection } from "@solana/web3.js";
import toast from "react-hot-toast";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

import { WSOL, USDC, formatAmount, parseAmount } from "@/lib/tokens";
import type { Token, SwapState, QuoteApiResponse, ProgressStep } from "@/types";

// ── module-level pure helpers re-exported from the hook file ──────────────────

async function buildSwapTxFn(
  inputMint: string, outputMint: string, inAmount: string,
  taker: string, slippageBps: number,
): Promise<{ transaction: string; requestId?: string; sponsored: boolean; router?: string; error?: string }> {
  const res = await fetch("/api/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputMint, outputMint, amount: inAmount, taker, slippageBps }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to build swap transaction");
  return data;
}

async function jupiterExecute(signed: VersionedTransaction, requestId: string): Promise<string> {
  const res = await fetch("/api/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      signedTransaction: Buffer.from(signed.serialize()).toString("base64"),
      requestId,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error || data.status !== "Success")
    throw new Error(data.error ?? `Execute failed (code ${data.code})`);
  return data.signature as string;
}

function recordToConvex(
  fn: (args: Record<string, unknown>) => Promise<unknown>,
  sig: string, router: string, st: SwapState, wallet: string, ephemeral: boolean,
) {
  const route = st.quote?.routePlan.map((r) => r.swapInfo.label).filter(Boolean).slice(0, 3).join(" → ") ?? "";
  fn({
    walletAddress: wallet,
    inputMint: st.inputToken?.address ?? "",
    outputMint: st.outputToken?.address ?? "",
    inputSymbol: st.inputToken?.symbol ?? "",
    outputSymbol: st.outputToken?.symbol ?? "",
    inputAmount: st.inputAmount,
    outputAmount: st.outputAmount,
    txSignature: sig,
    slippageBps: st.slippageBps,
    priceImpactPct: st.quote?.priceImpactPct ?? "",
    source: router,
    route,
    privacyEnabled: st.privacyEnabled,
    ephemeralEnabled: ephemeral,
  }).catch(() => { /* non-critical */ });
}

async function rpcExecute(signed: VersionedTransaction, conn: Connection): Promise<string> {
  const sig = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: false, maxRetries: 3 });
  const conf = await conn.confirmTransaction(sig, "confirmed");
  if (conf.value.err) throw new Error(`Transaction failed: ${JSON.stringify(conf.value.err)}`);
  return sig;
}

// ── The hook ──────────────────────────────────────────────────────────────────

export type SwapHook = ReturnType<typeof useSwap>;

export function useSwap() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const recordSwap = useMutation(api.swaps.recordSwap);
  const quoteSourceRef = useRef<string>("jupiter");
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quoteTimestampRef = useRef<number>(0);

  const [state, setState] = useState<SwapState>({
    inputToken: WSOL, outputToken: USDC,
    inputAmount: "", outputAmount: "",
    slippageBps: 50, quote: null,
    oracleValidation: null, safetyCheck: null,
    privacyEnabled: true, oracleEnabled: true, safetyCheckEnabled: true,
    status: "idle", error: null, txSignature: null,
  });

  const [ephemeralEnabled, setEphemeralEnabled] = useState(false);
  const [ephemeralBalances, setEphemeralBalances] = useState({
    baseBalance: null as number | null,
    ephemeralBalance: null as number | null,
    isLoading: false,
  });
  const [progressStep, setProgressStep] = useState<ProgressStep>("idle");
  const [showBurst, setShowBurst] = useState(false);
  const [quoteAge, setQuoteAge] = useState(0);

  // ── Quote fetching ──────────────────────────────────────────────────
  const fetchQuote = useCallback(async (
    inputToken: Token, outputToken: Token, inputAmount: string,
    slippageBps: number, oracleEnabled: boolean, safetyCheckEnabled: boolean,
  ) => {
    if (!inputAmount || Number.parseFloat(inputAmount) <= 0) {
      setState((s) => ({ ...s, quote: null, oracleValidation: null, outputAmount: "", status: "idle" }));
      setProgressStep("idle");
      return;
    }
    const rawAmount = parseAmount(inputAmount, inputToken.decimals);
    setState((s) => ({ ...s, status: "quoting", error: null }));
    setProgressStep("quoting");
    try {
      const params = new URLSearchParams({
        inputMint: inputToken.address, outputMint: outputToken.address,
        amount: rawAmount, slippageBps: slippageBps.toString(),
        skipOracle: (!oracleEnabled).toString(), skipSafety: (!safetyCheckEnabled).toString(),
      });
      const res = await fetch(`/api/quote?${params}`);
      const data: QuoteApiResponse & { error?: string } = await res.json();
      if (data.error) throw new Error(data.error);
      quoteTimestampRef.current = Date.now();
      quoteSourceRef.current = data.source ?? "jupiter";
      setState((s) => ({
        ...s, quote: data.quote,
        outputAmount: formatAmount(data.quote.outAmount, outputToken.decimals),
        oracleValidation: data.oracle, safetyCheck: data.safety,
        status: "ready", error: null,
      }));
      setProgressStep("idle");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get quote";
      setState((s) => ({ ...s, status: "error", error: msg, quote: null, outputAmount: "" }));
      setProgressStep("error");
    }
  }, []);

  useEffect(() => {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    quoteTimerRef.current = setTimeout(() => {
      if (state.inputToken && state.outputToken && state.inputAmount)
        fetchQuote(state.inputToken, state.outputToken, state.inputAmount,
          state.slippageBps, state.oracleEnabled, state.safetyCheckEnabled);
    }, 300);
    return () => { if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current); };
  }, [state.inputToken, state.outputToken, state.inputAmount,
      state.slippageBps, state.oracleEnabled, state.safetyCheckEnabled, fetchQuote]);

  useEffect(() => {
    const id = setInterval(() => {
      if (quoteTimestampRef.current > 0)
        setQuoteAge(Math.floor((Date.now() - quoteTimestampRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Token / amount handlers ─────────────────────────────────────────
  const handleSwapTokens = useCallback(() => {
    setState((s) => ({
      ...s,
      inputToken: s.outputToken, outputToken: s.inputToken,
      inputAmount: s.outputAmount, outputAmount: s.inputAmount,
      quote: null, oracleValidation: null, status: "idle",
    }));
  }, []);

  const handleInputAmountChange = useCallback((value: string) => {
    if (!/^[0-9]*\.?[0-9]*$/.test(value) && value !== "") return;
    setState((s) => ({ ...s, inputAmount: value, outputAmount: "", status: value ? "loading" : "idle" }));
  }, []);

  const handleMaxClick = useCallback(async () => {
    if (!publicKey || !state.inputToken) return;
    const WSOL_MINT = "So11111111111111111111111111111111111111112";
    if (state.inputToken.address !== WSOL_MINT) return;
    try {
      const bal = await connection.getBalance(publicKey);
      setState((s) => ({ ...s, inputAmount: Math.max(0, (bal - 10_000_000) / 1e9).toFixed(6) }));
    } catch { /* silent */ }
  }, [publicKey, state.inputToken, connection]);

  const handleRefreshQuote = useCallback(() => {
    if (state.inputToken && state.outputToken && state.inputAmount)
      fetchQuote(state.inputToken, state.outputToken, state.inputAmount,
        state.slippageBps, state.oracleEnabled, state.safetyCheckEnabled);
  }, [state, fetchQuote]);

  // ── Ephemeral balances ──────────────────────────────────────────────
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
    if (publicKey) refreshEphemeralBalances();
  }, [publicKey, refreshEphemeralBalances]);

  // ── Swap execution ──────────────────────────────────────────────────
  const executeSwap = useCallback(async () => {
    if (!state.quote || !publicKey || !signTransaction) return;
    setState((s) => ({ ...s, status: "swapping", error: null }));
    const toastId = toast.loading("Building transaction...");
    try {
      setProgressStep("signing");
      const swapData = await buildSwapTxFn(
        state.inputToken?.address ?? "", state.outputToken?.address ?? "",
        state.quote.inAmount, publicKey.toString(), state.slippageBps,
      );
      const router = swapData.router ?? quoteSourceRef.current;
      const tx = VersionedTransaction.deserialize(Buffer.from(swapData.transaction, "base64"));
      toast.loading("Sign in wallet...", { id: toastId });
      const signed = await signTransaction(tx);
      setProgressStep("sending");
      let sig: string;
      if (swapData.requestId) {
        toast.loading("Broadcasting via Jupiter...", { id: toastId });
        sig = await jupiterExecute(signed, swapData.requestId);
      } else {
        toast.loading("Broadcasting to Solana...", { id: toastId });
        sig = await rpcExecute(signed, connection);
      }
      setProgressStep("success");
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 1000);
      toast.success(`🌑 Swap via ${router}${swapData.sponsored ? " (gasless)" : ""}!`, { id: toastId, duration: 4000 });
      setState((s) => ({ ...s, status: "success", txSignature: sig, inputAmount: "", outputAmount: "", quote: null }));
      recordToConvex(recordSwap, sig, router, state, publicKey.toString(), ephemeralEnabled);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Swap failed";
      toast.error(msg, { id: toastId });
      setState((s) => ({ ...s, status: "error", error: msg }));
      setProgressStep("error");
    }
  }, [state, publicKey, signTransaction, connection, recordSwap, ephemeralEnabled]);

  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const handleSwapClick = useCallback(() => {
    if (!state.safetyCheck || state.safetyCheck.safe) void executeSwap();
    else setShowSafetyModal(true);
  }, [state.safetyCheck, executeSwap]);

  const handleSafetyConfirm = useCallback(() => {
    setShowSafetyModal(false);
    void executeSwap();
  }, [executeSwap]);

  // ── Derived ─────────────────────────────────────────────────────────
  const oracleBlocked = state.oracleEnabled && state.oracleValidation !== null && !state.oracleValidation.approved;
  const canSwap = connected && state.status === "ready" && state.quote !== null && !oracleBlocked;
  const swapBtnClass = oracleBlocked || state.status === "error" ? "swap-btn-error" : "swap-btn-ready";
  const swapBtnLabel = deriveLabel(connected, state, oracleBlocked);

  return {
    // wallet
    publicKey, connected,
    // core state
    state, setState,
    // ui state
    ephemeralEnabled, setEphemeralEnabled,
    ephemeralBalances,
    progressStep,
    showBurst,
    quoteAge,
    // handlers
    handleSwapTokens,
    handleInputAmountChange,
    handleMaxClick,
    handleRefreshQuote,
    handleSwapClick,
    refreshEphemeralBalances,
    // derived
    oracleBlocked, canSwap, swapBtnClass, swapBtnLabel,
  };
}

function deriveLabel(connected: boolean, state: SwapState, oracleBlocked: boolean): string {
  if (!connected) return "Connect Wallet";
  if (state.status === "quoting") return "Getting Quote...";
  if (state.status === "swapping") return "Swapping...";
  if (state.status === "success") return "Swap Complete ✓";
  if (oracleBlocked) return "Oracle Rejected — Price Too Far";
  if (state.status === "error") return state.error?.slice(0, 40) ?? "Error";
  if (state.quote) return `Swap ${state.inputToken?.symbol} → ${state.outputToken?.symbol}`;
  return "Enter Amount";
}
