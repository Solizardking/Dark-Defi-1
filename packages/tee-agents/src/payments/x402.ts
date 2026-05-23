import { sha256, sign, verifySignature, toBase58, fromBase58, toHex } from "../crypto.js";

/**
 * x402 — HTTP 402 "Payment Required" for machine-to-machine payments, adapted
 * to Solana and Dark Protocol's private settlement.
 *
 * Standard x402 leaks payer, amount, and asset on a public chain. The
 * `dark-shielded` scheme instead carries a signed authorization that a
 * facilitator settles from a shielded balance / ephemeral account, so the
 * resource server learns only that payment cleared — not who paid or how much.
 */

export type X402Scheme = "exact" | "dark-shielded";
export type X402Network = "solana-devnet" | "solana-mainnet" | "solana-localnet";

export interface PaymentRequirements {
  scheme: X402Scheme;
  network: X402Network;
  /** Atomic units (e.g. USDC has 6 decimals) the client must pay. */
  maxAmountRequired: string;
  /** The resource being paid for, e.g. an inference endpoint URL. */
  resource: string;
  description: string;
  mimeType: string;
  /** Recipient address (resource server / agent treasury). */
  payTo: string;
  maxTimeoutSeconds: number;
  /** Asset mint address. */
  asset: string;
  /** Scheme-specific extras (e.g. shielded pool id). */
  extra?: Record<string, unknown>;
}

export interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentRequirements[];
  error?: string;
}

/** The signed, scheme-specific authorization a client returns in `X-PAYMENT`. */
export interface PaymentPayload {
  x402Version: number;
  scheme: X402Scheme;
  network: X402Network;
  payload: {
    /** base58 ed25519 public key of the payer authorization key. */
    from: string;
    payTo: string;
    asset: string;
    /** Atomic amount committed. For dark-shielded this is a Pedersen-style commitment hex, not a cleartext amount. */
    value: string;
    /** sha256 hex of the resource + nonce, binds the payment to one request. */
    resourceHash: string;
    nonce: string;
    validUntil: number;
    /** base58 ed25519 signature over the canonical authorization. */
    signature: string;
    /** When true, `value` is a commitment and the real amount is settled privately. */
    confidential: boolean;
  };
}

export const X402_VERSION = 1;

export function buildPaymentRequirements(
  params: Partial<PaymentRequirements> &
    Pick<PaymentRequirements, "maxAmountRequired" | "resource" | "payTo" | "asset" | "network">
): PaymentRequiredResponse {
  return {
    x402Version: X402_VERSION,
    accepts: [
      {
        scheme: params.scheme ?? "dark-shielded",
        network: params.network,
        maxAmountRequired: params.maxAmountRequired,
        resource: params.resource,
        description: params.description ?? "Confidential AI inference",
        mimeType: params.mimeType ?? "application/json",
        payTo: params.payTo,
        maxTimeoutSeconds: params.maxTimeoutSeconds ?? 120,
        asset: params.asset,
        extra: params.extra,
      },
    ],
  };
}

function canonicalAuthorization(p: PaymentPayload["payload"]): Uint8Array {
  const msg = [
    "x402-dark/v1",
    p.from,
    p.payTo,
    p.asset,
    p.value,
    p.resourceHash,
    p.nonce,
    String(p.validUntil),
    String(p.confidential),
  ].join("\n");
  return new TextEncoder().encode(msg);
}

/**
 * A source of payment authorizations. The Dark wallet implements this by
 * signing against a shielded balance; {@link LocalSignerPayer} is a dev impl.
 */
export interface PrivatePayer {
  /** base58 ed25519 public key identifying the authorization key. */
  publicKey: string;
  /** Whether payments settle confidentially (shielded). */
  confidential: boolean;
  authorize(req: PaymentRequirements, resourceHash: string): Promise<PaymentPayload>;
}

/** Dev payer: signs a cleartext authorization with a local ed25519 key. */
export class LocalSignerPayer implements PrivatePayer {
  readonly publicKey: string;
  readonly confidential: boolean;
  private readonly secretKey: Uint8Array;

  constructor(keypair: { publicKey: Uint8Array; secretKey: Uint8Array }, confidential = true) {
    this.publicKey = toBase58(keypair.publicKey);
    this.secretKey = keypair.secretKey;
    this.confidential = confidential;
  }

  async authorize(req: PaymentRequirements, resourceHash: string): Promise<PaymentPayload> {
    const nonce = toBase58(sha256(`${resourceHash}:${Date.now()}:${Math.random()}`).slice(0, 16));
    // For a shielded payment we publish a commitment to the amount, not the amount.
    const value = this.confidential
      ? toHex(sha256(`${req.maxAmountRequired}:${nonce}`))
      : req.maxAmountRequired;

    const payload: PaymentPayload["payload"] = {
      from: this.publicKey,
      payTo: req.payTo,
      asset: req.asset,
      value,
      resourceHash,
      nonce,
      validUntil: Math.floor(Date.now() / 1000) + req.maxTimeoutSeconds,
      signature: "",
      confidential: this.confidential,
    };
    payload.signature = toBase58(sign(canonicalAuthorization(payload), this.secretKey));

    return { x402Version: X402_VERSION, scheme: req.scheme, network: req.network, payload };
  }
}

export function resourceHash(resource: string, requestNonce: string): string {
  return toHex(sha256(`${resource}|${requestNonce}`));
}

/** Encode a payment payload into the value of the `X-PAYMENT` HTTP header. */
export function encodePaymentHeader(payload: PaymentPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function decodePaymentHeader(header: string): PaymentPayload {
  return JSON.parse(Buffer.from(header, "base64").toString("utf8")) as PaymentPayload;
}

export interface PaymentVerification {
  valid: boolean;
  reasons: string[];
}

/**
 * Verify a payment authorization: signature validity, recipient/asset match,
 * resource binding, and freshness. Actual on-chain/shielded settlement is
 * performed by the facilitator after this passes.
 */
export function verifyPayment(
  payload: PaymentPayload,
  req: PaymentRequirements,
  expectedResourceHash: string
): PaymentVerification {
  const reasons: string[] = [];
  const p = payload.payload;

  if (payload.scheme !== req.scheme) reasons.push("scheme mismatch");
  if (payload.network !== req.network) reasons.push("network mismatch");
  if (p.payTo !== req.payTo) reasons.push("payTo does not match requirements");
  if (p.asset !== req.asset) reasons.push("asset does not match requirements");
  if (p.resourceHash !== expectedResourceHash) reasons.push("resource hash mismatch");
  if (p.validUntil < Math.floor(Date.now() / 1000)) reasons.push("authorization expired");

  const sigOk = verifySignature(
    canonicalAuthorization(p),
    fromBase58(p.signature),
    fromBase58(p.from)
  );
  if (!sigOk) reasons.push("authorization signature invalid");

  return { valid: reasons.length === 0, reasons };
}
