#!/usr/bin/env bash
# Try deploying to Nakamoto testnet (different RPC; use if Primary gives RecvError).
# Run from repo root. Same .env DEPLOYER_ADDRESS; you need Nakamoto testnet STX for this chain.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

export STACKS_TESTNET_RPC_URL="https://api.nakamoto.testnet.hiro.so"
./scripts/generate-testnet-plan.sh
echo ""
echo "Next: cd contracts && clarinet deployments apply --testnet"
echo "(You need Nakamoto testnet STX; get it from the Nakamoto testnet faucet if needed.)"
