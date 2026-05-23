/**
 * Confidential inference attestation helpers.
 *
 * Adapted from the `inference` package in the SAS attestation workspace.
 * Records on-chain proof that a prompt/response pair was processed by a
 * TEE-attested model and optionally paid for via x402.
 */

import { createHash } from "node:crypto";
import { INFERENCE_RECEIPT_SCHEMA } from "./schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InferenceAttestation {
  inferenceId: string;
  agentId: string;
  /** SHA-256 of the (possibly encrypted) prompt bytes. */
  promptHash: Uint8Array;
  /** SHA-256 of the (possibly encrypted) response bytes. */
  responseHash: Uint8Array;
  /** Unix timestamp (seconds). */
  timestamp: bigint;
  /** True when the prompt/response were end-to-end encrypted. */
  isConfidential: boolean;
  /** Amount paid in smallest units (e.g. USDC micro-cents). */
  amountPaid: bigint;
  /** Mint address of the payment asset. */
  payAsset: string;
  network: string;
}

export interface InferenceConfig {
  demoMode?: boolean;
  solanaRpcUrl?: string;
  credentialAddress?: string;
  schemaAddress?: string;
  signerPrivateKeyBytes?: Uint8Array;
}

export interface AttestationResult {
  attestationAddress: string;
  txSignature?: string;
  demoMode: boolean;
}

// ─── Hash helpers ─────────────────────────────────────────────────────────────

export function hashPrompt(promptText: string): Uint8Array {
  return new Uint8Array(
    createHash("sha256").update(Buffer.from(promptText, "utf8")).digest()
  );
}

export function hashResponse(responseText: string): Uint8Array {
  return new Uint8Array(
    createHash("sha256").update(Buffer.from(responseText, "utf8")).digest()
  );
}

// ─── On-chain / demo recording ────────────────────────────────────────────────

/**
 * Record an inference attestation on-chain (or in demo mode).
 *
 * Demo mode: derives a deterministic pseudo-address and returns immediately.
 * Live mode:  serialises the `InferenceReceiptData` against the on-chain schema
 *             and submits a `createAttestation` instruction via SAS.
 */
export async function recordInferenceAttestation(
  attestation: InferenceAttestation,
  config: InferenceConfig = {}
): Promise<AttestationResult> {
  const isDemoMode =
    config.demoMode ?? (!config.solanaRpcUrl || !config.credentialAddress);

  if (isDemoMode) {
    return _recordDemo(attestation);
  }
  return _recordOnChain(
    attestation,
    config as Required<Omit<InferenceConfig, "demoMode">> & { demoMode?: boolean }
  );
}

// ── Demo ──────────────────────────────────────────────────────────────────────

function _recordDemo(att: InferenceAttestation): AttestationResult {
  const promptHex = Buffer.from(att.promptHash).toString("hex");
  const seed = `demo:${att.inferenceId}:${promptHex}:${att.timestamp}`;
  const hash = createHash("sha256").update(seed).digest();
  const attestationAddress = toBase58Like(hash);
  return { attestationAddress, demoMode: true };
}

// ── Live ──────────────────────────────────────────────────────────────────────

async function _recordOnChain(
  att: InferenceAttestation,
  config: {
    solanaRpcUrl: string;
    credentialAddress: string;
    schemaAddress: string;
    signerPrivateKeyBytes?: Uint8Array;
  }
): Promise<AttestationResult> {
  // Dynamic imports keep the package lightweight for demo-only users.
  const {
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    createKeyPairSignerFromBytes,
    address,
    pipe,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstruction,
    signTransactionMessageWithSigners,
    sendAndConfirmTransactionFactory,
    getSignatureFromTransaction,
  } = await import("@solana/kit");

  const { fetchSchema } = await import("../generated/accounts/schema");
  const { getCreateAttestationInstruction } = await import(
    "../generated/instructions/createAttestation"
  );
  const { deriveAttestationPda } = await import("../pdas");
  const { serializeAttestationData } = await import("../utils");

  const rpc = createSolanaRpc(config.solanaRpcUrl);
  const rpcSubscriptions = createSolanaRpcSubscriptions(
    config.solanaRpcUrl.replace(/^http/, "ws")
  );

  if (!config.signerPrivateKeyBytes) {
    throw new Error("signerPrivateKeyBytes is required for on-chain recording");
  }
  const signer = await createKeyPairSignerFromBytes(config.signerPrivateKeyBytes);

  const data: Record<string, unknown> = {
    agent_id: att.agentId,
    request_hash: Buffer.from(att.promptHash).toString("hex"),
    response_hash: Buffer.from(att.responseHash).toString("hex"),
    amount_paid: att.amountPaid,
    pay_asset: att.payAsset,
    network: att.network,
    timestamp: att.timestamp,
    confidential: att.isConfidential,
  };

  const schemaAddr = address(config.schemaAddress);
  const schemaAccount = await fetchSchema(rpc, schemaAddr);
  const serialised = serializeAttestationData(schemaAccount.data, data);

  // Stable nonce derived from inferenceId
  const nonceBytes = createHash("sha256")
    .update(att.inferenceId)
    .digest()
    .slice(0, 32);
  const nonceAddress = address(toBase58Like(nonceBytes));

  const credentialAddr = address(config.credentialAddress);

  const [attestationPda] = await deriveAttestationPda({
    credential: credentialAddr,
    schema: schemaAddr,
    nonce: nonceAddress,
  });

  const ix = getCreateAttestationInstruction({
    payer: signer,
    authority: signer,
    credential: credentialAddr,
    schema: schemaAddr,
    attestation: attestationPda,
    nonce: nonceAddress,
    data: serialised,
    expiry: BigInt(0),
  });

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(signer.address, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstruction(ix, tx)
  );

  const signed = await signTransactionMessageWithSigners(message);
  const sendAndConfirm = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  } as Parameters<typeof sendAndConfirmTransactionFactory>[0]);
  await sendAndConfirm(signed as Parameters<typeof sendAndConfirm>[0], {
    commitment: "confirmed",
  });
  const txSignature = getSignatureFromTransaction(signed);

  return {
    attestationAddress: attestationPda as unknown as string,
    txSignature,
    demoMode: false,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBase58Like(buf: Buffer | Uint8Array): string {
  const ALPHABET =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return Array.from(b)
    .map((byte) => ALPHABET[byte % ALPHABET.length])
    .join("");
}

export { INFERENCE_RECEIPT_SCHEMA };
