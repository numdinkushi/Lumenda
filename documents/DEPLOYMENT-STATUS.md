# Deployment Status

## Current Status: ✅ DEPLOYMENT READY

Contracts are **validated** and **deployment plans are configured**. Deploy to a network when ready.

## Before You Deploy (Checklist)

- [ ] **Contracts pass locally:** `cd contracts && clarinet check && clarinet deployments check`
- [ ] **Tests pass:** run your contract test suite (e.g. `clarinet test` or your project’s test command)
- [ ] **Deployer:** `.env` has `DEPLOYER_ADDRESS` (copy from `env.example`). You have a Stacks wallet (or mnemonic) to sign; never commit `.env` or mnemonics.
- [ ] **STX for fees (testnet/mainnet):** deployer has enough STX. **Testnet** deployment typically needs **under 1 STX** for both contracts; script requires at least 0.5 STX to attempt. Use faucets or [request via API](#request-testnet-stx-via-api) below. Mainnet uses real STX.
- [ ] **Network config:** `contracts/settings/Testnet.toml` or `Mainnet.toml` point to the right RPC/explorer (defaults are fine for Hiro public nodes)

## What's Done

- ✅ Contracts written and validated
- ✅ Contracts pass `clarinet check`
- ✅ Test files created
- ✅ **Simnet plan** – `deployments/default.simnet-plan.yaml` (used by `clarinet test`, `clarinet console`)
- ✅ **Devnet plan** – `deployments/default.devnet-plan.yaml` (used by `clarinet devnet start`)
- ✅ **Devnet deployer** – `settings/Devnet.toml` has a valid deployer account (BIP39 test mnemonic)

## Deploy to a Network

### 1. Local Devnet (optional; requires Docker on your machine)

**No Dockerfile in this project.** If you want to run a **local** Stacks + Bitcoin chain, Clarinet’s `devnet start` uses Docker on your machine and pulls Hiro’s pre-built images—nothing from this repo.

**Prerequisites:** Docker Desktop (or Docker daemon) installed and running.

```bash
cd contracts
clarinet devnet start
```

This starts a local devnet, deploys the contracts from `default.devnet-plan.yaml`, and opens a dashboard. Stop with Ctrl+C.

**You can skip this:** Simnet (console, check, tests) and testnet deployment do **not** need Docker.

**If the deployer address doesn’t match:** The plan uses `expected-sender: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`. Your `settings/Devnet.toml` deployer mnemonic must derive to this address, or regenerate the plan:

```bash
clarinet deployments generate --devnet --manual-cost
# Then merge the expected-sender from the generated plan into deployments/default.devnet-plan.yaml if batches were empty
```

### 2. Testnet (public, requires STX)

**Option A — Node script (recommended, no Clarinet wallet prompt)**

1. Copy `env.example` to `.env` in the repo root.
2. Set **DEPLOYER_SECRET_KEY** to your 24-word phrase (e.g. from Leather: Settings → Secret Key). Optionally set **DEPLOYER_ADDRESS** to your wallet address (e.g. `ST33...`); if the script can’t derive that address from the phrase, it will use the address it can derive and tell you to fund it.
3. Ensure the **deployer address** has testnet STX (typically under 1 STX for both contracts; script needs at least 0.5 STX). If your wallet shows a different address (e.g. Leather shows `ST33...` but the script uses `ST2P3...`), send STX from your wallet to the address the script prints (e.g. `ST2P3Z4K0MQ0VAB0B4A4JHAQAK0P7Y4R7K1PGGR7Z`), then run again.
4. From repo root: `npm run deploy:testnet`.

The script will: resolve the key from your 24 words (and optional DEPLOYER_ADDRESS), check balance at `https://api.testnet.hiro.so`, then deploy `escrow.clar` and `remittance.clar` in order.

**Option B — Clarinet (generate plan + apply)**

1. Copy `env.example` to `.env` in the repo root.
2. Set `DEPLOYER_ADDRESS` to your testnet STX address (e.g. `ST33...`). Never commit `.env`.
3. Generate the testnet plan from the template, then apply:

```bash
# From repo root
cp env.example .env
# Edit .env and set DEPLOYER_ADDRESS=ST33...

./scripts/generate-testnet-plan.sh   # writes contracts/deployments/default.testnet-plan.yaml
cd contracts && clarinet deployments apply --testnet   # prompts for wallet/mnemonic to sign
```

The file `contracts/deployments/default.testnet-plan.yaml` is generated from `default.testnet-plan.yaml.template` and is gitignored so your address is never committed.

**Get testnet STX** (for either option):

- [Hiro Explorer Sandbox (testnet)](https://explorer.hiro.so/sandbox/faucet?chain=testnet) — if you see "Failed to fetch (api.testnet.hiro.so)", try the alternative below.
- **Alternative:** [Triangle Platform Stacks testnet faucet](https://faucet.triangleplatform.com/stacks/testnet) — use this when the Hiro faucet is down or fails.
- **Request testnet STX via API** (can give 500 STX per request; web UI may limit to 1 STX/day): see [Request testnet STX via API](#request-testnet-stx-via-api) below.

### How much STX do I need for testnet deploy?

- Typical testnet contract deploys cost **under 1 STX** total for both contracts. The script only requires **0.5 STX** balance to attempt; the SDK uses the network’s fee estimate when building the transaction.
- If a deploy fails with **NotEnoughFunds**, the error response usually includes the exact amount needed—fund the deployer address and try again. Simnet/devnet use fixed tiny costs (e.g. 0.01 STX) or no real STX; use **local devnet** (`clarinet devnet start`) if you want to avoid testnet STX entirely.

### Why is the deployer address ST2P3... and not my wallet (ST33...)?

The script derives the signing key from your **24‑word mnemonic** using the standard Stacks BIP44 path `m/44'/5757'/0'/0/0`. Many wallets (e.g. Leather “Account 1”) use a **different path** for the same seed, so they show a different address (e.g. `ST33...`). So:

- **ST2P3...** = address from your seed at path `m/44'/5757'/0'/0/0` (what the script uses).
- **ST33...** = address from your seed at the path your wallet uses.

Both are “yours” (same seed); they are different addresses. To deploy with this script you must **fund the address the script prints** (e.g. ST2P3...). Send testnet STX from your wallet (ST33...) to that address, or request faucet STX **to that address** (ST2P3...). If you prefer to deploy from ST33..., you must set **DEPLOYER_PRIVATE_KEY** in `.env` to that address’s 64‑char hex private key (wallets like Leather don’t expose this in the UI).

### I don’t have enough STX / faucet gives 1 STX per day — how do I bypass?

1. **Use local devnet (no real STX)**  
   Run a full local chain and deploy there (free, no faucet limits):
   ```bash
   cd contracts && clarinet devnet start
   ```
   Requires Docker. Contracts deploy from the devnet plan; you can test everything locally.

2. **Request testnet STX via API**  
   The Hiro API can send **500 STX** per request to a testnet address. The web faucet may rate‑limit to 1 STX/day; the API sometimes allows more. From repo root:
   ```bash
   ./scripts/request-testnet-faucet.sh ST2P3Z4K0MQ0VAB0B4A4JHAQAK0P7Y4R7K1PGGR7Z
   ```
   Use the **exact address** the deploy script prints (the one that needs funding). If the API returns success, wait for the tx to confirm then run `npm run deploy:testnet` again.

3. **Other faucets**  
   Try [Triangle testnet faucet](https://faucet.triangleplatform.com/stacks/testnet) or [LearnWeb3 Stacks faucet](https://learnweb3.io/) and enter the deployer address (ST2P3... or ST33... if using DEPLOYER_PRIVATE_KEY).

4. **Get STX from someone else**  
   Testnet STX has no real value; teams often share it. Ask in Stacks Discord or your team for a one‑off transfer to your deployer address.

### 3. Mainnet (production)

**Deployer:** Same as testnet—use apply prompts or configure deployer in `contracts/settings/Mainnet.toml`. Never commit mainnet mnemonics.

```bash
cd contracts
clarinet deployments generate --mainnet --low-cost
clarinet deployments apply --mainnet
```

Only use after security review and with real STX for fees.

### Request testnet STX via API

The Hiro API endpoint can send testnet STX (e.g. 500 STX per request) to an **ST** address. Use the deployer address the script prints (e.g. `ST2P3...`):

```bash
./scripts/request-testnet-faucet.sh ST2P3Z4K0MQ0VAB0B4A4JHAQAK0P7Y4R7K1PGGR7Z
```

Or with `curl`:

```bash
curl -sS -X POST "https://api.testnet.hiro.so/extended/v1/faucets/stx" \
  -H "Content-Type: application/json" \
  -d '{"address":"ST2P3Z4K0MQ0VAB0B4A4JHAQAK0P7Y4R7K1PGGR7Z"}'
```

Replace the address with your deployer address. If the API rate‑limits you, try again later or use another faucet.

### If the Hiro testnet faucet fails ("Failed to fetch (api.testnet.hiro.so)")

- **Try again later** — the Hiro testnet API can be temporarily down or rate-limited.
- **Use an alternative faucet:** [Triangle Platform Stacks testnet faucet](https://faucet.triangleplatform.com/stacks/testnet) — enter your testnet address (starts with `ST`) to receive testnet STX.
- **Optional (API):** You can call the faucet directly: `POST https://api.testnet.hiro.so/extended/v1/faucets/stx` with your address in the body (see [Hiro faucet docs](https://docs.hiro.so/stacks/api/faucets/stx)). If the browser fails due to CORS/network, a local script or `curl` from your machine might still work when the API is up.

### If you see "BadAddressVersionByte" (400 Bad Request)

The faucet expects an **ST**-format address (legacy version byte), not **SP**. Your wallet may be showing the SP address (e.g. `SP33...`). Use the **ST**-format address for the same account:

- In **Hiro Wallet**: Switch to testnet, then in account/address details look for the address that **starts with `ST`** (not `SP`) and use that for the faucet.
- In **Xverse**: Same idea — ensure you're on testnet and use the ST-form address if the faucet offers a field to paste an address.
- If the Sandbox auto-fills your **SP** address, try the **Triangle faucet** ([faucet.triangleplatform.com/stacks/testnet](https://faucet.triangleplatform.com/stacks/testnet)) and **paste your ST address manually** (get the ST address from your wallet’s testnet account).

### If you see "RecvError" when publishing transactions

**RecvError** means the connection to the testnet RPC was closed or timed out when Clarinet tried to broadcast (network/RPC issue, not your wallet).

1. **Check RPC reachability** (from repo root):
   ```bash
   ./scripts/check-testnet-rpc.sh
   ```
   If it fails, the RPC is unreachable from your network.

2. **Retry** — Often transient; run `cd contracts && clarinet deployments apply --testnet` again and confirm with Y.

3. **Change network** — Disable VPN/proxy; try another Wi‑Fi or mobile hotspot (Hiro’s RPC can drop connections from some networks).

4. **Use another RPC** — In repo root `.env` set `STACKS_TESTNET_RPC_URL` to one of these, then run `./scripts/generate-testnet-plan.sh` and again `cd contracts && clarinet deployments apply --testnet`:
   - **Primary testnet (default):** `https://api.testnet.hiro.so`
   - **Nakamoto testnet (different chain):** `https://api.nakamoto.testnet.hiro.so` — different testnet; you’d need Nakamoto testnet STX and use that chain. Try this if Primary keeps failing.
   - **QuickNode:** After [signup](https://www.quicknode.com/), use the testnet RPC URL they give you (e.g. `https://xxx.stacks-testnet.quiknode.pro`).

## Verify Deployment Plans

```bash
# If you want to verify the testnet plan too, generate it first (requires .env with DEPLOYER_ADDRESS)
./scripts/generate-testnet-plan.sh

cd contracts
clarinet deployments check
clarinet check
clarinet test
```

## Helper Scripts

**Testnet (use .env, no hardcoded address):**

Run from the **repo root** (the folder that contains `contracts/` and `scripts/`), not from inside `contracts/`:

```bash
cd /path/to/lumenda   # repo root
cp env.example .env
# Set DEPLOYER_ADDRESS=ST33... in .env

./scripts/generate-testnet-plan.sh   # generates plan from template + .env
cd contracts && clarinet deployments apply --testnet   # prompts for wallet to sign
```

**Optional – full testnet prep (check + generate plan via Clarinet):**

```bash
./scripts/prepare-deploy-testnet.sh   # clarinet check, deployments check, generate --testnet
# Then: ./scripts/generate-testnet-plan.sh (to inject your .env address) and apply
```

**Mainnet (after security review):**

```bash
./scripts/prepare-deploy-mainnet.sh
# Then: cd contracts && clarinet deployments apply --mainnet
```

## For Code for STX Month 1

**Deployment is optional.** Requirements are:

- ✅ New Clarity contract
- ✅ Meaningful functionality
- ✅ Test suite
- ✅ Valid Clarity code (passes `clarinet check`)

All are met without deploying.

## Recommendation

- **Month 1 PR:** No deployment needed; contracts are validated and ready to submit.
- **Later:** Deploy to testnet (no Docker) for real testnet transactions, or run local devnet (requires Docker on your machine) for a full local chain.
