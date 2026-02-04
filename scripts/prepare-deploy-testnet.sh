#!/usr/bin/env bash
# Prepare and optionally generate testnet deployment plan.
# Run from repo root. Apply with: cd contracts && clarinet deployments apply --testnet

set -e
cd "$(dirname "$0")/../contracts"

echo "==> Checking contracts..."
clarinet check

echo "==> Checking deployment plans..."
clarinet deployments check

echo "==> Generating testnet deployment plan (requires network)..."
clarinet deployments generate --testnet --low-cost

echo ""
echo "Done. To deploy to testnet, run:"
echo "  cd contracts && clarinet deployments apply --testnet"
echo ""
echo "Ensure your deployer wallet has testnet STX (faucet: https://explorer.stacks.co/sandbox/faucet?chain=testnet)."
