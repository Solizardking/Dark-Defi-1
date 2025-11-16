# 🔑 Dark Protocol - Program Information

This document contains critical program deployment information including program IDs, keypairs, and configuration details.

## 📋 Program IDs

### Production Program IDs (Current)

```
Dark Protocol Program ID: 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC
Shielded Wallet Program ID: 4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg
```

### Network Deployment Status

| Program | Localnet | Devnet | Mainnet |
|---------|----------|--------|---------|
| **dark-protocol** | `3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC` | ✅ **DEPLOYED** | Not Deployed |
| **shielded-wallet** | `4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg` | ✅ **DEPLOYED** | Not Deployed |

### Deployment Signatures (Devnet)

**Dark Protocol:**
```
Signature: 2AJGoZMqeyUn7MA7BiUHs1Vke5WUjz7VE7eiGBxb3sxVfd7M1JekM5z81B4xczrefeMc2m4p18YjissTi468Z53x
```

**Shielded Wallet:**
```
Signature: 3iLxV1XYQyajNSFZ7sqZkC1SZ91hvdtxVN2v48S4FkstUKDcDcQGKu7A2PJXV2ccthT3moR4KGBQRsjpMSfXMxwQ
```

## 🔐 Keypair Information

### Dark Protocol Keypair

**Location:** `target/deploy/dark_protocol-keypair.json`

**Seed Phrase (BIP39 Equivalent):**
```
occur quarter copy genre today joke insect proof asthma town waste daring
```

**Public Key (Base58):**
```
3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC
```

**Raw Keypair (First 32 bytes = Secret Key):**
```json
[93,252,0,171,103,3,54,102,89,1,226,224,250,74,199,4,153,98,59,83,59,229,117,92,231,242,221,56,217,131,100,166,34,116,254,126,38,63,210,225,223,76,235,122,156,194,153,44,180,234,213,37,56,149,9,248,11,255,227,50,172,201,4,177]
```

### Shielded Wallet Keypair

**Location:** `target/deploy/shielded_wallet-keypair.json`

**Seed Phrase (BIP39 Equivalent):**
```
cat two pledge bean shell artwork song romance remain welcome poverty deposit
```

**Public Key (Base58):**
```
4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg
```

**Raw Keypair (First 32 bytes = Secret Key):**
```json
[98,163,172,184,70,178,201,182,83,123,62,56,190,59,178,89,174,211,95,163,12,120,246,179,190,219,137,112,247,201,151,64,46,33,30,110,55,73,76,8,242,108,108,60,249,217,171,153,163,251,174,100,243,230,160,30,92,29,137,219,193,203,38,207]
```

## 📦 Compiled Binaries

### Binary Information

| Program | File | Size | Location |
|---------|------|------|----------|
| **dark-protocol** | `dark_protocol.so` | 334 KB | `target/deploy/dark_protocol.so` |
| **shielded-wallet** | `shielded_wallet.so` | 421 KB | `target/deploy/shielded_wallet.so` |

### Build Configuration

- **Anchor Version:** 0.32.1 (CLI), 0.30.0 (Framework)
- **Solana Version:** 1.18.0
- **Rust Toolchain:** Stable
- **BPF Target:** `bpfel-unknown-unknown`

## 🔧 Configuration Files

### Anchor.toml Configuration

The `Anchor.toml` file is configured with the following program IDs across all networks:

```toml
[programs.localnet]
dark_protocol = "3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC"
shielded_wallet = "4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg"

[programs.devnet]
dark_protocol = "3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC"
shielded_wallet = "4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg"

[programs.mainnet]
dark_protocol = "3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC"
shielded_wallet = "4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg"
```

### Program lib.rs Declaration

**dark-protocol/src/lib.rs:**
```rust
declare_id!("3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC");
```

**shielded-wallet/src/lib.rs:**
```rust
declare_id!("4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg");
```

## 🌐 RPC Endpoints

### Helius RPC Configuration

**Devnet (Public):**
```
https://devnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0
```

**Devnet (Secure):**
```
https://cati-etnoqa-fast-devnet.helius-rpc.com
```

**Mainnet (Public):**
```
https://mainnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0
```

**Mainnet (Secure):**
```
https://alli-pigt1b-fast-mainnet.helius-rpc.com
```

**Localnet:**
```
http://localhost:8899
```

## ⚠️ Security Warnings

### Critical Information

🔴 **NEVER SHARE THESE FILES PUBLICLY:**
- `target/deploy/dark_protocol-keypair.json`
- `target/deploy/shielded_wallet-keypair.json`
- Seed phrases listed above

🔴 **THESE KEYPAIRS CONTROL THE PROGRAMS:**
- Anyone with access to these keypairs can upgrade the programs
- Store them securely in a password manager or hardware wallet
- Consider using a multisig for mainnet deployments

### Backup Recommendations

1. **Encrypted Backup:** Store keypairs in an encrypted backup
2. **Multiple Locations:** Keep copies in separate secure locations
3. **Access Control:** Limit who has access to these files
4. **Monitoring:** Set up alerts for program upgrades

## 📊 Deployment History

### Build & Deployment History

| Date | Time | Action | Result |
|------|------|--------|--------|
| 2025-11-11 | 14:00 | Generated new keypairs | Success |
| 2025-11-11 | 14:00 | Fixed workspace dependencies | Success |
| 2025-11-11 | 14:00 | Fixed Anchor fallback function error | Success |
| 2025-11-11 | 14:00 | Fixed borrow/move errors | Success |
| 2025-11-11 | 14:00 | Built dark-protocol (334 KB) | Success |
| 2025-11-11 | 14:00 | Built shielded-wallet (421 KB) | Success |
| 2025-11-11 | 15:09 | **Deployed dark-protocol to Devnet** | ✅ **SUCCESS** |
| 2025-11-11 | 15:09 | **Deployed shielded-wallet to Devnet** | ✅ **SUCCESS** |

### Known Issues Resolved

1. ✅ Invalid Base58 program IDs (original user-provided IDs)
2. ✅ Workspace dependency conflicts
3. ✅ Anchor fallback function detection errors
4. ✅ Rust borrow checker errors in private_transfer
5. ✅ Program ID conflict on devnet (old shielded_wallet ID)
6. ✅ Missing idl-build features

### Remaining Warnings

- **BPF Stack Warnings:** Expected in Sapling crypto functions (non-blocking)
- These are documented limitations of BPF stack constraints
- Do not affect program functionality

## 🚀 Next Steps

### ✅ Devnet Deployment - COMPLETE!

1. ✅ Programs compiled successfully
2. ✅ Funded deployment wallet with SOL
3. ✅ Deployed to devnet successfully
4. ⏳ Verify on Solana Explorer (see links below)
5. ⏳ Test program instructions
6. ⏳ Update SDK with deployed program IDs

### Verification Links

**Dark Protocol Explorer:**
```
https://explorer.solana.com/address/3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC?cluster=devnet
https://explorer.solana.com/tx/2AJGoZMqeyUn7MA7BiUHs1Vke5WUjz7VE7eiGBxb3sxVfd7M1JekM5z81B4xczrefeMc2m4p18YjissTi468Z53x?cluster=devnet
```

**Shielded Wallet Explorer:**
```
https://explorer.solana.com/address/4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg?cluster=devnet
https://explorer.solana.com/tx/3iLxV1XYQyajNSFZ7sqZkC1SZ91hvdtxVN2v48S4FkstUKDcDcQGKu7A2PJXV2ccthT3moR4KGBQRsjpMSfXMxwQ?cluster=devnet
```

### For Mainnet (Future)

⚠️ **DO NOT deploy to mainnet yet. Required first:**
- Security audit by reputable firm
- ZK-SNARK circuit production implementation
- Threshold ElGamal SDK implementation
- Resolution of BPF stack warnings
- Comprehensive testing on devnet
- Community review

## 📝 Notes

- Programs use Anchor framework 0.30.0 (code) with CLI 0.32.1
- Both programs successfully compiled with latest fixes
- Keypairs generated with valid Base58 encoding
- All configuration files updated with correct IDs
- Ready for devnet deployment pending wallet funding

---

**Last Updated:** November 11, 2025 - 3:09 PM EST
**Status:** 🎉 **DEPLOYED TO DEVNET - LIVE!**
