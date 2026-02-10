#!/usr/bin/env node
/**
 * Test script to find Leather wallet derivation path.
 * Tests various account index structures that Leather might use.
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';
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
const targetAddress = process.env.DEPLOYER_ADDRESS?.trim().toUpperCase() || 'ST33HZRHVDY39CH8K1C5WD91HDHT8VV368RY9E9TD';

if (!mnemonic || mnemonic.split(' ').filter(Boolean).length < 12) {
  console.error('Error: DEPLOYER_SECRET_KEY not set or invalid in .env');
  process.exit(1);
}

console.log('Testing derivation paths for:', targetAddress);
console.log('Mnemonic:', mnemonic.split(' ').slice(0, 3).join(' ') + '...\n');

const seed = await bip39.mnemonicToSeed(mnemonic);
const bip32 = BIP32Factory(ecc);

// Test various account index interpretations
// Leather "Account 1" might be account index 1, not 0
const testPaths = [
  // Standard with account 0
  "m/44'/5757'/0'/0/0",
  "m/44'/5757'/0'/0/1",
  "m/44'/5757'/0'/1/0",
  
  // Account 1 (Leather Account 1 might map to account index 1)
  "m/44'/5757'/1'/0/0",
  "m/44'/5757'/1'/0/1",
  "m/44'/5757'/1'/1/0",
  
  // Non-hardened account 0
  "m/44'/5757'/0/0/0",
  "m/44'/5757'/0/0/1",
  "m/44'/5757'/0/1/0",
  
  // Non-hardened account 1
  "m/44'/5757'/1/0/0",
  "m/44'/5757'/1/0/1",
  "m/44'/5757'/1/1/0",
  
  // Try higher address indices for account 0
  "m/44'/5757'/0'/0/10",
  "m/44'/5757'/0'/0/20",
  "m/44'/5757'/0'/0/30",
  "m/44'/5757'/0'/0/40",
  "m/44'/5757'/0'/0/50",
  
  // Try higher address indices for account 1
  "m/44'/5757'/1'/0/10",
  "m/44'/5757'/1'/0/20",
  "m/44'/5757'/1'/0/30",
];

console.log('Testing specific paths:\n');

for (const pathStr of testPaths) {
  try {
    const node = bip32.fromSeed(seed).derivePath(pathStr);
    if (node.privateKey) {
      const keyHex = Buffer.from(node.privateKey).toString('hex');
      const derived = getAddressFromPrivateKey(keyHex, TransactionVersion.Testnet);
      const match = derived.toUpperCase() === targetAddress;
      console.log(`${match ? '✓✓✓ MATCH!' : '   '} ${pathStr.padEnd(25)} -> ${derived}`);
      if (match) {
        console.log(`\n✓✓✓ FOUND! Use this in .env:`);
        console.log(`MANUAL_DERIVATION_PATH=${pathStr}`);
        process.exit(0);
      }
    }
  } catch (e) {
    console.log(`   ${pathStr.padEnd(25)} -> ERROR: ${e.message}`);
  }
}

console.log('\nNot found in test paths. Trying wider search with account 1...\n');

// Search account 1 with wider address range
for (let addr = 0; addr <= 200; addr++) {
  for (const change of [0, 1]) {
    const path = `m/44'/5757'/1'/${change}/${addr}`;
    try {
      const node = bip32.fromSeed(seed).derivePath(path);
      if (node.privateKey) {
        const keyHex = Buffer.from(node.privateKey).toString('hex');
        const derived = getAddressFromPrivateKey(keyHex, TransactionVersion.Testnet);
        if (addr % 50 === 0 || addr <= 10) {
          console.log(`  ${path.padEnd(25)} -> ${derived}`);
        }
        if (derived.toUpperCase() === targetAddress) {
          console.log(`\n✓✓✓ FOUND! Path: ${path}`);
          console.log(`Add to .env: MANUAL_DERIVATION_PATH=${path}`);
          process.exit(0);
        }
      }
    } catch (_) {}
  }
}

console.log('\nStill not found. The address might use a different derivation scheme.');
console.log('Possible issues:');
console.log('  1. Leather uses a different BIP44 coin type (not 5757)');
console.log('  2. Leather uses a BIP39 passphrase');
console.log('  3. The mnemonic does not match this address');
process.exit(1);
