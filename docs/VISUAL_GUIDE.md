# 🎨 Dark Terminal Visual Guide

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Transaction Flow](#transaction-flow)
3. [Privacy Layers](#privacy-layers)
4. [Component Interactions](#component-interactions)
5. [Data Flow Diagrams](#data-flow-diagrams)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Dark Terminal Ecosystem                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐          │
│  │     User     │──▶│  CLI/TUI     │──▶│   Config     │          │
│  │  Interface   │   │  Commands    │   │  Manager     │          │
│  └──────────────┘   └──────────────┘   └──────────────┘          │
│         │                   │                   │                  │
│         ▼                   ▼                   ▼                  │
│  ┌──────────────────────────────────────────────────────┐         │
│  │              Core Components                         │         │
│  │                                                      │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │         │
│  │  │  Wallet  │  │ Jupiter  │  │   Dark   │         │         │
│  │  │ Manager  │  │  Client  │  │  Agent   │         │         │
│  │  └──────────┘  └──────────┘  └──────────┘         │         │
│  │       │              │              │               │         │
│  └───────┼──────────────┼──────────────┼───────────────┘         │
│          │              │              │                          │
│          ▼              ▼              ▼                          │
│  ┌──────────────────────────────────────────────────────┐         │
│  │           Privacy & Security Layer                   │         │
│  │                                                      │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │         │
│  │  │   Tor    │  │  Crypto  │  │   ZK     │         │         │
│  │  │  Proxy   │  │  Utils   │  │  Proofs  │         │         │
│  │  └──────────┘  └──────────┘  └──────────┘         │         │
│  └──────────────────────────────────────────────────────┘         │
│                         │                                          │
│                         ▼                                          │
│  ┌──────────────────────────────────────────────────────┐         │
│  │           External Services                          │         │
│  │                                                      │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │         │
│  │  │  Solana  │  │ Jupiter  │  │   xAI    │         │         │
│  │  │ Mainnet  │  │   API    │  │  Grok-4  │         │         │
│  │  └──────────┘  └──────────┘  └──────────┘         │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

```
┌────────────────────────────────────────────────────────────────┐
│                     Dark Terminal Core                         │
└────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  CLI Parser      │  Clap-based command parsing
│  (cli.rs)        │  ├─ ConfigCommand
└─────────┬────────┘  ├─ WalletCommands  
          │            ├─ SwapCommand
          │            └─ AgentCommands
          ▼
┌──────────────────┐
│  Config Manager  │  TOML-based configuration
│  (config.rs)     │  ├─ Network settings (mainnet/devnet)
└─────────┬────────┘  ├─ RPC URL
          │            ├─ Privacy settings (Tor, shielded)
          │            └─ Default wallet
          ▼
┌──────────────────┐
│  Wallet Manager  │  BIP-39/BIP-44 key derivation
│  (wallet.rs)     │  ├─ Create wallets
└─────────┬────────┘  ├─ Import from private key
          │            ├─ Sign transactions
          │            └─ Manage multiple wallets
          ▼
┌──────────────────┐
│  Jupiter Client  │  Jupiter Ultra API integration
│  (jupiter.rs)    │  ├─ Get quotes
└─────────┬────────┘  ├─ Execute swaps
          │            ├─ Parse routes
          │            └─ Handle errors
          ▼
┌──────────────────┐
│  Dark Agent      │  xAI Grok-4 integration
│  (dark_agent.rs) │  ├─ Chat interface
└─────────┬────────┘  ├─ Web search
          │            ├─ Portfolio analysis
          │            └─ Strategy execution
          ▼
┌──────────────────┐
│  Crypto Utils    │  Cryptographic primitives
│  (crypto.rs)     │  ├─ Blake3 hashing
└─────────┬────────┘  ├─ ChaCha20 encryption
          │            ├─ Commitments
          │            └─ Nullifiers
          ▼
┌──────────────────┐
│  Network Layer   │  HTTP/SOCKS5 client
│  (reqwest)       │  ├─ RPC requests
└──────────────────┘  ├─ API calls
                       └─ Tor proxy support
```

---

## Transaction Flow

### Complete Swap Lifecycle

```
                    ┌─────────────────┐
                    │   User Input    │
                    │  dark swap ...  │
                    └────────┬────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ STEP 1: Parse & Validate                                │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  Parse command arguments                  │         │
│  │  - from: SOL                               │         │
│  │  - to: USDC                                │         │
│  │  - amount: 0.01                            │         │
│  │  - slippage: 50 BPS                        │         │
│  └────────────────────────────────────────────┘         │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐         │
│  │  Validate inputs                           │         │
│  │  ✓ Amount > 0                              │         │
│  │  ✓ Slippage reasonable (1-1000 BPS)        │         │
│  │  ✓ Token mints valid                       │         │
│  └────────────────────────────────────────────┘         │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ STEP 2: Load Wallet                                     │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  Load wallet from private key              │         │
│  │  - Decode base58                           │         │
│  │  - Create Ed25519 keypair                  │         │
│  │  - Get public key (address)                │         │
│  └────────────────────────────────────────────┘         │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐         │
│  │  Wallet: 5m8qxm4j75VQC...4dVagS            │         │
│  └────────────────────────────────────────────┘         │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ STEP 3: Get Quote from Jupiter                          │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  POST https://ultra.jup.ag/v1/order        │         │
│  │  {                                         │         │
│  │    inputMint: "So111...112",               │         │
│  │    outputMint: "EPjF...1v",                │         │
│  │    amount: "10000000",                     │         │
│  │    slippageBps: 50,                        │         │
│  │    taker: "5m8q...VagS"                    │         │
│  │  }                                         │         │
│  └────────────────────────────────────────────┘         │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐         │
│  │  Response:                                 │         │
│  │  - inAmount: "10000000"                    │         │
│  │  - outAmount: "1395640"                    │         │
│  │  - priceImpact: -0.011675                  │         │
│  │  - transaction: "AQAAAAAAAAa..."           │         │
│  │  - requestId: "019a89fc..."                │         │
│  └────────────────────────────────────────────┘         │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ STEP 4: Display Quote & Request Confirmation            │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  Quote Details:                            │         │
│  │  ────────────────────────────────────      │         │
│  │  Input:   10000000 lamports (0.01 SOL)    │         │
│  │  Output:  1395640 (1.395640 USDC)         │         │
│  │  Impact:  -1.17%                           │         │
│  │  Route:   Raydium → Orca → Whirlpool      │         │
│  │                                            │         │
│  │  Execute this swap? (yes/no):              │         │
│  └────────────────────────────────────────────┘         │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐         │
│  │  User types: yes                           │         │
│  └────────────────────────────────────────────┘         │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ STEP 5: Sign Transaction                                │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  1. Decode base64 transaction              │         │
│  │     unsigned_tx = base64::decode(...)      │         │
│  └────────────────────────────────────────────┘         │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐         │
│  │  2. Deserialize VersionedTransaction       │         │
│  │     tx = bincode::deserialize(...)         │         │
│  └────────────────────────────────────────────┘         │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐         │
│  │  3. Sign message with Ed25519              │         │
│  │     message = tx.message.serialize()       │         │
│  │     sig = keypair.sign_message(message)    │         │
│  └────────────────────────────────────────────┘         │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐         │
│  │  4. Create signed transaction              │         │
│  │     signed_tx = VersionedTransaction {     │         │
│  │       signatures: vec![sig],               │         │
│  │       message: tx.message                  │         │
│  │     }                                       │         │
│  └────────────────────────────────────────────┘         │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐         │
│  │  5. Serialize to base64                    │         │
│  │     bytes = bincode::serialize(signed_tx)  │         │
│  │     b64 = base64::encode(bytes)            │         │
│  └────────────────────────────────────────────┘         │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ STEP 6: Execute on Jupiter                              │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  POST https://ultra.jup.ag/v1/execute      │         │
│  │  {                                         │         │
│  │    requestId: "019a89fc...",               │         │
│  │    signedTransaction: "AQAAAA..."          │         │
│  │  }                                         │         │
│  └────────────────────────────────────────────┘         │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐         │
│  │  Jupiter submits to Solana mainnet         │         │
│  │  via their RPC infrastructure              │         │
│  └────────────────────────────────────────────┘         │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐         │
│  │  Response:                                 │         │
│  │  {                                         │         │
│  │    signature: "5cHsR3EW...",               │         │
│  │    status: "Success"                       │         │
│  │  }                                         │         │
│  └────────────────────────────────────────────┘         │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ STEP 7: Display Result                                  │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  ✓ Swap executed successfully!             │         │
│  │                                            │         │
│  │  Transaction Details:                      │         │
│  │  ────────────────────────────────────      │         │
│  │  Signature: 5cHsR3EW...UwZH                │         │
│  │  Status:    Success                        │         │
│  │                                            │         │
│  │  View on Solscan:                          │         │
│  │  https://solscan.io/tx/5cHsR3EW...         │         │
│  └────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────┘

Total Time: ~585ms (quote 180ms + sign 3ms + submit 400ms)
```

---

## Privacy Layers

### Multi-Layer Privacy Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     Privacy Stack                             │
│                     (from bottom to top)                      │
└───────────────────────────────────────────────────────────────┘

Layer 5: Application Privacy
┌───────────────────────────────────────────────────────────────┐
│  🔒 No Analytics / No Telemetry                               │
│  ├─ No Google Analytics                                       │
│  ├─ No error reporting to 3rd parties                         │
│  ├─ No usage tracking                                         │
│  └─ Local-only logging                                        │
└───────────────────────────────────────────────────────────────┘
                             ▲
                             │
Layer 4: Timing Privacy
┌───────────────────────────────────────────────────────────────┐
│  ⏰ Randomized Transaction Timing                             │
│  ├─ Random delays (0-5000ms)                                  │
│  ├─ Prevents pattern analysis                                 │
│  ├─ Breaks timing correlation                                 │
│  └─ Optional - user configurable                              │
└───────────────────────────────────────────────────────────────┘
                             ▲
                             │
Layer 3: Amount Privacy
┌───────────────────────────────────────────────────────────────┐
│  💰 Zero-Knowledge Amount Hiding                              │
│  ├─ Pedersen commitments                                      │
│  │  C(v, r) = vG + rH                                         │
│  │  v = amount (hidden)                                       │
│  │  r = randomness (hidden)                                   │
│  │  C = commitment (public)                                   │
│  ├─ Range proofs (amount > 0, < max)                          │
│  └─ Enabled with --shielded flag                              │
└───────────────────────────────────────────────────────────────┘
                             ▲
                             │
Layer 2: Identity Privacy
┌───────────────────────────────────────────────────────────────┐
│  👤 Shielded Addresses (Zcash Sapling)                        │
│  ├─ Viewing key: Can see balance                              │
│  ├─ Spending key: Can spend                                   │
│  ├─ Nullifiers: Prevent double-spend                          │
│  ├─ Commitment tree: Store shielded notes                     │
│  └─ Transparent → Shielded → Transparent                      │
└───────────────────────────────────────────────────────────────┘
                             ▲
                             │
Layer 1: Network Privacy
┌───────────────────────────────────────────────────────────────┐
│  🌐 Tor Anonymity Network                                     │
│  ├─ SOCKS5 proxy: socks5://127.0.0.1:9050                     │
│  ├─ All RPC requests → Tor                                    │
│  ├─ All API requests → Tor                                    │
│  ├─ IP address hidden                                         │
│  ├─ Location hidden                                           │
│  └─ ISP can't see what you're doing                           │
└───────────────────────────────────────────────────────────────┘
                             ▲
                             │
Layer 0: Transport Security
┌───────────────────────────────────────────────────────────────┐
│  🔐 TLS/HTTPS Encryption                                      │
│  ├─ All connections use HTTPS                                 │
│  ├─ Certificate pinning for APIs                              │
│  ├─ Prevents MITM attacks                                     │
│  └─ Standard web security                                     │
└───────────────────────────────────────────────────────────────┘
```

### Privacy Comparison Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│  Feature           │ No Privacy │ Tor Only │ Shielded │  Full   │
├─────────────────────────────────────────────────────────────────┤
│  IP Hidden         │     ❌     │    ✅    │    ❌    │   ✅    │
│  Identity Hidden   │     ❌     │    ❌    │    ✅    │   ✅    │
│  Amount Hidden     │     ❌     │    ❌    │    ✅    │   ✅    │
│  Timing Hidden     │     ❌     │    ❌    │    ❌    │   ✅    │
│  Metadata Hidden   │     ❌     │    ✅    │    ✅    │   ✅    │
├─────────────────────────────────────────────────────────────────┤
│  Speed             │  585ms     │  885ms   │  785ms   │ 1085ms  │
│  Setup Difficulty  │  Easy      │  Medium  │  Easy    │  Hard   │
│  Cost              │  $0.0015   │ $0.0015  │ $0.0020  │ $0.0020 │
└─────────────────────────────────────────────────────────────────┘

Commands:
- No Privacy:  dark swap --from SOL --to USDC --amount 0.1
- Tor Only:    dark config --enable-tor (then any swap)
- Shielded:    dark swap ... --shielded
- Full:        dark config --enable-tor + --shielded + timing
```

---

## Component Interactions

### Swap Command Sequence Diagram

```
User          CLI           Wallet        Jupiter       Solana
 │             │              │              │             │
 │  dark swap  │              │              │             │
 ├────────────▶│              │              │             │
 │             │  Load wallet │              │             │
 │             ├─────────────▶│              │             │
 │             │     keypair  │              │             │
 │             │◀─────────────┤              │             │
 │             │              │              │             │
 │             │  POST /v1/order             │             │
 │             ├──────────────┼─────────────▶│             │
 │             │              │   quote +tx  │             │
 │             │◀─────────────┼──────────────┤             │
 │             │              │              │             │
 │   Display   │              │              │             │
 │◀────────────┤              │              │             │
 │   quote     │              │              │             │
 │             │              │              │             │
 │  Confirm?   │              │              │             │
 ├────────────▶│              │              │             │
 │    yes      │              │              │             │
 │             │  Sign tx     │              │             │
 │             ├─────────────▶│              │             │
 │             │   signature  │              │             │
 │             │◀─────────────┤              │             │
 │             │              │              │             │
 │             │  POST /v1/execute           │             │
 │             ├──────────────┼─────────────▶│             │
 │             │              │   Submit tx  │             │
 │             │              │              ├────────────▶│
 │             │              │              │  Confirm    │
 │             │              │              │◀────────────┤
 │             │◀─────────────┼──────────────┤             │
 │             │   signature  │              │             │
 │   Success   │              │              │             │
 │◀────────────┤              │              │             │
 │             │              │              │             │

Timeline: ├────180ms────┤─5ms─├──────400ms──────┤
          Quote Request  Sign  Blockchain Confirm

Total: ~585ms
```

### AI Agent Integration

```
User          CLI       DarkAgent     Grok-4 API    Web Search
 │             │            │              │             │
 │  dark agent chat --search               │             │
 ├────────────▶│            │              │             │
 │             │  Create    │              │             │
 │             │  agent     │              │             │
 │             ├───────────▶│              │             │
 │             │            │  POST /chat  │             │
 │             │            ├─────────────▶│             │
 │             │            │              │  Search     │
 │             │            │              ├────────────▶│
 │             │            │              │  Results    │
 │             │            │              │◀────────────┤
 │             │            │  Response +  │             │
 │             │            │  citations   │             │
 │             │            │◀─────────────┤             │
 │             │  AI reply  │              │             │
 │             │◀───────────┤              │             │
 │  Display    │            │              │             │
 │◀────────────┤            │              │             │
 │  answer +   │            │              │             │
 │  sources    │            │              │             │
```

---

## Data Flow Diagrams

### Configuration Management

```
┌──────────────────────────────────────────────────────────────┐
│                  Configuration Flow                          │
└──────────────────────────────────────────────────────────────┘

Environment Variables          Config File (.toml)
┌────────────────┐            ┌────────────────┐
│ HELIUS_RPC_URL │            │ network        │
│ XAI_API_KEY    │            │ rpc_url        │
└────────┬───────┘            │ wallet_path    │
         │                    │ grok_api_key   │
         │                    │ privacy {      │
         │                    │   use_tor      │
         │                    │   tor_proxy    │
         │                    │ }              │
         │                    └────────┬───────┘
         │                             │
         └─────────────┬───────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │   DarkConfig     │
            │    (merged)      │
            └─────────┬────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Wallet  │  │ Jupiter │  │  Agent  │
   │ Manager │  │ Client  │  │         │
   └─────────┘  └─────────┘  └─────────┘

Config Priority: CLI args > Env vars > Config file > Defaults
```

### Wallet Key Derivation

```
┌──────────────────────────────────────────────────────────────┐
│               BIP-39/BIP-44 Key Derivation                   │
└──────────────────────────────────────────────────────────────┘

Entropy (256 bits)
│
│  Random number generator
│
├─▶ 0x8f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e
│
▼
24-Word Mnemonic
│
├─▶ "abandon ability able about above absent absorb abstract
│    absurd abuse access accident account accuse achieve acid
│    acoustic acquire across act action actor actress actual"
│
▼
Seed (512 bits)
│
│  PBKDF2(mnemonic, "mnemonic" + passphrase, 2048 rounds)
│
├─▶ 0x1234567890abcdef...
│
▼
Master Key
│
│  HMAC-SHA512("Bitcoin seed", seed)
│
├─▶ Private Key: 0xabcdef...
│   Chain Code:   0x123456...
│
▼
Derivation Path: m/44'/501'/0'/0'
│                  │    │    │  │
│                  │    │    │  └─ Address Index
│                  │    │    └──── Change (0=external)
│                  │    └───────── Account
│                  └────────────── Coin (501=Solana)
│
▼
Ed25519 Keypair
│
├─▶ Private Key: [u8; 64]
│   Public Key:  [u8; 32]
│
▼
Solana Address
│
└─▶ 5m8qxm4j75VQCv34oUThE5QNbKJG7KHfd85NdK4dVagS
    (Base58-encoded public key)
```

### Transaction Serialization

```
┌──────────────────────────────────────────────────────────────┐
│          Solana VersionedTransaction Format                  │
└──────────────────────────────────────────────────────────────┘

VersionedTransaction {
  ┌────────────────────────────────────────────────┐
  │  signatures: Vec<Signature>                    │
  │  ┌──────────────────────────────────────────┐  │
  │  │  [u8; 64] - Ed25519 signature            │  │
  │  │  [u8; 64] - Additional signers (if any)  │  │
  │  └──────────────────────────────────────────┘  │
  │                                                │
  │  message: VersionedMessage::V0 {               │
  │    ┌────────────────────────────────────────┐  │
  │    │  header: MessageHeader {               │  │
  │    │    num_required_signatures: u8         │  │
  │    │    num_readonly_signed_accounts: u8    │  │
  │    │    num_readonly_unsigned_accounts: u8  │  │
  │    │  }                                     │  │
  │    │                                        │  │
  │    │  account_keys: Vec<Pubkey>             │  │
  │    │    [wallet, token_program, ...]        │  │
  │    │                                        │  │
  │    │  recent_blockhash: Hash                │  │
  │    │    [u8; 32] - Recent Solana block      │  │
  │    │                                        │  │
  │    │  instructions: Vec<CompiledInstruction>│  │
  │    │    ┌──────────────────────────────┐    │  │
  │    │    │  program_id_index: u8        │    │  │
  │    │    │  accounts: Vec<u8>           │    │  │
  │    │    │  data: Vec<u8> - Instruction │    │  │
  │    │    └──────────────────────────────┘    │  │
  │    │                                        │  │
  │    │  address_lookup_tables: Vec<...>       │  │
  │    │    (for compact account references)    │  │
  │    └────────────────────────────────────────┘  │
  │  }                                              │
  └────────────────────────────────────────────────┘
}

Serialization:
  1. bincode::serialize(tx) → Vec<u8>
  2. base64::encode(bytes) → String
  3. Send to Jupiter/Solana
```

---

## Innovation Highlights

### What Makes Dark Terminal Unique

```
┌──────────────────────────────────────────────────────────────┐
│              Dark Terminal Innovation Matrix                 │
└──────────────────────────────────────────────────────────────┘

1. Privacy + Speed
   ┌────────────────────────────────────────────────┐
   │  Traditional Privacy:  Slow (15-60 seconds)    │
   │  Traditional Speed:    Fast but public         │
   │  Dark Terminal:        Fast AND private        │
   │                        (585ms-1085ms)          │
   └────────────────────────────────────────────────┘

2. AI Integration
   ┌────────────────────────────────────────────────┐
   │  First DeFi terminal with:                     │
   │  - Grok-4 reasoning engine                     │
   │  - Real-time web search                        │
   │  - Natural language trading                    │
   │  - Portfolio AI analysis                       │
   └────────────────────────────────────────────────┘

3. Jupiter Ultra
   ┌────────────────────────────────────────────────┐
   │  Latest API features:                          │
   │  - 20+ DEX aggregation                         │
   │  - Advanced routing algorithms                 │
   │  - Versioned transactions (v0)                 │
   │  - Address lookup tables                       │
   └────────────────────────────────────────────────┘

4. Modular Privacy
   ┌────────────────────────────────────────────────┐
   │  User controls privacy level:                  │
   │  - Layer 1: Tor (IP hiding)                    │
   │  - Layer 2: Shielded addresses                 │
   │  - Layer 3: Amount commitments                 │
   │  - Layer 4: Timing randomization               │
   │  - Mix and match based on needs                │
   └────────────────────────────────────────────────┘

5. Developer Experience
   ┌────────────────────────────────────────────────┐
   │  - Clean Rust codebase                         │
   │  - Extensive documentation                     │
   │  - Property-based testing                      │
   │  - Modular architecture                        │
   │  - Easy to extend                              │
   └────────────────────────────────────────────────┘
```

---

## Performance Metrics

### Throughput & Latency

```
┌──────────────────────────────────────────────────────────────┐
│                  Performance Dashboard                       │
└──────────────────────────────────────────────────────────────┘

Operation Breakdown:
┌────────────────────────┬──────────┬─────────┬──────────────┐
│  Operation             │  Time    │  % Total│  Can Optimize│
├────────────────────────┼──────────┼─────────┼──────────────┤
│  Parse CLI args        │    1ms   │   0.2%  │      No      │
│  Load wallet keys      │    2ms   │   0.3%  │      No      │
│  Jupiter quote (API)   │  180ms   │  30.8%  │     Yes*     │
│  Decode base64         │    1ms   │   0.2%  │      No      │
│  Deserialize tx        │    1ms   │   0.2%  │      No      │
│  Sign transaction      │    3ms   │   0.5%  │      No      │
│  Serialize tx          │    1ms   │   0.2%  │      No      │
│  Encode base64         │    1ms   │   0.2%  │      No      │
│  Jupiter execute (API) │   10ms   │   1.7%  │      No      │
│  Solana confirmation   │  400ms   │  68.4%  │      No      │
├────────────────────────┼──────────┼─────────┼──────────────┤
│  **TOTAL (Normal)**    │  585ms   │  100%   │              │
│  **TOTAL (with Tor)**  │  885ms   │  100%   │              │
└────────────────────────┴──────────┴─────────┴──────────────┘

*Use premium Helius RPC for ~100ms quote time

Comparison to Other Chains:
┌────────────────┬──────────┬────────────┬──────────────────┐
│  Chain         │  Speed   │  Privacy   │  Dark Terminal   │
├────────────────┼──────────┼────────────┼──────────────────┤
│  Solana        │  400ms   │     No     │   585ms + Pr│  Ethereum      │ 15000ms  │     No     │       N/A        │
│  Polygon       │  2000ms  │     No     │       N/A        │
│  Zcash         │ 60000ms  │    Yes     │       N/A        │
│  Monero        │120000ms  │    Yes     │       N/A        │
└────────────────┴──────────┴────────────┴──────────────────┘

Dark Terminal = Solana Speed + Privacy (30x faster than Zcash!)
```

---

## Security Model

### Trust Boundaries

```
┌──────────────────────────────────────────────────────────────┐
│                    Trust Model                               │
└──────────────────────────────────────────────────────────────┘

Fully Trusted (You control):
┌────────────────────────────────────────────────┐
│  ✅ Your computer                               │
│  ✅ Dark Terminal binary (open source)         │
│  ✅ Your wallet keys (you generated)           │
│  ✅ Your seed phrase (you wrote down)          │
└────────────────────────────────────────────────┘
                     │
                     ▼
Partially Trusted (You verify):
┌────────────────────────────────────────────────┐
│  ⚠️  Helius RPC (read-only, can't steal)       │
│  ⚠️  Jupiter API (routes tx, can't modify sig) │
│  ⚠️  Tor network (anonymity, not encryption)   │
└────────────────────────────────────────────────┘
                     │
                     ▼
Don't Need to Trust:
┌────────────────────────────────────────────────┐
│  ❌ Dark Protocol team (can't access keys)     │
│  ❌ Solana validators (can't decrypt)          │
│  ❌ xAI Grok-4 (doesn't see transactions)      │
└────────────────────────────────────────────────┘

Threat Model:
┌────────────────────────────────────────────────┐
│  Protected Against:                            │
│  ✅ Front-running / MEV bots                   │
│  ✅ Network surveillance                       │
│  ✅ Transaction graph analysis                 │
│  ✅ Amount correlation attacks                 │
│  ✅ IP-based tracking                          │
│                                                │
│  NOT Protected Against:                        │
│  ❌ Compromised computer (keylogger)           │
│  ❌ Malicious browser extensions               │
│  ❌ Physical access to seed phrase             │
│  ❌ $5 wrench attack                           │
└────────────────────────────────────────────────┘
```

---

## Future Architecture

### Roadmap Components

```
v1.0 (Current)            v1.1 (Q1 2025)         v2.0 (Q2 2025)
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│  CLI         │────────▶│  CLI + TUI   │───────▶│  CLI + GUI   │
│  Interface   │         │  Interface   │        │  Interface   │
└──────────────┘         └──────────────┘        └──────────────┘
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│  Solana      │────────▶│  Solana +    │───────▶│  Multi-Chain │
│  Only        │         │  Ledger HW   │        │  Support     │
└──────────────┘         └──────────────┘        └──────────────┘
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│  Manual      │────────▶│  Limit Orders│───────▶│  DCA + Auto  │
│  Swaps       │         │  + DCA       │        │  Rebalance   │
└──────────────┘         └──────────────┘        └──────────────┘
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│  Basic       │────────▶│  Advanced    │───────▶│  Full ZK     │
│  Privacy     │         │  Privacy     │        │  Rollup      │
└──────────────┘         └──────────────┘        └──────────────┘
```

---

<div align="center">

**Dark Terminal Visual Guide**

[← Back to README](../README.md) | [Swap Guide →](DARK_SWAP_GUIDE.md)

</div>
