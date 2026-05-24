# Confidential TEE Agents

`@dark-protocol/tee-agents` implements Dark DeFi's **confidential AI desk**:
TEE-attested agents that run **sealed inference**, pay for it with **x402
private payments**, and anchor their identity and receipts on Solana through the
**Solana Attestation Service (SAS)**.

It is the concrete realization of layer 7 of the Dark DeFi vision ("AI agents in
TEE") wired to a real on-chain trust anchor instead of a mock attestation.

## Why

Running an AI trading/analysis agent over private positions creates two
problems public infrastructure can't solve:

1. **Confidentiality** — the prompt (your book, your strategy) and the
   completion must never be visible to the inference host or the network.
2. **Verifiable trust** — a client must be able to prove *which* code/model it
   is talking to before sending data, and prove *that it paid* without leaking
   who paid or how much.

This package addresses both: payloads are sealed to an enclave key, the enclave
publishes a verifiable attestation quote, and payment uses an x402 scheme whose
amount and payer settle privately via Dark Protocol's shielded layer.

## The flow

```text
┌─────────┐   1. fetch quote        ┌──────────────────────────┐
│ client  │ ──────────────────────► │  TEE-attested agent       │
│         │ ◄────────────────────── │  (enclave: signing+box    │
│         │   TeeQuote               │   keys, model)            │
│         │                          └──────────────────────────┘
│         │   2. verifyTeeQuote()  (measurement + report signature + allow-lists)
│         │
│         │   3. seal(prompt → enclave x25519 key)
│         │   4. x402: authorize payment (dark-shielded) → X-PAYMENT header
│         │ ──────────────────────►  provider.infer(sealedRequest, payHeader)
│         │                              · verifyPayment()
│         │                              · open(prompt) inside enclave
│         │                              · run model
│         │ ◄──────────────────────      · seal(completion → client key)
│         │   5. open(response)
└─────────┘   6. write SAS receipt attestation (request/response hashes, asset)
```

## On-chain anchoring (SAS)

The Solana Attestation Service models trust as **credential → schema →
attestation**:

- **Credential** — the Dark issuer authority (`Dark Protocol Agents`).
- **Schema** — `DarkAgentIdentity` and `DarkInferenceReceipt` (see
  `attestation/schemas.ts`). Layouts use only SAS compact codes 0–25 so the
  official serializer round-trips them.
- **Attestation** — a per-agent identity record and per-call receipts.

PDA derivation is offline (`credentialPda`, `schemaPda`, `attestationPda`);
writing requires a funded signer and an RPC endpoint.

SAS program: `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG`.

The SAS program, IDL, and generated TypeScript client originate from the
`x402agent/solana-clawd` attestation workspace (the OpenClawd verification
layer). They are included in this repo as the **local `sas-lib` workspace**
(`packages/sas-lib/`) with Dark-specific schema extensions layered on top
(`src/dark/`). `node_modules/sas-lib` is a symlink to that local package, so
no npm registry round-trip is needed and local changes are reflected
immediately on the next build.

## x402 private payments

Standard x402 (HTTP 402 "Payment Required") settles a public transfer, which
leaks payer and amount. The `dark-shielded` scheme instead carries a signed
authorization plus an **amount commitment**; a facilitator settles it from a
shielded balance / ephemeral account, so the resource server learns only that
payment cleared. See `payments/x402.ts` for the requirements, payload, header
encoding, and verification.

## Run it

```bash
# one-shot animated install + build
npm run install:dark

# confidential agent walkthrough (offline, no keys needed)
npm run tee:demo

# CLI
npx dark-tee spawn           # spawn + derive SAS addresses
npx dark-tee infer "..."     # one sealed, paid inference
```

## Production checklist

- Replace `local-dev` quotes with hardware quotes (`importHardwareQuote`) and
  verify them against the provider PCS (Intel DCAP / AMD KDS / dstack).
- Pin `allowedMeasurements` to the exact enclave builds you trust.
- Run settlement through a real x402 facilitator bound to the Dark shielded
  pool; persist receipts as SAS attestations.
- Keep all keypairs and API keys in the environment / `.secrets/` — never in the
  tree.
