import { NextRequest, NextResponse } from "next/server";
import { getOraclePrice } from "@/lib/oracle";
import { isSolanaAddress } from "@/lib/requestValidation";

const MAX_ORACLE_MINTS = 24;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mints = (searchParams.get("mints") ?? "")
    .split(",")
    .map((mint) => mint.trim())
    .filter(Boolean);

  if (
    mints.length === 0 ||
    mints.length > MAX_ORACLE_MINTS ||
    !mints.every(isSolanaAddress)
  ) {
    return NextResponse.json({ error: "Invalid mints param" }, { status: 400 });
  }

  const results = await Promise.all(
    mints.map((mint) => getOraclePrice(mint, process.env.BIRDEYE_API_KEY))
  );

  const prices: Record<string, number | null> = {};
  mints.forEach((mint, i) => {
    prices[mint] = results[i]?.price ?? null;
  });

  return NextResponse.json(
    { prices, timestamp: Date.now() },
    { headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=30" } }
  );
}
