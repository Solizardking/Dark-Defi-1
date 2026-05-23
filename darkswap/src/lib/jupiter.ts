import type { SwapQuote } from "@/types";

const JUP_API =
  process.env.JUPITER_ENDPOINT
    ? `${process.env.JUPITER_ENDPOINT}/v6`
    : "https://quote-api.jup.ag/v6";

function jupHeaders(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  const key = process.env.JUPITER_API_KEY ?? process.env.JUP_SWAP_V1_API_KEY;
  if (key) h["x-api-key"] = key;
  return h;
}

export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<SwapQuote> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: slippageBps.toString(),
    onlyDirectRoutes: "false",
    asLegacyTransaction: "false",
  });

  const res = await fetch(`${JUP_API}/quote?${params}`, {
    headers: jupHeaders(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jupiter quote failed: ${err}`);
  }

  return res.json();
}

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

  const res = await fetch(`${JUP_API}/swap`, {
    method: "POST",
    headers: jupHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jupiter swap failed: ${err}`);
  }

  return res.json();
}

export async function getJupiterPrice(mints: string[]): Promise<Record<string, number>> {
  const ids = mints.join(",");
  const res = await fetch(`https://price.jup.ag/v4/price?ids=${ids}`);
  if (!res.ok) return {};
  const data = await res.json();
  const prices: Record<string, number> = {};
  for (const [mint, info] of Object.entries(data.data ?? {})) {
    prices[mint] = (info as { price: number }).price;
  }
  return prices;
}
