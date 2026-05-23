# 🌑 Dark DeFi Terminal

> **Privacy-first DeFi on Solana** — Zcash Sapling cryptography, MEV-protected dark pools, AI trading agents in TEEs, and a cyberpunk terminal UI.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Devnet%20%7C%20Mainnet-9945FF)](https://solana.com)
[![Status](https://img.shields.io/badge/Status-Alpha-orange)](https://github.com/8bitsats/darkterminal)

---

## What is Dark DeFi?

**Dark DeFi** is a privacy-preserving DeFi metaprotocol on Solana that combines Zcash-style shielded transactions, Fully Homomorphic Encryption (FHE), and AI-driven trading agents inside Trusted Execution Environments (TEEs). It is built around three guarantees:

| Guarantee | How |
| --- | --- |
| **Confidential balances and transfers** | Zcash Sapling notes (43-byte shielded addresses, ChaCha20-Poly1305 note encryption, ZIP-32 HD keys) |
| **MEV resistance** | Order amounts encrypted end-to-end; matching happens in encrypted space (FHE) before settlement |
| **Auditable when you want to be** | Threshold ElGamal lets you share viewing keys with auditors without exposing spending power |

Think of it as: *"Zcash's shielded pool + Solana's throughput + Jupiter's liquidity + a TEE-isolated AI desk, all driven from a terminal."*

---

## Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                       Dark X402 Terminal (CLI)                   │
│   Gemini agents · x402 swarm · TradingView widgets               │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│              @dark-protocol/sdk  (TypeScript)                    │
│   Wallet · Sapling · Note Encryption · Privacy · Swap · Oracle   │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│              @dark-protocol/tee-agents  (TypeScript)             │
│   Confidential agents · SAS attestation · x402 payments          │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│    sas-lib  (local workspace)                                     │
│    Solana Attestation Service TypeScript client                   │
│    + Dark DeFi schema extensions (agent identity, receipts)       │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│   On-chain (Solana devnet)      Off-chain                        │
│   ───────────────────────       ─────────                        │
│   SAS program (attestation)     Helius RPC + DAS                 │
│   22zoJMtdu4tQ…                 Jupiter Ultra API                │
│   Dark Protocol (placeholder)   Birdeye oracle                   │
│   3KWLFYco7T2r…                 Google Gemini (in TEE)            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Repository Layout

```text
dark-defi-terminal/
├── packages/
│   ├── protocol/            # @dark-protocol/core — TypeScript protocol client, AI agent manager
│   ├── sdk/                 # @dark-protocol/sdk   — TypeScript SDK (Sapling, wallet, swap, oracle)
│   ├── sas-lib/             # sas-lib              — SAS client + Dark schema extensions (local workspace)
│   ├── tee-agents/          # @dark-protocol/tee-agents — confidential AI agents, SAS attestation, x402
│   ├── terminal/            # dark-x402-terminal   — interactive CLI + web shell
│   └── tradingview-example/ # Reference TradingView charting integration
├── docs/                    # Architecture, integration guides, deployment notes
├── scripts/                 # darkboot.sh and other ops scripts
├── .secrets/                # Local-only env + key files (gitignored)
└── package.json             # npm workspaces root
```

---

## Package Reference

### `@dark-protocol/sdk` · [packages/sdk/](packages/sdk/)

The core TypeScript SDK. Import this for wallet creation, shielded addresses, note encryption, private swaps, and oracle-guarded price checks.

**Implemented:**

| Module | File | Description |
| --- | --- | --- |
| `DarkWallet` | `src/wallet.ts` | Solana keypair + shielding helpers |
| `SaplingHDWallet` | `src/sapling.ts` | ZIP-32 HD key derivation, 43-byte shielded addresses, diversifiers |
| `NoteEncryptionUtils` | `src/note-encryption.ts` | ChaCha20-Poly1305 note encryption / decryption |
| `PrivateSwapManager` | `src/swap.ts` | Jupiter Ultra swap with oracle price validation |
| `PriceOracle` | `src/oracle.ts` | Multi-source price oracle (Birdeye + Jupiter fallback) |
| `PrivacyUtils` | `src/privacy.ts` | Ephemeral address helpers, unlinkability utilities |
| `DarkProtocolClient` | `src/client.ts` | RPC client factory (Helius + fallback) |
| `DarkSwap` (React) | `src/components/DarkSwap.tsx` | Drop-in React swap widget |

```typescript
import {
  DarkProtocolClient,
  DarkWallet,
  SaplingHDWallet,
  PrivateSwapManager,
  PriceOracle,
  KNOWN_TOKENS,
} from '@dark-protocol/sdk';

const client = await DarkProtocolClient.create({
  heliusApiKey: process.env.HELIUS_API_KEY!,
  network: 'devnet',
  useSecureRpc: true,
});

const { wallet, mnemonic } = await DarkWallet.generate(client);
const sapling = await SaplingHDWallet.fromMnemonic(mnemonic);
const shieldedAddr = sapling.getDefaultAddress().toBase58();
```

Full SDK docs: [packages/sdk/README.md](packages/sdk/README.md) · Oracle guide: [packages/sdk/ORACLE_README.md](packages/sdk/ORACLE_README.md).

---

### `@dark-protocol/tee-agents` · [packages/tee-agents/](packages/tee-agents/)

Confidential AI agents running inside Trusted Execution Environments (TEEs), anchored on-chain via the **Solana Attestation Service (SAS)** and paying for sealed inference via **x402**.

```text
spawn enclave → verify quote → seal prompt → pay (x402 dark-shielded) → infer → on-chain receipt
```

**Implemented:**

| Module | Path | Description |
| --- | --- | --- |
| `ConfidentialAgent` | `src/agents/confidential-agent.ts` | Agent lifecycle: spawn, seal, infer |
| `DarkAttestationService` | `src/attestation/service.ts` | SAS credential / schema / attestation management |
| `DarkTEEAttestation` | `src/attestation/tee.ts` | SGX/TDX quote parsing and verification |
| `X402PaymentClient` | `src/payments/x402.ts` | x402 shielded payment flow |
| `InferenceClient` | `src/inference/` | Provider-agnostic sealed inference |
| `DARK_SCHEMAS` | `src/attestation/schemas.ts` | `DarkAgentIdentity` + `DarkInferenceReceipt` SAS schemas |
| CLI | `src/cli.ts` | `dark-tee spawn` / `dark-tee infer` commands |

```bash
npm run tee:demo            # offline walkthrough (no keys needed)
npx dark-tee spawn          # spawn an agent + derive its SAS addresses
npx dark-tee infer "..."    # one sealed, x402-paid inference
```

```typescript
import { ConfidentialAgent, DarkAttestationService, DARK_SCHEMAS } from '@dark-protocol/tee-agents';

const agent = ConfidentialAgent.spawn({
  agentId: 'dark-analyst-01',
  owner: ownerAddress,
  model: 'phala/deepseek-r1-70b-tee',
  network: 'solana-devnet',
});

const sas = DarkAttestationService.fromNetwork('devnet', process.env.HELIUS_API_KEY);
await sas.createCredential({ payer, authority, authorizedSigners: [authority.address] });
await sas.createSchema({ payer, authority, credential, def: DARK_SCHEMAS.agentIdentity });
```

Details: [packages/tee-agents/README.md](packages/tee-agents/README.md) · Guide: [docs/TEE_AGENTS.md](docs/TEE_AGENTS.md).

---

### `sas-lib` · [packages/sas-lib/](packages/sas-lib/)

Local workspace package — the **Solana Attestation Service** TypeScript client, adapted for Dark DeFi. This is the canonical source for all SAS interactions; it is symlinked in `node_modules/sas-lib` so existing imports require no changes.

Sourced from the Solana Foundation's [SAS attestation workspace](https://github.com/solana-foundation/solana-attestation-service) and extended with:

| Extension | File | Description |
| --- | --- | --- |
| Program addresses | `src/dark/programs.ts` | All Dark protocol + SAS program IDs |
| Dark schemas | `src/dark/schemas.ts` | Agent identity, inference receipt, agent router schemas |
| `AgentRegistry` | `src/dark/registry.ts` | On-chain + demo-mode agent registration |
| Inference helpers | `src/dark/inference.ts` | Hash prompt/response, record inference attestation |

```typescript
// SAS core (generated client)
import { deriveAttestationPda, getCreateAttestationInstruction } from 'sas-lib';

// Dark extensions
import { DARK_SCHEMAS, AgentRegistry, recordInferenceAttestation, SAS_PROGRAM_ID } from 'sas-lib';
```

**SAS Program ID:** `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG`

---

### `@dark-protocol/core` (protocol) · [packages/protocol/](packages/protocol/)

Low-level TypeScript protocol client used by the SDK. Provides direct Anchor program bindings, AI agent manager, and cross-chain bridge stubs.

| Module | File |
| --- | --- |
| `DarkProtocolClient` | `client.ts` |
| `AIAgentManager` | `ai-agent.ts` |
| Config / program IDs | `config.ts` |
| Sapling primitives | `sapling.ts` |
| Note encryption | `note-encryption.ts` |
| Privacy utilities | `privacy.ts` |
| Swap routing | `swap.ts` |

---

### `dark-x402-terminal` · [packages/terminal/](packages/terminal/)

Interactive CLI terminal with a cyberpunk UI. Runs in both Node.js (terminal) and browser (via web shell).

```bash
npm run terminal         # start interactive CLI (ts-node dev mode)
npm run build:terminal   # compile to dist/
node packages/terminal/dist/terminal/index.js
```

---

## Quick Start

### Prerequisites

- Node.js **≥ 18**
- A [Helius](https://helius.xyz) API key (required for RPC)
- Optional: Jupiter, Birdeye, Google AI, RedPill API keys

### Install & build

```bash
git clone https://github.com/8bitsats/darkterminal.git
cd darkterminal
npm install          # installs all workspaces (including local sas-lib)
npm run build        # builds sdk → sas-lib → tee-agents → terminal
```

### Configure secrets

```bash
cp .env.example .secrets/.env
# Add at minimum: HELIUS_API_KEY
ln -sf ../../.secrets/.env packages/terminal/.env
```

### Run

```bash
npm run terminal                         # interactive CLI
npm run tee:demo                         # TEE agent demo (no keys needed)
node packages/tee-agents/dist/demo.js   # direct demo runner
```

---

## Workspace Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Build every package in dependency order |
| `npm run build:sas` | Build only `sas-lib` |
| `npm run build:sdk` | Build only `@dark-protocol/sdk` |
| `npm run build:tee` | Build only `@dark-protocol/tee-agents` |
| `npm run build:terminal` | Build only the CLI |
| `npm run terminal` | Launch the CLI in dev mode (ts-node) |
| `npm run tee:demo` | Run TEE agent offline demo |
| `npm run clean` | Remove all `dist/` and `node_modules/` |

---

## On-chain Programs (Solana)

| Program | Address | Status |
| --- | --- | --- |
| **Solana Attestation Service** | `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` | ✅ Deployed (Solana Foundation) |
| **Dark Protocol** | `3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC` | ⚠️ Placeholder (devnet, unaudited) |
| **Shielded Wallet** | `4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg` | ⚠️ Placeholder (devnet, unaudited) |

> **Note:** The Dark Protocol and Shielded Wallet program IDs are configuration placeholders — the Rust programs are not yet part of this repository. All on-chain privacy operations currently route through the SAS program for attestation. The Zcash Sapling cryptography is implemented in TypeScript (SDK) and is suitable for development and demos; production use requires a formal security audit.

---

## Status & Security

This is **alpha software**. Do not use it on mainnet with real funds without an audit.

| Component | Status |
| --- | --- |
| Sapling key derivation (ZIP-32), HD wallets | ✅ TypeScript — implemented, unit-testable |
| Note encryption (ChaCha20-Poly1305) | ✅ TypeScript — implemented |
| Multi-source price oracle + slippage validation | ✅ Implemented |
| Jupiter Ultra swap integration | ✅ Implemented |
| Terminal CLI — builds, runs, connects to Helius | ✅ Working |
| TEE agent: spawn, attest (SAS), pay (x402), infer | ✅ Implemented (demo + live modes) |
| Solana Attestation Service client (`sas-lib`) | ✅ Local workspace, built from SAS source |
| ZK-SNARK circuits | ⚠️ Placeholder — not production proofs |
| Threshold ElGamal (on-chain) | ⚠️ Moved off-chain due to BPF stack limits |
| Rust on-chain Zcash programs | 📋 Not yet implemented (TypeScript SDK only) |
| TEE attestation hardening | ⚠️ Wired, not hardened |
| Smart contracts | ⚠️ Unaudited |

---

## The Seven Layers (from `docs/DARK_DEFI_VISION.md`)

1. **Cryptographic foundation** — Sapling/Orchard primitives, Pedersen commitments, nullifiers, BLAKE2b PRFs, ZIP-32 HD keys.
2. **Dark pools** — Encrypted constant-product AMMs and FHE order matchers; Jupiter V6 for price discovery.
3. **eAsset wrapping** — `eSOL`, `eBTC`, `eETH`, `eUSDC` — tokens with encrypted balances.
4. **Fully Homomorphic Encryption** — `Swap(E(amount), E(price)) = E(output)` so swap math runs on ciphertext.
5. **Threshold ElGamal** — Distributed-trust key custody; t-of-n decryption for compliant view-key sharing.
6. **Ephemeral accounts** — Single-use addresses break transaction-graph linkability.
7. **AI agents in TEE** — Gemini-driven analysis and execution with attested measurement anchored in SAS.

---

## Documentation Map

| Doc | What it covers |
| --- | --- |
| [`docs/DARK_DEFI_VISION.md`](docs/DARK_DEFI_VISION.md) | Full protocol vision, all seven layers |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Technical architecture |
| [`docs/TEE_AGENTS.md`](docs/TEE_AGENTS.md) | TEE agent setup, SAS attestation, x402 payments |
| [`docs/SHIELDED_WALLET_GUIDE.md`](docs/SHIELDED_WALLET_GUIDE.md) | TypeScript shielded wallet walkthrough |
| [`docs/SDK_INTEGRATION.md`](docs/SDK_INTEGRATION.md) | SDK usage guide |
| [`docs/ORACLE_INTEGRATION_GUIDE.md`](docs/ORACLE_INTEGRATION_GUIDE.md) | Oracle and slippage protection |
| [`docs/DARK_X402_TERMINAL.md`](docs/DARK_X402_TERMINAL.md) | Terminal feature tour |
| [`docs/HELIUS_INTEGRATION.md`](docs/HELIUS_INTEGRATION.md) | RPC/DAS setup |
| [`docs/CROSS_CHAIN_BRIDGE_GUIDE.md`](docs/CROSS_CHAIN_BRIDGE_GUIDE.md) | Bridging in/out (roadmap) |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Build and deployment guide |
| [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md) | How to verify a build |
| [`docs/ZCASH_INTEGRATION.md`](docs/ZCASH_INTEGRATION.md) | Zcash Sapling TypeScript port details |
| [`docs/XAI_INTEGRATION.md`](docs/XAI_INTEGRATION.md) | xAI/Grok API integration notes |

---

## Contributing

1. Fork the repo
2. `git checkout -b feat/your-feature`
3. `npm install && npm run build`
4. Commit with a meaningful message
5. Open a PR against `main`

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## License

[Apache License 2.0](LICENSE) © 8bitlabs / Dark Protocol contributors

---

## Acknowledgments

- **Zcash Foundation** & **Electric Coin Company** — Sapling protocol design and reference implementation
- **Solana Foundation** — Solana Attestation Service program and TypeScript client
- **Solana Labs** — high-throughput L1
- **Helius** — RPC and DAS infrastructure
- **Jupiter** — swap aggregation and Ultra API
- **Phala Network** — TEE infrastructure for confidential compute

---

**🌑 Dark DeFi — where privacy meets liquidity.**
