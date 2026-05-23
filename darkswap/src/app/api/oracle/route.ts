import { NextRequest, NextResponse } from "next/server";
import { getOraclePrice } from "@/lib/oracle";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mints = searchParams.get("mints")?.split(",") ?? [];

  if (mints.length === 0) {
    return NextResponse.json({ error: "mints param required" }, { status: 400 });
  }

  const results = await Promise.all(
    mints.map((mint) => getOraclePrice(mint.trim(), process.env.BIRDEYE_API_KEY))
  );

  const prices: Record<string, number | null> = {};
  mints.forEach((mint, i) => {
    prices[mint.trim()] = results[i]?.price ?? null;
  });

  return NextResponse.json({ prices, timestamp: Date.now() });
}
