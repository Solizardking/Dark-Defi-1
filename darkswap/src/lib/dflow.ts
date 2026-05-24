import type { SwapQuote } from "@/types";

// ── Endpoints ─────────────────────────────────────────────────────────────────

// Legacy quote-only API (still used for parallel comparison)
const DFLOW_QUOTE_URL =
  process.env.DFLOW_QUOTE_API_URL ?? "https://d.quote-api.dflow.net";

// pond.dflow.net Trading API — supports sponsored swaps and order+execute flow
const DFLOW_TRADING_URL = "https://pond.dflow.net";

function dflowHeaders(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (process.env.DFLOW_API_KEY) h["x-api-key"] = process.env.DFLOW_API_KEY;
  return h;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DflowOrderResponse {
  transaction: string;
  requestId?: string;
  outAmount: string;
  inAmount: string;
  router: string;
  sponsored: boolean;
}

// ── Quote (legacy — for preview + oracle comparison) ──────────────────────────

export async function getDflowQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps = 50
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

// ── Order (pond.dflow.net) — standard or sponsored ────────────────────────────

/**
 * Get a DFlow order from pond.dflow.net.
 *
 * If `DFLOW_SPONSOR_PUBKEY` env var is set, requests a gasless sponsored swap
 * (user pays no SOL fees — sponsor wallet covers them). The sponsor must sign
 * server-side via `DFLOW_SPONSOR_KEY` before returning to the client.
 *
 * sponsorExec: false → user executes from their own token accounts (smaller tx).
 */
export async function getDflowOrder(
  inputMint: string,
  outputMint: string,
  amount: string,
  userPublicKey: string,
  slippageBps = 50
): Promise<DflowOrderResponse> {
  const sponsorPubkey = process.env.DFLOW_SPONSOR_PUBKEY;
  const sponsorKey = process.env.DFLOW_SPONSOR_KEY;
  const isSponsored = !!(sponsorPubkey && sponsorKey);

  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    userPublicKey,
    slippageBps: slippageBps.toString(),
  });

  if (isSponsored && sponsorPubkey) {
    params.set("sponsor", sponsorPubkey);
    params.set("sponsorExec", "false"); // user executes with their own accounts
  }

  const res = await fetch(`${DFLOW_TRADING_URL}/order?${params}`, {
    headers: dflowHeaders(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DFlow order failed (${res.status}): ${err}`);
  }

  const data = await res.json();

  // If sponsored: sign with sponsor keypair server-side (partial signature)
  let transaction = data.transaction as string;
  if (isSponsored && sponsorKey) {
    transaction = await sponsorSign(transaction, sponsorKey);
  }

  return {
    transaction,
    requestId: data.requestId,
    outAmount: data.outAmount ?? "0",
    inAmount: data.inAmount ?? amount,
    router: "dflow",
    sponsored: isSponsored,
  };
}

// ── Sponsor signing (server-side, Node.js only) ───────────────────────────────

async function sponsorSign(transactionBase64: string, sponsorKeyBase58: string): Promise<string> {
  const { Keypair, VersionedTransaction } = await import("@solana/web3.js");
  const bs58 = (await import("bs58")).default;

  const secretKey = bs58.decode(sponsorKeyBase58);
  const keypair = Keypair.fromSecretKey(secretKey);

  const txBytes = Buffer.from(transactionBase64, "base64");
  const tx = VersionedTransaction.deserialize(txBytes);
  tx.sign([keypair]);

  return Buffer.from(tx.serialize()).toString("base64");
}

// ── DFlow swap tx (legacy imperative path) ────────────────────────────────────

export async function getDflowSwapTransaction(
  quote: SwapQuote,
  userPublicKey: string,
  options?: { feeAccount?: string; sponsor?: string }
): Promise<{ swapTransaction: string }> {
  const body: Record<string, unknown> = {
    quoteResponse: quote,
    userPublicKey,
    wrapAndUnwrapSol: true,
    prioritizationFeeLamports: "auto",
  };
  if (options?.feeAccount) body.feeAccount = options.feeAccount;
  if (options?.sponsor) {
    body.sponsor = options.sponsor;
    body.sponsorExec = false;
  }

  const res = await fetch(`${DFLOW_TRADING_URL}/swap`, {
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

// ── Parallel comparison (kept for quote preview) ──────────────────────────────

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
    best = Number(dflow.outAmount) >= Number(jupiter.outAmount) ? "dflow" : "jupiter";
  } else if (dflow) {
    best = "dflow";
  } else if (jupiter) {
    best = "jupiter";
  }

  return { dflow, jupiter, best };
}
