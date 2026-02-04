#!/usr/bin/env node
/**
 * Deploy Lumenda contracts (escrow + remittance) to Stacks testnet.
 *
 * Refs: https://docs.stacks.co/stacks.js/contract-deployment, https://docs.stacks.co/stacks.js/private-keys
 *
 * PROCESS:
 * 1. Load .env: DEPLOYER_SECRET_KEY (24 words) or DEPLOYER_PRIVATE_KEY (64-char hex; Stacks format with trailing 01 is accepted).
 * 2. Resolve deployer key: if DEPLOYER_ADDRESS is set, try derivation paths to match it; else use m/44'/5757'/0'/0/0 or DEPLOYER_PRIVATE_KEY.
 * 3. Check deployer STX balance at RPC. Exit if < 0.5 STX unless SKIP_BALANCE_CHECK=1.
 * 4. Deploy escrow.clar then remittance.clar via makeContractDeploy + broadcastTransaction. Typical testnet deploy is under 1 STX total.
 *
 * Run from repo root: npm run deploy:testnet
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { makeContractDeploy, broadcastTransaction, getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';
import { c32addressDecode } from 'c32check';
import { StacksTestnet, createFetchFn } from '@stacks/network';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTRACTS = join(ROOT, 'contracts', 'core');

dotenv.config({ path: join(ROOT, '.env') });

/** Primary Stacks testnet API — use this so your testnet wallet balance is used */
const PRIMARY_TESTNET_RPC = 'https://api.testnet.hiro.so';
const RPC = process.env.STACKS_TESTNET_RPC_URL || PRIMARY_TESTNET_RPC;
const NAKAMOTO_RPC = 'https://api.nakamoto.testnet.hiro.so';
const FETCH_TIMEOUT_MS = 30000;

/** fetch with longer timeout to avoid Connect Timeout on slow networks */
function fetchWithTimeout(url, init = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...init, signal: c.signal }).finally(() => clearTimeout(t));
}

/** Private key: 64-char hex or 66-char with trailing 01 (Stacks compressed). See https://docs.stacks.co/stacks.js/private-keys */
let KEY_HEX = process.env.DEPLOYER_PRIVATE_KEY?.replace(/^0x/, '').trim();
if (KEY_HEX && KEY_HEX.length === 66 && KEY_HEX.slice(-2).toLowerCase() === '01') KEY_HEX = KEY_HEX.slice(0, 64);

/** BIP44 path: account and address index. Leather Account 1 = 0/0, Account 2 = 0/1; some wallets use account 1 = 1/0. */
const DERIVATION_ACCOUNT = parseInt(process.env.DEPLOYER_ACCOUNT_INDEX ?? '0', 10) || 0;
const DERIVATION_ADDRESS = parseInt(process.env.DEPLOYER_ADDRESS_INDEX ?? '0', 10) || 0;
/** If set, try common derivation paths until we find a key whose testnet address matches (so wallet ST33... works). */
const TARGET_DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS?.trim().toUpperCase() || null;
/** Set DEBUG_DERIVATION=1 to print first few derived addresses and hash160s (to verify mnemonic/path). */
const DEBUG_DERIVATION = process.env.DEBUG_DERIVATION === '1' || process.env.DEBUG_DERIVATION === 'true';

/** Normalize mnemonic: one line, single spaces (handles paste with newlines or extra spaces). */
function normalizeMnemonic(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().replace(/\s+/g, ' ').replace(/\r/g, '');
}

async function getSenderKey() {
  if (KEY_HEX && (KEY_HEX.length === 64 || KEY_HEX.length === 66)) return KEY_HEX.slice(0, 64);
  const mnemonic = normalizeMnemonic(process.env.DEPLOYER_SECRET_KEY);
  if (mnemonic && mnemonic.split(' ').filter(Boolean).length >= 12) {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const bip32 = BIP32Factory(ecc);
    if (TARGET_DEPLOYER_ADDRESS) {
      const normHash = (h) => (h || '').toLowerCase().replace(/^0x/, '').padStart(40, '0').slice(-40);
      let targetHash160;
      try {
        const [, hash160] = c32addressDecode(TARGET_DEPLOYER_ADDRESS);
        targetHash160 = normHash(hash160);
      } catch (_) {
        console.error('Invalid DEPLOYER_ADDRESS (not a valid Stacks address):', TARGET_DEPLOYER_ADDRESS);
        process.exit(1);
      }
      let debugCount = 0;
      for (const change of [0, 1]) {
        for (let acc = 0; acc <= 19; acc++) {
          for (let addr = 0; addr <= 99; addr++) {
            const path = `m/44'/5757'/${acc}'/${change}/${addr}`;
            try {
              const node = bip32.fromSeed(seed).derivePath(path);
              if (node.privateKey) {
                const keyHex = Buffer.from(node.privateKey).toString('hex');
                const derived = getAddressFromPrivateKey(keyHex, TransactionVersion.Testnet);
                const [, derivedHash160] = c32addressDecode(derived);
                if (DEBUG_DERIVATION && debugCount < 5) {
                  console.warn(`[DEBUG] path=${path} -> ${derived} hash160=${normHash(derivedHash160)}`);
                  debugCount++;
                }
                const derivedMatch = derived.toUpperCase() === TARGET_DEPLOYER_ADDRESS;
                const hashMatch = normHash(derivedHash160) === targetHash160;
                if (derivedMatch || hashMatch) return keyHex;
              }
            } catch (_) { /* skip invalid path */ }
          }
        }
      }
      const firstKeyHex = (() => {
        try {
          const n = bip32.fromSeed(seed).derivePath("m/44'/5757'/0'/0/0");
          return n.privateKey ? Buffer.from(n.privateKey).toString('hex') : null;
        } catch (_) { return null; }
      })();
      const firstAddress = firstKeyHex ? getAddressFromPrivateKey(firstKeyHex, TransactionVersion.Testnet) : null;
      if (firstKeyHex && firstAddress) {
        console.warn('DEPLOYER_ADDRESS=' + TARGET_DEPLOYER_ADDRESS + ' not found from mnemonic (tried paths m/44\'/5757\'/0-19\'/0-1/0-99). Using derived address ' + firstAddress + '.');
        console.warn('To deploy from ' + TARGET_DEPLOYER_ADDRESS + ': set DEPLOYER_PRIVATE_KEY in .env to that address\'s 64-char hex private key (export from wallet if supported), then remove DEPLOYER_ADDRESS and DEPLOYER_SECRET_KEY. Or send testnet STX from ' + TARGET_DEPLOYER_ADDRESS + ' to ' + firstAddress + ' and run again.');
        return firstKeyHex;
      }
      console.error('DEPLOYER_ADDRESS=' + TARGET_DEPLOYER_ADDRESS + ' not found from mnemonic (tried paths m/44\'/5757\'/0-19\'/0-1/0-99).');
      console.error('To use ' + TARGET_DEPLOYER_ADDRESS + ' you must set DEPLOYER_PRIVATE_KEY=<64-char-hex> in .env (the private key for that address). Leather does not expose this in the UI.');
      process.exit(1);
    }
    const path = `m/44'/5757'/${DERIVATION_ACCOUNT}'/0/${DERIVATION_ADDRESS}`;
    const node = bip32.fromSeed(seed).derivePath(path);
    if (node.privateKey) return Buffer.from(node.privateKey).toString('hex');
  }
  return null;
}

function makeNetwork(url) {
  return new StacksTestnet({ url, fetchFn: createFetchFn(fetchWithTimeout) });
}
let network = makeNetwork(RPC);

/** micro-STX (1e6) to STX */
function microStxToStx(hexOrStr) {
  const n = typeof hexOrStr === 'string' && hexOrStr.startsWith('0x')
    ? parseInt(hexOrStr, 16) : parseInt(String(hexOrStr), 10);
  return (Number.isNaN(n) ? 0 : n) / 1e6;
}

function formatRejection(res) {
  let msg = res.error || 'transaction rejected';
  if (res.reason) msg += ` (reason: ${res.reason})`;
  const rd = res.reason_data;
  if (rd && res.reason === 'NotEnoughFunds' && (rd.expected != null || rd.actual != null)) {
    const expectedStx = microStxToStx(rd.expected);
    const actualStx = microStxToStx(rd.actual);
    msg += ` — need ${expectedStx.toFixed(2)} STX, balance ${actualStx.toFixed(2)} STX. Get testnet STX from a faucet (e.g. https://explorer.hiro.so/faucet?chain=testnet).`;
  } else if (rd && Object.keys(rd).length) {
    msg += ` ${JSON.stringify(rd)}`;
  }
  return msg;
}

/** Rejection reasons that won't succeed on retry */
const NON_RETRY_REASONS = new Set(['NotEnoughFunds', 'ContractAlreadyExists', 'BadNonce', 'BadAddressVersionByte', 'BadFunctionArgument', 'NoSuchContract', 'NoSuchPublicFunction']);

async function broadcastWithRetry(tx, tag, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await broadcastTransaction(tx, network);
      if (res.error) {
        const err = new Error(formatRejection(res));
        err.reason = res.reason;
        throw err;
      }
      console.log(`${tag} txid: ${res.txid}`);
      return res;
    } catch (e) {
      if (e.reason && NON_RETRY_REASONS.has(e.reason)) throw e;
      if (i === maxAttempts - 1) throw e;
      console.warn(`${tag} attempt ${i + 1} failed, retrying...`, e.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

function isConnectTimeout(err) {
  const msg = String(err?.message ?? err?.cause?.message ?? '');
  return msg.includes('timeout') || msg.includes('Timeout') || msg.includes('ENOTFOUND') || err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT';
}

/** Fetch deployer STX balance from current RPC (so we can confirm testnet vs mainnet). */
async function getDeployerBalanceStx(address) {
  const url = `${RPC}/v2/accounts/${address}?proof=0`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    const bal = data.balance ?? data.stx?.balance ?? '0x0';
    return microStxToStx(bal);
  } catch {
    return null;
  }
}

async function main() {
  const senderKey = await getSenderKey();
  if (!senderKey || senderKey.length !== 64) {
    console.error('Missing in .env: set either DEPLOYER_SECRET_KEY (your 24 words from Settings → Secret Key) or DEPLOYER_PRIVATE_KEY (64-char hex).');
    process.exit(1);
  }

  const deployerAddress = getAddressFromPrivateKey(senderKey, TransactionVersion.Testnet);
  console.log('RPC (testnet):', RPC);
  console.log('Deployer address (testnet):', deployerAddress);

  const skipBalanceCheck = process.env.SKIP_BALANCE_CHECK === '1' || process.env.SKIP_BALANCE_CHECK === 'true';
  const balanceStx = await getDeployerBalanceStx(deployerAddress);
  /** Typical testnet contract deploy is under 1 STX; require a small minimum so we don't block. */
  const MIN_STX = 0.5;
  if (balanceStx != null) {
    console.log('Deployer balance at this RPC:', balanceStx.toFixed(2), 'STX');
    if (!skipBalanceCheck && balanceStx < MIN_STX) {
      console.error('Balance too low. Need at least ' + MIN_STX + ' STX to attempt deploy. You have', balanceStx.toFixed(2), 'STX.');
      console.error('Send testnet STX to: ' + deployerAddress);
      console.error('Faucet: https://explorer.hiro.so/faucet?chain=testnet');
      if (TARGET_DEPLOYER_ADDRESS) {
        console.error('Or send from your wallet (' + TARGET_DEPLOYER_ADDRESS + ') to the address above, then run again.');
      }
      process.exit(1);
    }
  } else {
    console.warn('Could not fetch balance from RPC; continuing anyway.');
  }
  if (skipBalanceCheck) console.warn('SKIP_BALANCE_CHECK is set; attempting deploy anyway.');
  console.log('');

  const escrowBody = readFileSync(join(CONTRACTS, 'escrow.clar'), 'utf8');
  const remittanceBody = readFileSync(join(CONTRACTS, 'remittance.clar'), 'utf8');

  /** Testnet uses 1 micro-STX per byte; we bypass the fee API and set a small explicit fee (contracts ~6KB + ~10KB; tx overhead ~1KB). */
  const FEE_MICROSTX_ESCROW = Math.ceil((Buffer.byteLength(escrowBody, 'utf8') + 1024) * 1.5);
  const FEE_MICROSTX_REMITTANCE = Math.ceil((Buffer.byteLength(remittanceBody, 'utf8') + 1024) * 1.5);

  const runDeploys = async () => {
    const txOptions = { senderKey, network };
    console.log('Deploying escrow...');
    const escrowTx = await makeContractDeploy({
      contractName: 'escrow',
      codeBody: escrowBody,
      fee: FEE_MICROSTX_ESCROW,
      ...txOptions,
    });
    await broadcastWithRetry(escrowTx, 'escrow');

    console.log('Deploying remittance...');
    const remittanceTx = await makeContractDeploy({
      contractName: 'remittance',
      codeBody: remittanceBody,
      fee: FEE_MICROSTX_REMITTANCE,
      ...txOptions,
    });
    await broadcastWithRetry(remittanceTx, 'remittance');
  };

  try {
    await runDeploys();
  } catch (e) {
    if (e.reason === 'NotEnoughFunds') {
      console.error('\nFund this deployer address with testnet STX:');
      console.error('  ' + deployerAddress);
      console.error('  Faucet: https://explorer.hiro.so/faucet?chain=testnet\n');
    }
    if (isConnectTimeout(e) && RPC.includes('api.testnet.hiro.so') && !RPC.includes('nakamoto')) {
      console.warn('Primary testnet timed out. Retrying with Nakamoto RPC...');
      network = makeNetwork(NAKAMOTO_RPC);
      await runDeploys();
      console.warn('Tip: set STACKS_TESTNET_RPC_URL=https://api.nakamoto.testnet.hiro.so in .env to use Nakamoto by default.');
    } else {
      throw e;
    }
  }

  console.log('Done. Check explorer for your address.');
  console.log('');
  console.log('Frontend: set in frontend/.env (or update frontend/config/addresses.testnet.json):');
  console.log('  NEXT_PUBLIC_STACKS_DEPLOYER_ADDRESS=' + deployerAddress);
  console.log('  Contract IDs: ' + deployerAddress + '.escrow, ' + deployerAddress + '.remittance');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
