import { address, type Address } from "@solana/kit";
import { generateTeeQuote, type TeeEnclave, type TeeProvider, type TeeQuote } from "../attestation/tee.js";
import type { AgentIdentityData, InferenceReceiptData } from "../attestation/schemas.js";
import {
  buildPaymentRequirements,
  type PaymentPayload,
  type PaymentRequiredResponse,
  type X402Network,
} from "../payments/x402.js";
import {
  LocalEnclaveProvider,
  type InferenceResult,
  type ModelFn,
} from "../inference/client.js";
import { sha256, toBase58 } from "../crypto.js";

export interface ConfidentialAgentConfig {
  agentId: string;
  /** Owner wallet (base58). */
  owner: string;
  /** Inference model the enclave runs. */
  model: string;
  provider?: TeeProvider;
  /** Capability / policy descriptor folded into the TEE measurement. */
  policy?: string;
  network?: X402Network;
}

/**
 * A confidential AI agent: a TEE-attested enclave identity that can be anchored
 * on Solana via the attestation service, accept x402 private payments, and run
 * sealed inference. Spawning one generates fresh enclave key material and a
 * self-rooted (dev) or hardware-rooted quote.
 */
export class ConfidentialAgent {
  readonly enclave: TeeEnclave;
  readonly config: Required<Omit<ConfidentialAgentConfig, "policy">> & { policy?: string };
  readonly createdAt: number;

  private constructor(enclave: TeeEnclave, config: ConfidentialAgentConfig) {
    this.enclave = enclave;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.config = {
      agentId: config.agentId,
      owner: config.owner,
      model: config.model,
      provider: config.provider ?? "local-dev",
      network: config.network ?? "solana-devnet",
      policy: config.policy,
    };
  }

  static spawn(config: ConfidentialAgentConfig): ConfidentialAgent {
    const enclave = generateTeeQuote(
      { agentId: config.agentId, model: config.model, policy: config.policy },
      config.provider ?? "local-dev"
    );
    return new ConfidentialAgent(enclave, config);
  }

  get quote(): TeeQuote {
    return this.enclave.quote;
  }

  /** Deterministic SAS attestation nonce (a 32-byte address derived from the agent id). */
  get attestationNonce(): Address {
    return address(toBase58(sha256(`dark-agent-nonce|${this.config.agentId}`)));
  }

  /** The on-chain identity record for this agent (serialize against AgentIdentitySchema). */
  identityData(): AgentIdentityData {
    return {
      agent_id: this.config.agentId,
      owner: this.config.owner,
      tee_signing_key: this.quote.signingPublicKey,
      tee_encryption_key: this.quote.encryptionPublicKey,
      measurement: this.quote.measurement,
      model: this.config.model,
      provider: this.quote.provider,
      created_at: BigInt(this.createdAt),
      is_attested: true,
    };
  }

  /** Payment requirements this agent advertises for one inference call. */
  paymentRequirements(params: {
    payTo: string;
    asset: string;
    atomicPrice: string | bigint;
    resource?: string;
  }): PaymentRequiredResponse {
    return buildPaymentRequirements({
      scheme: "dark-shielded",
      network: this.config.network,
      maxAmountRequired: String(params.atomicPrice),
      resource: params.resource ?? `dark://agent/${this.config.agentId}/infer`,
      description: `Confidential inference by ${this.config.agentId} (${this.config.model})`,
      payTo: params.payTo,
      asset: params.asset,
      extra: { agentId: this.config.agentId, measurement: this.quote.measurement },
    });
  }

  /** A provider that runs this agent's enclave in-process (dev/offline). */
  localProvider(model: ModelFn, requirements: PaymentRequiredResponse): LocalEnclaveProvider {
    return new LocalEnclaveProvider(this.enclave, model, requirements.accepts[0]);
  }

  /** Build the on-chain receipt record for a completed paid inference. */
  receiptData(params: {
    result: InferenceResult;
    payment: PaymentPayload;
    asset: string;
  }): InferenceReceiptData {
    return {
      agent_id: this.config.agentId,
      request_hash: params.result.requestHash,
      response_hash: params.result.responseHash,
      amount_paid: BigInt(/^\d+$/.test(params.payment.payload.value) ? params.payment.payload.value : 0),
      pay_asset: params.asset,
      network: this.config.network,
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      confidential: params.payment.payload.confidential,
    };
  }
}
