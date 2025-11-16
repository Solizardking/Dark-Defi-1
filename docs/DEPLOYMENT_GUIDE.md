# 🚀 Dark Protocol - Deployment Guide

Complete guide for deploying Dark Protocol to Solana networks (Localnet, Devnet, Mainnet).

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Steps](#deployment-steps)
- [Network-Specific Instructions](#network-specific-instructions)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## 🔧 Prerequisites

### Required Tools

Ensure you have the following installed:

```bash
# Check Rust
rustc --version
# Required: 1.70.0 or higher

# Check Solana CLI
solana --version
# Required: 1.18.0 or higher

# Check Anchor CLI
anchor --version
# Required: 0.32.1

# Check Node.js
node --version
# Required: 16.0.0 or higher
```

### Install Missing Tools

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Add Solana to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.32.1
avm use 0.32.1

# Install Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16
nvm use 16
```

---

## ✅ Pre-Deployment Checklist

### 1. Verify Build

```bash
# Clean previous builds
anchor clean

# Build programs
anchor build

# Verify binaries exist
ls -lh target/deploy/dark_protocol.so
ls -lh target/deploy/shielded_wallet.so
```

**Expected Output:**
```
-rwxr-xr-x  1 user  staff   334K Nov 11 14:00 dark_protocol.so
-rwxr-xr-x  1 user  staff   421K Nov 11 14:00 shielded_wallet.so
```

### 2. Verify Program IDs

```bash
# Check Anchor.toml configuration
cat Anchor.toml | grep -A 2 "programs.devnet"

# Verify program IDs in source code
grep "declare_id" programs/dark-protocol/src/lib.rs
grep "declare_id" programs/shielded-wallet/src/lib.rs
```

**Expected Program IDs:**
- dark_protocol: `3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC`
- shielded_wallet: `4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg`

### 3. Check Wallet

```bash
# View current wallet
solana address

# Check balance (Devnet)
solana balance --url devnet

# If balance is low, airdrop SOL (Devnet only)
solana airdrop 2 --url devnet
```

**Minimum Required Balance:**
- Devnet: ~5 SOL (programs are ~750KB total)
- Mainnet: ~10 SOL (includes buffer for upgrades)

---

## 🚀 Deployment Steps

### Method 1: Anchor Deploy (Recommended)

#### Step 1: Configure Network

```bash
# For Devnet
solana config set --url devnet

# For Mainnet (when ready)
solana config set --url mainnet-beta

# For Localnet
solana config set --url localhost
```

#### Step 2: Deploy Programs

```bash
# Deploy to configured network
anchor deploy

# Or specify network explicitly
anchor deploy --provider.cluster devnet

# With Helius RPC (faster, more reliable)
anchor deploy --provider.cluster https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

**Expected Output:**
```
Deploying cluster: Devnet
Upgrade authority: YOUR_WALLET_ADDRESS
Deploying program "dark_protocol"...
Program Id: 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC
Deploying program "shielded_wallet"...
Program Id: 4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg

Deploy success
```

### Method 2: Manual Deployment

```bash
# Deploy dark-protocol
solana program deploy \
  target/deploy/dark_protocol.so \
  --program-id target/deploy/dark_protocol-keypair.json \
  --url devnet

# Deploy shielded-wallet
solana program deploy \
  target/deploy/shielded_wallet.so \
  --program-id target/deploy/shielded_wallet-keypair.json \
  --url devnet
```

### Method 3: Using Custom Script

```bash
# Make script executable
chmod +x deploy-dark-protocol.sh

# Deploy to devnet
./deploy-dark-protocol.sh devnet

# Deploy to mainnet (when ready)
./deploy-dark-protocol.sh mainnet
```

---

## 🌐 Network-Specific Instructions

### Localnet Deployment

```bash
# Start local validator
solana-test-validator

# In another terminal, deploy
solana config set --url localhost
anchor deploy --provider.cluster localnet

# Test locally
anchor test --skip-local-validator
```

### Devnet Deployment

```bash
# Configure Solana CLI
solana config set --url devnet

# Airdrop SOL for deployment
solana airdrop 5

# Deploy
anchor deploy --provider.cluster devnet

# Verify on Explorer
# https://explorer.solana.com/address/3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC?cluster=devnet
```

### Mainnet Deployment

⚠️ **WARNING: DO NOT deploy to mainnet yet!**

Required before mainnet deployment:
1. ✅ Complete security audit
2. ✅ Production ZK-SNARK implementation
3. ✅ Extensive devnet testing
4. ✅ Community review
5. ✅ Insurance fund setup

When ready:
```bash
# Configure Solana CLI
solana config set --url mainnet-beta

# Ensure sufficient SOL (at least 10 SOL)
solana balance

# Deploy with caution
anchor deploy --provider.cluster mainnet

# IMMEDIATELY verify deployment
solana program show 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC
```

---

## ✔️ Post-Deployment Verification

### 1. Verify Programs Exist

```bash
# Check dark-protocol
solana program show 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC --url devnet

# Check shielded-wallet
solana program show 4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg --url devnet
```

**Expected Output:**
```
Program Id: 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: [ADDRESS]
Authority: [YOUR_WALLET]
Last Deployed In Slot: [SLOT_NUMBER]
Data Length: 341888 (0x53780) bytes
Balance: [RENT_EXEMPT_BALANCE] SOL
```

### 2. Verify IDL Generated

```bash
# Check IDL files
ls -lh target/idl/

# View dark_protocol IDL
cat target/idl/dark_protocol.json | jq '.instructions[] | .name'

# View shielded_wallet IDL
cat target/idl/shielded_wallet.json | jq '.instructions[] | .name'
```

### 3. Test Basic Instruction

```bash
# Run Anchor tests
anchor test --skip-deploy

# Or test specific functionality
npm test
```

### 4. Check Solana Explorer

Visit the following URLs to verify deployment:

**Dark Protocol:**
```
https://explorer.solana.com/address/3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC?cluster=devnet
```

**Shielded Wallet:**
```
https://explorer.solana.com/address/4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg?cluster=devnet
```

---

## 🔧 Troubleshooting

### Issue: Insufficient Balance

```bash
# Error: insufficient funds
Error: Account [WALLET] has insufficient funds for spend

# Solution: Airdrop more SOL (devnet only)
solana airdrop 5 --url devnet
```

### Issue: Program Already Exists

```bash
# Error: account in use
Error: Account [PROGRAM_ID] is already in use

# Solution 1: Use upgrade instead of deploy
solana program upgrade target/deploy/dark_protocol.so --program-id 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC

# Solution 2: Generate new keypair
solana-keygen new -o target/deploy/dark_protocol-keypair.json
# Then update Anchor.toml and lib.rs with new program ID
```

### Issue: Build Failures

```bash
# Error: build failed
error: could not compile `dark-protocol`

# Solution: Clean and rebuild
anchor clean
rm -rf target/
anchor build
```

### Issue: Wrong Network

```bash
# Error: deployed to wrong network

# Solution: Check current network
solana config get

# Set correct network
solana config set --url devnet
```

### Issue: Timeout During Deployment

```bash
# Error: transaction timeout

# Solution: Use Helius RPC for better reliability
anchor deploy --provider.cluster https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

---

## 🔐 Security Best Practices

### Before Deployment

1. **Code Review**
   - Review all source code changes
   - Run security scanners (cargo audit, clippy)
   - Test extensively on devnet

2. **Keypair Management**
   - Store keypairs securely (encrypted backup)
   - Never commit keypairs to version control
   - Use hardware wallets for mainnet

3. **Access Control**
   - Limit upgrade authority access
   - Consider multisig for mainnet
   - Document all authorized users

### During Deployment

1. **Network Verification**
   ```bash
   # Double-check network before deploying
   solana config get
   ```

2. **Dry Run**
   ```bash
   # Test deployment process on devnet first
   anchor deploy --provider.cluster devnet
   ```

3. **Transaction Monitoring**
   ```bash
   # Monitor deployment transaction
   solana confirm -v [SIGNATURE]
   ```

### After Deployment

1. **Immediate Verification**
   - Check program exists on-chain
   - Verify upgrade authority
   - Test core functionality

2. **Monitoring Setup**
   - Set up alerts for program upgrades
   - Monitor transaction volume
   - Track error rates

3. **Documentation**
   - Document deployment date/slot
   - Record program versions
   - Update README with new addresses

### Emergency Procedures

1. **Program Freeze**
   ```bash
   # If critical bug found, consider freezing program
   # This requires upgrade authority
   # Contact security team immediately
   ```

2. **Rollback Plan**
   ```bash
   # Keep previous program versions for potential rollback
   cp target/deploy/dark_protocol.so backups/dark_protocol_v1.0.0.so
   ```

---

## 📊 Deployment Checklist

Use this checklist for each deployment:

### Pre-Deployment
- [ ] Code review completed
- [ ] Tests passing (100% success)
- [ ] Security audit completed (mainnet only)
- [ ] Documentation updated
- [ ] Keypairs backed up securely
- [ ] Network configuration verified
- [ ] Wallet funded with sufficient SOL
- [ ] Build successful (no errors)

### Deployment
- [ ] Correct network selected
- [ ] Program IDs verified
- [ ] Deployment initiated
- [ ] Transaction confirmed
- [ ] Program deployed successfully
- [ ] IDL generated correctly

### Post-Deployment
- [ ] Programs verified on Explorer
- [ ] Upgrade authority correct
- [ ] Basic functionality tested
- [ ] SDK updated with new addresses
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring enabled

---

## 📞 Support

If you encounter issues during deployment:

1. Check [PROGRAM_INFO.md](PROGRAM_INFO.md) for program details
2. Review [Troubleshooting](#troubleshooting) section above
3. Check Anchor documentation: https://www.anchor-lang.com/
4. Check Solana documentation: https://docs.solana.com/
5. Open an issue on GitHub

---

## 🔗 Quick Reference

**Program IDs:**
- Dark Protocol: `3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC`
- Shielded Wallet: `4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg`

**Deploy Commands:**
```bash
# Devnet
anchor deploy --provider.cluster devnet

# With Helius RPC
anchor deploy --provider.cluster https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Mainnet (when ready)
anchor deploy --provider.cluster mainnet
```

**Verification:**
```bash
# Check program
solana program show [PROGRAM_ID] --url devnet

# Check balance
solana balance --url devnet

# View logs
solana logs [PROGRAM_ID]
```

---

**Last Updated:** November 11, 2025  
**Version:** 1.0.0  
**Status:** Ready for Devnet Deployment
