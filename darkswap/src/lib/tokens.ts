import type { Token } from "@/types";

const JUPITER_TOKEN_SEARCH_URL = "https://lite-api.jup.ag/ultra/v1/search";

export const POPULAR_TOKENS: Token[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    tags: ["native"],
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    tags: ["stablecoin"],
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
    tags: ["stablecoin"],
  },
  {
    address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    symbol: "JUP",
    name: "Jupiter",
    decimals: 6,
    logoURI: "https://static.jup.ag/jup/icon.png",
  },
  {
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    symbol: "RAY",
    name: "Raydium",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
  },
  {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
    logoURI: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
  },
  {
    address: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    symbol: "ETH",
    name: "Ethereum (Wormhole)",
    decimals: 8,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png",
  },
  {
    address: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh/logo.png",
  },
];

export const WSOL = POPULAR_TOKENS[0];
export const USDC = POPULAR_TOKENS[1];

export function formatAmount(amount: string, decimals: number): string {
  const num = Number(amount) / Math.pow(10, decimals);
  if (num === 0) return "0";
  if (num < 0.001) return num.toExponential(4);
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(4);
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function parseAmount(value: string, decimals: number): string {
  const normalized = value.trim();
  if (!/^\d*\.?\d*$/.test(normalized) || normalized === "" || normalized === ".") {
    return "0";
  }

  const [whole = "0", fraction = ""] = normalized.split(".");
  const wholeUnits = BigInt(whole || "0") * (10n ** BigInt(decimals));
  const fractionUnits = BigInt((fraction.padEnd(decimals, "0").slice(0, decimals)) || "0");

  return (wholeUnits + fractionUnits).toString();
}

export function getTokenBySymbol(symbol: string): Token | undefined {
  return POPULAR_TOKENS.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

export function getTokenByAddress(address: string): Token | undefined {
  return POPULAR_TOKENS.find((t) => t.address === address);
}

export async function searchTokens(query: string): Promise<Token[]> {
  if (!query) return POPULAR_TOKENS;
  const lower = query.toLowerCase();
  const local = POPULAR_TOKENS.filter(
    (t) =>
      t.symbol.toLowerCase().includes(lower) ||
      t.name.toLowerCase().includes(lower) ||
      t.address.toLowerCase().includes(lower)
  );
  if (local.length > 0) return local;

  try {
    const params = new URLSearchParams({ query });
    const res = await fetch(`${JUPITER_TOKEN_SEARCH_URL}?${params}`);
    if (!res.ok) return POPULAR_TOKENS;
    const data = await res.json();
    if (!Array.isArray(data)) return POPULAR_TOKENS;

    const mapped = data
      .map((token: Record<string, unknown>) => ({
        address: String(token.id ?? ""),
        symbol: String(token.symbol ?? "UNKNOWN"),
        name: String(token.name ?? token.symbol ?? "Unknown Token"),
        decimals: Number(token.decimals ?? 0),
        logoURI: typeof token.icon === "string" ? token.icon : undefined,
        tags: Array.isArray(token.tags)
          ? token.tags.filter((tag): tag is string => typeof tag === "string")
          : undefined,
      }))
      .filter((token: Token) => token.address);

    return mapped.length > 0 ? mapped.slice(0, 20) : POPULAR_TOKENS;
  } catch {
    return POPULAR_TOKENS;
  }
}
