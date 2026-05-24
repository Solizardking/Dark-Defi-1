import { type NextRequest, NextResponse } from "next/server";
import { executeJupiterOrder } from "@/lib/jupiter";

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
  let signedTransaction: string, requestId: string;

  try {
    const body = await req.json();
    signedTransaction = body.signedTransaction;
    requestId = body.requestId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!signedTransaction || !requestId) {
    return NextResponse.json(
      { error: "signedTransaction and requestId are required" },
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
