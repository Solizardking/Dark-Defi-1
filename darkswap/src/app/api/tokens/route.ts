import { NextRequest, NextResponse } from "next/server";
import { POPULAR_TOKENS } from "@/lib/tokens";
import type { Token } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q") ?? "";

  if (!query || query.length < 2) {
    return NextResponse.json(POPULAR_TOKENS);
  }

  const lower = query.toLowerCase();
  const local = POPULAR_TOKENS.filter(
    (t) =>
      t.symbol.toLowerCase().includes(lower) ||
      t.name.toLowerCase().includes(lower) ||
      t.address.toLowerCase() === lower
  );

  if (local.length > 0) {
    return NextResponse.json(local);
  }

  try {
    const res = await fetch(
      `https://tokens.jup.ag/tokens?tags=verified&search=${encodeURIComponent(query)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return NextResponse.json(POPULAR_TOKENS);
    const data: Token[] = await res.json();
    return NextResponse.json(Array.isArray(data) ? data.slice(0, 30) : POPULAR_TOKENS);
  } catch {
    return NextResponse.json(POPULAR_TOKENS);
  }
}
