import { NextRequest, NextResponse } from "next/server";
import { checkTokenSafety } from "@/lib/safety";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");

  if (!inputMint || !outputMint) {
    return NextResponse.json(
      { error: "inputMint and outputMint are required" },
      { status: 400 }
    );
  }

  try {
    const safety = await checkTokenSafety(inputMint, outputMint);
    return NextResponse.json(safety);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Safety check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
