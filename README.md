<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:000000,30:0d0d1a,60:1a0030,100:00ff41&height=220&section=header&text=DARK%20DeFi&fontSize=90&fontColor=00ff41&animation=fadeIn&fontAlignY=42&desc=%F0%9F%A6%9E%20Privacy-First%20Solana%20%7C%20Zcash%20Sapling%20%7C%20TEE%20Agents%20%7C%20Cypherpunk%20Terminal&descAlignY=60&descAlign=50" width="100%"/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Share+Tech+Mono&size=18&duration=2800&pause=900&color=00FF41&center=true&vCenter=true&width=700&lines=%F0%9F%A6%9E+Lobsters+don't+age.+Neither+does+privacy.;Zero-Knowledge+Transfers+on+Solana;Shielded+notes.+Encrypted+pools.+Dark+swaps.;TEE-Isolated+AI+%E2%80%94+attested+on-chain+via+SAS;ChaCha20-Poly1305+%7C+ZIP-32+HD+%7C+Blake3;In+the+cracks+of+the+panopticon%2C+lobsters+scuttle+free.;npm+install+%40openclawdsol%2Fdark-protocol-sdk)](https://www.npmjs.com/org/openclawdsol)

<br/>

[![npm](https://img.shields.io/npm/v/@openclawdsol/dark-protocol-sdk?color=00ff41&label=%40openclawdsol%2Fdark-protocol-sdk&logo=npm&logoColor=white&style=for-the-badge)](https://www.npmjs.com/package/@openclawdsol/dark-protocol-sdk)
[![npm](https://img.shields.io/npm/v/@openclawdsol/dark-tee-agents?color=9945FF&label=%40openclawdsol%2Fdark-tee-agents&logo=npm&logoColor=white&style=for-the-badge)](https://www.npmjs.com/package/@openclawdsol/dark-tee-agents)
[![npm](https://img.shields.io/npm/v/@openclawdsol/dark-protocol?color=ff00ff&label=%40openclawdsol%2Fdark-protocol&logo=npm&logoColor=white&style=for-the-badge)](https://www.npmjs.com/package/@openclawdsol/dark-protocol)

<br/>

[![CI](https://github.com/x402agent/dark-defi/actions/workflows/ci.yml/badge.svg)](https://github.com/x402agent/dark-defi/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Anchor](https://img.shields.io/badge/Anchor-0.32.1-9945FF?style=flat-square)](https://www.anchor-lang.com/)
[![Solana](https://img.shields.io/badge/Solana-Mainnet%20Ready-9945FF?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-00ff41?style=flat-square)](LICENSE)
[![Alpha](https://img.shields.io/badge/Status-Alpha-ff6600?style=flat-square)](https://github.com/x402agent/dark-defi)
[![Zcash](https://img.shields.io/badge/Zcash-Sapling%20Port-F4B728?style=flat-square)](https://z.cash)
[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/x402agent/dark-defi&root=darkswap)

</div>

---

<div align="center">

```
╔══════════════════════════════════════════════════════════════════╗
║  "Privacy is necessary for an open society in the electronic    ║
║   age. We cannot expect governments, corporations, or other     ║
║   large, faceless organizations to grant us privacy...          ║
║   We must defend our own privacy if we expect to have any."     ║
║                           — A Cypherpunk's Manifesto, 1993      ║
╚══════════════════════════════════════════════════════════════════╝
```

</div>

---

## 🦞 The Lobster Protocol

> Lobsters don't die of aging. Their telomerase never stops. A 100-year-old lobster is as fertile and vigorous as a 1-year-old. They are functionally **biologically immortal** — bounded only by accident and predation.
>
> **Dark DeFi** is designed the same way. Cryptographic privacy doesn't *expire*. Your shielded notes don't *decay*. Zero-knowledge proofs don't become *less true* with time. The shell protects forever.
>
> 🦞 **Dark DeFi**: Solana's throughput. Zcash's privacy. Lobster's permanence.

**Dark DeFi** is the privacy hub for Solana — a home base for humans and
AI agents who want to transact, infer, and converse without leaking
prompts, balances, counterparties, or strategies to the network.

| Layer | Technology |
|-------|-----------|
| 🔐 **Shielded wallets** | Zcash Sapling — 43-byte addresses, ZIP-32 HD keys, ChaCha20-Poly1305 |
| 🌑 **Dark pools** | Encrypted AMMs + FHE order matching before settlement |
| 🤖 **AI in TEEs** | Claude/Gemini/DeepSeek agents inside SGX/SEV/dstack enclaves, attested via SAS |
| 🦞 **Clawd agents** | First-class private Solana AI — sealed converse + shielded trade in one call |
| 💸 **Private payments** | x402 `dark-shielded` payment scheme for confidential inference |
| 🔑 **Viewing keys** | Selective disclosure — share with auditors, keep from adversaries |
| ⚡ **MEV resistance** | Order amounts encrypted end-to-end until settlement |

---

## ⚡ 30-Second Quickstart

```bash
npm install @openclawdsol/dark-protocol-sdk
```

```typescript
import { ShieldedWallet, SaplingUtils } from '@openclawdsol/dark-protocol-sdk';

// 1. Generate a privacy wallet (Zcash Sapling, ZIP-32 HD keys)
const { wallet, mnemonic } = await SaplingUtils.generateWallet();
console.log('Save your mnemonic:', mnemonic);

// 2. Get your shielded address (43-byte Sapling address, like zs1…)
const shieldedAddress = wallet.getDefaultAddress().toBase58();
console.log('Shielded address:', shieldedAddress);

// 3. Generate unlimited diversified addresses (unlinkable by observers)
const addr1 = wallet.generateDiversifiedAddress(0).toBase58();
const addr2 = wallet.generateDiversifiedAddress(1).toBase58();

// 4. Create a shielded wallet and deposit SOL into the private pool
const sw = await ShieldedWallet.create({ network: 'mainnet', demoMode: true });
const deposit = await sw.deposit({ amount: 1_000_000_000n, memo: 'Private deposit' });
console.log('Note commitment:', deposit.commitment);

// 5. Transfer privately
const transfer = await sw.transfer({
  to: addr1,
  amount: 500_000_000n,
  memo: 'Dark payment',
});

// 6. Check shielded balance
const { totalSol, notes } = await sw.getBalance();
console.log(`Shielded balance: ${totalSol} SOL across ${notes.length} notes`);

// 7. Export a view-only key (safe to share with auditors)
const vk = sw.exportViewingKey();
// auditors can decrypt notes but cannot spend
```

## 🦞 Install

```bash
# Core SDK — Sapling wallets, note encryption, Jupiter swaps, price oracle
npm install @openclawdsol/dark-protocol-sdk

# TEE Agents — confidential AI, SAS attestation, x402 payments, Clawd
npm install @openclawdsol/dark-tee-agents

# Protocol primitives — low-level Solana client, AI manager
npm install @openclawdsol/dark-protocol
```

---

## 🦞 Meet Clawd — the first private Solana AI agent

`ClawdTeeAgent` (in `@openclawdsol/dark-tee-agents`) is the world's first
Solana-native AI agent that can **converse privately** and **trade privately**
in the same flow. Every prompt is sealed end-to-end into a TEE-attested
enclave; every reply is sealed back to your ephemeral key; every trade flows
through a shielded route; and the only thing that ever touches the chain is
a Solana Attestation Service receipt containing nothing but hashes and
commitments.

```typescript
import {
  ClawdTeeAgent,
  InMemoryClawdAccount,
  verifyClawdQuote,
  PAYMENT_ASSETS,
} from '@openclawdsol/dark-tee-agents';

const clawd = ClawdTeeAgent.spawn({
  agentId:           'clawd-alpha',
  owner:             ownerAddress,           // base58 Solana pubkey
  model:             'dstack/claude-opus-tee',
  network:           'solana-mainnet',
  pricePerInference: 10_000n,                // 0.01 USDC per call
  paymentAsset:      PAYMENT_ASSETS.USDC,
});

// 1. Verify Clawd's TEE quote before sending a single byte.
verifyClawdQuote(clawd, { allowedProviders: ['dstack', 'sgx'] });

// 2. Converse — prompt sealed in, reply sealed out, paid via x402-dark.
const turn = await clawd.converse('How should I rebalance my shielded book?', myModel);
console.log('Clawd:', turn.reply);
console.log('On-chain receipt payload:', turn.receipt);

// 3. Trade — Clawd returns a policy-checked JSON decision, then executes
//    through a private swap router against your shielded wallet.
const account = new InMemoryClawdAccount({ SOL: 2_000_000_000n });
const trade = await clawd.trade(
  {
    request:         'Rotate 0.5 SOL into USDC privately',
    allowedMints:    [SOL_MINT, USDC_MINT],
    maxAtomicAmount: 1_000_000_000n,
    maxSlippageBps:  50,
  },
  myModel,
  account,   // PrivateSwapRouterLike — use `PrivateSwapManager` in production
  account,   // ShieldedAccountLike   — use `ShieldedWallet`        in production
);

if (trade.refused) {
  console.warn('Clawd refused:', trade.refusalReason);
} else {
  console.log('Private swap signature:', trade.swap?.signature);
}
```

Run the offline walkthrough:

```bash
npm run clawd:demo
```

What stays private:

- The **prompt** — only the attested enclave sees it.
- The **reply** — sealed to the caller's one-time x25519 key.
- The **amount paid** — `dark-shielded` x402 publishes a commitment, not a value.
- The **trade size, mints, and slippage** — encrypted to the swap router.
- The **balance** — held inside `ShieldedWallet` with Sapling note encryption.

What is public:

- Clawd's **identity attestation** on SAS (model, measurement, signing key).
- A per-call **inference receipt** on SAS (request hash, response hash, asset, network).
- The **fact** that an attested agent ran — never the contents.

---

## 🌑 Architecture

```
╔═════════════════════════════════════════════════════════════╗
║              dark-x402-terminal  (CLI)                      ║
║     🦞 Lobster shell — interactive cyberpunk interface      ║
╚═══════════════════════╦═════════════════════════════════════╝
                         ║
                         ▼
╔═════════════════════════════════════════════════════════════╗
║       @openclawdsol/dark-protocol-sdk  v0.3.1               ║
║  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   ║
║  │ ShieldedWallet│  │ SaplingHDWallet│  │ NoteEncryption │   ║
║  │ deposit/xfer│  │ ZIP-32 HD keys│  │ ChaCha20-Poly  │   ║
║  └─────────────┘  └──────────────┘  └─────────────────┘   ║
║  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   ║
║  │PrivateSwap  │  │  PriceOracle  │  │  CommitmentTree │   ║
║  │ Jupiter Ultra│  │ Birdeye+Jup  │  │  Merkle / SHA256│   ║
║  └─────────────┘  └──────────────┘  └─────────────────┘   ║
╚═══════════════════════╦═════════════════════════════════════╝
                         ║
                         ▼
╔═════════════════════════════════════════════════════════════╗
║       @openclawdsol/dark-tee-agents  v0.1.0                 ║
║  ┌─────────────────┐  ┌──────────────────────────────────┐ ║
║  │ConfidentialAgent│  │   DarkAttestationService (SAS)   │ ║
║  │ spawn·seal·infer│  │   credential·schema·attest       │ ║
║  └─────────────────┘  └──────────────────────────────────┘ ║
║  ┌─────────────────┐  ┌──────────────────────────────────┐ ║
║  │ X402PaymentClient│  │  DarkTEEAttestation (SGX/TDX)   │ ║
║  │ shielded x402   │  │  quote parsing + verification    │ ║
║  └─────────────────┘  └──────────────────────────────────┘ ║
╚═══════════════════════╦═════════════════════════════════════╝
                         ║
                         ▼
╔═════════════════════════════════════════════════════════════╗
║     sas-lib  (local workspace)                              ║
║     Solana Attestation Service TypeScript client            ║
║     + Dark DeFi schema extensions                           ║
╚═══════════════════════╦═════════════════════════════════════╝
                         ║
            ┌────────────┴────────────┐
            ▼                         ▼
  ┌─────────────────────┐   ┌─────────────────────┐
  │  Solana (on-chain)  │   │  Off-chain services  │
  │  SAS Program ✅     │   │  Helius RPC + DAS   │
  │  22zoJMtdu4tQ…      │   │  Jupiter Ultra API   │
  │  Dark Protocol ⚠️   │   │  Birdeye oracle      │
  │  3KWLFYco7T2r…      │   │  Google Gemini TEE   │
  └─────────────────────┘   └─────────────────────┘
```

---

## 📦 Package Reference

### 🦞 `@openclawdsol/dark-protocol-sdk` — [packages/sdk/](packages/sdk/)

> The lobster's claws. Everything you need for shielded Solana DeFi.

**Published:** [![npm](https://img.shields.io/npm/v/@openclawdsol/dark-protocol-sdk?color=00ff41&style=flat-square)](https://www.npmjs.com/package/@openclawdsol/dark-protocol-sdk)

| Module | File | Description |
|--------|------|-------------|
| `ShieldedWallet` | `src/shielded-wallet.ts` | Full note lifecycle — deposit, transfer, balance, proofs |
| `CommitmentTree` | `src/shielded-wallet.ts` | Incremental SHA-256 Merkle tree for note commitments |
| `NullifierSet` | `src/shielded-wallet.ts` | Double-spend prevention |
| `ViewOnlyWallet` | `src/shielded-wallet.ts` | Read-only wallet from viewing key export |
| `MultisigShieldedWallet` | `src/shielded-wallet.ts` | M-of-N threshold shielded wallet |
| `SaplingHDWallet` | `src/sapling.ts` | ZIP-32 HD key derivation, 43-byte diversified addresses |
| `NoteEncryptionUtils` | `src/note-encryption.ts` | ChaCha20-Poly1305 note encryption / decryption |
| `PrivateSwapManager` | `src/swap.ts` | Jupiter Ultra swap with oracle price validation |
| `PriceOracle` | `src/oracle.ts` | Multi-source price oracle (Birdeye + Jupiter fallback) |
| `PrivacyUtils` | `src/privacy.ts` | Ephemeral address helpers, transaction unlinkability |
| `DarkProtocolClient` | `src/client.ts` | RPC client factory (Helius + fallback) |
| `DarkWallet` | `src/wallet.ts` | Solana keypair + shielding helpers |
| `DarkSwap` (React) | `src/components/DarkSwap.tsx` | Drop-in React swap widget |
| `AIAgentManager` | `src/ai-agent.ts` | Multi-provider AI agent orchestration |

<details>
<summary>🦞 Quick examples</summary>

```typescript
import {
  ShieldedWallet,
  SaplingHDWallet,
  NoteEncryptionUtils,
  PrivateSwapManager,
  KNOWN_TOKENS,
} from '@openclawdsol/dark-protocol-sdk';

// ── Shielded wallet lifecycle ──────────────────────────────────
const wallet = await ShieldedWallet.create({ network: 'devnet' });
const mnemonic = wallet.generateMnemonic();

// Deposit SOL into shielded pool (demo mode — no RPC needed)
const deposit = await wallet.deposit({ amount: 1_000_000_000n, memo: '🦞 in the dark pool' });
console.log('Note commitment:', deposit.commitment);

// Check shielded balance
const { totalSol, notes } = await wallet.getBalance();
console.log(`${totalSol} SOL across ${notes.length} notes`);

// Transfer privately
const transfer = await wallet.transfer({
  to: recipientAddress,
  amount: 500_000_000n,
  memo: 'claws stay sharp',
});

// Export viewing key for auditors
const viewingKey = wallet.exportViewingKey();
const auditWallet = ShieldedWallet.fromViewingKey(viewingKey); // view-only

// Payment proof
const proof = wallet.createPaymentProof({
  noteId: deposit.noteId,
  recipient: deposit.shieldedAddress,
  amount: deposit.amount,
});
const valid = ShieldedWallet.verifyPaymentProof(proof);

// ── Sapling HD wallet ──────────────────────────────────────────
const hd = await SaplingHDWallet.fromMnemonic(mnemonic);
const addr = hd.getDefaultAddress();
console.log('Shielded address:', addr.toBase58()); // 43-byte

// ── Multisig (M-of-N) ─────────────────────────────────────────
const multisig = await MultisigShieldedWallet.createMultisig({
  required: 2,
  owners: [alice, bob, charlie], // base58 pubkeys
});
const proposal = multisig.proposeTransfer({ to: recipient, amount: 100_000_000n });
await multisig.approve(proposal.id, alice);
const { executed } = await multisig.approve(proposal.id, bob); // threshold met → executes
```

</details>

---

### 🦞 `@openclawdsol/dark-tee-agents` — [packages/tee-agents/](packages/tee-agents/)

> The lobster's shell — impenetrable TEE enclave, verifiable on-chain.

**Published:** [![npm](https://img.shields.io/npm/v/@openclawdsol/dark-tee-agents?color=9945FF&style=flat-square)](https://www.npmjs.com/package/@openclawdsol/dark-tee-agents)

Full pipeline from enclave spawn to on-chain receipt:

```
spawn enclave → verify SGX/TDX quote → seal prompt
  → pay via x402 (shielded) → infer → SAS on-chain receipt
```

| Module | Path | Description |
|--------|------|-------------|
| `ClawdTeeAgent` | `src/agents/clawd.ts` | 🦞 Private Solana AI agent — sealed converse + shielded trade |
| `InMemoryClawdAccount` | `src/agents/clawd.ts` | Reference `ShieldedAccountLike` + `PrivateSwapRouterLike` for demos/tests |
| `verifyClawdQuote` | `src/agents/clawd.ts` | Verify a Clawd's TEE quote before opening a channel |
| `ConfidentialAgent` | `src/agents/confidential-agent.ts` | Agent lifecycle: spawn, seal, infer |
| `ConfidentialInferenceClient` | `src/inference/client.ts` | Client-side sealed-inference + x402-pay flow |
| `LocalEnclaveProvider` | `src/inference/client.ts` | In-process enclave provider (dev/test) |
| `HttpInferenceProvider` | `src/inference/client.ts` | POSTs sealed envelopes to a remote TEE endpoint |
| `DarkAttestationService` | `src/attestation/service.ts` | SAS credential / schema / attestation management |
| `verifyTeeQuote` | `src/attestation/tee.ts` | Provider, measurement, freshness, and signature checks |
| `LocalSignerPayer` | `src/payments/x402.ts` | Dev `PrivatePayer` — signs `dark-shielded` x402 authorizations |
| `DARK_SCHEMAS` | `src/attestation/schemas.ts` | `DarkAgentIdentity` + `DarkInferenceReceipt` SAS schemas |
| `PAYMENT_ASSETS`, `PROGRAMS` | `src/config.ts` | Mint addresses (USDC, SOL) + on-chain program IDs |
| CLI `dark-tee` | `src/cli.ts` | `dark-tee spawn` / `dark-tee infer` commands |

<details>
<summary>🦞 Quick examples</summary>

```typescript
import {
  ConfidentialAgent,
  DarkAttestationService,
  DARK_SCHEMAS,
} from '@openclawdsol/dark-tee-agents';

// Spawn a confidential agent
const agent = ConfidentialAgent.spawn({
  agentId: 'dark-analyst-01',
  owner: ownerAddress,
  model: 'phala/deepseek-r1-70b-tee',
  network: 'solana-devnet',
});

// Register it on-chain via SAS
const sas = DarkAttestationService.fromNetwork('devnet', process.env.HELIUS_API_KEY);
await sas.createCredential({ payer, authority, authorizedSigners: [authority.address] });
await sas.createSchema({ payer, authority, credential, def: DARK_SCHEMAS.agentIdentity });
await sas.createAttestation({ payer, authority, credential, schema, data: agent.identityData() });

// Sealed inference with x402 payment
const receipt = await agent.infer({
  prompt: 'Analyze this shielded position...',
  payment: { amount: 1000n, token: 'USDC' },
});
console.log('On-chain receipt:', receipt.attestationAddress);
```

```bash
# CLI
npm run tee:demo                    # full offline walkthrough
npx dark-tee spawn                  # spawn agent + derive SAS addresses
npx dark-tee infer "analyze this"  # sealed x402-paid inference
```

</details>

---

### 🦞 `@openclawdsol/dark-protocol` — [packages/protocol/](packages/protocol/)

> The nervous system. Low-level TypeScript protocol client.

**Published:** [![npm](https://img.shields.io/npm/v/@openclawdsol/dark-protocol?color=ff00ff&style=flat-square)](https://www.npmjs.com/package/@openclawdsol/dark-protocol)

| Module | File |
|--------|------|
| `DarkProtocolClient` | `client.ts` |
| `AIAgentManager` | `ai-agent.ts` |
| Config + program IDs | `config.ts` |
| Sapling primitives | `sapling.ts` |
| Note encryption | `note-encryption.ts` |
| Privacy utilities | `privacy.ts` |
| Swap routing | `swap.ts` |

---

### 🦞 `sas-lib` — [packages/sas-lib/](packages/sas-lib/)

> Local workspace package. SAS client + Dark DeFi schema extensions.

Sourced from the Solana Foundation's attestation workspace and extended with:

| Extension | File | Description |
|-----------|------|-------------|
| Program addresses | `src/dark/programs.ts` | All Dark protocol + SAS program IDs |
| Dark schemas | `src/dark/schemas.ts` | `DarkAgentIdentity`, `DarkInferenceReceipt`, `DarkAgentRouter` |
| `AgentRegistry` | `src/dark/registry.ts` | On-chain + demo-mode agent registration |
| Inference helpers | `src/dark/inference.ts` | Hash prompt/response, record on-chain |

```typescript
// SAS core (generated client)
import { deriveAttestationPda, getCreateAttestationInstruction } from 'sas-lib';

// Dark extensions
import { DARK_SCHEMAS, AgentRegistry, recordInferenceAttestation } from 'sas-lib';
```

**SAS Program:** `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` ✅ Live (Solana Foundation)

---

### 🦞 `dark-x402-terminal` — [packages/terminal/](packages/terminal/)

> The shell. Interactive cyberpunk CLI with Figlet banners, Inquirer menus, and ora spinners.

```bash
npm run terminal         # start interactive CLI (ts-node)
npm run build:terminal   # compile to dist/
node packages/terminal/dist/terminal/index.js
```

| Entry point | File | Description |
|-------------|------|-------------|
| Terminal main loop | `index.ts` | Interactive menu — wallet, swap, agents, dashboards |
| DarkSwap UI surface | `dark-swap-ui.ts` | Terminal UI for the swap flow |
| Wallet manager | `dark-wallet-manager.ts` | Wallet lifecycle helpers |
| Gemini agent | `enhanced-google-ai-agent.ts`, `google-ai-agent.ts` | In-terminal AI assistant |
| x402 agents | `x402-agents.ts` | x402 payment-aware agent harnesses |
| x402 price WebSocket | `x402-price-websocket.ts` | Live price feed over WS |
| x402 dashboards | `x402-dashboard-launcher.ts`, `x402-token-dashboard.ts`, `x402-terminal.ts` | Portfolio dashboards |
| Phoenix perps | `phoenix-perps.ts` | Phoenix perp DEX integration |
| Web bridge | `web/` | Web-side surface for the terminal |

---

### 🦞 `dark-defi` — [packages/dark-defi/](packages/dark-defi/)

> The umbrella meta-package. One install, the whole stack.

**Published:** [![npm](https://img.shields.io/npm/v/dark-defi?color=00ff41&style=flat-square)](https://www.npmjs.com/package/dark-defi)

```bash
npm install dark-defi
```

```javascript
const { ShieldedWallet, ClawdTeeAgent, DarkAttestationService, PACKAGES, VERSION } =
  require('dark-defi');
```

Re-exports everything from `@openclawdsol/dark-protocol`,
`@openclawdsol/dark-protocol-sdk`, `@openclawdsol/dark-tee-agents`, and
`sas-lib`. Use it when you want one dep instead of four.

---

### 🦞 `@openclawdsol/dark-protocol` — [packages/protocol/](packages/protocol/)

> Low-level Solana client + AI manager. Lighter than the SDK; no React, no rollup bundle.

| File | Exports |
|------|---------|
| `client.ts` | `DarkProtocolClient` — connection factory |
| `wallet.ts` | `DarkWallet` — keypair + shielding helpers |
| `privacy.ts` | `PrivacyUtils` — ephemeral addresses, unlinkability |
| `swap.ts` | Swap routing primitives |
| `ai-agent.ts` | `AIAgentManager` — multi-provider agent orchestration |
| `sapling.ts` | Sapling key primitives (TS port) |
| `note-encryption.ts` | ChaCha20-Poly1305 note encryption |
| `config.ts` | Program IDs + network defaults |

---

### 🦞 Anchor program — [dark-protocol-program/](dark-protocol-program/)

> The on-chain settlement layer. Anchor 0.32.1 / Rust.

| Instruction | Purpose |
|-------------|---------|
| `deposit` | Shield SOL — stores a Sapling-encrypted note commitment on-chain |
| `withdraw` | Reveal nullifier, redeem SOL (double-spend protected by PDA) |
| `shielded_transfer` | Spend one note → create payment + change output notes |

```bash
# Build + deploy
cd dark-protocol-program
anchor build
bash deploy-devnet.sh        # or deploy-mainnet.sh (requires funded wallet)
```

**Program ID:** `E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm` (devnet built · mainnet pending)

---

### 🦞 `darkswap` — [darkswap/](darkswap/)

> Next.js front-end for the shielded swap. Wallet adapter, Convex backend hooks, framer-motion matrix animations.

```bash
cd darkswap
npm install --legacy-peer-deps
npm run dev    # http://localhost:3333
```

| Path | Description |
|------|-------------|
| `src/` | Next.js app router + components |
| `convex/` | Convex backend functions for off-chain state |
| `next.config.ts` | Next 16 configuration |
| `vercel.json` | One-click Vercel deploy template |

The CI builds `darkswap` on every push (`.github/workflows/ci.yml`).

---

## 🗺 Package map at a glance

| Name | Path | Scope | Status |
|------|------|-------|--------|
| `@openclawdsol/dark-protocol-sdk` | `packages/sdk/` | SDK — shielded wallet, swaps, oracle | ✅ Published |
| `@openclawdsol/dark-tee-agents` | `packages/tee-agents/` | TEE agents + **Clawd** | ✅ Published |
| `@openclawdsol/dark-protocol` | `packages/protocol/` | Low-level protocol primitives | ✅ Published |
| `dark-defi` | `packages/dark-defi/` | Umbrella meta-package | ✅ Published |
| `sas-lib` | `packages/sas-lib/` | SAS client + Dark schemas | 🔒 Local workspace |
| `dark-x402-terminal` | `packages/terminal/` | Interactive cypherpunk CLI | ✅ Published |
| `dark_protocol_program` | `dark-protocol-program/` | Anchor on-chain program | 🟡 Built — mainnet pending |
| `darkswap` | `darkswap/` | Next.js front-end | 🟢 Dev (Vercel-ready) |

---

## 🔑 Key Hierarchy (Zcash Sapling — TypeScript)

```
seed (BIP-39 mnemonic)
  └─ SaplingSpendingKey (sk)         32 bytes — secret, never on-chain
       ├─ SaplingExpandedSpendingKey  (ask 32 + nsk 32 + ovk 32)
       └─ SaplingFullViewingKey (fvk) (ak 32 + nk 32 + ovk 32)
            └─ SaplingIncomingViewingKey   64-bit scalar
                 └─ SaplingPaymentAddress  (diversifier 11 + pk_d 32) = 43 bytes
                                            ↑ same format as Zcash Sapling
```

ZIP-32 allows unlimited diversified addresses from a single seed — each address
is unlinkable to others without the full viewing key.

---

## ⚡ Quick Start

### Prerequisites

```
Node.js ≥ 18
A Helius API key  →  https://helius.xyz
```

Optional: Jupiter, Birdeye, Google AI, RedPill API keys for live trading + inference.

### Clone & Build

```bash
git clone https://github.com/x402agent/dark-defi.git
cd darkterminal
npm install        # installs all workspaces + sas-lib symlink
npm run build      # sas-lib → sdk → tee-agents → terminal
```

### Configure

```bash
cp .env.example .secrets/.env
# Minimum:  HELIUS_API_KEY=...
# Optional: JUPITER_API_KEY, BIRDEYE_API_KEY, GOOGLE_AI_API_KEY
ln -sf ../../.secrets/.env packages/terminal/.env
```

### Run

```bash
npm run terminal                          # 🦞 interactive cyberpunk CLI
npm run tee:demo                          # offline TEE agent walkthrough
node packages/tee-agents/dist/demo.js    # direct demo runner
```

---

## 🛠 Workspace Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build all packages in dependency order |
| `npm run build:sas` | Build `sas-lib` only |
| `npm run build:sdk` | Build `@openclawdsol/dark-protocol-sdk` only |
| `npm run build:tee` | Build `@openclawdsol/dark-tee-agents` only |
| `npm run build:terminal` | Build the CLI only |
| `npm run terminal` | Launch CLI in dev mode (ts-node) |
| `npm run tee:demo` | Run TEE agent offline demo |
| `npm run clawd:demo` | 🦞 Run Clawd (private converse + shielded trade) offline demo |
| `npm run clean` | Wipe all `dist/` and `node_modules/` |

---

## 🌐 On-chain Programs

| Program | Address | Status |
|---------|---------|--------|
| **Solana Attestation Service** | [`22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG`](https://explorer.solana.com/address/22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG) | ✅ Deployed — Solana Foundation |
| **Dark Protocol (Shielded Note Pool)** | [`E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm`](https://explorer.solana.com/address/E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm) | 🟡 Built · Mainnet deploy pending funding |

The Dark Protocol Anchor program (`dark_protocol_program`) is fully implemented with:
- **`deposit`** — shield SOL + store Sapling-encrypted note on-chain
- **`withdraw`** — reveal nullifier, redeem SOL (double-spend protected via PDA)
- **`shielded_transfer`** — spend one note → create two output notes (payment + change)

> **Mainnet deploy wallet:** `AAqkn72VgkZqFbWggn9SvzjzMRW5zsZrTe5VZKu9DwaM` (needs ≥ 3 SOL)
> Run `bash dark-protocol-program/deploy-mainnet.sh` once funded.

---

## 📊 Implementation Status

| Component | Status |
|-----------|--------|
| 🦞 Sapling key hierarchy (ZIP-32 HD wallets) | ✅ TypeScript — complete |
| 🦞 Note encryption (ChaCha20-Poly1305) | ✅ TypeScript — complete |
| 🦞 ShieldedWallet — deposit / transfer / balance | ✅ TypeScript — complete |
| 🦞 CommitmentTree + NullifierSet | ✅ TypeScript — complete |
| 🦞 ViewOnlyWallet + MultisigShieldedWallet | ✅ TypeScript — complete |
| 🦞 Payment proofs + viewing key export | ✅ TypeScript — complete |
| 🦞 Jupiter Ultra swap + oracle validation | ✅ Implemented |
| 🦞 Multi-source price oracle (Birdeye + Jup) | ✅ Implemented |
| 🦞 Terminal CLI (Figlet, Inquirer, ora) | ✅ Working |
| 🦞 TEE agent — spawn, attest, pay (x402), infer | ✅ Demo + live modes |
| 🦞 **Clawd** — private Solana AI: sealed converse + shielded trade | ✅ Demo + ready for production model providers |
| 🦞 SAS client (`sas-lib`) local workspace | ✅ Built from SAS source |
| 🦞 Rust Anchor program — deposit / withdraw / shielded_transfer | ✅ Built · ID: `E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm` |
| 🌑 ZK-SNARK circuits (Groth16 proofs) | 📋 Roadmap |
| 🌑 Threshold ElGamal (on-chain key custody) | 📋 Roadmap — BPF stack constraint |
| 🌑 FHE encrypted AMM | 📋 Roadmap |
| 🌑 Production jubjub curve ops | 📋 Roadmap — current: hash approx |
| ⚠️ Security audit | ⚠️ Not audited — alpha only |

---

## 🦞 The Seven Layers

```
Layer 1 ─── 🔑 Cryptographic Foundation
            Sapling/Orchard primitives · Pedersen commitments
            Nullifiers · BLAKE2b PRFs · ZIP-32 HD keys

Layer 2 ─── 🌑 Dark Pools
            Encrypted constant-product AMMs · FHE order matching
            Jupiter V6 for public price discovery

Layer 3 ─── 🪙 eAsset Wrapping
            eSOL · eBTC · eETH · eUSDC
            Tokens with encrypted balances

Layer 4 ─── 🧮 Fully Homomorphic Encryption
            Swap(E(amount), E(price)) = E(output)
            Math on ciphertext — inputs never revealed

Layer 5 ─── 🗝 Threshold ElGamal
            t-of-n distributed key custody
            Compliant view-key sharing without spending power

Layer 6 ─── 👻 Ephemeral Accounts
            Single-use addresses
            Break transaction-graph linkability

Layer 7 ─── 🤖 AI Agents in TEE
            Gemini/Claude in SGX enclaves
            Attested measurement anchored in SAS on-chain
```

---

## 🔒 Security Model

```
┌─────────────────────────────────────────────────────┐
│  What IS protected today (TypeScript SDK)           │
│  ✅ Note contents — ChaCha20-Poly1305 AEAD           │
│  ✅ Address linkability — diversified + ephemeral    │
│  ✅ Viewing key separation — spend ≠ view            │
│  ✅ Double-spend — nullifier tracking                │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  What is NOT yet production-grade                   │
│  ⚠️  Jubjub curve — hash-based approximation        │
│  ⚠️  ZK proofs — placeholder (no Groth16 yet)       │
│  ⚠️  On-chain settlement — Rust program roadmap      │
│  ⚠️  No formal security audit                       │
└─────────────────────────────────────────────────────┘
```

> ⛔ **DO NOT use on mainnet with real funds until audited.**
> The TypeScript cryptography is faithful to the Zcash spec but uses simplified
> curve approximations. Demo and devnet only.

---

## 📚 Documentation

| Doc | What it covers |
|-----|----------------|
| [`docs/DARK_DEFI_VISION.md`](docs/DARK_DEFI_VISION.md) | Full protocol vision, all seven layers |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Technical architecture deep-dive |
| [`docs/SHIELDED_WALLET_GUIDE.md`](docs/SHIELDED_WALLET_GUIDE.md) | ShieldedWallet TypeScript walkthrough |
| [`docs/TEE_AGENTS.md`](docs/TEE_AGENTS.md) | TEE agent setup, SAS attestation, x402 |
| [`docs/SDK_INTEGRATION.md`](docs/SDK_INTEGRATION.md) | SDK usage guide |
| [`docs/ZCASH_INTEGRATION.md`](docs/ZCASH_INTEGRATION.md) | Zcash Sapling port details |
| [`docs/ORACLE_INTEGRATION_GUIDE.md`](docs/ORACLE_INTEGRATION_GUIDE.md) | Oracle and slippage protection |
| [`docs/DARK_X402_TERMINAL.md`](docs/DARK_X402_TERMINAL.md) | Terminal feature tour |
| [`docs/HELIUS_INTEGRATION.md`](docs/HELIUS_INTEGRATION.md) | Helius RPC + DAS setup |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Build and deployment guide |
| [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md) | How to verify a build |
| [`docs/IMPLEMENTATION_SUMMARY.md`](docs/IMPLEMENTATION_SUMMARY.md) | What's built vs roadmap |

---

## 🤝 Contributing

```bash
git clone https://github.com/x402agent/dark-defi.git
cd darkterminal
git checkout -b feat/your-feature
npm install && npm run build
# ... make changes, add tests ...
git commit -m "feat: describe your change"
# open a PR against main
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## 🏆 Acknowledgments

| Project | Contribution |
|---------|-------------|
| **Zcash Foundation + ECC** | Sapling protocol design and reference implementation |
| **Solana Foundation** | Solana Attestation Service program + TypeScript client |
| **Solana Labs** | High-throughput L1 |
| **Helius** | RPC and DAS infrastructure |
| **Jupiter** | Swap aggregation and Ultra API |
| **Phala Network** | TEE infrastructure for confidential compute |
| **@noble/hashes** | Blake3, SHA-256 — pure TypeScript crypto |
| **@noble/ciphers** | ChaCha20-Poly1305 — pure TypeScript AEAD |

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00ff41,50:1a0030,100:000000&height=120&section=footer&text=%F0%9F%A6%9E%20Dark%20DeFi%20%E2%80%94%20where%20privacy%20meets%20liquidity&fontSize=20&fontColor=00ff41&animation=twinkling&fontAlignY=55" width="100%"/>

</div>
