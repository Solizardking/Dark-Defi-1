# 🏗️ Dark X402 Terminal - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DARK X402 TERMINAL                                  │
│                     Privacy-First DeFi Terminal                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TERMINAL UI LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐   │
│  │ X402Terminal    │  │ DarkSwapUI       │  │ DarkWalletManager      │   │
│  │                 │  │                  │  │                        │   │
│  │ • Main Menu     │  │ • Quote Display  │  │ • Balance Display      │   │
│  │ • Navigation    │  │ • Swap Execute   │  │ • Shield/Unshield      │   │
│  │ • Dashboard     │  │ • History Track  │  │ • Address Gen          │   │
│  │ • Dark Theme    │  │ • Slippage Set   │  │ • Key Export           │   │
│  └─────────────────┘  └──────────────────┘  └────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI AGENT LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────┐  ┌────────────────────────────────────┐   │
│  │  GoogleGenAIAgent          │  │  X402AgentManager                  │   │
│  │                            │  │                                    │   │
│  │  • Gemini 1.5 Pro          │  │  • Agent Swarm Deploy              │   │
│  │  • Context-Aware Chat      │  │  • 5 Agent Types:                  │   │
│  │  • Portfolio Analysis      │  │    - Swap Agent                    │   │
│  │  • Risk Assessment         │  │    - Arbitrage Agent               │   │
│  │  • Trade Recommendations   │  │    - Portfolio Agent               │   │
│  │  • Strategy Generation     │  │    - Security Agent                │   │
│  │  • Action Parsing          │  │    - Multi Agent                   │   │
│  │                            │  │  • Performance Analytics           │   │
│  │  API: Google AI Studio     │  │  • Autonomous Operations           │   │
│  └────────────────────────────┘  └────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROTOCOL LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐    │
│  │ DarkProtocol     │  │ PrivateSwap      │  │ AIAgentManager       │    │
│  │ Client           │  │ Manager          │  │                      │    │
│  │                  │  │                  │  │ • Agent Registry     │    │
│  │ • Connection     │  │ • Jupiter API    │  │ • TEE Attestation    │    │
│  │ • Anchor Program │  │ • Quote Fetch    │  │ • Capability Check   │    │
│  │ • Helius SDK     │  │ • Route Optimize │  │ • Action Execution   │    │
│  │ • State Mgmt     │  │ • Swap Execute   │  │                      │    │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘    │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐    │
│  │ DarkWallet       │  │ SaplingHDWallet  │  │ PrivacyUtils         │    │
│  │                  │  │                  │  │                      │    │
│  │ • Keypair Mgmt   │  │ • Sapling Keys   │  │ • Commitments        │    │
│  │ • Balance Track  │  │ • Address Gen    │  │ • Nullifiers         │    │
│  │ • Shield Ops     │  │ • ZIP-32 Derive  │  │ • Encryption         │    │
│  │ • Transfer Exec  │  │ • Note Decrypt   │  │ • ZK Proofs          │    │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Helius     │  │ Jupiter    │  │ Google AI    │  │ RedPill (TEE)    │  │
│  │ RPC        │  │ Swap API   │  │ Gemini API   │  │ Attestation      │  │
│  │            │  │            │  │              │  │                  │  │
│  │ • Fast RPC │  │ • Quotes   │  │ • Chat       │  │ • Verify TEE     │  │
│  │ • Secure   │  │ • Routes   │  │ • Analysis   │  │ • Validate       │  │
│  │ • Smart TX │  │ • Execute  │  │ • Generate   │  │                  │  │
│  └────────────┘  └────────────┘  └──────────────┘  └──────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BLOCKCHAIN LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    ┌─────────────────────────────┐                         │
│                    │     SOLANA BLOCKCHAIN       │                         │
│                    │                             │                         │
│                    │  • Devnet / Testnet        │                         │
│                    │  • Mainnet (Alpha)         │                         │
│                    │  • Anchor Programs         │                         │
│                    │  • Token Accounts          │                         │
│                    │  • Privacy Pools           │                         │
│                    └─────────────────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Wallet Creation Flow

```
User
  │
  ├──→ Select "Create New Wallet"
  │
  ▼
X402Terminal
  │
  ├──→ DarkWalletManager.setupWallet('new')
  │
  ▼
DarkWallet
  │
  ├──→ Generate BIP-39 Mnemonic (24 words)
  ├──→ Derive BIP-32 Keys
  ├──→ Create Solana Keypair
  │
  ▼
SaplingHDWallet
  │
  ├──→ fromMnemonic(mnemonic)
  ├──→ Generate Spending Key
  ├──→ Derive Full Viewing Key
  ├──→ Generate Default Address
  │
  ▼
Display to User
  │
  ├──→ Show Mnemonic (SAVE SECURELY!)
  ├──→ Confirm Mnemonic
  ├──→ Display Public Key
  └──→ Display Sapling Address
```

### 2. Private Swap Flow

```
User Input
  │
  ├──→ Select tokens (SOL → USDC)
  ├──→ Enter amount (0.5 SOL)
  ├──→ Set slippage (0.5%)
  │
  ▼
DarkSwapUI
  │
  ├──→ PrivateSwapManager.getQuote()
  │
  ▼
Jupiter API
  │
  ├──→ Find best routes
  ├──→ Calculate output amount
  ├──→ Estimate price impact
  │
  ▼
Display Quote
  │
  ├──→ Input: 0.5 SOL
  ├──→ Output: ~75 USDC
  ├──→ Price Impact: 0.02%
  ├──→ Confirm?
  │
  ▼
User Confirms
  │
  ├──→ PrivacyUtils.generateCommitment()
  ├──→ PrivacyUtils.generateNullifier()
  ├──→ Generate ZK Proof
  │
  ▼
PrivateSwapManager.executePrivateSwap()
  │
  ├──→ Build transaction
  ├──→ Sign with wallet
  ├──→ Send to Solana
  │
  ▼
Solana Blockchain
  │
  ├──→ Verify proof
  ├──→ Execute swap
  ├──→ Update balances
  │
  ▼
Success
  │
  └──→ Display transaction signature
```

### 3. AI Agent Chat Flow

```
User Message
  │
  ├──→ "Analyze my portfolio"
  │
  ▼
GoogleGenAIAgent
  │
  ├──→ Get wallet state
  ├──→ Build context
  ├──→ Add to conversation history
  │
  ▼
Google Gemini API
  │
  ├──→ Process message with context:
  │     • Wallet balance
  │     • Transaction history
  │     • Market conditions
  │     • Agent capabilities
  │
  ▼
Generate Response
  │
  ├──→ Portfolio analysis
  ├──→ Risk assessment
  ├──→ Recommendations
  ├──→ Proposed actions
  │
  ▼
Parse Actions
  │
  ├──→ Extract ACTION tags
  ├──→ Parse parameters
  ├──→ Calculate confidence
  │
  ▼
Display to User
  │
  ├──→ Show analysis text
  ├──→ List recommended actions
  ├──→ Ask for confirmation
  │
  ▼
User Confirms Action
  │
  ├──→ Execute swap / transfer / etc.
  └──→ Update portfolio
```

### 4. Agent Swarm Deployment

```
User
  │
  ├──→ Select "Deploy Agent Swarm"
  ├──→ Enter count (3 agents)
  │
  ▼
X402AgentManager
  │
  ├──→ Loop for each agent:
  │
  ▼
For Agent i = 1 to 3:
  │
  ├──→ Determine type (swap, arbitrage, portfolio)
  ├──→ Generate agent keypair
  ├──→ Define capabilities
  ├──→ Generate TEE attestation (mock)
  │
  ▼
AIAgentManager
  │
  ├──→ registerAgent(params)
  │
  ▼
Solana Blockchain
  │
  ├──→ Create agent account
  ├──→ Store attestation hash
  ├──→ Record capabilities
  │
  ▼
Agent Created
  │
  ├──→ Store in local registry
  ├──→ Set status = 'active'
  │
  ▼
All Agents Deployed
  │
  ├──→ Display agent table
  └──→ Ready for operations
```

---

## Component Interaction Matrix

```
┌───────────────┬─────────┬────────┬────────┬───────┬──────────┐
│ Component     │ Wallet  │ Swap   │ AI     │ Agent │ Protocol │
├───────────────┼─────────┼────────┼────────┼───────┼──────────┤
│ X402Terminal  │   ✓     │   ✓    │   ✓    │   ✓   │    ✓     │
│ GoogleAI      │   ✓     │   ✓    │   -    │   ✓   │    ✓     │
│ X402Agents    │   ✓     │   ✓    │   ✓    │   -   │    ✓     │
│ DarkSwapUI    │   ✓     │   -    │   ○    │   ○   │    ✓     │
│ WalletManager │   -     │   ○    │   ○    │   ○   │    ✓     │
└───────────────┴─────────┴────────┴────────┴───────┴──────────┘

Legend:
  ✓ = Direct interaction
  ○ = Indirect interaction
  - = No interaction
```

---

## File Dependencies

```
terminal/index.ts
  │
  └──→ terminal/x402-terminal.ts
        │
        ├──→ terminal/google-ai-agent.ts
        │     └──→ @google/generative-ai
        │
        ├──→ terminal/x402-agents.ts
        │     └──→ Protocol/ai-agent.ts
        │
        ├──→ terminal/dark-swap-ui.ts
        │     └──→ Protocol/swap.ts
        │
        └──→ terminal/dark-wallet-manager.ts
              ├──→ Protocol/wallet.ts
              └──→ Protocol/sapling.ts

Protocol/
  ├──→ client.ts
  │     ├──→ @solana/web3.js
  │     ├──→ @coral-xyz/anchor
  │     └──→ helius-sdk
  │
  ├──→ wallet.ts
  │     ├──→ client.ts
  │     └──→ bip39, bip32
  │
  ├──→ sapling.ts
  │     └──→ Zcash Sapling crypto
  │
  ├──→ swap.ts
  │     ├──→ client.ts
  │     └──→ Jupiter API
  │
  └──→ ai-agent.ts
        ├──→ client.ts
        └──→ RedPill API
```

---

## State Management

```
Application State
├── Terminal State
│   ├── currentMode: 'main' | 'agents' | 'swap' | 'wallet'
│   ├── isRunning: boolean
│   └── theme: ThemeConfig
│
├── Wallet State
│   ├── keypair: Keypair
│   ├── shieldedAddress: ShieldedAddress | undefined
│   ├── notes: Map<string, Note>
│   └── saplingWallet: SaplingHDWallet | undefined
│
├── Agent State
│   ├── googleAgents: Map<string, GoogleAgent>
│   ├── x402Agents: Map<string, X402Agent>
│   └── models: Map<string, GeminiModel>
│
└── Swap State
    └── swapHistory: SwapRecord[]
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────┐
│ Application Security                                │
│ • Input validation                                  │
│ • Error handling                                    │
│ • Secure key storage                                │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Cryptographic Security                              │
│ • Zcash Sapling                                     │
│ • ChaCha20-Poly1305                                 │
│ • BIP-39/BIP-32                                     │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Network Security                                    │
│ • HTTPS connections                                 │
│ • API key management                                │
│ • Rate limiting                                     │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Blockchain Security                                 │
│ • Transaction verification                          │
│ • Signature validation                              │
│ • Smart contract security                           │
└─────────────────────────────────────────────────────┘
```

---

## API Integration Points

| Service | Purpose | Authentication | Rate Limit |
|---------|---------|----------------|------------|
| **Helius** | Solana RPC | API Key | Free: 100 req/s |
| **Jupiter** | Token swaps | API Key (optional) | 600 req/min |
| **Google AI** | Gemini chat | API Key | 60 req/min (free) |
| **RedPill** | TEE attestation | API Key | Custom |
| **Birdeye** | Price oracle | API Key | 100 req/s |

---

This architecture provides:
- ✅ **Modularity** - Each component is independent
- ✅ **Scalability** - Easy to add new features
- ✅ **Security** - Multiple security layers
- ✅ **Maintainability** - Clear separation of concerns
- ✅ **Extensibility** - Simple to extend with plugins

---

*Architecture Version: 1.0.0*
*Last Updated: 2024*
