#!/usr/bin/env node
/**
 * Helper script to find which derivation path matches a Leather wallet address.
 * This helps identify the correct path when the automatic search fails.
 * 
 * Usage: node scripts/find-leather-address.mjs
 * 
 * Requires in .env:
 *   DEPLOYER_SECRET_KEY = your 24-word mnemonic
 *   DEPLOYER_ADDRESS = the address you're looking for (e.g., ST33HZ...)
 *   Optional: BIP39_PASSPHRASE = if your wallet uses a passphrase
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';
import { c32addressDecode } from 'c32check';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

dotenv.config({ path: join(ROOT, '.env') });

function normalizeMnemonic(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().replace(/\s+/g, ' ').replace(/\r/g, '');
}

const mnemonic = normalizeMnemonic(process.env.DEPLOYER_SECRET_KEY);
const targetAddress = process.env.DEPLOYER_ADDRESS?.trim().toUpperCase();
const passphrase = process.env.BIP39_PASSPHRASE || '';

if (!mnemonic || mnemonic.split(' ').filter(Boolean).length < 12) {
  console.error('Error: DEPLOYER_SECRET_KEY not set or invalid in .env');
  process.exit(1);
}

if (!targetAddress) {
  console.error('Error: DEPLOYER_ADDRESS not set in .env');
  console.error('Set it to the address you want to find (e.g., ST33HZRHVDY39CH8K1C5WD91HDHT8VV368RY9E9TD)');
  process.exit(1);
}

console.log('Finding derivation path for:', targetAddress);
console.log('Using mnemonic:', mnemonic.split(' ').slice(0, 3).join(' ') + '...');
if (passphrase) {
  console.log('Using BIP39 passphrase: (set)');
}
console.log('');

const seed = passphrase 
  ? await bip39.mnemonicToSeed(mnemonic, passphrase)
  : await bip39.mnemonicToSeed(mnemonic);
const bip32 = BIP32Factory(ecc);

const normHash = (h) => (h || '').toLowerCase().replace(/^0x/, '').padStart(40, '0').slice(-40);
let targetHash160;
try {
  const [, hash160] = c32addressDecode(targetAddress);
  targetHash160 = normHash(hash160);
} catch (_) {
  console.error('Invalid DEPLOYER_ADDRESS (not a valid Stacks address):', targetAddress);
  process.exit(1);
}

console.log('Trying common paths first...\n');

// Common paths
const commonPaths = [
  "m/44'/5757'/0'/0/0",
  "m/44'/5757'/0'/0/1",
  "m/44'/5757'/0'/0/2",
  "m/44'/5757'/0'/0/3",
  "m/44'/5757'/0'/0/4",
  "m/44'/5757'/0'/1/0",
  "m/44'/5757'/0'/1/1",
  "m/44'/5757'/1'/0/0",
  "m/44'/5757'/1'/0/1",
  "m/44'/5757'/0/0/0",
  "m/44'/5757'/0/0/1",
  "m/44'/5757'/0/1/0",
  "m/44'/5757'/1/0/0",
];

for (const pathStr of commonPaths) {
  try {
    const node = bip32.fromSeed(seed).derivePath(pathStr);
    if (node.privateKey) {
      const keyHex = Buffer.from(node.privateKey).toString('hex');
      const derived = getAddressFromPrivateKey(keyHex, TransactionVersion.Testnet);
      const match = derived.toUpperCase() === targetAddress;
      console.log(`${match ? '✓ MATCH!' : ' '} ${pathStr.padEnd(20)} -> ${derived}`);
      if (match) {
        console.log('\n✓ Found! Use this path in your .env:');
        console.log(`  MANUAL_DERIVATION_PATH=${pathStr}`);
        process.exit(0);
      }
    }
  } catch (_) {}
}

console.log('\nNot found in common paths. Searching wider range...\n');
console.log('This may take a while. Press Ctrl+C to stop.\n');

let found = false;
let pathsChecked = 0;

// Search hardened accounts with wider address range
for (let acc = 0; acc <= 9 && !found; acc++) {
  for (const change of [0, 1]) {
    for (let addr = 0; addr <= 999 && !found; addr++) {
      const path = `m/44'/5757'/${acc}'/${change}/${addr}`;
      try {
        const node = bip32.fromSeed(seed).derivePath(path);
        if (node.privateKey) {
          const keyHex = Buffer.from(node.privateKey).toString('hex');
          const derived = getAddressFromPrivateKey(keyHex, TransactionVersion.Testnet);
          const [, derivedHash160] = c32addressDecode(derived);
          pathsChecked++;
          
          if (pathsChecked % 1000 === 0) {
            process.stdout.write(`\r  Checked ${pathsChecked} paths... (account ${acc}, change ${change}, address ${addr})`);
          }
          
          const derivedMatch = derived.toUpperCase() === targetAddress;
          const hashMatch = normHash(derivedHash160) === targetHash160;
          if (derivedMatch || hashMatch) {
            console.log(`\n\n✓ FOUND! Path: ${path}`);
            console.log(`  Address: ${derived}`);
            console.log('\nAdd this to your .env:');
            console.log(`  MANUAL_DERIVATION_PATH=${path}`);
            found = true;
            break;
          }
        }
      } catch (_) {}
    }
    if (found) break;
  }
  if (found) break;
}

if (!found) {
  console.log(`\n\n✗ Not found after checking ${pathsChecked} paths.`);
  console.log('\nPossible reasons:');
  console.log('  1. The mnemonic does not match the wallet that owns this address');
  console.log('  2. Leather uses a derivation path outside the searched range');
  console.log('  3. Your wallet uses a BIP39 passphrase (try setting BIP39_PASSPHRASE in .env)');
  console.log('  4. The address belongs to a different seed phrase');
  process.exit(1);
}
