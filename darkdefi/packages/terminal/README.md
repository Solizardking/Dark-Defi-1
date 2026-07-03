# 🌑 Dark X402 Terminal

**A privacy-first DeFi terminal with Google Gen AI agents, multiple X402 agents, dark swaps, and shielded wallets**

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)
![Network](https://img.shields.io/badge/network-Solana-green)

---

## 🚀 Features

### 🤖 AI Agents
- **Google Gen AI Integration** - Chat with Gemini-powered agents for portfolio analysis and trading strategies
- **X402 Agent Swarm** - Deploy multiple specialized AI agents (swap, arbitrage, portfolio, security)
- **TEE Security** - Agents run in Trusted Execution Environments with attestation
- **Autonomous Operations** - Agents can execute swaps, transfers, and analysis autonomously

### 🔄 Dark Swaps
- **Privacy-Preserving Swaps** - Execute token swaps with Zcash Sapling privacy
- **Jupiter Integration** - Best price routing across all Solana DEXs
- **Oracle Validation** - Price protection with Birdeye oracle integration
- **MEV Protection** - Shield transactions from MEV bots
- **Slippage Control** - Customizable slippage tolerance

### 💼 Dark Wallets
- **Shielded Balances** - Hide transaction amounts using zero-knowledge proofs
- **Sapling Addresses** - Generate unlimited diversified addresses
- **Hierarchical Deterministic** - BIP-39/BIP-32 compliant key derivation
- **Private Transfers** - Send tokens without revealing amounts or recipients
- **Shield/Unshield** - Move between public and private pools

### 🎨 X402 Dark Theme
- Beautiful terminal UI with cyberpunk aesthetics
- Interactive menus and prompts
- Real-time balance and analytics displays
- QR code support for addresses

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- A Helius API key ([get one free](https://helius.dev))

### Quick Start

```bash
# Clone the repository
cd terminal

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env

# Build the terminal
npm run build

# Start the terminal
npm start
```

### Development Mode

```bash
# Run in development with hot reload
npm run dev

# Watch mode
npm run watch
```

---

## 🔑 Configuration

Edit `.env` file with your API keys:

```bash
# Required
HELIUS_API_KEY=your_helius_api_key

# Optional (enables additional features)
JUPITER_API_KEY=your_jupiter_api_key
REDPILL_API_KEY=your_redpill_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
NETWORK=devnet
```

### API Keys

| Key | Required | Purpose | Get It |
|-----|----------|---------|--------|
| `HELIUS_API_KEY` | ✅ Yes | Solana RPC access | [helius.dev](https://helius.dev) |
| `JUPITER_API_KEY` | ⚠️ Recommended | Token swaps | [jup.ag](https://station.jup.ag/api-keys) |
| `GOOGLE_AI_API_KEY` | 🎯 Optional | AI agents | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `REDPILL_API_KEY` | 🔐 Optional | TEE verification | [redpill.ai](https://redpill.ai) |

---

## 💻 Usage

### Starting the Terminal

```bash
npm start
```

### Main Menu

```
🌑 DARK X402 TERMINAL

1. 🤖 X402 AI Agents
   - Launch Google Gen AI Agent
   - Deploy X402 Agent Swarm
   - List Active Agents
   - Agent Analytics
   - Execute Agent Action

2. 🔄 Dark Swaps
   - Execute Private Swap
   - Get Quote
   - Swap History

3. 💼 Wallet Manager
   - View Balances
   - Shield Tokens
   - Unshield Tokens
   - Private Transfer
   - Sapling Addresses
   - Export Keys

4. 📊 Dashboard
   - Portfolio overview
   - Agent statistics
   - Recent activity

5. ⚙️ Settings
   - Network selection
   - Privacy level
   - RPC endpoint
```

---

## 🤖 AI Agent Examples

### Launch Google Gen AI Agent

```typescript
// The terminal will guide you through:
1. Select "🤖 X402 AI Agents"
2. Choose "Launch Google Gen AI Agent"
3. Chat with the agent:

   You: "Analyze my portfolio and suggest optimizations"
   Agent: "Based on your current holdings of 10 SOL..."

   You: "Should I swap SOL for USDC now?"
   Agent: "Current SOL price is $150. Market indicators suggest..."
```

### Deploy X402 Agent Swarm

```typescript
// Deploy multiple specialized agents:
1. Select "Deploy X402 Agent Swarm"
2. Choose number of agents (1-10)
3. Agents are automatically assigned roles:
   - Swap Agent: Executes token swaps
   - Arbitrage Agent: Finds arbitrage opportunities
   - Portfolio Agent: Analyzes holdings
   - Security Agent: Monitors risks
   - Multi Agent: All capabilities
```

---

## 🔄 Dark Swap Examples

### Execute Private Swap

```typescript
// Privacy-preserving token swap:
1. Select "🔄 Dark Swaps"
2. Choose "Execute Private Swap"
3. Select tokens (e.g., SOL → USDC)
4. Enter amount
5. Set slippage tolerance
6. Review quote and confirm

// Transaction is shielded using Zcash Sapling
// Amounts and routes are hidden from observers
```

---

## 💼 Wallet Examples

### Create Shielded Wallet

```typescript
// First time setup:
1. Choose "🆕 Create new wallet"
2. Save your 24-word mnemonic phrase securely
3. Confirm by entering a random word
4. Wallet is ready with:
   - Solana public key
   - Sapling shielded address
   - Hierarchical deterministic keys
```

### Shield Tokens

```typescript
// Move tokens to private pool:
1. Select "💼 Wallet Manager"
2. Choose "🔐 Shield Tokens"
3. Enter amount to shield
4. Confirm transaction

// Tokens are now invisible to blockchain explorers
```

---

## 🏗️ Architecture

```
terminal/
├── x402-terminal.ts          # Main terminal class
├── google-ai-agent.ts        # Google Gen AI integration
├── x402-agents.ts            # X402 agent manager
├── dark-swap-ui.ts           # Swap interface
├── dark-wallet-manager.ts    # Wallet interface
├── index.ts                  # Entry point
├── package.json
├── tsconfig.json
└── .env.example

../Protocol/
├── client.ts                 # Dark Protocol client
├── wallet.ts                 # Wallet management
├── swap.ts                   # Swap manager
├── ai-agent.ts               # AI agent manager
├── sapling.ts                # Zcash Sapling
├── privacy.ts                # Privacy utilities
└── types.ts                  # Type definitions
```

---

## 🔐 Security

### Current Status

- ✅ **Zcash Sapling cryptography** - Production-grade privacy
- ✅ **ChaCha20-Poly1305 encryption** - Secure note encryption
- ✅ **BIP-39/BIP-32 HD wallets** - Standard key derivation
- ⚠️ **ZK-SNARK proofs** - Using placeholders (not production-ready)
- ⚠️ **TEE attestation** - Mock implementation (dev only)

### Best Practices

1. **Never share your mnemonic** - It's the only way to recover your wallet
2. **Use strong passwords** - For encrypted storage
3. **Test on devnet first** - Before using mainnet
4. **Verify transactions** - Always check transaction signatures
5. **Keep software updated** - Pull latest security patches

### Known Limitations

- ZK-SNARK circuits are placeholders (require production deployment)
- TEE attestation is simulated (Intel SGX/AMD SEV not integrated)
- This is alpha software (security audit pending)

---

## 🛣️ Roadmap

- [ ] Production ZK-SNARK circuits
- [ ] Real TEE attestation (Intel SGX/AMD SEV)
- [ ] Multi-signature support
- [ ] Hardware wallet integration
- [ ] Mobile app companion
- [ ] Advanced trading strategies
- [ ] Social recovery
- [ ] Governance integration

---

## 🤝 Contributing

We welcome contributions!

```bash
# Fork and clone
git clone https://github.com/your-username/dark-protocol
cd dark-protocol/terminal

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

---

## 📄 License

Apache License 2.0 - see [LICENSE](../LICENSE)

---

## 🙏 Acknowledgments

- **Zcash Foundation** - Sapling protocol
- **Electric Coin Company** - Zcash implementation
- **Solana Labs** - Solana blockchain
- **Helius** - RPC infrastructure
- **Jupiter** - DEX aggregation
- **Google** - Gemini AI models
- **Anchor** - Solana framework

---

## 📞 Support

- **Documentation**: [docs/](../docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/dark-protocol/issues)
- **Discord**: Coming Soon
- **Twitter**: [@DarkProtocol](https://twitter.com/DarkProtocol)

---

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Use at your own risk. This is alpha software not audited for production use. Do not use with significant funds on mainnet.

---

**🌑 Welcome to the Dark Side of DeFi 🌑**

Built with ❤️ by the Dark Protocol team
