/**
 * React hooks for Convex transfer operations.
 * Provides easy access to transfer data cached in Convex.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Get transfer by transfer ID.
 */
export function useTransfer(transferId: number | null) {
  return useQuery(
    api.transfers.getTransfer,
    transferId !== null ? { transferId } : "skip"
  );
}

/**
 * Get all transfers for a user (as sender or recipient).
 */
export function useUserTransfers(
  userAddress: string | null,
  status?: "pending" | "completed" | "cancelled",
  limit?: number
) {
  return useQuery(
    api.transfers.getTransfersByUser,
    userAddress ? { userAddress, status, limit } : "skip"
  );
}

/**
 * Get pending transfers for a user (as recipient).
 */
export function usePendingTransfers(userAddress: string | null) {
  return useQuery(
    api.transfers.getPendingTransfersForUser,
    userAddress ? { userAddress } : "skip"
  );
}

/**
 * Get transfers by status.
 */
export function useTransfersByStatus(
  status: "pending" | "completed" | "cancelled",
  limit?: number
) {
  return useQuery(api.transfers.getTransfersByStatus, { status, limit });
}

/**
 * Sync transfer from contract to Convex.
 */
export function useSyncTransfer() {
  return useMutation(api.transfers.upsertTransfer);
}
