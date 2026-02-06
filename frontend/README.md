# Lumenda Frontend

Remittance application frontend built with Next.js, React, and Stacks Connect.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

   **Important:** If you get "Module not found: Can't resolve '@stacks/connect'" error, make sure to run `npm install` to install all dependencies including `@stacks/connect`.

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and set:
   - `NEXT_PUBLIC_STACKS_NETWORK=testnet` (or `mainnet`)
   - `NEXT_PUBLIC_STACKS_DEPLOYER_ADDRESS=ST2P3Z4K0MQ0VAB0B4A4JHAQAK0P7Y4R7K1PGGR7Z` (your deployer address)

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Install a Stacks wallet extension:**
   - [Leather Wallet](https://leather.io/) (recommended)
   - [Hiro Wallet](https://www.hiro.so/wallet)

## Wallet Connection

The app uses `@stacks/connect` v8+ for wallet integration. When you click "Connect wallet", it will:
1. Show a modal/popup from your wallet extension
2. Allow you to select an account
3. Store the address for the session

If the modal doesn't appear:
- Make sure `@stacks/connect` is installed: `npm install @stacks/connect`
- Check browser console for errors
- Ensure a wallet extension (Leather or Hiro) is installed

## Project Structure

- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Utilities and helpers
  - `wallet/` - Wallet connection logic (`stacks-connect.ts`, `storage.ts`)
  - `remittance-contracts.ts` - Contract read/write helpers
  - `stx.ts` - STX amount conversion utilities
- `hooks/` - Custom React hooks
- `contexts/` - React contexts (wallet state)
- `config/` - Contract addresses and ABIs

## Building

```bash
npm run build
```

Make sure all dependencies are installed before building.
