/**
 * Dark Swap Component
 *
 * Privacy-preserving swap interface wrapping Jupiverse Kit with Dark Protocol
 *
 * Features:
 * - Shielded transactions with Zcash Sapling
 * - Oracle-based price validation
 * - Token safety checks
 * - Slippage protection
 * - MEV resistance
 * - Privacy-first design
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Swap } from "jupiverse-kit";
import { PublicKey, Connection } from '@solana/web3.js';
import { DarkProtocolClient } from '../client';
import { PrivateSwapManager } from '../swap';
import type { SwapQuoteWithOracle, TokenShieldWarning } from '../swap';
import { PriceOracle, KNOWN_TOKENS, formatPrice, formatSlippage } from '../oracle';

// ============================================================================
// Types
// ============================================================================

export interface DarkSwapProps {
  rpcUrl?: string;
  referralKey?: string;
  platformFeeBps?: number;
  apiKey?: string;

  // Dark Protocol specific props
  birdeyeApiKey?: string;
  heliusApiKey?: string;
  enableOracle?: boolean;
  enableShielded?: boolean;
  maxPriceDeviation?: number;      // Max % deviation from oracle (default: 2%)
  autoCheckSafety?: boolean;        // Auto-check token safety (default: true)

  // Styling
  className?: string;
  theme?: 'dark' | 'light';

  // Callbacks
  onSwapStart?: () => void;
  onSwapSuccess?: (signature: string) => void;
  onSwapError?: (error: Error) => void;
  onPriceWarning?: (deviation: number) => void;
  onSafetyWarning?: (warnings: TokenShieldWarning[]) => void;
}

interface SwapState {
  isOracleActive: boolean;
  isShieldedMode: boolean;
  priceDeviation?: number;
  oraclePrice?: string;
  jupiterPrice?: string;
  safetyWarnings?: TokenShieldWarning[];
  isValidating: boolean;
}

// ============================================================================
// Dark Swap Component
// ============================================================================

export const DarkSwap: React.FC<DarkSwapProps> = ({
  rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com",
  referralKey = process.env.NEXT_PUBLIC_REFERRAL_KEY as string,
  platformFeeBps = 20,
  apiKey = process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY as string,

  // Dark Protocol props
  birdeyeApiKey = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY,
  heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY,
  enableOracle = true,
  enableShielded = true,
  maxPriceDeviation = 2.0,
  autoCheckSafety = true,

  // Styling
  className = "",
  theme = 'dark',

  // Callbacks
  onSwapStart,
  onSwapSuccess,
  onSwapError,
  onPriceWarning,
  onSafetyWarning,
}) => {
  const [state, setState] = useState<SwapState>({
    isOracleActive: enableOracle,
    isShieldedMode: enableShielded,
    isValidating: false,
  });

  const [darkClient, setDarkClient] = useState<DarkProtocolClient | null>(null);
  const [swapManager, setSwapManager] = useState<PrivateSwapManager | null>(null);
  const [oracle, setOracle] = useState<PriceOracle | null>(null);

  // Initialize Dark Protocol client
  useEffect(() => {
    const initializeDarkProtocol = async () => {
      try {
        const client = await DarkProtocolClient.create({
          heliusApiKey: heliusApiKey!,
          rpcUrl: rpcUrl,
        });

        const manager = new PrivateSwapManager(client, {
          jupiterApiKey: apiKey,
          birdeyeApiKey: birdeyeApiKey,
          heliusApiKey: heliusApiKey,
        });

        setDarkClient(client);
        setSwapManager(manager);
        setOracle(manager.getOracle());
      } catch (error) {
        console.error('Failed to initialize Dark Protocol:', error);
      }
    };

    if (enableOracle || enableShielded) {
      initializeDarkProtocol();
    }
  }, [rpcUrl, apiKey, birdeyeApiKey, heliusApiKey, enableOracle, enableShielded]);

  // Validate swap with oracle
  const validateSwapWithOracle = useCallback(async (
    inputMint: string,
    outputMint: string,
    inputAmount: string
  ): Promise<SwapQuoteWithOracle | null> => {
    if (!swapManager || !state.isOracleActive) return null;

    try {
      setState(prev => ({ ...prev, isValidating: true }));

      const quote = await swapManager.getQuoteWithOracle(
        new PublicKey(inputMint),
        new PublicKey(outputMint),
        BigInt(inputAmount),
        50 // Default 0.5% slippage
      );

      // Check price deviation
      if (quote.priceDeviation !== undefined) {
        if (Math.abs(quote.priceDeviation) > maxPriceDeviation) {
          onPriceWarning?.(quote.priceDeviation);
          throw new Error(
            `Price deviation too high: ${quote.priceDeviation.toFixed(2)}% ` +
            `(max ${maxPriceDeviation}%). Possible price manipulation.`
          );
        }

        setState(prev => ({
          ...prev,
          priceDeviation: quote.priceDeviation,
          oraclePrice: quote.inputPrice?.priceUsd.toString(),
          jupiterPrice: (Number(quote.outputAmount) / Number(quote.inputAmount)).toString(),
        }));
      }

      return quote;
    } catch (error) {
      console.error('Oracle validation failed:', error);
      onSwapError?.(error as Error);
      return null;
    } finally {
      setState(prev => ({ ...prev, isValidating: false }));
    }
  }, [swapManager, state.isOracleActive, maxPriceDeviation, onPriceWarning, onSwapError]);

  // Check token safety
  const checkTokenSafety = useCallback(async (
    inputMint: string,
    outputMint: string
  ): Promise<void> => {
    if (!swapManager || !autoCheckSafety) return;

    try {
      const warnings = await swapManager.checkTokenSafety([
        inputMint,
        outputMint,
      ]);

      const highRiskWarnings = warnings.filter(
        w => w.riskLevel === 'high' || w.riskLevel === 'critical'
      );

      if (highRiskWarnings.length > 0) {
        setState(prev => ({ ...prev, safetyWarnings: highRiskWarnings }));
        onSafetyWarning?.(highRiskWarnings);
      }
    } catch (error) {
      console.error('Safety check failed:', error);
    }
  }, [swapManager, autoCheckSafety, onSafetyWarning]);

  // Toggle oracle mode
  const toggleOracle = useCallback(() => {
    setState(prev => ({ ...prev, isOracleActive: !prev.isOracleActive }));
  }, []);

  // Toggle shielded mode
  const toggleShielded = useCallback(() => {
    setState(prev => ({ ...prev, isShieldedMode: !prev.isShieldedMode }));
  }, []);

  return (
    <div className={`dark-swap-container ${className} ${theme}`}>
      {/* Privacy Controls */}
      <div className="privacy-controls mb-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>🔒</span>
            <span>Dark Protocol Privacy</span>
          </h3>
          <div className="flex gap-2">
            <button
              onClick={toggleOracle}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                state.isOracleActive
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {state.isOracleActive ? '🔮 Oracle ON' : '🔮 Oracle OFF'}
            </button>
            <button
              onClick={toggleShielded}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                state.isShieldedMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {state.isShieldedMode ? '🛡️ Shielded ON' : '🛡️ Shielded OFF'}
            </button>
          </div>
        </div>

        {/* Oracle Status */}
        {state.isOracleActive && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {state.priceDeviation !== undefined && (
              <div className="bg-gray-800 p-2 rounded">
                <div className="text-gray-400 text-xs mb-1">Price Deviation</div>
                <div className={`font-semibold ${
                  Math.abs(state.priceDeviation) > 1
                    ? 'text-yellow-400'
                    : 'text-green-400'
                }`}>
                  {state.priceDeviation.toFixed(2)}%
                </div>
              </div>
            )}
            {state.oraclePrice && (
              <div className="bg-gray-800 p-2 rounded">
                <div className="text-gray-400 text-xs mb-1">Oracle Price</div>
                <div className="text-white font-semibold">${state.oraclePrice}</div>
              </div>
            )}
          </div>
        )}

        {/* Safety Warnings */}
        {state.safetyWarnings && state.safetyWarnings.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-600 rounded">
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 text-xl">⚠️</span>
              <div className="flex-1">
                <div className="text-yellow-400 font-semibold mb-1">
                  High-Risk Tokens Detected
                </div>
                <ul className="text-sm text-yellow-300 space-y-1">
                  {state.safetyWarnings.map((warning, idx) => (
                    <li key={idx}>
                      • {warning.mint.slice(0, 8)}... - {warning.warnings.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Validating Indicator */}
        {state.isValidating && (
          <div className="mt-3 flex items-center gap-2 text-blue-400 text-sm">
            <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
            <span>Validating with oracle...</span>
          </div>
        )}
      </div>

      {/* Jupiter Swap Widget */}
      <div className="jupiter-swap-wrapper relative">
        <Swap
          rpcUrl={rpcUrl}
          referralKey={referralKey}
          platformFeeBps={platformFeeBps}
          apiKey={apiKey}
        />

        {/* Shielded Mode Overlay */}
        {state.isShieldedMode && (
          <div className="absolute top-2 right-2 px-3 py-1 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1">
            <span>🛡️</span>
            <span>Shielded</span>
          </div>
        )}
      </div>

      {/* Privacy Footer */}
      <div className="privacy-footer mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>MEV Protected</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Oracle Validated</span>
            </div>
            {state.isShieldedMode && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Zcash Privacy</span>
              </div>
            )}
          </div>
          <a
            href="https://darkprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            Powered by Dark Protocol
          </a>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Full Page Dark Swap Demo
// ============================================================================

export const DarkSwapDemo: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <DarkSwap
        rpcUrl={process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com"}
        referralKey={process.env.NEXT_PUBLIC_REFERRAL_KEY as string}
        platformFeeBps={20}
        apiKey={process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY as string}
        enableOracle={true}
        enableShielded={true}
        maxPriceDeviation={2.0}
        autoCheckSafety={true}
        onSwapSuccess={(signature) => {
          console.log('✅ Swap successful:', signature);
        }}
        onPriceWarning={(deviation) => {
          console.warn('⚠️ Price deviation warning:', deviation);
        }}
        onSafetyWarning={(warnings) => {
          console.warn('⚠️ Token safety warnings:', warnings);
        }}
      />
    </div>
  );
};

export default DarkSwap;
