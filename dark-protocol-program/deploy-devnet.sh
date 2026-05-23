#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍  Checking devnet balance..."
solana config set --url devnet
PUBKEY=$(solana-keygen pubkey ~/.config/solana/id.json)
echo "   Wallet: $PUBKEY"
echo "   Balance: $(solana balance)"

echo "🔨  Building..."
cd "$SCRIPT_DIR" && anchor build 2>&1 | tail -5

PROGRAM_KP="$SCRIPT_DIR/target/deploy/dark_protocol_program-keypair.json"
PROGRAM_ID=$(solana-keygen pubkey "$PROGRAM_KP")
echo "   Program ID: $PROGRAM_ID"

echo "🚀  Deploying to devnet..."
solana program deploy \
  "$SCRIPT_DIR/target/deploy/dark_protocol_program.so" \
  --program-id "$PROGRAM_KP" \
  --url devnet

echo "✅  Deployed: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
