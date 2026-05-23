import type { SwapQuote } from "@/types";

const DFLOW_QUOTE_URL = process.env.DFLOW_QUOTE_API_URL ?? "https://d.quote-api.dflow.net";

function dflowHeaders(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (process.env.DFLOW_API_KEY) h["x-api-key"] = process.env.DFLOW_API_KEY;
  return h;
}

export async function getDflowQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<SwapQuote & { _source: "dflow" }> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: slippageBps.toString(),
  });

  const res = await fetch(`${DFLOW_QUOTE_URL}/quote?${params}`, {
    headers: dflowHeaders(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DFlow quote failed (${res.status}): ${err}`);
  }

  const data = await res.json();

  // DFlow uses `routePlan` but leg shape may differ — normalize it
  const routePlan = (data.routePlan ?? []).map((leg: Record<string, unknown>) => {
    if (leg.swapInfo) return leg;
    return {
      swapInfo: {
        ammKey: String(leg.marketKey ?? "dflow"),
        label: String(leg.venue ?? "DFlow"),
        inputMint: String(leg.inputMint ?? inputMint),
        outputMint: String(leg.outputMint ?? outputMint),
        inAmount: String(leg.inAmount ?? amount),
        outAmount: String(leg.outAmount ?? data.outAmount ?? "0"),
        feeAmount: "0",
        feeMint: inputMint,
      },
      percent: 100,
    };
  });

  return {
    inputMint: data.inputMint ?? inputMint,
    inAmount: data.inAmount ?? amount,
    outputMint: data.outputMint ?? outputMint,
    outAmount: data.outAmount ?? "0",
    otherAmountThreshold: data.otherAmountThreshold ?? data.minOutAmount ?? "0",
    swapMode: "ExactIn",
    slippageBps: data.slippageBps ?? slippageBps,
    priceImpactPct: String(data.priceImpactPct ?? "0"),
    routePlan,
    contextSlot: data.contextSlot,
    timeTaken: data.timeTaken,
    _source: "dflow",
  };
}

export async function getDflowSwapTransaction(
  quote: SwapQuote,
  userPublicKey: string,
  options?: { feeAccount?: string }
): Promise<{ swapTransaction: string }> {
  const body: Record<string, unknown> = {
    quoteResponse: quote,
    userPublicKey,
    wrapAndUnwrapSol: true,
    prioritizationFeeLamports: "auto",
  };
  if (options?.feeAccount) body.feeAccount = options.feeAccount;

  const res = await fetch(`${DFLOW_QUOTE_URL}/swap`, {
    method: "POST",
    headers: dflowHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DFlow swap failed (${res.status}): ${err}`);
  }

  return res.json();
}

export async function compareDflowVsJupiter(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number
): Promise<{ dflow: SwapQuote | null; jupiter: SwapQuote | null; best: "dflow" | "jupiter" | null }> {
  const { getJupiterQuote } = await import("./jupiter");

  const [dflowResult, jupResult] = await Promise.allSettled([
    getDflowQuote(inputMint, outputMint, amount, slippageBps),
    getJupiterQuote(inputMint, outputMint, amount, slippageBps),
  ]);

  const dflow = dflowResult.status === "fulfilled" ? dflowResult.value : null;
  const jupiter = jupResult.status === "fulfilled" ? jupResult.value : null;

  let best: "dflow" | "jupiter" | null = null;
  if (dflow && jupiter) {
    best = BigInt(dflow.outAmount) >= BigInt(jupiter.outAmount) ? "dflow" : "jupiter";
  } else if (dflow) {
    best = "dflow";
  } else if (jupiter) {
    best = "jupiter";
  }

  return { dflow, jupiter, best };
}
