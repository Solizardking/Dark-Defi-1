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
import React from 'react';
import type { TokenShieldWarning } from '../swap';
export interface DarkSwapProps {
    rpcUrl?: string;
    referralKey?: string;
    platformFeeBps?: number;
    apiKey?: string;
    birdeyeApiKey?: string;
    heliusApiKey?: string;
    enableOracle?: boolean;
    enableShielded?: boolean;
    maxPriceDeviation?: number;
    autoCheckSafety?: boolean;
    className?: string;
    theme?: 'dark' | 'light';
    onSwapStart?: () => void;
    onSwapSuccess?: (signature: string) => void;
    onSwapError?: (error: Error) => void;
    onPriceWarning?: (deviation: number) => void;
    onSafetyWarning?: (warnings: TokenShieldWarning[]) => void;
}
export declare const DarkSwap: React.FC<DarkSwapProps>;
export declare const DarkSwapDemo: React.FC;
export default DarkSwap;
//# sourceMappingURL=DarkSwap.d.ts.map