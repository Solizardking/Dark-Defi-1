/**
 * Lightweight agent-registry helper.
 *
 * Adapted from the `agent-router` package in the SAS attestation workspace.
 * Supports both live on-chain mode (via @solana/kit) and demo mode (no RPC
 * required) so the terminal can be tested without a funded wallet.
 */

import { createHash } from "node:crypto";
import { SAS_PROGRAM_ID } from "./programs";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentCapability {
  name: string;
  version: string;
  description?: string;
}

export interface RegistrationRequest {
  agentId: string;
  capabilities: AgentCapability[];
  /** HTTP/WebSocket endpoint where the agent accepts requests. */
  endpoint: string;
  /** Base58 pubkey of the agent's Solana wallet. */
  walletPubkey: string;
  /** Private key bytes for on-chain signing (optional — omit for demo mode). */
  signerPrivateKey?: Uint8Array;
}

export interface RegistrationResult {
  attestationAddress: string;
  txSignature?: string;
  demoMode: boolean;
}

export interface RegistryConfig {
  solanaRpcUrl?: string;
  credentialAddress?: string;
  schemaAddress?: string;
  /** Set to true to skip on-chain calls (default: true when no RPC supplied). */
  demoMode?: boolean;
}

// ─── AgentRegistry ───────────────────────────────────────────────────────────

/**
 * Simple on-chain / demo-mode agent registry.
 *
 * On-chain flow:
 *   1. Caller ensures a Dark credential and the AGENT_ROUTER_SCHEMA exist.
 *   2. `registerAgent()` serialises the registration data and calls
 *      `getCreateAttestationInstruction` (from the SAS generated client) to
 *      anchor the record as a SAS attestation.
 *   3. Returns the attestation PDA and transaction signature.
 *
 * Demo flow (no RPC / no wallet):
 *   – Derives a deterministic pseudo-address from the registration data.
 *   – Returns immediately with `demoMode: true`.
 */
export class AgentRegistry {
  private readonly config: Required<RegistryConfig>;

  constructor(config: RegistryConfig = {}) {
    const demoMode = config.demoMode ?? !config.solanaRpcUrl;
    this.config = {
      solanaRpcUrl: config.solanaRpcUrl ?? "https://api.devnet.solana.com",
      credentialAddress: config.credentialAddress ?? "",
      schemaAddress: config.schemaAddress ?? "",
      demoMode,
    };
  }

  async registerAgent(req: RegistrationRequest): Promise<RegistrationResult> {
    if (this.config.demoMode || !this.config.credentialAddress) {
      return this._registerDemo(req);
    }
    return this._registerOnChain(req);
  }

  // ── Demo mode ──────────────────────────────────────────────────────────────

  private _registerDemo(req: RegistrationRequest): RegistrationResult {
    const capStr = JSON.stringify(req.capabilities.map((c) => c.name));
    const seed = `demo:${req.agentId}:${capStr}:${req.endpoint}:${Date.now()}`;
    const hash = createHash("sha256").update(seed).digest("hex");
    const attestationAddress = toBase58Like(Buffer.from(hash, "hex"));
    return { attestationAddress, demoMode: true };
  }

  // ── On-chain mode ──────────────────────────────────────────────────────────

  private async _registerOnChain(req: RegistrationRequest): Promise<RegistrationResult> {
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

    const rpc = createSolanaRpc(this.config.solanaRpcUrl);
    const rpcSubscriptions = createSolanaRpcSubscriptions(
      this.config.solanaRpcUrl.replace(/^http/, "ws")
    );

    if (!req.signerPrivateKey) {
      throw new Error("signerPrivateKey is required for on-chain registration");
    }
    const signer = await createKeyPairSignerFromBytes(req.signerPrivateKey);

    const registeredAt = BigInt(Math.floor(Date.now() / 1000));
    const data: Record<string, unknown> = {
      agent_id: req.agentId,
      capabilities: JSON.stringify(req.capabilities.map((c) => c.name)),
      endpoint: req.endpoint,
      wallet_pubkey: req.walletPubkey,
      registered_at: registeredAt,
      is_active: true,
    };

    const schemaAddr = address(this.config.schemaAddress);
    const schemaAccount = await fetchSchema(rpc, schemaAddr);
    const serialised = serializeAttestationData(schemaAccount.data, data);

    // Derive a stable nonce from agent_id
    const nonceBytes = createHash("sha256")
      .update(req.agentId)
      .digest()
      .slice(0, 32);
    const nonceAddress = address(toBase58Like(nonceBytes));

    const credentialAddr = address(this.config.credentialAddress);

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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBase58Like(buf: Buffer | Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return Array.from(b)
    .map((byte) => ALPHABET[byte % ALPHABET.length])
    .join("");
}

export { SAS_PROGRAM_ID };
