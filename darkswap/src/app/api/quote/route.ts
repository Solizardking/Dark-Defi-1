import { type NextRequest, NextResponse } from "next/server";
import { getJupiterQuote } from "@/lib/jupiter";
import { getDflowQuote } from "@/lib/dflow";
import { validateOraclePrice } from "@/lib/oracle";
import { checkTokenSafety } from "@/lib/safety";
import type { SwapQuote } from "@/types";

function makeMockQuote(inputMint: string, outputMint: string, amount: string, slippageBps: number): SwapQuote {
  const inAmt = Number(amount);
  const outAmt = Math.floor(inAmt * 142.5);
  const minOut = Math.floor(outAmt * (10000 - slippageBps) / 10000);
  return {
    inputMint,
    inAmount: amount,
    outputMint,
    outAmount: String(outAmt),
    otherAmountThreshold: String(minOut),
    swapMode: "ExactIn",
    slippageBps,
    priceImpactPct: "0.123",
    routePlan: [{
      swapInfo: {
        ammKey: "mock",
        label: "Mock (dev)",
        inputMint,
        outputMint,
        inAmount: amount,
        outAmount: String(outAmt),
        feeAmount: "200",
        feeMint: inputMint,
      },
      percent: 100,
    }],
  };
}

function pickBest(
  dflow: SwapQuote | null,
  jup: SwapQuote | null
): { quote: SwapQuote; source: string } | null {
  if (!dflow && !jup) return null;
  if (dflow && jup) {
    return Number(dflow.outAmount) >= Number(jup.outAmount)
      ? { quote: dflow, source: "dflow" }
      : { quote: jup, source: "jupiter" };
  }
  return dflow ? { quote: dflow, source: "dflow" } : { quote: jup!, source: "jupiter" };
}

async function getBestQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number
): Promise<{ quote: SwapQuote; source: string }> {
  const hasDflow = !!process.env.DFLOW_API_KEY || !!process.env.DFLOW_QUOTE_API_URL;

  if (hasDflow) {
    const [dflowResult, jupResult] = await Promise.allSettled([
      getDflowQuote(inputMint, outputMint, amount, slippageBps),
      getJupiterQuote(inputMint, outputMint, amount, slippageBps),
    ]);
    const dflow = dflowResult.status === "fulfilled" ? dflowResult.value : null;
    const jup = jupResult.status === "fulfilled" ? jupResult.value : null;
    const best = pickBest(dflow, jup);
    if (!best) throw new Error("All quote sources failed");
    return best;
  }

  try {
    const quote = await getJupiterQuote(inputMint, outputMint, amount, slippageBps);
    return { quote, source: "jupiter" };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      return { quote: makeMockQuote(inputMint, outputMint, amount, slippageBps), source: "mock" };
    }
    throw err;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = searchParams.get("amount");
  const slippageBps = Number.parseInt(searchParams.get("slippageBps") ?? "50", 10);
  const skipOracle = searchParams.get("skipOracle") === "true";
  const skipSafety = searchParams.get("skipSafety") === "true";

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json(
      { error: "inputMint, outputMint, amount are required" },
      { status: 400 }
    );
  }

  try {
    const { quote, source } = await getBestQuote(inputMint, outputMint, amount, slippageBps);

    const [oracle, safety] = await Promise.all([
      skipOracle
        ? Promise.resolve(null)
        : validateOraclePrice(quote, 2.0, process.env.BIRDEYE_API_KEY),
      skipSafety
        ? Promise.resolve(null)
        : checkTokenSafety(inputMint, outputMint),
    ]);

    return NextResponse.json({ quote, oracle, safety, source });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quote failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
