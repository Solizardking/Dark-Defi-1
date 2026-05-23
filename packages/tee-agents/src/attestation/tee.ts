import {
  generateSigningKeypair,
  generateBoxKeypair,
  sign,
  verifySignature,
  sha256,
  toHex,
  toBase58,
  fromBase58,
  type SigningKeypair,
  type BoxKeypair,
} from "../crypto.js";

export type TeeProvider = "local-dev" | "sgx" | "sev-snp" | "dstack" | "redpill";

/**
 * What the enclave commits to: the code/model identity it is running. In a real
 * SGX/SEV flow this is the MRENCLAVE / launch measurement; here it is a stable
 * hash over the agent's declared model + policy so it is reproducible offline.
 */
export interface EnclaveIdentity {
  /** Logical agent id. */
  agentId: string;
  /** Inference model the enclave runs (e.g. "phala/deepseek-r1-tee"). */
  model: string;
  /** Free-form policy / capability descriptor hashed into the measurement. */
  policy?: string;
}

export interface TeeQuote {
  provider: TeeProvider;
  /** hex SHA-256 measurement (MRENCLAVE analogue). */
  measurement: string;
  /** base58 ed25519 public key the enclave signs reports with. */
  signingPublicKey: string;
  /** base58 x25519 public key clients seal confidential payloads to. */
  encryptionPublicKey: string;
  /** Unix seconds. */
  timestamp: number;
  /** base58 ed25519 signature over the canonical report bytes. */
  signature: string;
  /** Echo of the identity for verifiers. */
  identity: EnclaveIdentity;
}

/** The full enclave key material — secret keys never leave the TEE. */
export interface TeeEnclave {
  quote: TeeQuote;
  signing: SigningKeypair;
  encryption: BoxKeypair;
}

export function computeMeasurement(identity: EnclaveIdentity): string {
  const canonical = `dark-tee/v1|${identity.agentId}|${identity.model}|${identity.policy ?? ""}`;
  return toHex(sha256(canonical));
}

function canonicalReport(parts: {
  measurement: string;
  signingPublicKey: string;
  encryptionPublicKey: string;
  timestamp: number;
  identity: EnclaveIdentity;
}): Uint8Array {
  const report = [
    "dark-tee-report/v1",
    parts.measurement,
    parts.signingPublicKey,
    parts.encryptionPublicKey,
    String(parts.timestamp),
    parts.identity.agentId,
    parts.identity.model,
    parts.identity.policy ?? "",
  ].join("\n");
  return new TextEncoder().encode(report);
}

/**
 * Spin up a (dev) enclave: generate its key material and self-sign a quote.
 *
 * `provider: "local-dev"` produces a quote whose signing key IS the report key,
 * so it verifies offline without external hardware. Real providers (SGX/SEV/
 * dstack) replace {@link generateTeeQuote} output with hardware-rooted quotes
 * via {@link importHardwareQuote}; the verification surface is identical.
 */
export function generateTeeQuote(
  identity: EnclaveIdentity,
  provider: TeeProvider = "local-dev"
): TeeEnclave {
  const signing = generateSigningKeypair();
  const encryption = generateBoxKeypair();
  const measurement = computeMeasurement(identity);
  const timestamp = Math.floor(Date.now() / 1000);
  const signingPublicKey = toBase58(signing.publicKey);
  const encryptionPublicKey = toBase58(encryption.publicKey);

  const report = canonicalReport({
    measurement,
    signingPublicKey,
    encryptionPublicKey,
    timestamp,
    identity,
  });
  const signature = toBase58(sign(report, signing.secretKey));

  return {
    quote: {
      provider,
      measurement,
      signingPublicKey,
      encryptionPublicKey,
      timestamp,
      signature,
      identity,
    },
    signing,
    encryption,
  };
}

export interface QuoteVerification {
  valid: boolean;
  reasons: string[];
}

/**
 * Verify a TEE quote: the measurement matches the declared identity, the report
 * signature is valid under the quote's signing key, and (optionally) the
 * measurement and provider are in the caller's allow-lists.
 */
export function verifyTeeQuote(
  quote: TeeQuote,
  opts: {
    allowedMeasurements?: string[];
    allowedProviders?: TeeProvider[];
    maxAgeSeconds?: number;
  } = {}
): QuoteVerification {
  const reasons: string[] = [];

  const expectedMeasurement = computeMeasurement(quote.identity);
  if (expectedMeasurement !== quote.measurement) {
    reasons.push("measurement does not match declared enclave identity");
  }

  const report = canonicalReport({
    measurement: quote.measurement,
    signingPublicKey: quote.signingPublicKey,
    encryptionPublicKey: quote.encryptionPublicKey,
    timestamp: quote.timestamp,
    identity: quote.identity,
  });
  const sigOk = verifySignature(
    report,
    fromBase58(quote.signature),
    fromBase58(quote.signingPublicKey)
  );
  if (!sigOk) {
    reasons.push("report signature is invalid");
  }

  if (opts.allowedMeasurements && !opts.allowedMeasurements.includes(quote.measurement)) {
    reasons.push("measurement is not in the allow-list");
  }

  if (opts.allowedProviders && !opts.allowedProviders.includes(quote.provider)) {
    reasons.push(`provider "${quote.provider}" is not allowed`);
  }

  if (opts.maxAgeSeconds !== undefined) {
    const age = Math.floor(Date.now() / 1000) - quote.timestamp;
    if (age > opts.maxAgeSeconds) {
      reasons.push(`quote is stale (${age}s > ${opts.maxAgeSeconds}s)`);
    }
  }

  return { valid: reasons.length === 0, reasons };
}

/**
 * Wrap a hardware-rooted quote (raw bytes from SGX DCAP / SEV-SNP / dstack)
 * into the Dark quote envelope. The raw evidence is hashed into the measurement
 * and must be verified out-of-band against the provider's PCS before trust.
 */
export function importHardwareQuote(params: {
  provider: TeeProvider;
  identity: EnclaveIdentity;
  rawQuote: Uint8Array;
  signingPublicKey: string;
  encryptionPublicKey: string;
  signature: string;
}): TeeQuote {
  return {
    provider: params.provider,
    measurement: toHex(sha256(params.rawQuote)),
    signingPublicKey: params.signingPublicKey,
    encryptionPublicKey: params.encryptionPublicKey,
    timestamp: Math.floor(Date.now() / 1000),
    signature: params.signature,
    identity: params.identity,
  };
}
