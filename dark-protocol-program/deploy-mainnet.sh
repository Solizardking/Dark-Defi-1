#!/usr/bin/env bash
# =============================================================================
# Dark Protocol — Mainnet Deployment Script
# =============================================================================
# Prerequisites:
#   - Wallet funded with ≥ 3 SOL on mainnet-beta
#   - solana CLI, anchor CLI, cargo installed
#   - Keypair at ~/.config/solana/id.json
#
# Run: bash deploy-mainnet.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_CONFIG="$SCRIPT_DIR/../packages/sdk/src/config.ts"

# ── 1. Confirm wallet + balance ──────────────────────────────────────────────
echo "🔍  Checking mainnet balance..."
solana config set --url mainnet-beta
PUBKEY=$(solana-keygen pubkey ~/.config/solana/id.json)
BALANCE=$(solana balance --lamports | awk '{print $1}')
MIN_LAMPORTS=2500000000  # 2.5 SOL

echo "   Wallet : $PUBKEY"
echo "   Balance: $(solana balance)"

if [ "$BALANCE" -lt "$MIN_LAMPORTS" ]; then
  echo ""
  echo "❌  Insufficient balance. Need ≥ 2.5 SOL to deploy."
  echo "   Fund this address: $PUBKEY"
  echo "   Then re-run this script."
  exit 1
fi

# ── 2. Build program (release) ───────────────────────────────────────────────
echo ""
echo "🔨  Building dark_protocol_program (release)..."
cd "$SCRIPT_DIR"
anchor build 2>&1

PROGRAM_SO="$SCRIPT_DIR/target/deploy/dark_protocol_program.so"
PROGRAM_KP="$SCRIPT_DIR/target/deploy/dark_protocol_program-keypair.json"
PROGRAM_ID=$(solana-keygen pubkey "$PROGRAM_KP")

echo "   Program binary : $PROGRAM_SO ($(du -h "$PROGRAM_SO" | cut -f1))"
echo "   Program ID     : $PROGRAM_ID"

# ── 3. Deploy to mainnet ─────────────────────────────────────────────────────
echo ""
echo "🚀  Deploying to mainnet-beta..."
solana program deploy \
  "$PROGRAM_SO" \
  --program-id "$PROGRAM_KP" \
  --url mainnet-beta \
  --keypair ~/.config/solana/id.json

echo ""
echo "✅  Program deployed: $PROGRAM_ID"
echo "   Explorer: https://explorer.solana.com/address/$PROGRAM_ID"

# ── 4. Initialize protocol state ────────────────────────────────────────────
echo ""
echo "🏗   Initializing protocol state on mainnet..."
cat > /tmp/dark_init.ts << EOF
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from '@solana/web3.js';
import { readFileSync } from 'fs';
import { homedir } from 'os';

async function main() {
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  const kpData = JSON.parse(readFileSync(\`\${homedir()}/.config/solana/id.json\`, 'utf8'));
  const payer = Keypair.fromSecretKey(Uint8Array.from(kpData));

  // Dynamically import the SDK
  const { DarkProtocolClient } = await import('../packages/sdk/dist/client.js');
  const client = await DarkProtocolClient.create({
    network: 'mainnet',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    programId: new PublicKey('$PROGRAM_ID'),
  });

  const [statePDA] = client.protocolStatePDA();
  const existing = await client.getProtocolState();
  if (existing) {
    console.log('Protocol state already initialized at:', statePDA.toBase58());
    return;
  }

  const tx = await client.buildInitializeTx(payer.publicKey, payer.publicKey);
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer.publicKey;
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log('Initialized! Tx:', sig);
  console.log('Protocol State PDA:', statePDA.toBase58());
}

main().catch(console.error);
EOF
node --input-type=module < /tmp/dark_init.ts 2>/dev/null || \
  echo "   (Run npm run build in packages/sdk first, then re-run this step)"

# ── 5. Update SDK config ──────────────────────────────────────────────────────
echo ""
echo "📝  Updating SDK config.ts with mainnet program ID..."
sed -i '' \
  "s|DARK_PROTOCOL_MAINNET: new PublicKey('.*')|DARK_PROTOCOL_MAINNET: new PublicKey('$PROGRAM_ID')|g" \
  "$SDK_CONFIG"

# Also update the primary DARK_PROTOCOL id to the mainnet one
sed -i '' \
  "s|DARK_PROTOCOL: new PublicKey('.*')|DARK_PROTOCOL: new PublicKey('$PROGRAM_ID')|g" \
  "$SDK_CONFIG"

echo "   Updated: $SDK_CONFIG"

# ── 6. Rebuild + republish SDK ───────────────────────────────────────────────
echo ""
echo "📦  Rebuilding and publishing SDK..."
cd "$SCRIPT_DIR/../packages/sdk"
npm version patch --no-git-tag-version
npm run build
npm publish --access public

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅  DARK PROTOCOL DEPLOYED TO MAINNET"
echo "═══════════════════════════════════════════════════════════════"
echo "   Program ID : $PROGRAM_ID"
echo "   Explorer   : https://explorer.solana.com/address/$PROGRAM_ID"
echo "   npm        : https://www.npmjs.com/package/@openclawdsol/dark-protocol-sdk"
echo ""
echo "   Install: npm install @openclawdsol/dark-protocol-sdk"
echo ""
echo "   Quick start:"
echo "   import { ShieldedWallet } from '@openclawdsol/dark-protocol-sdk';"
echo "   const wallet = await ShieldedWallet.create({ network: 'mainnet', demoMode: false });"
echo "═══════════════════════════════════════════════════════════════"
