#!/usr/bin/env bash
# Check if the testnet RPC is reachable before running clarinet deployments apply.
# Run from repo root. Uses STACKS_TESTNET_RPC_URL from .env or default.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
RPC="${STACKS_TESTNET_RPC_URL:-https://api.testnet.hiro.so}"

echo "Checking testnet RPC: $RPC"
if curl -sf --connect-timeout 10 --max-time 15 "$RPC/v2/info" >/dev/null 2>&1; then
  echo "OK: RPC is reachable."
  exit 0
else
  echo "FAIL: RPC not reachable (connection refused, timeout, or error)."
  echo "If you get RecvError when deploying, try: different network, VPN off, or set STACKS_TESTNET_RPC_URL in .env to another testnet RPC."
  exit 1
fi
