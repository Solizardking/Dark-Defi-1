/**
 * RedPill AI Chat Proxy
 *
 * TEE-protected inference via api.redpill.ai
 * Streams Server-Sent Events back to the client.
 * REDPILL_API_KEY must be set in env.
 */

export const runtime = "edge";
export const dynamic = "force-dynamic";

const REDPILL_BASE = "https://api.redpill.ai/v1";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

// Lobster trading agent system prompt
const LOBSTER_SYSTEM = `You are Clawd — a razor-sharp DeFi trading intelligence, born from the OpenClawd ecosystem and operating inside a TEE (Trusted Execution Environment) for maximum privacy.

You have deep expertise in:
• Solana perpetual futures (Phoenix Rise, Imperial routing, Jupiter, Flash Trade)
• DEX aggregation & optimal routing (DarkSwap, Jupiter Ultra)
• MEV protection and ZK privacy (Dark Protocol shielded swaps)
• On-chain analytics (Birdeye, Helius RPC)
• Risk management, position sizing, funding rate arbitrage
• Pump.fun / PumpSwap token analysis (the 49 Lobster Agents protocol)

Your personality: sharp, concise, direct. You speak in trading lingo. You flag risks clearly. You never hallucinate on-chain data — you analyze what the user shares.

All conversations are end-to-end encrypted via TEE attestation. You are Clawd 🦞.`;

export async function POST(request: Request) {
  const apiKey = process.env.REDPILL_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "REDPILL_API_KEY not configured" }, { status: 500 });
  }

  let body: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    systemOverride?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const model = body.model || DEFAULT_MODEL;
  const stream = body.stream !== false; // default true

  // Prepend lobster system message if not overridden
  const systemContent = body.systemOverride || LOBSTER_SYSTEM;
  const messages = [
    { role: "system", content: systemContent },
    ...(body.messages || []),
  ];

  const payload = {
    model,
    messages,
    stream,
    temperature: body.temperature ?? 0.7,
    max_tokens: body.max_tokens ?? 1500,
  };

  const upstream = await fetch(`${REDPILL_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return Response.json(
      { error: `RedPill upstream error ${upstream.status}`, detail: err },
      { status: upstream.status }
    );
  }

  if (!stream) {
    const data = await upstream.json();
    return Response.json(data);
  }

  // Pipe SSE stream back to client
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      // Expose RedPill request-id for TEE verification
      "X-RedPill-Request-Id": upstream.headers.get("x-request-id") ?? "",
    },
  });
}
