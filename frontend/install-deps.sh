#!/bin/bash
# Install dependencies for Lumenda frontend
# Run this if you get "Module not found: Can't resolve '@stacks/connect'" errors

echo "Installing dependencies..."
cd "$(dirname "$0")"
npm install

if [ $? -eq 0 ]; then
  echo "✅ Dependencies installed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Make sure you have a Stacks wallet extension installed:"
  echo "   - Leather: https://leather.io/"
  echo "   - Hiro: https://www.hiro.so/wallet"
  echo "2. Run: npm run dev"
else
  echo "❌ Installation failed. Check the error above."
  exit 1
fi
