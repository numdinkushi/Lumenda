#!/usr/bin/env bash
# Generate contracts/deployments/default.testnet-plan.yaml from template and .env.
# Run from repo root. Requires: .env with DEPLOYER_ADDRESS set.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f .env ]; then
  echo "Missing .env. Copy env.example to .env and set DEPLOYER_ADDRESS."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

if [ -z "${DEPLOYER_ADDRESS:-}" ]; then
  echo "DEPLOYER_ADDRESS is not set in .env."
  exit 1
fi

# Default: Nakamoto testnet RPC (often more reliable than Primary; use Primary in .env if you prefer)
export STACKS_TESTNET_RPC_URL="${STACKS_TESTNET_RPC_URL:-https://api.nakamoto.testnet.hiro.so}"

TEMPLATE="$REPO_ROOT/contracts/deployments/default.testnet-plan.yaml.template"
OUT="$REPO_ROOT/contracts/deployments/default.testnet-plan.yaml"

if command -v envsubst >/dev/null 2>&1; then
  export DEPLOYER_ADDRESS
  envsubst '$DEPLOYER_ADDRESS $STACKS_TESTNET_RPC_URL' < "$TEMPLATE" > "$OUT"
else
  sed -e "s|\${DEPLOYER_ADDRESS}|$DEPLOYER_ADDRESS|g" \
      -e "s|\${STACKS_TESTNET_RPC_URL}|$STACKS_TESTNET_RPC_URL|g" < "$TEMPLATE" > "$OUT"
fi
echo "Generated $OUT with deployer $DEPLOYER_ADDRESS and RPC $STACKS_TESTNET_RPC_URL"
