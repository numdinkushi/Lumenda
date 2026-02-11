/**
 * React hooks for Convex transaction operations.
 * Provides easy access to transaction data and operations.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getConvexNetworkInfo } from "@/lib/convex/utils";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Get transaction by transaction ID.
 */
export function useTransaction(txId: string | null) {
  return useQuery(
    api.transactions.getTransactionByTxId,
    txId ? { txId } : "skip"
  );
}

/**
 * Get all transactions for a specific transfer.
 */
export function useTransferTransactions(transferId: number | null) {
  return useQuery(
    api.transactions.getTransactionsByTransferId,
    transferId !== null ? { transferId } : "skip"
  );
}

/**
 * Get transaction by transfer ID and type.
 */
export function useTransferTransaction(
  transferId: number | null,
  transactionType: "initiate" | "complete" | "cancel"
) {
  return useQuery(
    api.transactions.getTransactionByTransferAndType,
    transferId !== null
      ? { transferId, transactionType }
      : "skip"
  );
}

/**
 * Get all transactions for the current user.
 */
export function useUserTransactions(
  userAddress: string | null,
  transactionType?: "initiate" | "complete" | "cancel",
  limit?: number
) {
  return useQuery(
    api.transactions.getTransactionsByUser,
    userAddress
      ? { userAddress, transactionType, limit }
      : "skip"
  );
}

/**
 * Update transaction status (e.g., when a pending transaction confirms).
 */
export function useUpdateTransactionStatus() {
  return useMutation(api.transactions.updateTransactionStatus);
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
