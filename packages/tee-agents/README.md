# @dark-protocol/tee-agents

> TEE-attested **confidential AI agents** on Solana — sealed inference paid for
> with **x402 private payments**, anchored by the **Solana Attestation Service**.

This package is the trust + payments layer for Dark DeFi's AI desk. It lets you:

- **spawn** an enclave-backed agent that holds its own TEE key material and a
  signed attestation **quote** (measurement + report signature);
- **anchor** that agent's identity on-chain through the **Solana Attestation
  Service (SAS)** under a Dark-controlled credential;
- **pay** for inference confidentially with the **x402 `dark-shielded`** scheme
  (the resource server learns only that payment cleared — not who paid or how
  much);
- **run** inference **sealed** end-to-end (the prompt and completion are
  encrypted to the enclave's key, never visible to the host or the network);
- **receipt** every paid call back on-chain as a SAS attestation.

```text
spawn enclave → verify quote → seal prompt → pay (x402) → infer → on-chain receipt
```

## Install

```bash
npm install @dark-protocol/tee-agents
```

## Quick start

```ts
import {
  ConfidentialAgent,
  ConfidentialInferenceClient,
  LocalSignerPayer,
  generateSigningKeypair,
  toBase58,
  PAYMENT_ASSETS,
} from "@dark-protocol/tee-agents";
import { address } from "@solana/kit";

// 1. Spawn a confidential agent (generates enclave keys + a TEE quote).
const owner = address(toBase58(generateSigningKeypair().publicKey));
const agent = ConfidentialAgent.spawn({
  agentId: "dark-analyst-01",
  owner,
  model: "phala/deepseek-r1-70b-tee",
  network: "solana-devnet",
});

// 2. Advertise x402 payment requirements for one inference.
const requirements = agent.paymentRequirements({
  payTo: owner,
  asset: PAYMENT_ASSETS.USDC,
  atomicPrice: 10_000n, // 0.01 USDC
});

// 3. A client verifies the quote, pays, and runs sealed inference.
const provider = agent.localProvider(
  (req) => `analysis of "${req.prompt}" …`,
  requirements
);
const client = new ConfidentialInferenceClient({
  enclave: agent.quote,
  payer: new LocalSignerPayer(generateSigningKeypair(), /* confidential */ true),
  verify: { allowedProviders: ["local-dev"] },
});

const { result, payment } = await client.infer(
  { prompt: "How should I rebalance my private portfolio?" },
  provider,
  requirements.accepts[0]
);
console.log(result.text); // decrypted only on the client
```

### Anchor the agent on-chain (SAS)

```ts
import { DarkAttestationService, DARK_SCHEMAS } from "@dark-protocol/tee-agents";

const sas = DarkAttestationService.fromNetwork("devnet", process.env.HELIUS_API_KEY);

// One-time issuer + schema setup (needs a funded signer).
const { credential } = await sas.createCredential({
  payer, authority, authorizedSigners: [authority.address],
});
const { schema } = await sas.createSchema({
  payer, authority, credential, def: DARK_SCHEMAS.agentIdentity,
});

// Attest the agent identity.
await sas.attest({
  payer, authority, credential, schema,
  nonce: agent.attestationNonce,
  data: agent.identityData(),
  expiryUnixSeconds: Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
});
```

## CLI

The package ships an animated CLI:

```bash
npx dark-tee demo            # full offline walkthrough
npx dark-tee spawn           # spawn an agent + derive its SAS addresses
npx dark-tee infer "..."     # one sealed, x402-paid inference
```

Or from the repo root: `npm run tee:demo`.

## How it fits together

| Module | Responsibility |
| --- | --- |
| `attestation/tee.ts` | Generate & verify TEE quotes (measurement + ed25519 report signature). |
| `attestation/schemas.ts` | SAS schemas for agent identity and inference receipts. |
| `attestation/service.ts` | Drive SAS credential → schema → attestation lifecycle via `sas-lib`. |
| `payments/x402.ts` | x402 payment requirements + the private `dark-shielded` scheme. |
| `inference/client.ts` | Sealed inference (verify → seal → pay → call → open). |
| `agents/confidential-agent.ts` | The agent: enclave identity + payments + inference + receipts. |
| `crypto.ts` | ed25519 signatures, x25519 sealed boxes, SHA-256 (via `tweetnacl` + Node `crypto`). |

**Program addresses**

| Component | Address |
| --- | --- |
| Solana Attestation Service | `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` |
| Dark Protocol | `3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC` |

## Security status

Alpha. The `local-dev` TEE provider produces a **self-rooted** quote suitable
for development and tests only — it proves key custody and identity binding, not
hardware isolation. For production, supply hardware-rooted quotes (SGX DCAP /
SEV-SNP / dstack) via `importHardwareQuote` and verify them against the
provider's attestation/PCS out of band before trusting an enclave. Never commit
keypairs or API keys; load them from the environment.

## License

Apache-2.0
