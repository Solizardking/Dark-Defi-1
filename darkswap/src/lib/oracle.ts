import type { OraclePrice, OracleValidation, SwapQuote } from "@/types";
import { getTokenByAddress } from "@/lib/tokens";
import { getJupiterPrice } from "@/lib/jupiter";

const BIRDEYE_BASE = "https://public-api.birdeye.so";
const REQUEST_TIMEOUT_MS = 4_000;
const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";

async function getTokenDecimals(mint: string): Promise<number> {
  const known = getTokenByAddress(mint)?.decimals;
  if (known !== undefined) return known;

  try {
    const res = await fetch(SOLANA_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [mint, { encoding: "jsonParsed" }],
      }),
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return 6;
    const data = await res.json();
    return Number(data?.result?.value?.data?.parsed?.info?.decimals ?? 6);
  } catch {
    return 6;
  }
}

export async function fetchBirdeyePrice(
  mint: string,
  apiKey?: string
): Promise<number | null> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (apiKey) headers["X-API-KEY"] = apiKey;

    const res = await fetch(
      `${BIRDEYE_BASE}/defi/price?address=${mint}`,
      { headers, next: { revalidate: 10 }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.value ?? null;
  } catch {
    return null;
  }
}

export async function fetchJupiterPrice(mint: string): Promise<number | null> {
  try {
    const prices = await getJupiterPrice([mint]);
    return prices[mint] ?? null;
  } catch {
    return null;
  }
}

export async function getOraclePrice(
  mint: string,
  birdeyeApiKey?: string
): Promise<OraclePrice | null> {
  const bePrice = await fetchBirdeyePrice(mint, birdeyeApiKey);
  if (bePrice !== null) {
    return { mint, price: bePrice, source: "birdeye", timestamp: Date.now() };
  }

  const jupPrice = await fetchJupiterPrice(mint);
  if (jupPrice !== null) {
    return { mint, price: jupPrice, source: "jupiter", timestamp: Date.now() };
  }

  return null;
}

export async function validateOraclePrice(
  quote: SwapQuote,
  maxDeviationPct: number = 2.0,
  birdeyeApiKey?: string
): Promise<OracleValidation> {
  const [inputOracle, outputOracle] = await Promise.all([
    getOraclePrice(quote.inputMint, birdeyeApiKey),
    getOraclePrice(quote.outputMint, birdeyeApiKey),
  ]);

  const inputPrice = inputOracle?.price ?? null;
  const outputPrice = outputOracle?.price ?? null;

  if (!inputPrice || !outputPrice) {
    return {
      approved: true,
      deviation: 0,
      inputOraclePrice: inputPrice,
      outputOraclePrice: outputPrice,
      jupiterRate: 0,
      oracleRate: 0,
      message: "Oracle prices unavailable — proceeding without validation",
    };
  }

  const [inputDecimals, outputDecimals] = await Promise.all([
    getTokenDecimals(quote.inputMint),
    getTokenDecimals(quote.outputMint),
  ]);

  const inAmountNorm = Number(quote.inAmount) / Math.pow(10, inputDecimals);
  const outAmountNorm = Number(quote.outAmount) / Math.pow(10, outputDecimals);

  const jupiterRate = outAmountNorm / inAmountNorm;
  const oracleRate = inputPrice / outputPrice;

  const deviation = Math.abs((jupiterRate - oracleRate) / oracleRate) * 100;
  const approved = deviation <= maxDeviationPct;

  return {
    approved,
    deviation,
    inputOraclePrice: inputPrice,
    outputOraclePrice: outputPrice,
    jupiterRate,
    oracleRate,
    message: approved
      ? `Price validated ✓ (${deviation.toFixed(2)}% deviation)`
      : `Price deviation ${deviation.toFixed(2)}% exceeds ${maxDeviationPct}% limit`,
  };
}
