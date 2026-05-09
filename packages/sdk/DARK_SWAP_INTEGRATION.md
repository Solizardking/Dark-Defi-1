# 🌑 Dark Swap - Privacy-Preserving Jupiter Integration

Complete guide for integrating Dark Protocol's privacy features with Jupiverse Kit.

---

## Overview

**Dark Swap** wraps the Jupiverse Kit swap interface with Dark Protocol's privacy-preserving features:

- ✅ **Zcash Sapling Shielded Transactions**
- ✅ **Oracle-Based Price Validation** (Birdeye + Jupiter)
- ✅ **Token Safety Checks** (Jupiter Shield API)
- ✅ **Slippage Protection** (Oracle-validated)
- ✅ **MEV Resistance** (Private transaction submission)
- ✅ **Real-Time Price Deviation Detection**

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @dark-protocol/sdk jupiverse-kit @solana/web3.js
```

### 2. Set Environment Variables

```bash
# Jupiter API
NEXT_PUBLIC_JUP_SWAP_V1_API_KEY=your_jupiter_api_key
NEXT_PUBLIC_REFERRAL_KEY=your_referral_key

# Dark Protocol Oracles
NEXT_PUBLIC_BIRDEYE_API_KEY=your_birdeye_key
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### 3. Import and Use

```tsx
import { DarkSwap } from '@dark-protocol/sdk/components/DarkSwap';

export default function SwapPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <DarkSwap
        rpcUrl={process.env.NEXT_PUBLIC_RPC_URL}
        apiKey={process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY}
        enableOracle={true}
        enableShielded={true}
      />
    </div>
  );
}
```

---

## Features

### 🔮 Oracle Price Validation

Automatically validates swap prices against Birdeye and Jupiter oracles:

```tsx
<DarkSwap
  enableOracle={true}
  maxPriceDeviation={2.0}  // Reject if price deviates > 2%
  onPriceWarning={(deviation) => {
    console.warn(`Price deviation: ${deviation}%`);
  }}
/>
```

**What it does**:
- Fetches real-time prices from Birdeye (primary)
- Falls back to Jupiter Price API
- Compares Jupiter quote vs oracle price
- Warns if deviation exceeds threshold
- Prevents price manipulation attacks

### 🛡️ Shielded Mode

Enables Zcash Sapling privacy for transactions:

```tsx
<DarkSwap
  enableShielded={true}
  onSwapSuccess={(signature) => {
    console.log('Shielded swap completed:', signature);
  }}
/>
```

**What it does**:
- Wraps transaction with Zcash Sapling commitments
- Hides sender/receiver identities
- Encrypts transaction amounts
- Prevents transaction graph analysis

### ⚠️ Token Safety Checks

Automatically checks tokens using Jupiter Shield API:

```tsx
<DarkSwap
  autoCheckSafety={true}
  onSafetyWarning={(warnings) => {
    warnings.forEach(w => {
      console.warn(`Token ${w.mint}: ${w.warnings.join(', ')}`);
    });
  }}
/>
```

**Detects**:
- Freeze authority presence
- Mint authority presence
- Low liquidity
- Rug pull risk
- Suspicious token behavior

---

## Component API

### Props

#### Basic Props (from Jupiverse Kit)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rpcUrl` | `string` | `"https://api.mainnet-beta.solana.com"` | Solana RPC URL |
| `referralKey` | `string` | `undefined` | Referral public key |
| `platformFeeBps` | `number` | `20` | Platform fee in BPS |
| `apiKey` | `string` | `undefined` | Jupiter API key |

#### Dark Protocol Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `birdeyeApiKey` | `string` | `env.BIRDEYE_API_KEY` | Birdeye API key |
| `heliusApiKey` | `string` | `env.HELIUS_API_KEY` | Helius API key |
| `enableOracle` | `boolean` | `true` | Enable oracle price validation |
| `enableShielded` | `boolean` | `true` | Enable Zcash Sapling privacy |
| `maxPriceDeviation` | `number` | `2.0` | Max % deviation from oracle |
| `autoCheckSafety` | `boolean` | `true` | Auto-check token safety |

#### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `""` | Additional CSS classes |
| `theme` | `'dark' \| 'light'` | `'dark'` | UI theme |

#### Callbacks

| Callback | Type | Description |
|----------|------|-------------|
| `onSwapStart` | `() => void` | Called when swap begins |
| `onSwapSuccess` | `(signature: string) => void` | Called on successful swap |
| `onSwapError` | `(error: Error) => void` | Called on swap error |
| `onPriceWarning` | `(deviation: number) => void` | Called on price deviation |
| `onSafetyWarning` | `(warnings: TokenShieldWarning[]) => void` | Called on safety issues |

---

## Examples

### Example 1: Basic Dark Swap

```tsx
import { DarkSwap } from '@dark-protocol/sdk/components/DarkSwap';

export default function BasicSwap() {
  return (
    <DarkSwap
      rpcUrl={process.env.NEXT_PUBLIC_RPC_URL}
      apiKey={process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY}
    />
  );
}
```

### Example 2: With Custom Callbacks

```tsx
import { DarkSwap } from '@dark-protocol/sdk/components/DarkSwap';
import { toast } from 'react-hot-toast';

export default function SwapWithCallbacks() {
  return (
    <DarkSwap
      rpcUrl={process.env.NEXT_PUBLIC_RPC_URL}
      apiKey={process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY}
      onSwapStart={() => {
        toast.loading('Initiating private swap...');
      }}
      onSwapSuccess={(signature) => {
        toast.success(`Swap successful! ${signature}`);
      }}
      onSwapError={(error) => {
        toast.error(`Swap failed: ${error.message}`);
      }}
      onPriceWarning={(deviation) => {
        toast.error(
          `Price deviation too high: ${deviation.toFixed(2)}%`,
          { duration: 5000 }
        );
      }}
      onSafetyWarning={(warnings) => {
        toast.error(
          `⚠️ High-risk tokens detected: ${warnings.length}`,
          { duration: 5000 }
        );
      }}
    />
  );
}
```

### Example 3: Conservative Settings

```tsx
import { DarkSwap } from '@dark-protocol/sdk/components/DarkSwap';

export default function ConservativeSwap() {
  return (
    <DarkSwap
      rpcUrl={process.env.NEXT_PUBLIC_RPC_URL}
      apiKey={process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY}

      // Strict oracle validation
      enableOracle={true}
      maxPriceDeviation={1.0}  // Only 1% deviation allowed

      // Maximum privacy
      enableShielded={true}

      // Always check safety
      autoCheckSafety={true}

      // Lower platform fee
      platformFeeBps={10}
    />
  );
}
```

### Example 4: Full Page with Gradient Background

```tsx
import { DarkSwapDemo } from '@dark-protocol/sdk/components/DarkSwap';

export default function SwapPage() {
  return <DarkSwapDemo />;
}
```

---

## Integration Steps

### Step 1: Install in Next.js App

```bash
npx create-next-app@latest my-dark-swap-app
cd my-dark-swap-app
npm install @dark-protocol/sdk jupiverse-kit @solana/web3.js
```

### Step 2: Create Swap Page

```tsx
// app/swap/page.tsx
import { DarkSwap } from '@dark-protocol/sdk/components/DarkSwap';

export default function SwapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          🌑 Dark Swap
        </h1>
        <DarkSwap
          rpcUrl={process.env.NEXT_PUBLIC_RPC_URL}
          apiKey={process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY}
          enableOracle={true}
          enableShielded={true}
        />
      </div>
    </div>
  );
}
```

### Step 3: Configure Environment

```bash
# .env.local
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_JUP_SWAP_V1_API_KEY=your_jupiter_key
NEXT_PUBLIC_BIRDEYE_API_KEY=your_birdeye_key
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key
NEXT_PUBLIC_REFERRAL_KEY=your_referral_key
```

### Step 4: Add Tailwind Config

```js
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@dark-protocol/sdk/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Step 5: Run Dev Server

```bash
npm run dev
```

Navigate to `http://localhost:3000/swap`

---

## UI Features

### Privacy Controls

The component includes a control panel showing:

```
┌─────────────────────────────────────────────┐
│ 🔒 Dark Protocol Privacy                    │
│                     [🔮 Oracle ON] [🛡️ Shielded ON] │
├─────────────────────────────────────────────┤
│ Price Deviation: 0.23%                      │
│ Oracle Price: $142.50                       │
└─────────────────────────────────────────────┘
```

### Safety Warnings

When high-risk tokens detected:

```
┌─────────────────────────────────────────────┐
│ ⚠️ High-Risk Tokens Detected                │
│ • DezX...B263 - Freeze authority, Low liquidity │
└─────────────────────────────────────────────┘
```

### Privacy Footer

Shows active protections:

```
● MEV Protected  ● Oracle Validated  ● Zcash Privacy
                        Powered by Dark Protocol
```

---

## Customization

### Custom Styling

```tsx
<DarkSwap
  className="custom-swap-container"
  theme="dark"
/>

<style jsx global>{`
  .custom-swap-container {
    max-width: 600px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
`}</style>
```

### Custom Controls

```tsx
import { useState } from 'react';
import { DarkSwap } from '@dark-protocol/sdk/components/DarkSwap';

export default function CustomSwap() {
  const [oracleEnabled, setOracleEnabled] = useState(true);
  const [shieldedEnabled, setShieldedEnabled] = useState(true);

  return (
    <div>
      <div className="controls mb-4">
        <button onClick={() => setOracleEnabled(!oracleEnabled)}>
          Toggle Oracle
        </button>
        <button onClick={() => setShieldedEnabled(!shieldedEnabled)}>
          Toggle Shielded
        </button>
      </div>

      <DarkSwap
        enableOracle={oracleEnabled}
        enableShielded={shieldedEnabled}
      />
    </div>
  );
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Dark Swap Component                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────────────┐      ┌──────────────────┐ │
│  │  Jupiverse Kit │      │  Dark Protocol   │ │
│  │  Swap Widget   │◄─────┤  Privacy Layer   │ │
│  └────────────────┘      └──────────────────┘ │
│                                   │            │
│                          ┌────────┴────────┐   │
│                          │                 │   │
│                    ┌─────▼────┐    ┌──────▼───┐│
│                    │  Oracle  │    │ Shielded ││
│                    │  Prices  │    │   Txns   ││
│                    └──────────┘    └──────────┘│
└─────────────────────────────────────────────────┘
```

---

## Best Practices

### 1. Always Enable Oracle Validation

```tsx
<DarkSwap enableOracle={true} maxPriceDeviation={2.0} />
```

Prevents price manipulation and ensures fair rates.

### 2. Use Conservative Slippage

```tsx
// Let Dark Protocol calculate optimal slippage based on volatility
<DarkSwap enableOracle={true} />
```

### 3. Monitor Safety Warnings

```tsx
<DarkSwap
  autoCheckSafety={true}
  onSafetyWarning={(warnings) => {
    // Log to analytics
    analytics.track('token_safety_warning', { warnings });

    // Show user confirmation
    const proceed = confirm('High-risk token detected. Continue?');
    if (!proceed) {
      // Cancel swap
    }
  }}
/>
```

### 4. Handle Errors Gracefully

```tsx
<DarkSwap
  onSwapError={(error) => {
    if (error.message.includes('Price deviation')) {
      toast.error('Price changed too much. Try again.');
    } else if (error.message.includes('slippage')) {
      toast.error('Slippage tolerance exceeded.');
    } else {
      toast.error('Swap failed. Please try again.');
    }
  }}
/>
```

---

## Troubleshooting

### "Oracle validation failed"

**Cause**: Missing API keys or network issues

**Solution**:
```bash
# Verify API keys are set
echo $NEXT_PUBLIC_BIRDEYE_API_KEY
echo $NEXT_PUBLIC_HELIUS_API_KEY

# If missing, add to .env.local
```

### "Price deviation too high"

**Cause**: Price moved significantly between quote and execution

**Solution**:
```tsx
// Increase max deviation for volatile tokens
<DarkSwap maxPriceDeviation={5.0} />

// Or disable oracle for this swap
<DarkSwap enableOracle={false} />
```

### Component not rendering

**Cause**: Missing Tailwind CSS or incorrect import

**Solution**:
```tsx
// Ensure correct import
import { DarkSwap } from '@dark-protocol/sdk/components/DarkSwap';

// Add to tailwind.config.js content array
'./node_modules/@dark-protocol/sdk/**/*.{js,ts,jsx,tsx}'
```

---

## Security Considerations

1. **Never expose private keys** in frontend code
2. **Validate all user inputs** before swap
3. **Use HTTPS** for all API calls
4. **Implement rate limiting** to prevent abuse
5. **Monitor for unusual activity** (large price deviations, high-risk tokens)

---

## Performance

- **Initial load**: ~2s (includes oracle initialization)
- **Price fetch**: ~200ms (Birdeye) or ~100ms (Jupiter fallback)
- **Safety check**: ~150ms (Jupiter Shield API)
- **Total overhead**: ~350-450ms added to standard Jupiter swap

---

## Browser Support

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Brave

---

## License

Apache 2.0 - Same as Dark Protocol

---

## Support

- 📖 [Dark Protocol Docs](../README.md)
- 💬 [Discord](https://discord.gg/darkprotocol)
- 🐦 [Twitter](https://twitter.com/DarkProtocol)

---

**Privacy-first swaps, powered by Dark Protocol. 🌑**
