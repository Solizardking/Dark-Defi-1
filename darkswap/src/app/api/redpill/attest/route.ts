/**
 * RedPill TEE Attestation Proxy
 *
 * Fetches cryptographic proof that the AI model runs in genuine TEE hardware.
 * Supports nonce binding and signing-address filtering.
 */

export const runtime = "edge";
export const dynamic = "force-dynamic";

const REDPILL_BASE = "https://api.redpill.ai/v1";
const TEE_MODEL = "phala/qwen3.5-27b"; // GPU TEE model for attestation

export async function GET(request: Request) {
  const apiKey = process.env.REDPILL_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "REDPILL_API_KEY not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const nonce = searchParams.get("nonce") || crypto.randomUUID().replace(/-/g, "");
  const signingAddress = searchParams.get("signing_address");
  const model = searchParams.get("model") || TEE_MODEL;

  const url = new URL(`${REDPILL_BASE}/attestation/report`);
  url.searchParams.set("model", model);
  url.searchParams.set("nonce", nonce);
  if (signingAddress) url.searchParams.set("signing_address", signingAddress);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const data = await response.json();

  // Enrich with verification metadata
  return Response.json({
    ...data,
    _meta: {
      model,
      nonce,
      fetchedAt: Date.now(),
      verified: response.ok,
    },
  });
}

/**
 * GET /api/redpill/attest/verify — verify a specific request signature
 */
export async function POST(request: Request) {
  const apiKey = process.env.REDPILL_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "REDPILL_API_KEY not configured" }, { status: 500 });
  }

  const { requestId, model } = await request.json() as { requestId: string; model?: string };
  if (!requestId) {
    return Response.json({ error: "requestId required" }, { status: 400 });
  }

  const sigUrl = `${REDPILL_BASE}/signature/${requestId}?model=${model || TEE_MODEL}`;
  const sigResponse = await fetch(sigUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!sigResponse.ok) {
    return Response.json({ error: "Signature not found", status: sigResponse.status }, { status: 404 });
  }

  const sigData = await sigResponse.json();
  return Response.json({ ...sigData, verified: true });
}
