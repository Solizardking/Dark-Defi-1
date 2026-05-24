import { type NextRequest, NextResponse } from "next/server";
import { getJupiterOrder } from "@/lib/jupiter";
import { getDflowOrder } from "@/lib/dflow";
import { isRawTokenAmount, isSolanaAddress, parseSlippageBps } from "@/lib/requestValidation";

/**
 * POST /api/swap
 *
 * Builds an assembled, ready-to-sign swap transaction using the best available
 * router (DFlow sponsored > DFlow direct > Jupiter Meta-Aggregator).
 *
 * Body: { inputMint, outputMint, amount, taker, slippageBps? }
 *
 * Returns: { transaction, requestId?, router, sponsored }
 *   - transaction: base64-encoded (partially signed if sponsored)
 *   - requestId: pass to /api/execute when using Jupiter execution
 *   - sponsored: if true, user signs + sends via RPC (no /execute needed)
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { inputMint, outputMint, amount, taker } = body;
  const slippageBps = parseSlippageBps(body.slippageBps);

  if (!isSolanaAddress(inputMint) || !isSolanaAddress(outputMint) || !isSolanaAddress(taker)) {
    return NextResponse.json({ error: "Valid inputMint, outputMint, and taker are required" }, { status: 400 });
  }

  if (inputMint === outputMint) {
    return NextResponse.json({ error: "inputMint and outputMint must differ" }, { status: 400 });
  }

  if (!isRawTokenAmount(amount)) {
    return NextResponse.json({ error: "amount must be a positive raw token amount" }, { status: 400 });
  }

  if (slippageBps === null) {
    return NextResponse.json({ error: "slippageBps must be an integer from 1 to 1000" }, { status: 400 });
  }

  const hasDflow = !!process.env.DFLOW_API_KEY;
  const hasSponsored = !!(process.env.DFLOW_SPONSOR_PUBKEY && process.env.DFLOW_SPONSOR_KEY);

  // Try DFlow first when key is present
  if (hasDflow) {
    try {
      const order = await getDflowOrder(inputMint, outputMint, amount, taker, slippageBps);
      return NextResponse.json(order);
    } catch {
      // Fall through to Jupiter
    }
  }

  // Jupiter v2 Meta-Aggregator — all routers compete (iris, jupiterz, dflow, okx)
  try {
    const order = await getJupiterOrder(inputMint, outputMint, amount, slippageBps, taker);
    if (order.errorCode) {
      throw new Error(order.errorMessage ?? `Order error ${order.errorCode}`);
    }
    return NextResponse.json({
      transaction: order.transaction,
      requestId: order.requestId,
      outAmount: order.outAmount,
      router: order.router,
      sponsored: false,
      hasSponsored,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
