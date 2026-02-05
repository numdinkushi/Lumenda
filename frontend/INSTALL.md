# Installation Required

## Build Error: Module not found '@stacks/connect'

If you're seeing this error, you need to install the dependencies:

```bash
cd lumenda/frontend
npm install
```

This will install `@stacks/connect` and all other dependencies listed in `package.json`.

## After Installation

1. **Install a Stacks wallet extension:**
   - [Leather Wallet](https://leather.io/) (recommended)
   - [Hiro Wallet](https://www.hiro.so/wallet)

2. **Run the dev server:**
   ```bash
   npm run dev
   ```

3. **Test wallet connection:**
   - Click "Connect wallet" button
   - Wallet extension should open
   - Select an account
   - Address should appear in header

## Troubleshooting

- **Build still fails:** Make sure `node_modules` exists and contains `@stacks/connect`
- **Modal doesn't appear:** Check browser console for errors, ensure wallet extension is installed
- **"Package not found" error:** Run `npm install` again
