# ⚡ Dark Swap - Quick Start

**Get privacy-preserving Jupiter swaps running in 5 minutes**

---

## 1. Install (30 seconds)

```bash
npm install @dark-protocol/sdk jupiverse-kit @solana/web3.js
```

---

## 2. Environment Variables (1 minute)

Create `.env.local`:

```bash
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_JUP_SWAP_V1_API_KEY=your_jupiter_key
NEXT_PUBLIC_BIRDEYE_API_KEY=your_birdeye_key
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key
```

**Using provided keys for testing**:
```bash
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0
NEXT_PUBLIC_HELIUS_API_KEY=6b52d42b-5d24-4841-a093-02b0d2cc9fc0
```

---

## 3. Create Page (2 minutes)

### Option A: Minimal (5 lines)

```tsx
// app/swap/page.tsx
import { DarkSwapDemo } from '@dark-protocol/sdk/components/DarkSwap';

export default function SwapPage() {
  return <DarkSwapDemo />;
}
```

### Option B: Custom (15 lines)

```tsx
// app/swap/page.tsx
import { DarkSwap } from '@dark-protocol/sdk/components/DarkSwap';

export default function SwapPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <DarkSwap
        rpcUrl={process.env.NEXT_PUBLIC_RPC_URL!}
        apiKey={process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY!}
        enableOracle={true}
        enableShielded={true}
      />
    </div>
  );
}
```

---

## 4. Run (30 seconds)

```bash
npm run dev
```

Navigate to: `http://localhost:3000/swap`

---

## 5. Test (1 minute)

1. Connect wallet
2. Select tokens (e.g., SOL → USDC)
3. Enter amount
4. Watch oracle validation ✅
5. Execute swap 🚀

---

## Features You Get

| Feature | Status |
|---------|--------|
| 🔮 Oracle Price Validation | ✅ Enabled |
| 🛡️ Zcash Sapling Privacy | ✅ Enabled |
| ⚠️ Token Safety Checks | ✅ Auto |
| ⚡ MEV Protection | ✅ Built-in |
| 💰 Slippage Protection | ✅ Smart |
| 🎨 Beautiful UI | ✅ Dark theme |

---

## What Happens During a Swap

```
1. 🔮 Oracle fetches real-time price
   → Birdeye: $142.50/SOL
   → Jupiter: $142.35/SOL
   → Deviation: 0.11% ✅

2. ⚠️ Safety check runs
   → No freeze authority ✅
   → Good liquidity ✅
   → No rug pull signals ✅

3. 🛡️ Privacy layer activates
   → Generate commitments
   → Encrypt amounts
   → Hide identities

4. ⚡ Execute swap
   → Submit to Solana
   → Get signature
   → Update balance

5. 🎉 Success!
   → View on Solscan
   → Fully private
   → Fair price guaranteed
```

---

## Troubleshooting

### "Oracle validation failed"

```bash
# Check API keys
echo $NEXT_PUBLIC_BIRDEYE_API_KEY
echo $NEXT_PUBLIC_HELIUS_API_KEY

# If missing, add to .env.local
```

### "Price deviation too high"

Increase max deviation:
```tsx
<DarkSwap maxPriceDeviation={5.0} />  // Allow 5%
```

### Component not rendering

Install Tailwind CSS:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Add to `tailwind.config.js`:
```js
content: [
  './app/**/*.{js,ts,jsx,tsx}',
  './node_modules/@dark-protocol/sdk/**/*.{js,ts,jsx,tsx}',
]
```

---

## API Keys Setup

### Required Keys

1. **Helius** (Solana RPC)
   - Sign up: https://helius.dev
   - Free tier: ✅
   - Get key: Dashboard → API Keys

2. **Birdeye** (Price Oracle)
   - Sign up: https://birdeye.so
   - Free tier: ✅ (100 req/min)
   - Get key: Account → API

### Optional Keys

3. **Jupiter** (Higher limits)
   - Sign up: https://station.jup.ag
   - Free tier: ✅
   - Get key: Docs → API

---

## Props Quick Reference

### Essential

```tsx
<DarkSwap
  rpcUrl="..."           // Solana RPC
  apiKey="..."           // Jupiter key
/>
```

### Privacy

```tsx
<DarkSwap
  enableOracle={true}    // Oracle validation
  enableShielded={true}  // Zcash privacy
  autoCheckSafety={true} // Token checks
/>
```

### Advanced

```tsx
<DarkSwap
  maxPriceDeviation={2.0}     // Max % deviation
  platformFeeBps={20}         // Fee in BPS
  onSwapSuccess={(sig) => {}} // Callback
/>
```

---

## Examples

### With Notifications

```tsx
import { DarkSwap } from '@dark-protocol/sdk/components/DarkSwap';
import { toast, Toaster } from 'react-hot-toast';

export default function SwapPage() {
  return (
    <>
      <DarkSwap
        rpcUrl={process.env.NEXT_PUBLIC_RPC_URL!}
        apiKey={process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY!}
        onSwapSuccess={(sig) => toast.success('Swap successful!')}
        onSwapError={(err) => toast.error(err.message)}
        onPriceWarning={(dev) => toast.error(`Price deviation: ${dev}%`)}
      />
      <Toaster />
    </>
  );
}
```

### Custom Styling

```tsx
<DarkSwap
  className="max-w-2xl mx-auto my-custom-class"
  theme="dark"
/>
```

---

## Full Documentation

- 📖 [Complete Integration Guide](sdk/typescript/DARK_SWAP_INTEGRATION.md)
- 📖 [Oracle Documentation](sdk/typescript/ORACLE_README.md)
- 📖 [API Keys Setup](API_KEYS_SETUP.md)
- 📖 [Full Example](sdk/typescript/examples/nextjs-dark-swap-page.tsx)

---

## Support

- 💬 Discord: https://discord.gg/darkprotocol
- 🐦 Twitter: https://twitter.com/DarkProtocol
- 📧 Email: hello@darkprotocol.io

---

**That's it! You now have a privacy-preserving Jupiter swap. 🎉**

**Total setup time: ~5 minutes**
**Features unlocked: 6 major privacy/security features**
**Lines of code: ~5-15**

🌑 **Welcome to the Dark Side** 🌑
