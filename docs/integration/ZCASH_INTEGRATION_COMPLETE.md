# Zcash Integration — Current State

> **⚠️ Implementation status note:** This document has been updated to reflect
> the *actual* state of the codebase as of v0.1. The **TypeScript SDK** contains
> a complete Sapling implementation. Rust on-chain programs are on the roadmap
> but **do not yet exist in this repository**. Claims in older versions of this
> document about deployed Rust programs were aspirational and have been corrected.

---

## What Is Implemented (TypeScript SDK)

The `@dark-protocol/sdk` and `@dark-protocol/core` packages contain a full
TypeScript port of the Zcash Sapling cryptographic primitives:

| Module | Package path | Description |
| --- | --- | --- |
| `SaplingHDWallet` | `packages/sdk/src/sapling.ts` | ZIP-32 HD key derivation, 43-byte diversified addresses, full/incoming viewing keys |
| `NoteEncryptionUtils` | `packages/sdk/src/note-encryption.ts` | ChaCha20-Poly1305 note encryption / decryption |
| `SaplingUtils` | `packages/sdk/src/sapling.ts` | Address generation, diversifier scanning, key serialisation |
| Sapling primitives | `packages/protocol/sapling.ts` | Core protocol-level Sapling types |
| Note encryption | `packages/protocol/note-encryption.ts` | Protocol-level encryption helpers |

All of these are **unit-testable in Node.js** without an on-chain program.

---

## Architecture (Current)

```text
┌─────────────────────────────────────────────┐
│           dark-x402-terminal (CLI)           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         @dark-protocol/sdk (TypeScript)      │
│  sapling.ts          — ZIP-32 HD wallet      │
│  note-encryption.ts  — ChaCha20-Poly1305     │
│  wallet.ts           — keypair + shielding   │
│  swap.ts             — Jupiter Ultra         │
│  oracle.ts           — price oracle          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         Solana (devnet / mainnet)            │
│  SAS program — on-chain attestation anchor  │
│  (placeholder program IDs for Dark Protocol) │
└─────────────────────────────────────────────┘
```

---

## Using the TypeScript Sapling SDK

### Generate a shielded wallet

```typescript
import { SaplingHDWallet, SaplingUtils } from '@dark-protocol/sdk';

// From a fresh random seed
const { wallet, mnemonic } = await SaplingUtils.generateWallet();

// Or restore from mnemonic
const wallet = await SaplingHDWallet.fromMnemonic(mnemonic);
const addr = wallet.getDefaultAddress();
console.log('Shielded address:', addr.toBase58()); // 43-byte diversified address
```

### Note encryption

```typescript
import { NoteEncryptionUtils } from '@dark-protocol/sdk';

const { wallet } = await SaplingUtils.generateWallet();
const note = NoteEncryptionUtils.createNote({
  recipient: wallet.getDefaultAddress(),
  value: BigInt(1_000_000),   // 0.001 SOL in lamports
  memo: 'private transfer',
});

const encrypted = NoteEncryptionUtils.encryptNote(note, wallet.outgoingViewKey);
const decrypted = NoteEncryptionUtils.decryptNote(encrypted, wallet.incomingViewKey);
```

### Integration with DarkProtocolClient

```typescript
import { DarkProtocolClient, DarkWallet, SaplingHDWallet } from '@dark-protocol/sdk';

const client = await DarkProtocolClient.create({
  heliusApiKey: process.env.HELIUS_API_KEY!,
  network: 'devnet',
});

const { wallet, mnemonic } = await DarkWallet.generate(client);
const sapling = await SaplingHDWallet.fromMnemonic(mnemonic);

// Both Solana keypair and Sapling shielded address from the same mnemonic
console.log('Solana address:  ', wallet.publicKey.toBase58());
console.log('Shielded address:', sapling.getDefaultAddress().toBase58());
```

---

## Roadmap — On-chain Rust Programs

The following are **not yet implemented** and represent the next phase of
development:

- [ ] `programs/dark-protocol/` — Anchor program with Zcash note verification
  - `src/zcash/sapling.rs` — BPF-compatible Sapling elliptic-curve ops
  - `src/zcash/note_encryption.rs` — on-chain ChaCha20-Poly1305
  - `src/zcash/prf.rs` — BLAKE2b PRF
  - `src/zcash/zip32.rs` — HD derivation
- [ ] `programs/shielded-wallet/` — shielded balance account management
- [ ] ZK-SNARK verification circuits (Groth16 on BPF)
- [ ] Threshold ElGamal on-chain key custody

> **Program IDs in config** (`packages/tee-agents/src/config.ts`) are
> placeholder addresses for future deployment. They are **not** live programs
> owned by this repository.

---

## Security Notes

- The TypeScript implementation is suitable for **development and demos**.
- It does **not** use production-grade elliptic-curve libraries for all
  operations; some operations are hash-based simulations of Sapling math.
- Do not use this for mainnet funds until a security audit has been completed.
- The Rust program, when implemented, will need a separate BPF-stack-aware port
  of the Sapling curve operations (jubjub / Pedersen commitments).

---

See also: [ZCASH_INTEGRATION.md](ZCASH_INTEGRATION.md) · [SDK_INTEGRATION.md](SDK_INTEGRATION.md) · [DARK_DEFI_VISION.md](DARK_DEFI_VISION.md)
