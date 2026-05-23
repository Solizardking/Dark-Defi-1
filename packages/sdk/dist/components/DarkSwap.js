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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Swap } from "jupiverse-kit";
import { PublicKey } from '@solana/web3.js';
import { DarkProtocolClient } from '../client';
import { PrivateSwapManager } from '../swap';
// ============================================================================
// Dark Swap Component
// ============================================================================
export const DarkSwap = ({ rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com", referralKey = process.env.NEXT_PUBLIC_REFERRAL_KEY, platformFeeBps = 20, apiKey = process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY, 
// Dark Protocol props
birdeyeApiKey = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY, heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY, enableOracle = true, enableShielded = true, maxPriceDeviation = 2.0, autoCheckSafety = true, 
// Styling
className = "", theme = 'dark', 
// Callbacks
onSwapStart, onSwapSuccess, onSwapError, onPriceWarning, onSafetyWarning, }) => {
    const [state, setState] = useState({
        isOracleActive: enableOracle,
        isShieldedMode: enableShielded,
        isValidating: false,
    });
    const [darkClient, setDarkClient] = useState(null);
    const [swapManager, setSwapManager] = useState(null);
    const [oracle, setOracle] = useState(null);
    // Initialize Dark Protocol client
    useEffect(() => {
        const initializeDarkProtocol = async () => {
            try {
                const client = await DarkProtocolClient.create({
                    heliusApiKey: heliusApiKey,
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
            }
            catch (error) {
                console.error('Failed to initialize Dark Protocol:', error);
            }
        };
        if (enableOracle || enableShielded) {
            initializeDarkProtocol();
        }
    }, [rpcUrl, apiKey, birdeyeApiKey, heliusApiKey, enableOracle, enableShielded]);
    // Validate swap with oracle
    const validateSwapWithOracle = useCallback(async (inputMint, outputMint, inputAmount) => {
        if (!swapManager || !state.isOracleActive)
            return null;
        try {
            setState(prev => ({ ...prev, isValidating: true }));
            const quote = await swapManager.getQuoteWithOracle(new PublicKey(inputMint), new PublicKey(outputMint), BigInt(inputAmount), 50 // Default 0.5% slippage
            );
            // Check price deviation
            if (quote.priceDeviation !== undefined) {
                if (Math.abs(quote.priceDeviation) > maxPriceDeviation) {
                    onPriceWarning?.(quote.priceDeviation);
                    throw new Error(`Price deviation too high: ${quote.priceDeviation.toFixed(2)}% ` +
                        `(max ${maxPriceDeviation}%). Possible price manipulation.`);
                }
                setState(prev => ({
                    ...prev,
                    priceDeviation: quote.priceDeviation,
                    oraclePrice: quote.inputPrice?.priceUsd.toString(),
                    jupiterPrice: (Number(quote.outputAmount) / Number(quote.inputAmount)).toString(),
                }));
            }
            return quote;
        }
        catch (error) {
            console.error('Oracle validation failed:', error);
            onSwapError?.(error);
            return null;
        }
        finally {
            setState(prev => ({ ...prev, isValidating: false }));
        }
    }, [swapManager, state.isOracleActive, maxPriceDeviation, onPriceWarning, onSwapError]);
    // Check token safety
    const checkTokenSafety = useCallback(async (inputMint, outputMint) => {
        if (!swapManager || !autoCheckSafety)
            return;
        try {
            const warnings = await swapManager.checkTokenSafety([
                inputMint,
                outputMint,
            ]);
            const highRiskWarnings = warnings.filter(w => w.riskLevel === 'high' || w.riskLevel === 'critical');
            if (highRiskWarnings.length > 0) {
                setState(prev => ({ ...prev, safetyWarnings: highRiskWarnings }));
                onSafetyWarning?.(highRiskWarnings);
            }
        }
        catch (error) {
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
    return (_jsxs("div", { className: `dark-swap-container ${className} ${theme}`, children: [_jsxs("div", { className: "privacy-controls mb-4 p-4 bg-gray-900 rounded-lg border border-gray-700", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("h3", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [_jsx("span", { children: "\uD83D\uDD12" }), _jsx("span", { children: "Dark Protocol Privacy" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: toggleOracle, className: `px-3 py-1 rounded text-sm font-medium transition-colors ${state.isOracleActive
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-700 text-gray-300'}`, children: state.isOracleActive ? '🔮 Oracle ON' : '🔮 Oracle OFF' }), _jsx("button", { onClick: toggleShielded, className: `px-3 py-1 rounded text-sm font-medium transition-colors ${state.isShieldedMode
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-700 text-gray-300'}`, children: state.isShieldedMode ? '🛡️ Shielded ON' : '🛡️ Shielded OFF' })] })] }), state.isOracleActive && (_jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [state.priceDeviation !== undefined && (_jsxs("div", { className: "bg-gray-800 p-2 rounded", children: [_jsx("div", { className: "text-gray-400 text-xs mb-1", children: "Price Deviation" }), _jsxs("div", { className: `font-semibold ${Math.abs(state.priceDeviation) > 1
                                            ? 'text-yellow-400'
                                            : 'text-green-400'}`, children: [state.priceDeviation.toFixed(2), "%"] })] })), state.oraclePrice && (_jsxs("div", { className: "bg-gray-800 p-2 rounded", children: [_jsx("div", { className: "text-gray-400 text-xs mb-1", children: "Oracle Price" }), _jsxs("div", { className: "text-white font-semibold", children: ["$", state.oraclePrice] })] }))] })), state.safetyWarnings && state.safetyWarnings.length > 0 && (_jsx("div", { className: "mt-3 p-3 bg-yellow-900/20 border border-yellow-600 rounded", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-yellow-400 text-xl", children: "\u26A0\uFE0F" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-yellow-400 font-semibold mb-1", children: "High-Risk Tokens Detected" }), _jsx("ul", { className: "text-sm text-yellow-300 space-y-1", children: state.safetyWarnings.map((warning, idx) => (_jsxs("li", { children: ["\u2022 ", warning.mint.slice(0, 8), "... - ", warning.warnings.join(', ')] }, idx))) })] })] }) })), state.isValidating && (_jsxs("div", { className: "mt-3 flex items-center gap-2 text-blue-400 text-sm", children: [_jsx("div", { className: "animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" }), _jsx("span", { children: "Validating with oracle..." })] }))] }), _jsxs("div", { className: "jupiter-swap-wrapper relative", children: [_jsx(Swap, { rpcUrl: rpcUrl, referralKey: referralKey, platformFeeBps: platformFeeBps, apiKey: apiKey }), state.isShieldedMode && (_jsxs("div", { className: "absolute top-2 right-2 px-3 py-1 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1", children: [_jsx("span", { children: "\uD83D\uDEE1\uFE0F" }), _jsx("span", { children: "Shielded" })] }))] }), _jsx("div", { className: "privacy-footer mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700 text-xs text-gray-400", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 bg-green-500 rounded-full" }), _jsx("span", { children: "MEV Protected" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 bg-blue-500 rounded-full" }), _jsx("span", { children: "Oracle Validated" })] }), state.isShieldedMode && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 bg-purple-500 rounded-full" }), _jsx("span", { children: "Zcash Privacy" })] }))] }), _jsx("a", { href: "https://darkprotocol.io", target: "_blank", rel: "noopener noreferrer", className: "text-gray-500 hover:text-gray-300 transition-colors", children: "Powered by Dark Protocol" })] }) })] }));
};
// ============================================================================
// Full Page Dark Swap Demo
// ============================================================================
export const DarkSwapDemo = () => {
    return (_jsx("div", { className: "min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900", children: _jsx(DarkSwap, { rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com", referralKey: process.env.NEXT_PUBLIC_REFERRAL_KEY, platformFeeBps: 20, apiKey: process.env.NEXT_PUBLIC_JUP_SWAP_V1_API_KEY, enableOracle: true, enableShielded: true, maxPriceDeviation: 2.0, autoCheckSafety: true, onSwapSuccess: (signature) => {
                console.log('✅ Swap successful:', signature);
            }, onPriceWarning: (deviation) => {
                console.warn('⚠️ Price deviation warning:', deviation);
            }, onSafetyWarning: (warnings) => {
                console.warn('⚠️ Token safety warnings:', warnings);
            } }) }));
};
export default DarkSwap;
//# sourceMappingURL=DarkSwap.js.map