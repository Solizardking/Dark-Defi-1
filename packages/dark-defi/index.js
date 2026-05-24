/**
 * dark-defi — Official Dark DeFi SDK meta-package
 * Privacy-first Solana DeFi suite
 *
 * Re-exports the core Dark DeFi packages so users can `npm install dark-defi`
 * and get the full stack:
 *
 *   - @openclawdsol/dark-protocol-sdk  → shielded wallet, swaps, oracle
 *   - @openclawdsol/dark-tee-agents    → TEE-attested AI agents (Clawd, ConfidentialAgent)
 *   - @openclawdsol/dark-protocol      → low-level protocol primitives
 *   - sas-lib                          → Solana Attestation Service client + Dark schemas
 */

'use strict';

try { Object.assign(exports, require('@openclawdsol/dark-protocol')); } catch (_) {}
try { Object.assign(exports, require('@openclawdsol/dark-protocol-sdk')); } catch (_) {}
try { Object.assign(exports, require('@openclawdsol/dark-tee-agents')); } catch (_) {}
try { Object.assign(exports, require('sas-lib')); } catch (_) {}

exports.VERSION = '0.2.1';
exports.PACKAGES = {
  protocol: '@openclawdsol/dark-protocol',
  sdk:      '@openclawdsol/dark-protocol-sdk',
  tee:      '@openclawdsol/dark-tee-agents',
  sas:      'sas-lib',
  terminal: 'dark-x402-terminal',
};
