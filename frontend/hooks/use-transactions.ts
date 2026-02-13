/**
 * React hooks for Convex transaction operations.
 * Provides easy access to transaction data and operations.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Get transaction by transaction ID.
 */
export function useTransaction(txId: string | null) {
  try {
    return useQuery(
      api.transactions.getTransactionByTxId,
      txId ? { txId } : "skip"
    );
  } catch {
    return undefined;
  }
}

/**
 * Get all transactions for a specific transfer.
 */
export function useTransferTransactions(transferId: number | null) {
  try {
    return useQuery(
      api.transactions.getTransactionsByTransferId,
      transferId !== null ? { transferId } : "skip"
    );
  } catch {
    return undefined;
  }
}

/**
 * Get transaction by transfer ID and type.
 */
export function useTransferTransaction(
  transferId: number | null,
  transactionType: "initiate" | "complete" | "cancel"
) {
  try {
    return useQuery(
      api.transactions.getTransactionByTransferAndType,
      transferId !== null
        ? { transferId, transactionType }
        : "skip"
    );
  } catch {
    return undefined;
  }
}

/**
 * Get all transactions for the current user.
 */
export function useUserTransactions(
  userAddress: string | null,
  transactionType?: "initiate" | "complete" | "cancel",
  limit?: number
) {
  try {
    return useQuery(
      api.transactions.getTransactionsByUser,
      userAddress
        ? { userAddress, transactionType, limit }
        : "skip"
    );
  } catch {
    return undefined;
  }
}

/**
 * Update transaction status (e.g., when a pending transaction confirms).
 */
export function useUpdateTransactionStatus() {
  try {
    return useMutation(api.transactions.updateTransactionStatus);
  } catch {
    return () => Promise.resolve();
  }
}

/**
 * Get initiate transaction for a transfer.
 */
export function useInitiateTransaction(transferId: number | null) {
  return useTransferTransaction(transferId, "initiate");
}

/**
 * Get complete transaction for a transfer.
 */
export function useCompleteTransaction(transferId: number | null) {
  return useTransferTransaction(transferId, "complete");
}

/**
 * Get cancel transaction for a transfer.
 */
export function useCancelTransaction(transferId: number | null) {
  return useTransferTransaction(transferId, "cancel");
}
