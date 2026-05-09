# 🌑 Dark DeFi Terminal

> **Privacy-first DeFi on Solana** — Zcash Sapling cryptography, MEV-protected dark pools, AI trading agents in TEEs, and a cyberpunk terminal UI.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Devnet%20%7C%20Mainnet-9945FF)](https://solana.com)
[![Status](https://img.shields.io/badge/Status-Alpha-orange)]()

---

## What is Dark DeFi?

**Dark DeFi** is a privacy-preserving DeFi metaprotocol on Solana that combines Zcash-style shielded transactions, Fully Homomorphic Encryption (FHE), and AI-driven trading agents inside Trusted Execution Environments (TEEs). It is built around three guarantees:

| Guarantee | How |
| --- | --- |
| **Confidential balances and transfers** | Zcash Sapling notes (43-byte shielded addresses, ChaCha20-Poly1305 note encryption, ZIP-32 HD keys) |
| **MEV resistance** | Order amounts encrypted end-to-end; matching happens in encrypted space (FHE) before settlement |
| **Auditable when you want to be** | Threshold ElGamal lets you share viewing keys with auditors without exposing spending power |

Think of it as: *"Zcash's shielded pool + Solana's throughput + Jupiter's liquidity + a TEE-isolated AI desk, all driven from a terminal."*

### Why this exists

Public DeFi leaks every position, every entry, every exit to anyone running an indexer. That makes institutional flow impossible (no compliant fund will pre-broadcast its book) and retail flow unsafe (sandwich bots, copy-traders, public wallet scoring). Dark DeFi shields the trade graph itself — not just the wallet ID — so flow and PnL stay private until the user chooses to disclose.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Dark X402 Terminal (CLI)                   │
│   Google Gemini agents · X402 swarm · TradingView widgets        │
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
│              @dark-protocol/core  (Protocol Client)              │
│   Anchor program client · TEE attestation · Cross-chain bridge   │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│   On-chain (Solana)             Off-chain                        │
│   ─────────────────             ─────────                        │
│   Dark Protocol program         Helius RPC + DAS                 │
│   Shielded Wallet program       Jupiter Ultra API                │
│   Encrypted Asset registry      Birdeye oracle                   │
│   3KWLFYco7T2rUZkzjSSthj…        Google Gemini (in TEE)           │
└──────────────────────────────────────────────────────────────────┘
```

### The seven layers (from `docs/DARK_DEFI_VISION.md`)

1. **Cryptographic foundation** — Sapling/Orchard primitives, Pedersen commitments, nullifiers, BLAKE2b PRFs, ZIP-32 HD keys.
2. **Dark pools** — Encrypted constant-product AMMs and FHE order matchers; Jupiter V6 for price discovery.
3. **eAsset wrapping** — `eSOL`, `eBTC`, `eETH`, `eUSDC` — tokens with encrypted balances that can be added/multiplied/compared without decryption.
4. **Fully Homomorphic Encryption** — `Swap(E(amount), E(price)) = E(output)` so swap math runs on ciphertext.
5. **Threshold ElGamal** — Distributed-trust key custody; t-of-n decryption for compliant view-key sharing.
6. **Ephemeral accounts** — Single-use addresses break transaction-graph linkability.
7. **AI agents in TEE** — Gemini-driven analysis and execution with attested measurement; agent capabilities are scoped on-chain (`maxAmount`, `requiresApproval`).

---

## Repository Layout

```
dark-defi-terminal/
├── packages/
│   ├── protocol/            # @dark-protocol/core — protocol client, AI agent mgr, sapling
│   ├── sdk/                 # @dark-protocol/sdk — TypeScript SDK with React components
│   ├── terminal/            # dark-x402-terminal — interactive CLI + web shell
│   └── tradingview-example/ # Reference TradingView charting integration
├── docs/                    # Architecture, integration guides, deployment notes
│   └── legacy/              # Older drafts kept for history
├── scripts/                 # darkboot.sh and other ops scripts
├── .secrets/                # Local-only env + key files (gitignored)
├── package.json             # npm workspaces root
└── README.md                # You are here
```

---

## Quick Start

### Prerequisites

- Node.js **≥ 18**
- A [Helius](https://helius.xyz) API key (required)
- Optional: Jupiter, Birdeye, Google AI, RedPill API keys

### Install & build

```bash
git clone https://github.com/8bitsats/darkterminal.git
cd darkterminal
npm install                 # installs all workspaces
npm run build               # builds protocol, sdk, terminal
```

### Configure secrets

```bash
cp .env.example .secrets/.env
# edit .secrets/.env and add at minimum HELIUS_API_KEY
ln -sf ../../.secrets/.env packages/terminal/.env
```

### Run the terminal

```bash
npm run terminal
# or directly:
node packages/terminal/dist/terminal/index.js
```

You should see the Dark X402 banner and a prompt for wallet / swap / agent commands.

---

## Workspace Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Build every package (`--workspaces --if-present`) |
| `npm run build:sdk` | Build only `@dark-protocol/sdk` (tsc + rollup) |
| `npm run build:terminal` | Build only the CLI |
| `npm run terminal` | Launch the CLI in dev mode (ts-node) |
| `npm run clean` | Remove all `dist/` and `node_modules/` |

---

## Using the SDK

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

// 1. Generate a privacy wallet
const { wallet, mnemonic } = await DarkWallet.generate(client);

// 2. Derive a Sapling shielded wallet from the same mnemonic
const sapling = await SaplingHDWallet.fromMnemonic(mnemonic);
const shieldedAddr = sapling.getDefaultAddress().toBase58();

// 3. Shield 1 SOL and run a private SOL → USDC swap with oracle protection
await wallet.shieldTokens(BigInt(1_000_000_000), PublicKey.default);

const swaps = new PrivateSwapManager(client, {
  jupiterApiKey: process.env.JUPITER_API_KEY,
  birdeyeApiKey: process.env.BIRDEYE_API_KEY,
});

const quote = await swaps.getQuoteWithOracle(
  new PublicKey(KNOWN_TOKENS.SOL),
  new PublicKey(KNOWN_TOKENS.USDC),
  BigInt(10_000_000),
  50, // 0.5 % slippage
);

await swaps.executePrivateSwap({
  inputMint: new PublicKey(KNOWN_TOKENS.SOL),
  outputMint: new PublicKey(KNOWN_TOKENS.USDC),
  inputAmount: BigInt(10_000_000),
  minOutputAmount: quote.outputAmount,
  slippageBps: 50,
  userPublicKey: wallet.publicKey,
  validateWithOracle: true, // reject if oracle deviates >2%
});
```

Full SDK docs: [packages/sdk/README.md](packages/sdk/README.md) · Oracle guide: [packages/sdk/ORACLE_README.md](packages/sdk/ORACLE_README.md).

---

## Programs (Solana Devnet)

| Program | Address |
| --- | --- |
| Dark Protocol | `3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC` |
| Shielded Wallet | `4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg` |

[View on Solana Explorer →](https://explorer.solana.com/address/3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC?cluster=devnet)

---

## Status & Security

This is **alpha software**. Do not use it on mainnet with real funds without an audit.

- ✅ Sapling key derivation, note encryption, ZIP-32, HD wallets — implemented and unit-testable
- ✅ Multi-source price oracle, slippage validation, Jupiter Ultra integration
- ✅ Terminal builds, runs, connects to Helius
- ⚠️ ZK-SNARK circuits are placeholders — not production proofs
- ⚠️ Threshold ElGamal moved off-chain due to BPF stack limits
- ⚠️ TEE attestation surface is wired but not hardened
- ⚠️ Smart contracts are unaudited

If you find a security issue, **do not open a public issue** — email security disclosures privately first.

---

## Documentation Map

- [`docs/DARK_DEFI_VISION.md`](docs/DARK_DEFI_VISION.md) — full protocol vision, all seven layers
- [`docs/DARK_X402_TERMINAL.md`](docs/DARK_X402_TERMINAL.md) — terminal feature tour
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — technical architecture
- [`docs/SHIELDED_WALLET_GUIDE.md`](docs/SHIELDED_WALLET_GUIDE.md) — shielded wallet walkthrough
- [`docs/CROSS_CHAIN_BRIDGE_GUIDE.md`](docs/CROSS_CHAIN_BRIDGE_GUIDE.md) — bridging in/out
- [`docs/HELIUS_INTEGRATION.md`](docs/HELIUS_INTEGRATION.md) — RPC/DAS setup
- [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md) — how to verify a build

---

## Contributing

1. Fork the repo
2. `git checkout -b feat/your-feature`
3. `npm install && npm run build`
4. Commit with a meaningful message (we squash on merge — no `;;`, `ff`, or `ksss`)
5. Open a PR against `main`

---

## License

[Apache License 2.0](LICENSE) © 8bitlabs / Dark Protocol contributors

---

## Acknowledgments

- **Zcash Foundation** & **Electric Coin Company** — Sapling protocol design and reference implementation
- **Solana Labs** — high-throughput L1
- **Helius** — RPC and DAS infrastructure
- **Jupiter** — swap aggregation and Ultra API
- **Anchor** — Solana program framework

---

**🌑 Dark DeFi — where privacy meets liquidity.**
