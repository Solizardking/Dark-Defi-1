import { type NextRequest, NextResponse } from "next/server";
import { getJupiterOrder, getJupiterQuote } from "@/lib/jupiter";
import { getDflowQuote } from "@/lib/dflow";
import { validateOraclePrice } from "@/lib/oracle";
import { isRawTokenAmount, isSolanaAddress, parseSlippageBps } from "@/lib/requestValidation";
import { checkTokenSafety } from "@/lib/safety";
import type { SwapQuote } from "@/types";

type QuoteResult = { quote: SwapQuote; source: string; router?: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickBest(a: QuoteResult | null, b: QuoteResult | null): QuoteResult | null {
  if (!a && !b) return null;
  if (a && b) return Number(a.quote.outAmount) >= Number(b.quote.outAmount) ? a : b;
  return a ?? b;
}

function makeMockQuote(
  inputMint: string, outputMint: string, amount: string, slippageBps: number
): SwapQuote {
  const inAmt = Number(amount);
  const outAmt = Math.floor(inAmt * 142.5);
  return {
    inputMint, inAmount: amount, outputMint,
    outAmount: String(outAmt),
    otherAmountThreshold: String(Math.floor(outAmt * (10000 - slippageBps) / 10000)),
    swapMode: "ExactIn", slippageBps, priceImpactPct: "0.123",
    routePlan: [{ swapInfo: { ammKey: "mock", label: "Mock (dev)", inputMint, outputMint, inAmount: amount, outAmount: String(outAmt) }, percent: 100 }],
  };
}

// ── Meta-Aggregator path (v2 /order, no taker — all routers compete) ──────────

async function tryMetaAggregator(
  inputMint: string, outputMint: string, amount: string, slippageBps: number
): Promise<QuoteResult | null> {
  try {
    const order = await getJupiterOrder(inputMint, outputMint, amount, slippageBps);
    const quote: SwapQuote = {
      inputMint: order.inputMint, inAmount: order.inAmount,
      outputMint: order.outputMint, outAmount: order.outAmount,
      otherAmountThreshold: order.otherAmountThreshold,
      swapMode: "ExactIn", slippageBps: order.slippageBps,
      priceImpactPct: order.priceImpactPct, routePlan: order.routePlan,
      platformFee: order.platformFee,
    };
    return { quote, source: order.router ?? "jupiter", router: order.router };
  } catch {
    return null;
  }
}

// ── DFlow direct path (legacy quote API) ──────────────────────────────────────

async function tryDflow(
  inputMint: string, outputMint: string, amount: string, slippageBps: number
): Promise<QuoteResult | null> {
  try {
    const q = await getDflowQuote(inputMint, outputMint, amount, slippageBps);
    return { quote: q as SwapQuote, source: "dflow" };
  } catch {
    return null;
  }
}

// ── v1 fallback path ──────────────────────────────────────────────────────────

async function tryJupiterV1(
  inputMint: string, outputMint: string, amount: string, slippageBps: number
): Promise<QuoteResult | null> {
  try {
    const quote = await getJupiterQuote(inputMint, outputMint, amount, slippageBps);
    return { quote, source: "jupiter" };
  } catch {
    return null;
  }
}

// ── Main quote selector ───────────────────────────────────────────────────────

async function getBestQuote(
  inputMint: string, outputMint: string, amount: string, slippageBps: number
): Promise<QuoteResult> {
  const hasDflow = !!process.env.DFLOW_API_KEY || !!process.env.DFLOW_QUOTE_API_URL;

  // Meta-Aggregator already includes DFlow as a competing router.
  // If we also have a DFlow key, race both for the absolute best price.
  const [metaResult, dflowResult] = await Promise.all([
    tryMetaAggregator(inputMint, outputMint, amount, slippageBps),
    hasDflow ? tryDflow(inputMint, outputMint, amount, slippageBps) : Promise.resolve(null),
  ]);

  const best = pickBest(metaResult, dflowResult);
  if (best) return best;

  // v1 fallback
  const v1 = await tryJupiterV1(inputMint, outputMint, amount, slippageBps);
  if (v1) return v1;

  if (process.env.NODE_ENV === "development") {
    return { quote: makeMockQuote(inputMint, outputMint, amount, slippageBps), source: "mock" };
  }

  throw new Error("All quote sources failed");
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = searchParams.get("amount");
  const slippageBps = parseSlippageBps(searchParams.get("slippageBps"));
  const skipOracle = searchParams.get("skipOracle") === "true";
  const skipSafety = searchParams.get("skipSafety") === "true";

  if (!isSolanaAddress(inputMint) || !isSolanaAddress(outputMint)) {
    return NextResponse.json({ error: "Valid inputMint and outputMint are required" }, { status: 400 });
  }

  if (inputMint === outputMint) {
    return NextResponse.json({ error: "inputMint and outputMint must differ" }, { status: 400 });
  }

  if (!isRawTokenAmount(amount)) {
    return NextResponse.json({ error: "amount must be a positive raw token amount" }, { status: 400 });
  }

  if (slippageBps === null) {
    return NextResponse.json({ error: "slippageBps must be an integer from 1 to 1000" }, { status: 400 });
  }

  try {
    const { quote, source, router } = await getBestQuote(inputMint, outputMint, amount, slippageBps);

    const [oracle, safety] = await Promise.all([
      skipOracle ? Promise.resolve(null) : validateOraclePrice(quote, 5.0, process.env.BIRDEYE_API_KEY),
      skipSafety ? Promise.resolve(null) : checkTokenSafety(inputMint, outputMint),
    ]);

    return NextResponse.json({ quote, oracle, safety, source, router });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quote failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
