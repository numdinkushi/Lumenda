#!/usr/bin/env bash
# Quick check: frontend lint + build only (no contracts, no npm ci).
# Use when you only changed frontend code. For full CI parity use: npm run ci
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f frontend/package.json ]; then
  echo "No frontend/package.json found."
  exit 1
fi

echo "==> [Frontend] Lint"
(cd frontend && npm run lint)
echo ""
echo "==> [Frontend] Build"
(cd frontend && npm run build)
echo ""
echo "Frontend checks passed."
