import { type NextRequest, NextResponse } from "next/server";
import { getJupiterOrder } from "@/lib/jupiter";
import { getDflowOrder } from "@/lib/dflow";

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
  let inputMint: string, outputMint: string, amount: string, taker: string;
  let slippageBps = 50;

  try {
    const body = await req.json();
    inputMint = body.inputMint;
    outputMint = body.outputMint;
    amount = body.amount;
    taker = body.taker;
    if (body.slippageBps) slippageBps = Number(body.slippageBps);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!inputMint || !outputMint || !amount || !taker) {
    return NextResponse.json(
      { error: "inputMint, outputMint, amount, taker are required" },
      { status: 400 }
    );
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
