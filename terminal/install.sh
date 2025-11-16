#!/bin/bash

# Dark X402 Terminal Installation Script

set -e

echo ""
echo "🌑 Dark X402 Terminal - Installation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required"
    echo "   Current version: $(node -v)"
    echo "   Please upgrade from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Setup environment
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your API keys!"
    echo "   Required: HELIUS_API_KEY"
    echo "   Optional: JUPITER_API_KEY, GOOGLE_AI_API_KEY, REDPILL_API_KEY"
    echo ""
else
    echo "ℹ️  .env file already exists (not overwriting)"
    echo ""
fi

# Build terminal
echo "🔨 Building terminal..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build terminal"
    exit 1
fi

echo "✅ Terminal built successfully"
echo ""

# Success message
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add your HELIUS_API_KEY"
echo "     Get a free key at: https://helius.dev"
echo ""
echo "  2. (Optional) Add other API keys:"
echo "     - JUPITER_API_KEY for swaps"
echo "     - GOOGLE_AI_API_KEY for AI agents"
echo "     - REDPILL_API_KEY for TEE verification"
echo ""
echo "  3. Start the terminal:"
echo "     npm start"
echo ""
echo "🌑 Welcome to Dark X402 Terminal!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
