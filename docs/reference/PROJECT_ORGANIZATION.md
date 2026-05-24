# 📁 Dark Protocol - Project Organization

Complete overview of the Dark Protocol project structure, files, and organization.

## 📊 Project Summary

**Status:** 🎉 **DEPLOYED TO DEVNET - LIVE!**

**Deployment Date:** November 11, 2025 - 3:09 PM EST

**Program IDs:**
- Dark Protocol: `3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC` ✅ LIVE
- Shielded Wallet: `4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg` ✅ LIVE

---

## 📂 Directory Structure

```
DarkWallet/
├── 📄 Configuration Files
│   ├── Anchor.toml              # Anchor framework configuration
│   ├── Cargo.toml               # Workspace Cargo configuration
│   ├── package.json             # Node.js dependencies
│   └── pnpm-lock.yaml          # Package lock file
│
├── 📝 Documentation
│   ├── README.md               # Main project README
│   ├── PROGRAM_INFO.md         # Program IDs, keypairs, build info
│   ├── DEPLOYMENT_GUIDE.md     # Complete deployment guide
│   ├── PROJECT_ORGANIZATION.md # This file
│   ├── REPOSITORY_SETUP.md     # Repository setup guide
│   └── docs/                   # Additional documentation
│       ├── COMPLETE_IMPLEMENTATION_GUIDE.md
│       ├── DARK_DEFI_VISION.md
│       ├── DEPLOYMENT_SUCCESS.md
│       ├── DEPLOYMENT.md
│       ├── DEVNET_DEPLOYMENT.md
│       ├── HELIUS_INTEGRATION.md
│       ├── IMPLEMENTATION_SUMMARY.md
│       ├── QUICK_START.md
│       ├── ZCASH_INTEGRATION_COMPLETE.md
│       ├── ZCASH_INTEGRATION.md
│       ├── ZCASH_PORT.md
│       └── ZCASH_RUST_INTEGRATION.md
│
├── 🔧 Scripts
│   ├── deploy-dark-protocol.sh  # Automated deployment script
│   ├── deploy.sh                # Legacy deployment script
│   └── scripts/
│       ├── deploy-devnet.sh
│       └── deploy-devnet-secure.sh
│
├── 🔐 Programs (Solana Smart Contracts)
│   ├── dark-protocol/          # Main privacy protocol
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs          # Program entry point
│   │       ├── state.rs        # On-chain state structures
│   │       ├── errors.rs       # Error definitions
│   │       ├── crypto/         # Cryptographic primitives
│   │       │   ├── mod.rs
│   │       │   ├── sapling.rs
│   │       │   ├── fhe.rs
│   │       │   ├── merkle.rs
│   │       │   ├── commitment.rs
│   │       │   ├── encryption.rs
│   │       │   ├── note_encryption.rs
│   │       │   ├── nullifier.rs
│   │       │   ├── threshold_elgamal.rs
│   │       │   └── zk_proof.rs
│   │       ├── zcash/          # Zcash components
│   │       │   ├── mod.rs
│   │       │   ├── sapling.rs
│   │       │   ├── prf.rs
│   │       │   ├── zip32.rs
│   │       │   └── note_encryption.rs
│   │       └── instructions/
│   │           └── mod.rs
│   │
│   └── shielded-wallet/        # Shielded wallet program
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
│
├── 💻 SDK (Software Development Kit)
│   └── typescript/
│       ├── package.json
│       ├── tsconfig.json
│       ├── rollup.config.js
│       ├── SDK_INTEGRATION.md
│       └── src/
│           ├── index.ts
│           ├── client.ts
│           ├── wallet.ts
│           ├── privacy.ts
│           ├── sapling.ts
│           ├── note-encryption.ts
│           ├── swap.ts
│           ├── ai-agent.ts
│           ├── config.ts
│           ├── types.ts
│           └── utils.ts
│
├── 🎯 Build Output
│   └── target/
│       ├── deploy/
│       │   ├── dark_protocol.so              # Compiled program (334KB)
│       │   ├── shielded_wallet.so            # Compiled program (421KB)
│       │   ├── dark_protocol-keypair.json    # Program keypair
│       │   └── shielded_wallet-keypair.json  # Program keypair
│       └── idl/
│           ├── dark_protocol.json
│           └── shielded_wallet.json
│
└── 📜 License & Git
    ├── LICENSE
    └── .gitignore
```

---

## 🔑 Critical Files

### Must-Know Files for Deployment

1. **Anchor.toml** - Program IDs and network configuration
2. **PROGRAM_INFO.md** - All program information and keypairs
3. **DEPLOYMENT_GUIDE.md** - Step-by-step deployment instructions
4. **deploy-dark-protocol.sh** - Automated deployment script

### Must-Know Files for Development

1. **programs/dark-protocol/src/lib.rs** - Main program logic
2. **programs/dark-protocol/src/state.rs** - Data structures
3. **programs/shielded-wallet/src/lib.rs** - Wallet program logic
4. **sdk/typescript/src/client.ts** - TypeScript client

### Must-Read Documentation

1. **README.md** - Project overview and quick start
2. **DARK_DEFI_VISION.md** - Complete technical vision
3. **ZCASH_PORT.md** - Cryptography implementation details
4. **DEPLOYMENT_GUIDE.md** - Deployment procedures

---

## 📦 Key Components

### Programs (Solana Smart Contracts)

#### Dark Protocol (`dark-protocol`)
- **Purpose:** Core privacy protocol with Zcash primitives
- **Size:** 334 KB compiled
- **Program ID:** `3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC`
- **Key Features:**
  - Sapling key derivation
  - Commitment/nullifier system
  - FHE encryption
  - Merkle tree management
  - ZK proof verification

#### Shielded Wallet (`shielded-wallet`)
- **Purpose:** Privacy-preserving wallet with shielded transactions
- **Size:** 421 KB compiled
- **Program ID:** `4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg`
- **Key Features:**
  - Private transfers
  - Shield/unshield tokens
  - Encrypted notes
  - Signature verification

### SDK (TypeScript)

**Location:** `sdk/typescript/`

**Purpose:** Client library for interacting with Dark Protocol programs

**Key Files:**
- `client.ts` - Main program client
- `wallet.ts` - Privacy wallet implementation
- `privacy.ts` - Privacy utilities
- `sapling.ts` - Sapling crypto operations
- `swap.ts` - Dark swap functionality
- `ai-agent.ts` - AI agent framework

---

## 🔧 Build System

### Toolchain

- **Rust:** Stable (1.70.0+)
- **Solana:** 1.18.0
- **Anchor CLI:** 0.32.1
- **Anchor Framework:** 0.30.0
- **BPF Target:** `bpfel-unknown-unknown`

### Build Commands

```bash
# Clean build
anchor clean

# Build programs
anchor build

# Build TypeScript SDK
cd sdk/typescript && npm run build

# Run tests
anchor test

# Deploy
anchor deploy --provider.cluster devnet
```

### Build Artifacts

**Location:** `target/deploy/`

**Files:**
- `dark_protocol.so` (334 KB)
- `shielded_wallet.so` (421 KB)
- `dark_protocol-keypair.json`
- `shielded_wallet-keypair.json`

---

## 📝 Documentation Categories

### 1. Getting Started
- `README.md` - Main entry point
- `docs/QUICK_START.md` - 5-minute guide
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

### 2. Technical Documentation
- `docs/DARK_DEFI_VISION.md` - Architecture & vision
- `docs/ZCASH_PORT.md` - Cryptography details
- `docs/COMPLETE_IMPLEMENTATION_GUIDE.md` - Implementation guide

### 3. Deployment Documentation
- `DEPLOYMENT_GUIDE.md` - Complete guide
- `PROGRAM_INFO.md` - Program information
- `docs/DEVNET_DEPLOYMENT.md` - Devnet specifics
- `docs/DEPLOYMENT_SUCCESS.md` - Success verification

### 4. Integration Documentation
- `sdk/typescript/SDK_INTEGRATION.md` - SDK integration
- `docs/HELIUS_INTEGRATION.md` - Helius RPC integration

---

## 🔐 Security Files

### Critical - Never Commit

🔴 **DO NOT COMMIT THESE FILES:**
- `target/deploy/*-keypair.json` (Program keypairs)
- `.env` (Environment variables)
- `~/.config/solana/id.json` (Wallet keypair)

### Already Protected (in .gitignore)

✅ These are already in `.gitignore`:
- `target/` directory
- `node_modules/` directory
- `.env` files
- `*.keypair` files

---

## 🚀 Deployment Status

### Current Status - LIVE ON DEVNET! 🎉

✅ **Completed:**
- Programs compiled successfully (334KB + 421KB)
- Program IDs configured across all files
- Keypairs generated and secured
- Documentation suite created
- Deployment script implemented
- **Wallet funded with SOL**
- **✅ DEPLOYED TO DEVNET**
- Deployment transactions confirmed

⏳ **Next Steps:**
- Verify programs on Solana Explorer
- Test program instructions on devnet
- Update SDK with deployed program IDs
- Build frontend integration
- Community testing

### Deployment Complete! ✅

**Deployed Programs:**
```bash
Dark Protocol: 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC
Shielded Wallet: 4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg
```

**Deployment Signatures:**
```
Dark Protocol: 2AJGoZMqeyUn7MA7BiUHs1Vke5WUjz7VE7eiGBxb3sxVfd7M1JekM5z81B4xczrefeMc2m4p18YjissTi468Z53x
Shielded Wallet: 3iLxV1XYQyajNSFZ7sqZkC1SZ91hvdtxVN2v48S4FkstUKDcDcQGKu7A2PJXV2ccthT3moR4KGBQRsjpMSfXMxwQ
```

**Explorer Links:**
- [Dark Protocol](https://explorer.solana.com/address/3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC?cluster=devnet)
- [Shielded Wallet](https://explorer.solana.com/address/4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg?cluster=devnet)

**Next Steps:**
1. Verify programs on Explorer
2. Test program instructions
3. Update SDK configuration
4. Begin integration testing

---

## 📊 File Sizes & Metrics

### Programs
- dark-protocol: 334 KB
- shielded-wallet: 421 KB
- **Total:** 755 KB

### Source Code
- Rust files: ~50 files
- TypeScript files: ~15 files
- Documentation: ~20 files

### Lines of Code (Approximate)
- Rust: ~8,000 lines
- TypeScript: ~2,000 lines
- Documentation: ~5,000 lines

---

## 🗂️ File Naming Conventions

### Programs
- Rust files: `snake_case.rs`
- Modules: `mod.rs` for module roots
- Programs: `lib.rs` for entry points

### Documentation
- Uppercase with underscores: `DEPLOYMENT_GUIDE.md`
- Descriptive names: `PROGRAM_INFO.md`

### Scripts
- Lowercase with hyphens: `deploy-dark-protocol.sh`
- Executable: `chmod +x script.sh`

---

## 🔗 Quick Reference Links

### Explorer Links (After Deployment)
- Dark Protocol: `https://explorer.solana.com/address/3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC?cluster=devnet`
- Shielded Wallet: `https://explorer.solana.com/address/4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg?cluster=devnet`

### Important Files to Bookmark
1. `PROGRAM_INFO.md` - Program details
2. `DEPLOYMENT_GUIDE.md` - Deployment guide
3. `README.md` - Project overview
4. `docs/DARK_DEFI_VISION.md` - Technical vision

---

## 💡 Tips for New Contributors

### First Time Setup
1. Read `README.md` first
2. Review `docs/QUICK_START.md`
3. Check `PROGRAM_INFO.md` for current state
4. Follow `DEPLOYMENT_GUIDE.md` for deployment

### Development Workflow
1. Make changes to Rust code
2. Run `anchor build` to compile
3. Run `anchor test` to verify
4. Update documentation if needed
5. Commit changes (but never commit keypairs!)

### Common Tasks

**Build everything:**
```bash
anchor build && cd sdk/typescript && npm run build
```

**Clean and rebuild:**
```bash
anchor clean && anchor build
```

**Test locally:**
```bash
solana-test-validator  # In one terminal
anchor test --skip-local-validator  # In another
```

---

## 📞 Getting Help

If you need help:

1. Check documentation in `docs/` directory
2. Review `DEPLOYMENT_GUIDE.md` troubleshooting section
3. Check `PROGRAM_INFO.md` for current configuration
4. Review error messages carefully
5. Open an issue on GitHub

---

## ✅ Organization Checklist

- [x] Project structure documented
- [x] All critical files identified
- [x] Build system explained
- [x] Deployment process documented
- [x] Security considerations noted
- [x] Quick reference created
- [x] File naming conventions established
- [x] Documentation categorized
- [x] Next steps clarified

---

**Last Updated:** November 11, 2025 - 3:09 PM EST  
**Version:** 1.0.0  
**Project Status:** 🎉 **DEPLOYED TO DEVNET - LIVE!**
