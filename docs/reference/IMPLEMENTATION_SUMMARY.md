# Dark DeFi Implementation Summary

> **Version:** v0.1 (TypeScript SDK + TEE Agents — Alpha)
> **Last updated:** May 2026

---

## What Is Actually Built

### 1. TypeScript Sapling SDK — `packages/sdk/src/sapling.ts`

A complete TypeScript port of the Zcash Sapling address system, adapted from the Zcash C++/Rust reference implementation.

**Implemented:**

- `SaplingSpendingKey` — 32-byte spending key (same derivation as Zcash)
- `SaplingExpandedSpendingKey` — `(ask, nsk, ovk)` triple
- `SaplingFullViewingKey` — `(ak, nk, ovk)` — view without spending
- `SaplingIncomingViewingKey` — derive payment addresses
- `SaplingPaymentAddress` — 43-byte diversified address (11-byte diversifier + 32-byte pk_d)
- Full key hierarchy: `seed → sk → expsk → fvk → ivk → address`
- ZIP-32 HD derivation (`SaplingHDWallet`)
- Diversifier scanning for valid addresses

```typescript
import { SaplingHDWallet } from '@dark-protocol/sdk';

const wallet = await SaplingHDWallet.fromMnemonic(mnemonic);
const addr = wallet.getDefaultAddress();   // 43-byte shielded address
const diversified = wallet.getDiversifiedAddress(1); // new address, same wallet
```

### 2. Note Encryption — `packages/sdk/src/note-encryption.ts`

ChaCha20-Poly1305 AEAD note encryption, compatible with the Zcash Sapling note format.

**Implemented:**

- `NoteEncryption` / `NoteDecryption` with incoming and full viewing keys
- `SaplingNotePlaintext` structure (leadbyte, diversifier, value, rseed, memo)
- `SaplingOutgoingPlaintext` — sender-side recovery data
- Ephemeral key agreement (ECDH-style shared secret)

Note format matches Zcash (ZIP 212):

```text
leadbyte:    1 byte
diversifier: 11 bytes
value:       8 bytes
rseed:       32 bytes
memo:        512 bytes
```

### 3. Privacy Utilities — `packages/sdk/src/privacy.ts`

- Ephemeral address generation (single-use, unlinks transaction graph)
- Nullifier computation (prevents double-spend in simulated pool)
- Commitment helpers

### 4. TEE Agent Stack — `packages/tee-agents/`

Full pipeline from enclave spawn to on-chain receipt:

| Module | Status |
| --- | --- |
| `ConfidentialAgent` — spawn, seal, infer | ✅ Implemented |
| `DarkTEEAttestation` — SGX/TDX quote parsing | ✅ Implemented |
| `DarkAttestationService` — SAS credential / schema / attestation | ✅ Implemented |
| `X402PaymentClient` — shielded x402 payment flow | ✅ Implemented |
| `DARK_SCHEMAS` — on-chain schema definitions | ✅ Implemented |
| CLI (`dark-tee spawn / infer`) | ✅ Implemented |

### 5. SAS Client — `packages/sas-lib/`

Local workspace containing the Solana Attestation Service TypeScript client
(sourced from the Solana Foundation attestation workspace) with Dark DeFi
extensions:

- `src/dark/schemas.ts` — `DarkAgentIdentity`, `DarkInferenceReceipt`, `DarkAgentRouter`
- `src/dark/registry.ts` — on-chain + demo agent registry
- `src/dark/inference.ts` — prompt/response hashing + on-chain recording
- `src/dark/programs.ts` — all Dark + SAS program addresses

### 6. Dark Protocol Client — `packages/protocol/`

TypeScript RPC client, AI agent manager, swap routing, oracle integration.

### 7. Terminal CLI — `packages/terminal/`

Interactive CLI with Figlet banner, Inquirer menus, ora spinners, chalk styling. Connects to Helius RPC, runs swap and agent commands.

---

## Actual File Structure

```text
packages/
├── sdk/src/
│   ├── sapling.ts          ← ZIP-32 HD wallet, 43-byte addresses
│   ├── note-encryption.ts  ← ChaCha20-Poly1305 note encryption
│   ├── wallet.ts           ← Solana keypair + shielding helpers
│   ├── swap.ts             ← Jupiter Ultra private swap
│   ├── oracle.ts           ← Birdeye + Jupiter price oracle
│   ├── privacy.ts          ← ephemeral accounts, unlinkability
│   ├── client.ts           ← Helius RPC factory
│   └── components/DarkSwap.tsx  ← React swap widget
├── tee-agents/src/
│   ├── agents/confidential-agent.ts
│   ├── attestation/{service,tee,schemas}.ts
│   ├── payments/x402.ts
│   ├── inference/
│   ├── crypto.ts
│   ├── cli.ts
│   └── demo.ts
├── sas-lib/src/
│   ├── generated/          ← Codama-generated SAS client
│   ├── pdas.ts             ← PDA derivation helpers
│   ├── utils.ts            ← Borsh serialization
│   └── dark/               ← Dark DeFi extensions
│       ├── programs.ts
│       ├── schemas.ts
│       ├── registry.ts
│       └── inference.ts
├── protocol/               ← Low-level TypeScript protocol client
└── terminal/               ← Interactive CLI
```

---

## What Is NOT Yet Implemented

The following are on the **roadmap** but do not exist in this repository:

| Feature | Status |
| --- | --- |
| `programs/dark-protocol/` Rust Anchor program | 📋 Roadmap |
| `programs/shielded-wallet/` Rust program | 📋 Roadmap |
| ZK-SNARK circuits (Groth16 proofs) | 📋 Roadmap |
| On-chain note commitment Merkle tree | 📋 Roadmap |
| Threshold ElGamal on-chain key custody | 📋 Roadmap (BPF stack limit workaround needed) |
| Production elliptic-curve ops (jubjub) in BPF | 📋 Roadmap |
| FHE encrypted AMM | 📋 Roadmap |
| Multi-oracle aggregation + TWAP | 📋 Roadmap |
| Cross-chain bridge | 📋 Roadmap |

> **Program IDs** in `packages/tee-agents/src/config.ts` and `packages/sas-lib/src/dark/programs.ts`
> are placeholder addresses for future deployment — they are **not** live
> programs owned by this repository. The one exception is the **SAS program**
> (`22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG`), which is deployed and
> maintained by the Solana Foundation.

---

## Build & Test

```bash
npm install
npm run build        # all packages
npm run tee:demo     # TEE agent walkthrough (no keys needed)
npm run terminal     # interactive CLI
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for unit test setup.

---

## Security Posture

This is **alpha / research software**:

- TypeScript Sapling is a faithful port but uses hash-based approximations for some elliptic-curve operations that are not available in JS.
- No formal security audit has been performed.
- Do not use on mainnet with real funds.
- TEE attestation surface is wired but not hardened for production SGX deployments.
