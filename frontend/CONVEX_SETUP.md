# Convex Setup Guide

This project uses Convex for reliable transaction tracking and history management.

## Initial Setup

1. **Install Convex CLI** (if not already installed):
   ```bash
   npm install -g convex
   ```

2. **Login to Convex**:
   ```bash
   npx convex dev
   ```
   This will prompt you to login and create a new deployment if needed.

3. **Configure Environment Variables**:
   
   Add to your `.env` file (root):
   ```env
   CONVEX_DEPLOYMENT=your-deployment-name
   ```
   
   Add to your `frontend/.env` file:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```
   
   The Convex URL will be shown in the Convex dashboard after running `npx convex dev`.

4. **Start Convex Development Server**:
   ```bash
   cd frontend
   npx convex dev
   ```
   
   This will:
   - Generate the `_generated` API files
   - Watch for schema changes
   - Sync your functions to Convex

5. **Start Next.js Development Server**:
   ```bash
   npm run dev
   ```

## Schema

The Convex schema includes three main tables:

- **transactions**: Tracks blockchain transaction IDs linked to transfer IDs
- **transfers**: Caches transfer data from the contract for fast access
- **users**: Tracks user activity and statistics

## Usage

### Tracking Transactions

When a transaction is submitted, use the `useCreateTransaction` hook:

```typescript
import { useCreateTransaction } from "@/lib/convex/utils";

const createTransaction = useCreateTransaction();

// After transaction is submitted
await createTransaction(
  txId,           // Transaction ID from blockchain
  transferId,     // Transfer ID from contract
  "initiate",     // Transaction type
  userAddress,    // User's address
  "pending",      // Initial status
  {               // Optional metadata
    amount: "1000000",
    fee: "10000",
    recipient: recipientAddress
  }
);
```

### Querying Transactions

Use the hooks in `hooks/use-transactions.ts`:

```typescript
import { useTransferTransactions } from "@/hooks/use-transactions";

// Get all transactions for a transfer
const transactions = useTransferTransactions(transferId);
```

### Syncing Transfers

To cache transfer data from the contract:

```typescript
import { useSyncTransfer } from "@/lib/convex/utils";

const syncTransfer = useSyncTransfer();

await syncTransfer({
  transferId: 1,
  sender: "ST...",
  recipient: "ST...",
  amount: "1000000",
  fee: "10000",
  totalAmount: "1010000",
  status: "pending",
  createdAt: 1234567890
});
```

## Notes

- The `_generated` folder is automatically created by Convex - don't edit these files
- Schema changes require running `npx convex dev` to regenerate types
- All Convex functions run server-side and cannot import client-side code
- Network and contract info must be passed as parameters to Convex functions
