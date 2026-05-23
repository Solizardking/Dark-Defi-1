import type { SwapQuote } from "@/types";

const JUP_API = "https://quote-api.jup.ag/v6";

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
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
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
