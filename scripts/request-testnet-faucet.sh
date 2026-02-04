#!/usr/bin/env bash
# Request testnet STX from Hiro faucet API (can give 500 STX per request).
# Usage: ./scripts/request-testnet-faucet.sh <ST... address>
# Example: ./scripts/request-testnet-faucet.sh ST2P3Z4K0MQ0VAB0B4A4JHAQAK0P7Y4R7K1PGGR7Z
set -e
ADDR="${1:?Usage: $0 <ST... address>}"
if [[ ! "$ADDR" =~ ^ST[A-HJ-NP-Z0-9]+$ ]]; then
  echo "Error: address must be testnet ST format (starts with ST)." >&2
  exit 1
fi
URL="https://api.testnet.hiro.so/extended/v1/faucets/stx"
echo "Requesting testnet STX for $ADDR..."
RES=$(curl -sS -w "\n%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$ADDR\"}")
HTTP=$(echo "$RES" | tail -n1)
BODY=$(echo "$RES" | sed '$d')
if [[ "$HTTP" == "200" ]]; then
  echo "$BODY" | head -c 500
  echo ""
  echo "Request accepted. Wait for the transaction to confirm, then run: npm run deploy:testnet"
else
  echo "Faucet returned HTTP $HTTP" >&2
  echo "$BODY" >&2
  exit 1
fi
