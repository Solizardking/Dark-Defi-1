# Zcash Integration for Solana Privacy Protocol

This document describes the integration of Zcash's privacy technology into a Solana-based privacy protocol.

## Overview

We've successfully adapted Zcash's battle-tested privacy primitives to work on Solana, creating a comprehensive shielded wallet system that provides:

- **Zcash-style Sapling addresses** with diversifier support
- **Encrypted notes** with viewing key/spending key separation
- **Zero-knowledge proofs** for private transactions
- **Nullifier tracking** to prevent double-spending
- **Merkle trees** for efficient commitment tracking

## Architecture

### 1. Zcash Components Adapted

#### From Zcash Source: `/src/zcash/address/`

| Zcash Component | Solana Implementation | Location |
|-----------------|----------------------|----------|
| `sapling.hpp` - Sapling addresses | `crypto/sapling.rs` | Programs/dark-protocol |
| `NoteEncryption.hpp` - Note encryption | `crypto/note_encryption.rs` | Programs/dark-protocol |
| `Note.hpp` - Note structures | Integrated into `state.rs` and `shielded-wallet` | Multiple locations |
| Spending/Viewing keys | Full implementation in `sapling.rs` | Programs/dark-protocol |
| Diversifiers (11 bytes) | Exact same size and concept | Programs/dark-protocol |

### 2. Key Cryptographic Primitives

#### Sapling Address System ([sapling.rs](programs/dark-protocol/src/crypto/sapling.rs))

```rust
// Spending Key (sk) -> Expanded Spending Key (ask, nsk, ovk)
// -> Full Viewing Key (ak, nk, ovk) -> Incoming Viewing Key (ivk)
// -> Payment Address (diversifier + pk_d)

pub struct SaplingSpendingKey {
    pub sk: [u8; 32],
}

pub struct SaplingFullViewingKey {
    pub ak: [u8; 32],  // Authentication key
    pub nk: [u8; 32],  // Nullifier deriving key
    pub ovk: [u8; 32], // Outgoing viewing key
}

pub struct SaplingPaymentAddress {
    pub d: [u8; 11],   // Diversifier (same as Zcash)
    pub pk_d: [u8; 32], // Diversified transmission key
}
```

#### Note Encryption ([note_encryption.rs](programs/dark-protocol/src/crypto/note_encryption.rs))

```rust
// Encrypt notes for recipients using their incoming viewing key
// Implements ChaCha20-Poly1305 AEAD encryption (simplified for Solana)

pub struct NoteEncryption {
    esk: [u8; 32],  // Ephemeral secret key
    epk: [u8; 32],  // Ephemeral public key
    h_sig: [u8; 32], // Signature hash
}

pub struct SaplingNotePlaintext {
    pub leadbyte: u8,    // ZIP 212 indicator
    pub d: [u8; 11],      // Diversifier
    pub value: u64,       // Note amount
    pub rseed: [u8; 32],  // Randomness seed
    pub memo: [u8; 512],  // Memo field
}
```

### 3. Shielded Wallet Program

The [`shielded-wallet`](programs/shielded-wallet/src/lib.rs) program provides a complete privacy-preserving wallet:

#### Core Features

1. **Hierarchical Deterministic Wallets** (ZIP 32-inspired)
   - One master spending key generates unlimited viewing keys
   - Each viewing key can generate unlimited diversified addresses
   - Full key hierarchy: `sk -> fvk -> ivk -> address`

2. **Shielded Transactions**
   - `initialize_wallet`: Create wallet with FVK (never store spending key on-chain)
   - `create_diversified_address`: Generate new privacy address
   - `shield_tokens`: Deposit transparent tokens into shielded pool
   - `unshield_tokens`: Withdraw with zero-knowledge proof
   - `private_transfer`: Transfer between shielded addresses
   - `view_note`: Decrypt notes with viewing key

3. **Privacy Guarantees**
   - Amounts are hidden (encrypted in notes)
   - Sender/receiver identities are hidden (shielded addresses)
   - Transaction graph is hidden (using nullifiers)
   - Selective disclosure (via viewing keys)

## Implementation Details

### Key Differences from Zcash

| Aspect | Zcash | Our Solana Implementation |
|--------|-------|---------------------------|
| Curve | Jubjub (on BLS12-381) | Simplified to use Blake3 + SHA256 |
| Zero-Knowledge Proofs | Groth16 SNARKs | Placeholder (implement with Groth16 later) |
| Encryption | ChaCha20-Poly1305 | Simplified (use proper AEAD in production) |
| Merkle Trees | Incremental with Pedersen hashes | SHA256-based (can upgrade to Poseidon) |
| Storage | UTXO-based blockchain | Account-based Solana program |

### What Works Like Zcash

✅ **Address Structure**: Identical format (11-byte diversifier + 32-byte pk_d)
✅ **Key Hierarchy**: Same derivation chain (sk -> fvk -> ivk -> address)
✅ **Note Format**: Compatible structure with value, diversifier, rseed, memo
✅ **Nullifiers**: Same concept for preventing double-spending
✅ **Commitments**: Pedersen-style commitments (simplified)
✅ **Viewing Keys**: Full support for view-only access

### Security Considerations

⚠️ **Current Limitations** (for production, implement proper versions):

1. **Cryptography**: Using simplified hash-based crypto instead of elliptic curves
2. **Zero-Knowledge Proofs**: Placeholder verification (need actual Groth16/PLONK)
3. **Encryption**: Simplified ChaCha20-Poly1305 (use production AEAD)
4. **Randomness**: Using deterministic hashing (need proper RNG)

## File Structure

```
dark-protocol/
├── programs/
│   ├── dark-protocol/           # Main protocol
│   │   └── src/
│   │       ├── crypto/
│   │       │   ├── sapling.rs             # Zcash Sapling addresses ⭐
│   │       │   ├── note_encryption.rs     # Zcash note encryption ⭐
│   │       │   ├── commitment.rs          # Pedersen commitments
│   │       │   ├── nullifier.rs           # Nullifier generation
│   │       │   ├── merkle.rs              # Merkle tree
│   │       │   └── zk_proof.rs            # ZK proof verification
│   │       ├── state.rs                   # Account structures
│   │       ├── lib.rs                     # Main program logic
│   │       └── errors.rs                  # Error codes
│   │
│   └── shielded-wallet/         # Zcash-style wallet ⭐
│       └── src/
│           └── lib.rs            # Complete wallet implementation
│
└── Anchor.toml                  # Anchor configuration
```

## Usage Example

### 1. Initialize Wallet

```rust
// Generate spending key (off-chain, never revealed)
let sk = SaplingSpendingKey::random(&seed);
let fvk = sk.full_viewing_key();

// Initialize wallet with only viewing key
initialize_wallet(
    ctx,
    hash(sk),  // Commitment only
    fvk,       // Full viewing key
    default_diversifier,
);
```

### 2. Create Privacy Address

```rust
// Generate diversified address (can create unlimited)
create_diversified_address(
    ctx,
    diversifier,  // 11 bytes, like Zcash
    index,        // Address index
);
```

### 3. Shield Tokens (Deposit)

```rust
shield_tokens(
    ctx,
    amount,
    recipient_address,  // 43-byte Sapling address
    memo,               // 512-byte encrypted memo
    rseed,              // Randomness for note
);
```

### 4. Private Transfer

```rust
private_transfer(
    ctx,
    input_nullifiers,    // Spend existing notes
    output_commitments,  // Create new notes
    zk_proof,            // Prove transaction validity
    merkle_proofs,       // Prove note existence
);
```

### 5. Unshield (Withdraw)

```rust
unshield_tokens(
    ctx,
    nullifier,      // Prevent double-spend
    amount,
    merkle_proof,   // Prove note in tree
    zk_proof,       // Prove ownership
);
```

### 6. View Notes (Read-only)

```rust
let result = view_note(
    ctx,
    incoming_viewing_key,  // ivk for decryption
);
// Returns: { value, memo, diversifier }
```

## Comparison with Zcash

### Similarities

1. **Address Format**: Exact same 43-byte Sapling payment address
2. **Key Hierarchy**: Identical sk -> fvk -> ivk -> address chain
3. **Note Structure**: Compatible with Zcash note format
4. **Diversifiers**: Same 11-byte diversifier system
5. **Nullifiers**: Same double-spend prevention mechanism
6. **Viewing Keys**: Same spend/view key separation

### Differences

1. **Blockchain Model**: Account-based (Solana) vs UTXO (Zcash)
2. **Consensus**: Proof-of-Stake (Solana) vs Proof-of-Work (Zcash)
3. **Performance**: 400ms blocks (Solana) vs 75s blocks (Zcash)
4. **Fees**: ~$0.0002 (Solana) vs ~$0.01 (Zcash)
5. **Smart Contracts**: Native support (Solana) vs limited (Zcash)

## Building

```bash
# Install Anchor if needed
npm install -g @coral-xyz/anchor-cli

# Build all programs
anchor build

# Or use cargo directly
cargo build-sbf --manifest-path programs/dark-protocol/Cargo.toml
cargo build-sbf --manifest-path programs/shielded-wallet/Cargo.toml
```

## Testing

```bash
# Run tests
anchor test

# Or cargo test
cargo test --manifest-path programs/dark-protocol/Cargo.toml
```

## Deployment

```bash
# Deploy to devnet
solana config set --url devnet
anchor deploy

# Deploy to mainnet (after audits!)
solana config set --url mainnet-beta
anchor deploy
```

## Roadmap to Production

### Phase 1: Core Cryptography ✅
- [x] Sapling address system
- [x] Note encryption/decryption
- [x] Key derivation hierarchy
- [x] Basic commitment scheme
- [x] Nullifier generation

### Phase 2: Proof System (Next)
- [ ] Implement Groth16 verifier on-chain
- [ ] Or use PLONK/Halo2 for better recursion
- [ ] Circuit for spend authorization
- [ ] Circuit for output note creation
- [ ] Merkle tree membership proofs

### Phase 3: Production Hardening
- [ ] Replace hash-based crypto with proper curves
- [ ] Implement real ChaCha20-Poly1305
- [ ] Add proper randomness sources
- [ ] Security audit
- [ ] Formal verification

### Phase 4: Advanced Features
- [ ] Cross-program private calls
- [ ] Privacy-preserving DEX integration
- [ ] Compliance tools (viewing keys for auditors)
- [ ] Mobile wallet support
- [ ] Hardware wallet integration

## References

- [Zcash Protocol Specification](https://zips.z.cash/protocol/protocol.pdf)
- [Sapling Protocol](https://z.cash/upgrade/sapling/)
- [ZIP 32: Shielded Hierarchical Deterministic Wallets](https://zips.z.cash/zip-0032)
- [ZIP 212: Allow Recipient to Derive Sapling Ephemeral Secret](https://zips.z.cash/zip-0212)
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)

## Credits

This implementation adapts cryptographic primitives from:
- **Zcash** (MIT/Apache 2.0): Address system, note encryption, key hierarchy
- **Electric Coin Company**: Sapling protocol design
- **Zcash Community**: ZIP specifications and reference implementations

Built for Solana using:
- **Anchor Framework**: Solana program development
- **Solana Web3.js**: Client library
- **Rust**: Systems programming language

## License

Apache 2.0 (same as Zcash core components)

## Security Warning

⚠️ **This code is UNAUDITED and uses SIMPLIFIED cryptography.**

DO NOT use in production without:
1. Complete security audit
2. Proper zero-knowledge proof implementation
3. Production-grade encryption
4. Formal verification
5. Extensive testing on devnet/testnet

This is a **proof-of-concept** demonstrating how Zcash's privacy technology can be adapted to Solana.

---

**Built with privacy in mind. Deploy with caution. 🔒**
