#!/usr/bin/env bash
# Prepare and generate mainnet deployment plan.
# Run from repo root. Apply only after security review.
# Apply with: cd contracts && clarinet deployments apply --mainnet

set -e
cd "$(dirname "$0")/../contracts"

echo "==> Checking contracts..."
clarinet check

echo "==> Checking deployment plans..."
clarinet deployments check

echo "==> Generating mainnet deployment plan (requires network)..."
clarinet deployments generate --mainnet --low-cost

echo ""
echo "Done. To deploy to mainnet (after security review), run:"
echo "  cd contracts && clarinet deployments apply --mainnet"
echo ""
echo "WARNING: Only use after security audit. Real STX required for fees."
