import { NextRequest, NextResponse } from "next/server";
import { POPULAR_TOKENS } from "@/lib/tokens";
import type { Token } from "@/types";

const JUPITER_TOKEN_SEARCH_URL = "https://lite-api.jup.ag/ultra/v1/search";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q") ?? "";

  if (!query) {
    return NextResponse.json(POPULAR_TOKENS);
  }

  const lower = query.toLowerCase();
  const local = POPULAR_TOKENS.filter(
    (t) =>
      t.symbol.toLowerCase().includes(lower) ||
      t.name.toLowerCase().includes(lower) ||
      t.address.toLowerCase().includes(lower)
  );

  if (local.length > 0) {
    return NextResponse.json(local);
  }

  try {
    const params = new URLSearchParams({ query });
    const res = await fetch(`${JUPITER_TOKEN_SEARCH_URL}?${params}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json(POPULAR_TOKENS);
    const data = await res.json();
    const mapped = Array.isArray(data)
      ? data
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
          .filter((token: Token) => token.address)
      : [];
    return NextResponse.json(mapped.length > 0 ? mapped.slice(0, 30) : POPULAR_TOKENS);
  } catch {
    return NextResponse.json(POPULAR_TOKENS);
  }
}
