import type { SwapQuote } from "@/types";

// ── v1 (Metis) — kept for oracle/safety quote preview ────────────────────────

const JUP_V1 =
  process.env.JUPITER_ENDPOINT
    ? `${process.env.JUPITER_ENDPOINT}/v6`
    : "https://quote-api.jup.ag/v6";

// ── v2 Meta-Aggregator — order+execute flow ───────────────────────────────────

const JUP_V2 = "https://api.jup.ag/swap/v2";
const REQUEST_TIMEOUT_MS = 8_000;

function jupHeaders(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  const key = process.env.JUPITER_API_KEY ?? process.env.JUP_SWAP_V1_API_KEY;
  if (key) h["x-api-key"] = key;
  return h;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JupiterOrderResponse {
  transaction: string | null;
  requestId: string;
  outAmount: string;
  inAmount: string;
  inputMint: string;
  outputMint: string;
  otherAmountThreshold: string;
  slippageBps: number;
  priceImpactPct: string;
  priceImpact: number;
  router: "iris" | "jupiterz" | "dflow" | "okx";
  mode: "ultra" | "manual";
  feeBps: number;
  feeMint: string;
  routePlan: SwapQuote["routePlan"];
  platformFee?: { amount: string; feeBps: number; feeMint: string };
  errorCode?: number;
  errorMessage?: string;
}

export interface JupiterExecuteResponse {
  status: "Success" | "Failed";
  signature: string;
  slot?: string;
  code: number;
  inputAmountResult: string;
  outputAmountResult: string;
  error?: string;
}

// ── v1: quote only (for oracle price validation preview) ──────────────────────

export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps = 50
): Promise<SwapQuote> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: slippageBps.toString(),
    onlyDirectRoutes: "false",
    asLegacyTransaction: "false",
  });

  const res = await fetch(`${JUP_V1}/quote?${params}`, {
    headers: jupHeaders(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jupiter quote failed: ${err}`);
  }

  return res.json();
}

// ── v2: get order (quote + assembled tx, all routers compete) ─────────────────

export async function getJupiterOrder(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps = 50,
  taker?: string
): Promise<JupiterOrderResponse> {
  const params = new URLSearchParams({ inputMint, outputMint, amount });
  if (slippageBps) params.set("slippageBps", slippageBps.toString());
  if (taker) params.set("taker", taker);

  const res = await fetch(`${JUP_V2}/order?${params}`, {
    headers: jupHeaders(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jupiter /order failed (${res.status}): ${err}`);
  }

  const data = await res.json();

  // Normalise priceImpact → priceImpactPct string for backward compat
  return {
    ...data,
    priceImpactPct: data.priceImpactPct ?? String(Math.abs(data.priceImpact ?? 0) * 100),
    routePlan: (data.routePlan ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      swapInfo: {
        ammKey: (r.swapInfo as Record<string, string>)?.ammKey ?? "",
        label: (r.swapInfo as Record<string, string>)?.label ?? "",
        inputMint: (r.swapInfo as Record<string, string>)?.inputMint ?? inputMint,
        outputMint: (r.swapInfo as Record<string, string>)?.outputMint ?? outputMint,
        inAmount: (r.swapInfo as Record<string, string>)?.inAmount ?? amount,
        outAmount: (r.swapInfo as Record<string, string>)?.outAmount ?? data.outAmount ?? "0",
        feeAmount: (r.swapInfo as Record<string, string>)?.feeAmount,
        feeMint: (r.swapInfo as Record<string, string>)?.feeMint,
      },
      percent: (r as Record<string, number>).percent ?? 100,
    })),
  };
}

// ── v2: execute signed transaction (Jupiter handles landing + confirm) ─────────

export async function executeJupiterOrder(
  signedTransaction: string,
  requestId: string
): Promise<JupiterExecuteResponse> {
  const res = await fetch(`${JUP_V2}/execute`, {
    method: "POST",
    headers: jupHeaders(),
    body: JSON.stringify({ signedTransaction, requestId }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jupiter /execute failed (${res.status}): ${err}`);
  }

  return res.json();
}

// ── v1: build swap tx (kept for RPC-direct path, e.g. sponsored swaps) ────────

export async function getJupiterSwapTransaction(
  quote: SwapQuote,
  userPublicKey: string,
  options?: {
    feeAccount?: string;
    prioritizationFeeLamports?: number;
    asLegacyTransaction?: boolean;
  }
): Promise<{ swapTransaction: string }> {
  const body = {
    quoteResponse: quote,
    userPublicKey,
    wrapAndUnwrapSol: true,
    prioritizationFeeLamports: options?.prioritizationFeeLamports ?? "auto",
    feeAccount: options?.feeAccount,
    asLegacyTransaction: options?.asLegacyTransaction ?? false,
  };

  const res = await fetch(`${JUP_V1}/swap`, {
    method: "POST",
    headers: jupHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jupiter swap failed: ${err}`);
  }

  return res.json();
}

export async function getJupiterPrice(mints: string[]): Promise<Record<string, number>> {
  const ids = mints.join(",");
  const res = await fetch(`https://price.jup.ag/v4/price?ids=${ids}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return {};
  const data = await res.json();
  const prices: Record<string, number> = {};
  for (const [mint, info] of Object.entries(data.data ?? {})) {
    prices[mint] = (info as { price: number }).price;
  }
  return prices;
}
