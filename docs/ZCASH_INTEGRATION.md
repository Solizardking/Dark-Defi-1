# Zcash Sapling Integration

> **Implementation status:** The cryptographic primitives described below are
> fully ported to **TypeScript** in `packages/sdk/src/` and
> `packages/protocol/`. The **Rust on-chain program** (shown as reference
> structs) is on the roadmap; those files do not yet exist in this repository.
> Code blocks marked `// TypeScript` reflect live code; blocks marked
> `// Rust (roadmap)` are design specifications.

---

## Overview

Dark DeFi adapts Zcash's battle-tested Sapling privacy primitives to Solana, providing:

- **Zcash-style Sapling addresses** — 43-byte diversified payment addresses
- **Encrypted notes** — ChaCha20-Poly1305 AEAD with viewing-key / spending-key separation
- **Nullifier tracking** — prevents double-spending without revealing note contents
- **Merkle commitments** — efficient shielded pool membership proofs
- **ZIP-32 HD wallets** — one mnemonic, unlimited diversified addresses

---

## Cryptographic Design

### Key Hierarchy (identical to Zcash Sapling)

```text
seed (mnemonic)
  └─ SaplingSpendingKey (sk)               32 bytes — secret, never on-chain
       ├─ SaplingExpandedSpendingKey        (ask 32 + nsk 32 + ovk 32)
       └─ SaplingFullViewingKey (fvk)       (ak 32 + nk 32 + ovk 32)
            └─ SaplingIncomingViewingKey    64-bit scalar
                 └─ SaplingPaymentAddress   (diversifier 11 + pk_d 32) = 43 bytes
```

### Data structures — TypeScript (live)

```typescript
// packages/sdk/src/sapling.ts

export interface SaplingSpendingKey {
  sk: Uint8Array;          // 32 bytes
}

export interface SaplingExpandedSpendingKey {
  ask: Uint8Array;         // 32 bytes — spend authorizing key
  nsk: Uint8Array;         // 32 bytes — nullifier deriving key
  ovk: Uint8Array;         // 32 bytes — outgoing viewing key
}

export interface SaplingFullViewingKey {
  ak:  Uint8Array;         // 32 bytes — authentication key
  nk:  Uint8Array;         // 32 bytes — nullifier deriving key
  ovk: Uint8Array;         // 32 bytes — outgoing viewing key
}

export interface SaplingPaymentAddress {
  d:    Uint8Array;        // 11 bytes — diversifier (same as Zcash)
  pk_d: Uint8Array;        // 32 bytes — diversified transmission key
}
```

### Data structures — Rust (roadmap, on-chain target)

```rust
// programs/dark-protocol/src/crypto/sapling.rs  (not yet implemented)

pub struct SaplingSpendingKey {
    pub sk: [u8; 32],
}

pub struct SaplingExpandedSpendingKey {
    pub ask: [u8; 32],   // spend authorizing key
    pub nsk: [u8; 32],   // nullifier deriving key
    pub ovk: [u8; 32],   // outgoing viewing key
}

pub struct SaplingFullViewingKey {
    pub ak:  [u8; 32],   // authentication key
    pub nk:  [u8; 32],   // nullifier deriving key
    pub ovk: [u8; 32],   // outgoing viewing key
}

pub struct SaplingPaymentAddress {
    pub d:    [u8; 11],  // diversifier (same as Zcash)
    pub pk_d: [u8; 32],  // diversified transmission key
}
```

---

## Note Encryption

### Structure (TypeScript — live)

```typescript
// packages/sdk/src/note-encryption.ts

export interface SaplingNotePlaintext {
  leadbyte: number;        // 1 byte  — ZIP 212 indicator
  d:        Uint8Array;    // 11 bytes — diversifier
  value:    bigint;        // 8 bytes  — amount
  rseed:    Uint8Array;    // 32 bytes — randomness seed
  memo:     Uint8Array;    // 512 bytes
}

export interface SaplingOutgoingPlaintext {
  pk_d:  Uint8Array;       // 32 bytes — recipient transmission key
  esk:   Uint8Array;       // 32 bytes — ephemeral secret
}
```

### Structure (Rust — roadmap)

```rust
// programs/dark-protocol/src/crypto/note_encryption.rs  (not yet implemented)

pub struct NoteEncryption {
    esk:   [u8; 32],     // ephemeral secret key
    epk:   [u8; 32],     // ephemeral public key (transmitted)
    h_sig: [u8; 32],     // signature hash
}

pub struct SaplingNotePlaintext {
    pub leadbyte: u8,       // ZIP 212 indicator
    pub d:        [u8; 11], // diversifier
    pub value:    u64,      // note amount
    pub rseed:    [u8; 32], // randomness seed
    pub memo:     [u8; 512],
}
```

---

## Using the TypeScript SDK

### 1 — Generate a shielded wallet

```typescript
import { SaplingHDWallet, SaplingUtils } from '@dark-protocol/sdk';

// New wallet
const { wallet, mnemonic } = await SaplingUtils.generateWallet();

// Restore
const wallet = await SaplingHDWallet.fromMnemonic(mnemonic);
const addr = wallet.getDefaultAddress();
console.log('Shielded address:', addr.toBase58()); // 43-byte diversified address
const addr2 = wallet.getDiversifiedAddress(1);     // unlimited addresses, same wallet
```

### 2 — Encrypt a note

```typescript
import { NoteEncryptionUtils } from '@dark-protocol/sdk';

const note = NoteEncryptionUtils.createNote({
  recipient: wallet.getDefaultAddress(),
  value:     BigInt(1_000_000),   // lamports
  memo:      'private transfer',
});

const encrypted  = NoteEncryptionUtils.encryptNote(note, wallet.outgoingViewKey);
const decrypted  = NoteEncryptionUtils.decryptNote(encrypted, wallet.incomingViewKey);
```

### 3 — Shield tokens (private deposit)

```typescript
import { DarkProtocolClient, DarkWallet } from '@dark-protocol/sdk';

const client = await DarkProtocolClient.create({
  heliusApiKey: process.env.HELIUS_API_KEY!,
  network: 'devnet',
});

const { wallet } = await DarkWallet.generate(client);

// Shield 0.01 SOL
await wallet.shieldTokens(
  BigInt(10_000_000),            // 0.01 SOL in lamports
  recipientShieldedAddress,
);
```

### 4 — Private swap via Jupiter

```typescript
import { PrivateSwapManager, KNOWN_TOKENS } from '@dark-protocol/sdk';
import { PublicKey } from '@solana/web3.js';

const swaps = new PrivateSwapManager(client, {
  jupiterApiKey: process.env.JUPITER_API_KEY,
  birdeyeApiKey: process.env.BIRDEYE_API_KEY,
});

const quote = await swaps.getQuoteWithOracle(
  new PublicKey(KNOWN_TOKENS.SOL),
  new PublicKey(KNOWN_TOKENS.USDC),
  BigInt(10_000_000), // 0.01 SOL
  50,                 // 0.5% slippage
);

await swaps.executePrivateSwap({
  inputMint:       new PublicKey(KNOWN_TOKENS.SOL),
  outputMint:      new PublicKey(KNOWN_TOKENS.USDC),
  inputAmount:     BigInt(10_000_000),
  minOutputAmount: quote.outputAmount,
  slippageBps:     50,
  userPublicKey:   wallet.publicKey,
  validateWithOracle: true,
});
```

---

## Comparison with Zcash

| Aspect | Zcash | Dark DeFi TypeScript | Dark DeFi Rust (roadmap) |
| --- | --- | --- | --- |
| **Address format** | 43-byte Sapling | ✅ Identical | ✅ Identical |
| **Key hierarchy** | sk → fvk → ivk → addr | ✅ Identical | ✅ Identical |
| **Note format** | ZIP 212 | ✅ Compatible | ✅ Compatible |
| **Diversifiers** | 11-byte | ✅ Identical | ✅ Identical |
| **Nullifiers** | Pedersen PRF | Hash-based sim | Pedersen PRF |
| **Curve** | Jubjub (BLS12-381) | BLAKE2b / hash approx | Jubjub (BPF-stack aware) |
| **ZK proofs** | Groth16 | Placeholder | Groth16 / PLONK |
| **Encryption** | ChaCha20-Poly1305 | ✅ ChaCha20-Poly1305 | ✅ ChaCha20-Poly1305 |
| **Merkle tree** | Incremental, Pedersen | SHA-256 | SHA-256 / Poseidon |
| **Blockchain** | UTXO | Account (Solana) | Account (Solana) |
| **Block time** | ~75 s | ~400 ms | ~400 ms |

---

## Differences from Zcash (by design)

1. **Account model** — Solana's account-based model replaces the UTXO model.
   Notes are stored in Solana accounts keyed by commitment hash.
2. **BPF stack constraints** — Jubjub curve operations exceed the 4 KB BPF
   stack limit. The Rust on-chain program will use a stack-aware wrapper or
   off-load heavy crypto to client-side proofs.
3. **Threshold ElGamal** — moved off-chain to avoid BPF stack blowup. Keys are
   re-combined off-chain and the result is submitted with a proof.

---

## Roadmap

### Phase 1 — Cryptographic foundation ✅ (TypeScript)

- [x] Sapling address system (`sapling.ts`)
- [x] Note encryption / decryption (`note-encryption.ts`)
- [x] ZIP-32 HD wallet derivation (`SaplingHDWallet`)
- [x] Viewing key hierarchy
- [x] Diversified address generation
- [x] ChaCha20-Poly1305 AEAD

### Phase 2 — On-chain Rust programs 📋

- [ ] `programs/dark-protocol/src/crypto/sapling.rs`
- [ ] `programs/dark-protocol/src/crypto/note_encryption.rs`
- [ ] `programs/shielded-wallet/src/lib.rs` (shield / unshield / transfer / view)
- [ ] Incremental Merkle tree with nullifier set on-chain
- [ ] `anchor build` + devnet deployment

### Phase 3 — Proof system 📋

- [ ] Groth16 verifier for spend authorisation
- [ ] Circuit: output note creation
- [ ] Circuit: Merkle membership
- [ ] Consider PLONK / Halo2 for recursive proofs

### Phase 4 — Production hardening 📋

- [ ] Replace hash-based curve approximations with real jubjub
- [ ] Production RNG (secure enclave / VRF)
- [ ] Security audit
- [ ] Formal verification of circuits
- [ ] Cross-program private calls
- [ ] Compliance tooling (selective disclosure with viewing keys)

---

## References

- [Zcash Protocol Specification](https://zips.z.cash/protocol/protocol.pdf)
- [ZIP-32: Shielded HD Wallets](https://zips.z.cash/zip-0032)
- [ZIP-212: Recipient-Derived Ephemeral Secret](https://zips.z.cash/zip-0212)
- [Sapling upgrade overview](https://z.cash/upgrade/sapling/)
- [Solana Attestation Service](https://github.com/solana-foundation/solana-attestation-service)

---

## Security Warning

> ⚠️ **This code is UNAUDITED and uses simplified cryptography.**
>
> The TypeScript implementation is a faithful port of Zcash's address system
> using hash-based approximations for the Jubjub elliptic-curve operations.
> It is suitable for development, demos, and devnet testing **only**.
>
> Do not use on mainnet with real funds until:
>
> 1. A complete security audit is performed
> 2. Zero-knowledge proofs are properly implemented
> 3. The Rust on-chain program passes formal verification

---

**🔒 Built with privacy in mind. Deploy with caution.**
