/**
 * dark-defi — Official Dark DeFi SDK meta-package
 * Privacy-first Solana DeFi suite
 *
 * Re-exports everything from the Dark DeFi ecosystem:
 *  - @openclawdsolana/dark-protocol  → on-chain types & ABIs
 *  - @openclawdsolana/dark-sdk       → full privacy SDK
 *  - @openclawdsolana/dark-tee-agents → TEE-attested AI agents
 *  - sas-lib                         → Solana Attestation Service client
 */

'use strict';

// Re-export sub-packages for convenience
// Users can also install the individual packages directly.
try { Object.assign(exports, require('@openclawdsolana/dark-protocol')); } catch (_) {}
try { Object.assign(exports, require('@openclawdsolana/dark-sdk')); } catch (_) {}
try { Object.assign(exports, require('@openclawdsolana/dark-tee-agents')); } catch (_) {}
try { Object.assign(exports, require('sas-lib')); } catch (_) {}

exports.VERSION = '0.2.0';
exports.PACKAGES = {
  protocol: '@openclawdsolana/dark-protocol',
  sdk:      '@openclawdsolana/dark-sdk',
  tee:      '@openclawdsolana/dark-tee-agents',
  sas:      'sas-lib',
  terminal: 'dark-x402-terminal',
};
