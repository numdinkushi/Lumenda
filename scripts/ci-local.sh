#!/usr/bin/env bash
# Run the same checks as CI locally. Use before pushing to avoid CI failures.
# Usage: ./scripts/ci-local.sh   or   npm run ci
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Running CI checks (contracts + frontend)..."
FAILED=0

# --- Contracts (same as test-contracts job) ---
echo ""
echo "==> [Contracts] clarinet check"
if command -v clarinet &>/dev/null; then
  (cd contracts && clarinet check) || FAILED=1
else
  echo "    Skipped: clarinet not installed. Install from https://github.com/stx-labs/clarinet/releases"
fi

if [ $FAILED -eq 1 ]; then exit 1; fi

echo ""
echo "==> [Contracts] clarinet test"
if command -v clarinet &>/dev/null; then
  TMP=$(cd contracts && clarinet test 2>&1); R=$?
  if echo "$TMP" | grep -q "unrecognized subcommand 'test'"; then
    echo "    Skipped: this Clarinet has no 'test' subcommand (CI uses stx-labs Clarinet v3)."
  else
    echo "$TMP"
    [ $R -ne 0 ] && FAILED=1
  fi
else
  echo "    Skipped: clarinet not installed (CI will run it)."
fi
if [ $FAILED -eq 1 ]; then exit 1; fi

# --- Frontend (same as test-frontend job) ---
if [ ! -f frontend/package.json ]; then
  echo ""
  echo "==> [Frontend] No frontend/package.json, skipping."
  echo "All checks passed."
  exit 0
fi

echo ""
echo "==> [Frontend] Installing dependencies (npm ci)"
(cd frontend && npm ci) || FAILED=1
if [ $FAILED -eq 1 ]; then exit 1; fi

echo ""
echo "==> [Frontend] Lint"
(cd frontend && npm run lint) || FAILED=1
if [ $FAILED -eq 1 ]; then exit 1; fi

echo ""
echo "==> [Frontend] Build"
(cd frontend && npm run build) || FAILED=1
if [ $FAILED -eq 1 ]; then exit 1; fi

echo ""
echo "All CI checks passed."
