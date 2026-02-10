#!/usr/bin/env node
/**
 * Simple script to help you get your Leather wallet address.
 * 
 * Since we can't derive it from the mnemonic, this script provides instructions
 * on how to get it from Leather directly, then we can use that address.
 * 
 * Run this and follow the instructions.
 */

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Get Your Leather Wallet Address                             ║
╚══════════════════════════════════════════════════════════════╝

Since we can't derive your Leather address (ST33HZ...Y9E9TD) from the mnemonic,
here are ways to get it and use it for deployment:

METHOD 1: Use Leather Extension API (Browser)
──────────────────────────────────────────────
1. Open your browser with Leather extension installed
2. Open browser console (F12)
3. Run this JavaScript:

   const leather = window.LeatherProvider;
   if (leather) {
     leather.request('getAddresses', {}).then(result => {
       console.log('Your Stacks address:', result.addresses.stx[0].address);
     });
   }

4. Copy the address and use it in deployment

METHOD 2: Check Leather Wallet UI
──────────────────────────────────
1. Open Leather wallet extension
2. Go to your Stacks account
3. Copy the address shown (should be ST33HZ...Y9E9TD)
4. Verify it matches what you expect

METHOD 3: Use Browser-Based Deployment
──────────────────────────────────────
I've created a deployment page at: frontend/app/deploy/page.tsx
You can:
1. Start the frontend: cd frontend && npm run dev
2. Navigate to http://localhost:3000/deploy
3. Connect your Leather wallet
4. The page will show your address

METHOD 4: Use Already-Deployed Contracts
─────────────────────────────────────────
Contracts are already deployed at:
- ST2P3Z4K0MQ0VAB0B4A4JHAQAK0P7Y4R7K1PGGR7Z.escrow
- ST2P3Z4K0MQ0VAB0B4A4JHAQAK0P7Y4R7K1PGGR7Z.remittance

Your frontend is already configured to use these. You can:
1. Use these contracts as-is
2. Connect your Leather wallet (ST33HZ...Y9E9TD) for signing transactions
3. The contracts will work with any wallet address

RECOMMENDATION:
───────────────
Since we can't find the derivation path for ST33HZ...Y9E9TD, I recommend:
1. Use the already-deployed contracts (they work!)
2. Connect your Leather wallet in the frontend for signing
3. The frontend will use your wallet address for transactions

This way you don't need to redeploy - just use what's already working!

`);
