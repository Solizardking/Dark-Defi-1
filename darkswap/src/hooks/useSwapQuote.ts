import { useState, useCallback, useEffect, useRef } from "react";
import { formatAmount, parseAmount } from "@/lib/tokens";
import type { Token, SwapState, QuoteApiResponse, ProgressStep } from "@/types";

type QuoteSlice = Pick<SwapState,
  | "quote" | "outputAmount" | "oracleValidation" | "safetyCheck"
  | "status" | "error"
>;

interface UseSwapQuoteReturn {
  quoteAge: number;
  fetchQuote: (
    inputToken: Token,
    outputToken: Token,
    inputAmount: string,
    slippageBps: number,
    oracleEnabled: boolean,
    safetyCheckEnabled: boolean,
  ) => Promise<void>;
  scheduleQuote: (
    inputToken: Token | null,
    outputToken: Token | null,
    inputAmount: string,
    slippageBps: number,
    oracleEnabled: boolean,
    safetyCheckEnabled: boolean,
  ) => void;
  onQuoteResult: (patch: Partial<QuoteSlice>) => void;
  onProgressStep: (step: ProgressStep) => void;
}

export function useSwapQuote(
  onQuoteResult: (patch: Partial<QuoteSlice>) => void,
  onProgressStep: (step: ProgressStep) => void,
): Omit<UseSwapQuoteReturn, "onQuoteResult" | "onProgressStep"> {
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tsRef       = useRef<number>(0);
  const [quoteAge, setQuoteAge] = useState(0);

  /* Age counter */
  useEffect(() => {
    const id = setInterval(() => {
      if (tsRef.current > 0)
        setQuoteAge(Math.floor((Date.now() - tsRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const fetchQuote = useCallback(async (
    inputToken: Token,
    outputToken: Token,
    inputAmount: string,
    slippageBps: number,
    oracleEnabled: boolean,
    safetyCheckEnabled: boolean,
  ) => {
    if (!inputAmount || Number.parseFloat(inputAmount) <= 0) {
      onQuoteResult({ quote: null, oracleValidation: null, outputAmount: "", status: "idle" });
      onProgressStep("idle");
      return;
    }

    const rawAmount = parseAmount(inputAmount, inputToken.decimals);
    onQuoteResult({ status: "quoting", error: null });
    onProgressStep("quoting");

    try {
      const params = new URLSearchParams({
        inputMint: inputToken.address,
        outputMint: outputToken.address,
        amount: rawAmount,
        slippageBps: slippageBps.toString(),
        skipOracle: (!oracleEnabled).toString(),
        skipSafety:  (!safetyCheckEnabled).toString(),
      });

      const res  = await fetch(`/api/quote?${params}`);
      const data = await res.json() as QuoteApiResponse & { error?: string };
      if (data.error) throw new Error(data.error);

      tsRef.current = Date.now();
      onQuoteResult({
        quote: data.quote,
        outputAmount: formatAmount(data.quote.outAmount, outputToken.decimals),
        oracleValidation: data.oracle,
        safetyCheck: data.safety,
        status: "ready",
        error: null,
      });
      onProgressStep("idle");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get quote";
      onQuoteResult({ status: "error", error: msg, quote: null, outputAmount: "" });
      onProgressStep("error");
    }
  }, [onQuoteResult, onProgressStep]);

  /** Debounce wrapper — 300 ms */
  const scheduleQuote = useCallback((
    inputToken: Token | null,
    outputToken: Token | null,
    inputAmount: string,
    slippageBps: number,
    oracleEnabled: boolean,
    safetyCheckEnabled: boolean,
  ) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!inputToken || !outputToken || !inputAmount) return;
    timerRef.current = setTimeout(
      () => fetchQuote(inputToken, outputToken, inputAmount, slippageBps, oracleEnabled, safetyCheckEnabled),
      300,
    );
  }, [fetchQuote]);

  return { quoteAge, fetchQuote, scheduleQuote };
}
