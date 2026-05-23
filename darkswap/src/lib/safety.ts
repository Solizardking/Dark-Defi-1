import type { SafetyCheck, TokenRisk } from "@/types";

const SAFE_MINTS = new Set([
  "So11111111111111111111111111111111111111112",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
  "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
]);

export async function checkTokenSafety(
  inputMint: string,
  outputMint: string
): Promise<SafetyCheck> {
  const risks = await Promise.all([
    checkSingleToken(inputMint),
    checkSingleToken(outputMint),
  ]);

  const nonLow = risks.filter((r) => r.level !== "low");
  const overallLevel = nonLow.length > 0
    ? nonLow.reduce<TokenRisk["level"]>((worst, r) => {
        const order = { low: 0, medium: 1, high: 2, critical: 3 };
        return order[r.level] > order[worst] ? r.level : worst;
      }, "low")
    : "low";

  return {
    safe: overallLevel === "low" || overallLevel === "medium",
    risks,
    overallLevel,
  };
}

async function checkSingleToken(mint: string): Promise<TokenRisk> {
  if (SAFE_MINTS.has(mint)) {
    return {
      mint,
      symbol: getKnownSymbol(mint),
      level: "low",
      warnings: [],
      freezeAuthority: false,
      mintAuthority: false,
      lowLiquidity: false,
      recentlyCreated: false,
    };
  }

  try {
    const [shieldData, tokenData] = await Promise.allSettled([
      fetchJupiterShield(mint),
      fetchTokenMetadata(mint),
    ]);

    const shield = shieldData.status === "fulfilled" ? shieldData.value : null;
    const meta = tokenData.status === "fulfilled" ? tokenData.value : null;

    const warnings: string[] = [];
    let freezeAuthority = false;
    let mintAuthority = false;
    let lowLiquidity = false;
    let recentlyCreated = false;

    if (shield) {
      if (shield.hasFreeze) { freezeAuthority = true; warnings.push("Freeze authority present — issuer can freeze your tokens"); }
      if (shield.hasMint) { mintAuthority = true; warnings.push("Mint authority present — supply can be inflated"); }
      if (shield.topHoldersOwn > 80) warnings.push(`Top holders own ${shield.topHoldersOwn}% — high concentration risk`);
    }

    if (meta) {
      if (meta.liquidity && meta.liquidity < 10000) {
        lowLiquidity = true;
        warnings.push(`Low liquidity ($${meta.liquidity.toLocaleString()}) — slippage risk`);
      }
      if (meta.ageHours && meta.ageHours < 168) {
        recentlyCreated = true;
        warnings.push(`Token created < 7 days ago — increased rug risk`);
      }
    }

    const level: TokenRisk["level"] =
      warnings.length === 0 ? "low"
      : (freezeAuthority || mintAuthority) && lowLiquidity ? "critical"
      : freezeAuthority || mintAuthority ? "high"
      : lowLiquidity || recentlyCreated ? "medium"
      : "low";

    return {
      mint,
      symbol: meta?.symbol ?? mint.slice(0, 6) + "...",
      level,
      warnings,
      freezeAuthority,
      mintAuthority,
      lowLiquidity,
      recentlyCreated,
    };
  } catch {
    return {
      mint,
      symbol: mint.slice(0, 6) + "...",
      level: "medium",
      warnings: ["Unable to fetch safety data — proceed with caution"],
      freezeAuthority: false,
      mintAuthority: false,
      lowLiquidity: false,
      recentlyCreated: false,
    };
  }
}

async function fetchJupiterShield(mint: string) {
  const res = await fetch(
    `https://tokens.jup.ag/token/${mint}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return {
    hasFreeze: !!data.freezeAuthority,
    hasMint: !!data.mintAuthority,
    topHoldersOwn: 0,
  };
}

async function fetchTokenMetadata(mint: string) {
  const res = await fetch(
    `https://public-api.birdeye.so/defi/token_overview?address=${mint}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const d = data?.data;
  return d
    ? {
        symbol: d.symbol,
        liquidity: d.liquidity,
        ageHours: d.creation_time
          ? (Date.now() / 1000 - d.creation_time) / 3600
          : null,
      }
    : null;
}

function getKnownSymbol(mint: string): string {
  const map: Record<string, string> = {
    "So11111111111111111111111111111111111111112": "SOL",
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
    "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": "JUP",
  };
  return map[mint] ?? mint.slice(0, 6) + "...";
}
