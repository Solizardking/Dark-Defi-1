import {
  seal,
  open,
  generateBoxKeypair,
  sha256,
  toHex,
  randomNonce,
  toBase58,
  fromBase58,
  type SealedMessage,
} from "../crypto.js";
import { verifyTeeQuote, type TeeProvider, type TeeQuote, type TeeEnclave } from "../attestation/tee.js";
import {
  resourceHash,
  encodePaymentHeader,
  decodePaymentHeader,
  verifyPayment,
  type PaymentRequirements,
  type PaymentPayload,
  type PrivatePayer,
} from "../payments/x402.js";

export interface InferenceRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface InferenceResult {
  text: string;
  model: string;
  /** hex sha256 of the sealed request ciphertext. */
  requestHash: string;
  /** hex sha256 of the sealed response ciphertext. */
  responseHash: string;
}

/** Envelope a client sends to an enclave: sealed prompt + reply address + payment. */
export interface InferenceEnvelope {
  sealedRequest: SealedMessage;
  /** base58 x25519 public key the enclave seals its reply to. */
  clientPublicKey: string;
  /** base64 `X-PAYMENT` header value. */
  paymentHeader: string;
  resource: string;
  expectedResourceHash: string;
}

export interface InferenceResponseEnvelope {
  sealedResponse: SealedMessage;
}

/** Where confidential inference actually runs. */
export interface InferenceProvider {
  infer(envelope: InferenceEnvelope): Promise<InferenceResponseEnvelope>;
}

export interface ConfidentialInferenceOptions {
  enclave: TeeQuote;
  payer: PrivatePayer;
  verify?: {
    allowedMeasurements?: string[];
    allowedProviders?: TeeProvider[];
    maxAgeSeconds?: number;
  };
}

/**
 * Client that runs AI inference confidentially against a TEE-attested endpoint:
 *
 *   verify quote -> seal prompt to enclave key -> pay via x402 -> call -> open reply
 *
 * The resource server / facilitator never sees the prompt, the completion, or
 * (under `dark-shielded`) the payer or amount.
 */
export class ConfidentialInferenceClient {
  constructor(private readonly opts: ConfidentialInferenceOptions) {}

  async infer(
    request: InferenceRequest,
    provider: InferenceProvider,
    requirements: PaymentRequirements
  ): Promise<{ result: InferenceResult; payment: PaymentPayload }> {
    const verification = verifyTeeQuote(this.opts.enclave, this.opts.verify ?? {});
    if (!verification.valid) {
      throw new Error(`Refusing to send data to unverified TEE: ${verification.reasons.join("; ")}`);
    }

    const client = generateBoxKeypair();
    const plaintext = new TextEncoder().encode(JSON.stringify(request));
    const sealedRequest = seal(plaintext, fromBase58(this.opts.enclave.encryptionPublicKey));
    const requestHash = toHex(sha256(sealedRequest.ciphertext));

    const requestNonce = toBase58(randomNonce(16));
    const expectedResourceHash = resourceHash(requirements.resource, requestNonce);
    const payment = await this.opts.payer.authorize(requirements, expectedResourceHash);
    const paymentHeader = encodePaymentHeader(payment);

    const { sealedResponse } = await provider.infer({
      sealedRequest,
      clientPublicKey: toBase58(client.publicKey),
      paymentHeader,
      resource: requirements.resource,
      expectedResourceHash,
    });

    const responseBytes = open(sealedResponse, client.secretKey);
    const decoded = JSON.parse(new TextDecoder().decode(responseBytes)) as {
      text: string;
      model: string;
    };

    return {
      result: {
        text: decoded.text,
        model: decoded.model,
        requestHash,
        responseHash: toHex(sha256(sealedResponse.ciphertext)),
      },
      payment,
    };
  }
}

export type ModelFn = (request: InferenceRequest) => Promise<string> | string;

/**
 * An in-process enclave that performs inference offline. It holds the TEE secret
 * keys, verifies the x402 payment, opens the sealed prompt, runs a model
 * function, and seals the completion back to the client. Useful for local dev,
 * tests, and demos; swap for {@link HttpInferenceProvider} in production.
 */
export class LocalEnclaveProvider implements InferenceProvider {
  constructor(
    private readonly enclave: TeeEnclave,
    private readonly model: ModelFn,
    private readonly requirements: PaymentRequirements
  ) {}

  async infer(envelope: InferenceEnvelope): Promise<InferenceResponseEnvelope> {
    const payment = decodePaymentHeader(envelope.paymentHeader);
    const check = verifyPayment(payment, this.requirements, envelope.expectedResourceHash);
    if (!check.valid) {
      throw new Error(`Payment rejected: ${check.reasons.join("; ")}`);
    }

    const requestBytes = open(envelope.sealedRequest, this.enclave.encryption.secretKey);
    const request = JSON.parse(new TextDecoder().decode(requestBytes)) as InferenceRequest;

    const text = await this.model(request);
    const responseBytes = new TextEncoder().encode(
      JSON.stringify({ text, model: this.enclave.quote.identity.model })
    );
    const sealedResponse = seal(responseBytes, fromBase58(envelope.clientPublicKey));
    return { sealedResponse };
  }
}

/** Production provider: POSTs the sealed envelope to a remote TEE endpoint. */
export class HttpInferenceProvider implements InferenceProvider {
  constructor(private readonly endpoint: string) {}

  async infer(envelope: InferenceEnvelope): Promise<InferenceResponseEnvelope> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PAYMENT": envelope.paymentHeader,
      },
      body: JSON.stringify({
        sealedRequest: envelope.sealedRequest,
        clientPublicKey: envelope.clientPublicKey,
        resource: envelope.resource,
      }),
    });
    if (res.status === 402) {
      throw new Error("Payment required or rejected by inference endpoint (HTTP 402)");
    }
    if (!res.ok) {
      throw new Error(`Inference endpoint error: HTTP ${res.status}`);
    }
    return (await res.json()) as InferenceResponseEnvelope;
  }
}
