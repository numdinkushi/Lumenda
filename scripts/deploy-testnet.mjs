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
/** BIP39 passphrase (optional). Some wallets use a passphrase with the mnemonic. */
const BIP39_PASSPHRASE = process.env.BIP39_PASSPHRASE || '';
/** Manual derivation path override (e.g., "m/44'/5757'/0'/0/123"). If set, uses this exact path instead of searching. */
const MANUAL_DERIVATION_PATH = process.env.MANUAL_DERIVATION_PATH?.trim() || null;

/** Normalize mnemonic: one line, single spaces (handles paste with newlines or extra spaces). */
function normalizeMnemonic(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().replace(/\s+/g, ' ').replace(/\r/g, '');
}

async function getSenderKey() {
  if (KEY_HEX && (KEY_HEX.length === 64 || KEY_HEX.length === 66)) return KEY_HEX.slice(0, 64);
  const mnemonic = normalizeMnemonic(process.env.DEPLOYER_SECRET_KEY);
  if (mnemonic && mnemonic.split(' ').filter(Boolean).length >= 12) {
    // Use BIP39 passphrase if provided (some wallets like Leather may use this)
    const seed = BIP39_PASSPHRASE 
      ? await bip39.mnemonicToSeed(mnemonic, BIP39_PASSPHRASE)
      : await bip39.mnemonicToSeed(mnemonic);
    const bip32 = BIP32Factory(ecc);
    
    // If manual derivation path is specified, use it directly
    if (MANUAL_DERIVATION_PATH) {
      try {
        console.log(`Using manual derivation path: ${MANUAL_DERIVATION_PATH}`);
        const node = bip32.fromSeed(seed).derivePath(MANUAL_DERIVATION_PATH);
        if (node.privateKey) {
          const keyHex = Buffer.from(node.privateKey).toString('hex');
          const derived = getAddressFromPrivateKey(keyHex, TransactionVersion.Testnet);
          console.log(`Derived address: ${derived}`);
          if (TARGET_DEPLOYER_ADDRESS && derived.toUpperCase() !== TARGET_DEPLOYER_ADDRESS) {
            console.warn(`Warning: Manual path gives ${derived}, but TARGET_DEPLOYER_ADDRESS is ${TARGET_DEPLOYER_ADDRESS}`);
          }
          return keyHex;
        }
      } catch (e) {
        console.error(`Failed to derive from manual path ${MANUAL_DERIVATION_PATH}:`, e.message);
        process.exit(1);
      }
    }
    
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
      
      console.log(`Searching for address ${TARGET_DEPLOYER_ADDRESS}...`);
      console.log('Trying common Leather wallet paths first, then expanding search...');
      
      // Common paths to try first (Leather/Hiro wallet patterns)
      const commonPaths = [
        // Standard BIP44 with hardened accounts
        "m/44'/5757'/0'/0/0",
        "m/44'/5757'/0'/0/1",
        "m/44'/5757'/0'/0/2",
        "m/44'/5757'/0'/1/0",
        "m/44'/5757'/1'/0/0",
        // Non-hardened accounts (some wallets use this)
        "m/44'/5757'/0/0/0",
        "m/44'/5757'/0/0/1",
        "m/44'/5757'/0/1/0",
        "m/44'/5757'/1/0/0",
      ];
      
      let debugCount = 0;
      let pathsTried = 0;
      let lastProgressUpdate = Date.now();
      
      // Try common paths first
      for (const pathStr of commonPaths) {
        try {
          const node = bip32.fromSeed(seed).derivePath(pathStr);
          if (node.privateKey) {
            const keyHex = Buffer.from(node.privateKey).toString('hex');
            const derived = getAddressFromPrivateKey(keyHex, TransactionVersion.Testnet);
            const [, derivedHash160] = c32addressDecode(derived);
            pathsTried++;
            
            if (DEBUG_DERIVATION || pathsTried <= 10) {
              console.log(`[${pathsTried}] Trying ${pathStr} -> ${derived}`);
            }
            
            const derivedMatch = derived.toUpperCase() === TARGET_DEPLOYER_ADDRESS;
            const hashMatch = normHash(derivedHash160) === targetHash160;
            if (derivedMatch || hashMatch) {
              console.log(`✓ Found matching address at path: ${pathStr}`);
              return keyHex;
            }
          }
        } catch (_) { /* skip invalid path */ }
      }
      
      // Expanded search: hardened accounts with wider address range
      console.log('Expanding search to more derivation paths...');
      for (const change of [0, 1]) {
        for (let acc = 0; acc <= 49; acc++) { // Expanded from 19 to 49
          for (let addr = 0; addr <= 499; addr++) { // Expanded from 99 to 499
            const path = `m/44'/5757'/${acc}'/${change}/${addr}`;
            try {
              const node = bip32.fromSeed(seed).derivePath(path);
              if (node.privateKey) {
                const keyHex = Buffer.from(node.privateKey).toString('hex');
                const derived = getAddressFromPrivateKey(keyHex, TransactionVersion.Testnet);
                const [, derivedHash160] = c32addressDecode(derived);
                pathsTried++;
                
                // Progress update every 1000 paths
                if (pathsTried % 1000 === 0) {
                  const now = Date.now();
                  if (now - lastProgressUpdate > 2000) { // Update every 2 seconds max
                    console.log(`  Searched ${pathsTried} paths... (account ${acc}, change ${change}, address ${addr})`);
                    lastProgressUpdate = now;
                  }
                }
                
                const derivedMatch = derived.toUpperCase() === TARGET_DEPLOYER_ADDRESS;
                const hashMatch = normHash(derivedHash160) === targetHash160;
                if (derivedMatch || hashMatch) {
                  console.log(`✓ Found matching address at path: ${path}`);
                  return keyHex;
                }
              }
            } catch (_) { /* skip invalid path */ }
          }
        }
      }
      
      // Try non-hardened accounts with wider range
      console.log('Trying non-hardened account paths...');
      for (const change of [0, 1]) {
        for (let acc = 0; acc <= 49; acc++) {
          for (let addr = 0; addr <= 499; addr++) {
            const path = `m/44'/5757'/${acc}/${change}/${addr}`;
            try {
              const node = bip32.fromSeed(seed).derivePath(path);
              if (node.privateKey) {
                const keyHex = Buffer.from(node.privateKey).toString('hex');
                const derived = getAddressFromPrivateKey(keyHex, TransactionVersion.Testnet);
                const [, derivedHash160] = c32addressDecode(derived);
                pathsTried++;
                
                if (pathsTried % 1000 === 0) {
                  const now = Date.now();
                  if (now - lastProgressUpdate > 2000) {
                    console.log(`  Searched ${pathsTried} paths... (non-hardened account ${acc}, change ${change}, address ${addr})`);
                    lastProgressUpdate = now;
                  }
                }
                
                const derivedMatch = derived.toUpperCase() === TARGET_DEPLOYER_ADDRESS;
                const hashMatch = normHash(derivedHash160) === targetHash160;
                if (derivedMatch || hashMatch) {
                  console.log(`✓ Found matching address at path: ${path}`);
                  return keyHex;
                }
              }
            } catch (_) { /* skip invalid path */ }
          }
        }
      }
      
      console.log(`\nSearched ${pathsTried} derivation paths but could not find ${TARGET_DEPLOYER_ADDRESS}`);
      console.log('This might mean:');
      console.log('  1. The mnemonic does not derive to this address');
      console.log('  2. Leather uses a derivation path outside the searched range');
      console.log('  3. The address belongs to a different seed phrase');
      console.log('\nTrying one more time with even wider search (this may take a while)...');
      
      // Last resort: try even wider ranges for account 0 (most common)
      for (let addr = 500; addr <= 999; addr++) {
        for (const change of [0, 1]) {
          const path = `m/44'/5757'/0'/${change}/${addr}`;
          try {
            const node = bip32.fromSeed(seed).derivePath(path);
            if (node.privateKey) {
              const keyHex = Buffer.from(node.privateKey).toString('hex');
              const derived = getAddressFromPrivateKey(keyHex, TransactionVersion.Testnet);
              const [, derivedHash160] = c32addressDecode(derived);
              pathsTried++;
              
              const derivedMatch = derived.toUpperCase() === TARGET_DEPLOYER_ADDRESS;
              const hashMatch = normHash(derivedHash160) === targetHash160;
              if (derivedMatch || hashMatch) {
                console.log(`✓ Found matching address at path: ${path}`);
                return keyHex;
              }
            }
          } catch (_) { /* skip invalid path */ }
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
        console.error(`\n✗ Could not find ${TARGET_DEPLOYER_ADDRESS} after searching ${pathsTried} paths.`);
        console.error(`  Default derivation (m/44'/5757'/0'/0/0) gives: ${firstAddress}`);
        console.error('\nOptions:');
        console.error('  1. Verify the mnemonic matches the wallet that owns ' + TARGET_DEPLOYER_ADDRESS);
        console.error('  2. Set DEPLOYER_PRIVATE_KEY in .env to the 64-char hex private key for ' + TARGET_DEPLOYER_ADDRESS);
        console.error('  3. Send testnet STX from ' + TARGET_DEPLOYER_ADDRESS + ' to ' + firstAddress + ' and deploy from there');
        process.exit(1);
      }
      console.error('DEPLOYER_ADDRESS=' + TARGET_DEPLOYER_ADDRESS + ' not found from mnemonic.');
      console.error('To use ' + TARGET_DEPLOYER_ADDRESS + ' you must set DEPLOYER_PRIVATE_KEY=<64-char-hex> in .env (the private key for that address).');
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

  /** Wait for a transaction to be confirmed on-chain */
  async function waitForConfirmation(txid, maxWaitSeconds = 300) {
    const startTime = Date.now();
    const maxWait = maxWaitSeconds * 1000;
    console.log(`Waiting for transaction ${txid} to confirm...`);
    
    while (Date.now() - startTime < maxWait) {
      try {
        const url = `${RPC}/extended/v1/tx/${txid}`;
        const res = await fetchWithTimeout(url);
        if (res.ok) {
          const data = await res.json();
          if (data.tx_status === 'success') {
            console.log(`✓ Transaction confirmed: ${txid}`);
            return true;
          } else if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
            console.error(`✗ Transaction failed: ${data.tx_status}`);
            if (data.tx_result) {
              console.error(`Error: ${data.tx_result}`);
            }
            return false;
          }
          // Still pending, wait and retry
          await new Promise((r) => setTimeout(r, 5000)); // Wait 5 seconds
        }
      } catch (e) {
        // Network error, retry
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    console.warn(`⚠ Transaction not confirmed after ${maxWaitSeconds} seconds, continuing anyway...`);
    return false;
  }

  /** Check if a contract already exists */
  async function contractExists(contractName) {
    try {
      const url = `${RPC}/v2/contracts/${deployerAddress}/${contractName}`;
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        return !!data.contract_id;
      }
    } catch (e) {
      // Contract doesn't exist or not accessible yet
    }
    return false;
  }

  const runDeploys = async () => {
    const txOptions = { senderKey, network };
    
    // Check if escrow already exists
    const escrowExists = await contractExists('escrow');
    let escrowResult = null;
    
    if (escrowExists) {
      console.log('✓ Escrow contract already exists, skipping deployment');
    } else {
      console.log('Deploying escrow...');
      try {
        const escrowTx = await makeContractDeploy({
          contractName: 'escrow',
          codeBody: escrowBody,
          fee: FEE_MICROSTX_ESCROW,
          ...txOptions,
        });
        escrowResult = await broadcastWithRetry(escrowTx, 'escrow');
      
        if (!escrowResult || !escrowResult.txid) {
          throw new Error('Escrow deployment failed - no transaction ID returned');
        }

        // CRITICAL: Wait for escrow to confirm before deploying remittance
        console.log('\nWaiting for escrow contract to confirm on-chain...');
        const escrowConfirmed = await waitForConfirmation(escrowResult.txid, 300);
      
      if (!escrowConfirmed) {
        throw new Error('Escrow deployment did not confirm. Remittance cannot be deployed until escrow is live.');
      }

      // Verify escrow contract exists before proceeding
      console.log('Verifying escrow contract is accessible via RPC (this may take 1-2 minutes)...');
      let escrowVerified = false;
      for (let i = 0; i < 30; i++) { // Try for up to 2.5 minutes (30 * 5 seconds)
        try {
          const url = `${RPC}/v2/contracts/${deployerAddress}/escrow`;
          const res = await fetchWithTimeout(url);
          if (res.ok) {
            const data = await res.json();
            if (data.contract_id) {
              console.log(`✓ Escrow contract verified: ${data.contract_id}`);
              escrowVerified = true;
              break;
            }
          }
        } catch (e) {
          // Continue trying
        }
        if (i < 29) { // Don't wait on last iteration
          process.stdout.write(`  Attempt ${i + 1}/30...\r`);
          await new Promise((r) => setTimeout(r, 5000)); // Wait 5 seconds between checks
        }
      }
      console.log(''); // New line after progress

      if (!escrowVerified) {
        console.warn('⚠ Escrow contract not yet accessible via RPC API.');
        console.warn('This is normal - there can be a delay. The transaction is confirmed.');
        console.warn('You can either:');
        console.warn('  1. Wait 2-3 minutes and run: npm run deploy:testnet (it will skip escrow and deploy remittance)');
        console.warn('  2. Or continue anyway (remittance may fail if escrow is not ready)');
        console.warn('\nProceeding with remittance deployment anyway...');
        }
      } catch (e) {
        if (e.reason === 'ContractAlreadyExists') {
          console.log('✓ Escrow contract already exists (caught during deployment), continuing...');
        } else {
          throw e;
        }
      }
    }

    // Check if remittance already exists
    const remittanceExists = await contractExists('remittance');
    if (remittanceExists) {
      console.log('✓ Remittance contract already exists, skipping deployment');
    } else {
      console.log('\nDeploying remittance...');
      try {
        const remittanceTx = await makeContractDeploy({
          contractName: 'remittance',
          codeBody: remittanceBody,
          fee: FEE_MICROSTX_REMITTANCE,
          ...txOptions,
        });
        await broadcastWithRetry(remittanceTx, 'remittance');
      } catch (e) {
        if (e.reason === 'ContractAlreadyExists') {
          console.log('✓ Remittance contract already exists (caught during deployment)');
        } else {
          throw e;
        }
      }
    }
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
