/**
 * Complete Next.js Page Example for Dark Swap
 *
 * Copy this file to: app/swap/page.tsx
 *
 * Features:
 * - Privacy-preserving Jupiter swaps
 * - Oracle price validation
 * - Token safety checks
 * - Real-time price deviation alerts
 * - Toast notifications
 * - Analytics tracking
 */

"use client";

import React, { useState } from 'react';
import { DarkSwap } from '@dark-protocol/sdk/components/DarkSwap';
import type { TokenShieldWarning } from '@dark-protocol/sdk';

// Optional: Add toast notifications
// npm install react-hot-toast
import { Toaster, toast } from 'react-hot-toast';

// Optional: Add analytics
// npm install @vercel/analytics
import { Analytics } from '@vercel/analytics/react';

export default function DarkSwapPage() {
  const [swapCount, setSwapCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [stats, setStats] = useState({
    successfulSwaps: 0,
    failedSwaps: 0,
    priceWarnings: 0,
    safetyWarnings: 0,
  });

  // Handle swap start
  const handleSwapStart = () => {
    toast.loading('🔄 Initiating private swap...', {
      id: 'swap-loading',
      duration: Infinity,
    });
  };

  // Handle swap success
  const handleSwapSuccess = (signature: string) => {
    toast.dismiss('swap-loading');

    toast.success(
      (t) => (
        <div className="flex flex-col gap-2">
          <div className="font-semibold">✅ Swap Successful!</div>
          <a
            href={`https://solscan.io/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            View on Solscan
          </a>
        </div>
      ),
      {
        duration: 5000,
        icon: '🎉',
      }
    );

    // Update stats
    setSwapCount((prev) => prev + 1);
    setStats((prev) => ({
      ...prev,
      successfulSwaps: prev.successfulSwaps + 1,
    }));

    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'swap_success', {
        event_category: 'dark_swap',
        event_label: signature,
      });
    }
  };

  // Handle swap error
  const handleSwapError = (error: Error) => {
    toast.dismiss('swap-loading');

    let errorMessage = 'Swap failed. Please try again.';

    if (error.message.includes('Price deviation')) {
      errorMessage = '⚠️ Price deviation too high. Oracle detected price manipulation.';
    } else if (error.message.includes('slippage')) {
      errorMessage = '⚠️ Slippage tolerance exceeded. Try increasing slippage.';
    } else if (error.message.includes('Insufficient funds')) {
      errorMessage = '💰 Insufficient balance for swap.';
    }

    toast.error(errorMessage, {
      duration: 5000,
      icon: '❌',
    });

    // Update stats
    setStats((prev) => ({
      ...prev,
      failedSwaps: prev.failedSwaps + 1,
    }));
  };

  // Handle price warning
  const handlePriceWarning = (deviation: number) => {
    toast.error(
      `⚠️ Price Deviation Alert: ${deviation.toFixed(2)}%\n` +
      `Oracle price differs significantly from Jupiter quote.\n` +
      `Possible price manipulation detected!`,
      {
        duration: 8000,
        icon: '🚨',
      }
    );

    setStats((prev) => ({
      ...prev,
      priceWarnings: prev.priceWarnings + 1,
    }));
  };

  // Handle safety warning
  const handleSafetyWarning = (warnings: TokenShieldWarning[]) => {
    const highRiskCount = warnings.filter(
      (w) => w.riskLevel === 'high' || w.riskLevel === 'critical'
    ).length;

    toast.error(
      (t) => (
        <div className="flex flex-col gap-2">
          <div className="font-semibold">⚠️ High-Risk Tokens Detected</div>
          <div className="text-sm">
            {highRiskCount} token(s) flagged as high risk:
          </div>
          <ul className="text-xs space-y-1">
            {warnings.slice(0, 3).map((w, idx) => (
              <li key={idx}>
                • {w.mint.slice(0, 8)}... - {w.warnings.join(', ')}
              </li>
            ))}
          </ul>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
          >
            I Understand
          </button>
        </div>
      ),
      {
        duration: 10000,
        icon: '🛡️',
      }
    );

    setStats((prev) => ({
      ...prev,
      safetyWarnings: prev.safetyWarnings + 1,
    }));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🌑</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Dark Swap</h1>
                <p className="text-sm text-gray-400">Privacy-First Trading</p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Total Swaps</div>
                <div className="text-xl font-bold text-white">{swapCount}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Success Rate</div>
                <div className="text-xl font-bold text-green-400">
                  {stats.successfulSwaps + stats.failedSwaps > 0
                    ? Math.round(
                        (stats.successfulSwaps /
                          (stats.successfulSwaps + stats.failedSwaps)) *
                          100
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Feature Badges */}
          <div className="mb-8 flex flex-wrap gap-3 justify-center">
            <div className="px-4 py-2 bg-purple-600/20 border border-purple-500 rounded-full text-sm text-purple-300 flex items-center gap-2">
              <span>🛡️</span>
              <span>Zcash Sapling Privacy</span>
            </div>
            <div className="px-4 py-2 bg-blue-600/20 border border-blue-500 rounded-full text-sm text-blue-300 flex items-center gap-2">
              <span>🔮</span>
              <span>Oracle Price Validation</span>
            </div>
            <div className="px-4 py-2 bg-green-600/20 border border-green-500 rounded-full text-sm text-green-300 flex items-center gap-2">
              <span>⚡</span>
              <span>MEV Protected</span>
            </div>
          </div>

          {/* Dark Swap Component */}
          <DarkSwap
            rpcUrl={process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com"}
            referralKey={process.env.NEXT_PUBLIC_REFERRAL_KEY as string}
            platformFeeBps={20}
            apiKey={process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY as string}
            birdeyeApiKey={process.env.NEXT_PUBLIC_BIRDEYE_API_KEY}
            heliusApiKey={process.env.NEXT_PUBLIC_HELIUS_API_KEY}
            enableOracle={true}
            enableShielded={true}
            maxPriceDeviation={2.0}
            autoCheckSafety={true}
            onSwapStart={handleSwapStart}
            onSwapSuccess={handleSwapSuccess}
            onSwapError={handleSwapError}
            onPriceWarning={handlePriceWarning}
            onSafetyWarning={handleSafetyWarning}
          />

          {/* Info Section */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🔒</span>
                <h3 className="font-semibold text-white">Private</h3>
              </div>
              <p className="text-sm text-gray-400">
                Transactions are shielded using Zcash Sapling technology, hiding amounts and identities.
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <h3 className="font-semibold text-white">Accurate</h3>
              </div>
              <p className="text-sm text-gray-400">
                Oracle validation ensures you get fair prices and protects against manipulation.
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🛡️</span>
                <h3 className="font-semibold text-white">Safe</h3>
              </div>
              <p className="text-sm text-gray-400">
                Automatic token safety checks warn you about high-risk tokens before swapping.
              </p>
            </div>
          </div>

          {/* Stats Display */}
          {swapCount > 0 && (
            <div className="mt-8 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">
                Session Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Successful</div>
                  <div className="text-2xl font-bold text-green-400">
                    {stats.successfulSwaps}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Failed</div>
                  <div className="text-2xl font-bold text-red-400">
                    {stats.failedSwaps}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Price Warnings</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.priceWarnings}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Safety Alerts</div>
                  <div className="text-2xl font-bold text-orange-400">
                    {stats.safetyWarnings}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              Powered by{' '}
              <a
                href="https://darkprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Dark Protocol
              </a>
              {' '}×{' '}
              <a
                href="https://jup.ag"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Jupiter
              </a>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <a
                href="https://docs.darkprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Docs
              </a>
              <a
                href="https://discord.gg/darkprotocol"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Discord
              </a>
              <a
                href="https://twitter.com/DarkProtocol"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Container */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#F9FAFB',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#F9FAFB',
            },
          },
        }}
      />

      {/* Analytics */}
      <Analytics />
    </div>
  );
}
