import { type NextRequest, NextResponse } from "next/server";
import { executeJupiterOrder } from "@/lib/jupiter";
import { isBase64Payload, isBoundedString } from "@/lib/requestValidation";

/**
 * POST /api/execute
 *
 * Proxies to Jupiter Meta-Aggregator /execute.
 * Jupiter handles: priority fees, transaction landing, retries, confirmation.
 *
 * Body: { signedTransaction, requestId }
 * Returns: { status, signature, inputAmountResult, outputAmountResult, code }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { signedTransaction, requestId } = body;

  if (!isBase64Payload(signedTransaction, 200_000) || !isBoundedString(requestId, 200)) {
    return NextResponse.json(
      { error: "Valid signedTransaction and requestId are required" },
      { status: 400 }
    );
  }

  try {
    const result = await executeJupiterOrder(signedTransaction, requestId);
    const status = result.status === "Success" ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Execute failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
