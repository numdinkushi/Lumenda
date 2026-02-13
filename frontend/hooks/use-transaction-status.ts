/**
 * Hook for checking and updating transaction status.
 * Polls the blockchain to update transaction status in Convex.
 */

import { useEffect, useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { fetchTransactionStatus } from "@/lib/utils/transaction-status";

/**
 * Hook to check and update a single transaction status from blockchain.
 */
export function useCheckAndUpdateTransactionStatus() {
  let updateStatus: ((args: any) => Promise<any>) | null = null;
  try {
    updateStatus = useMutation(api.transactions.updateTransactionStatus);
  } catch {
    // Convex not configured or provider not available
    updateStatus = null;
  }
  const [isUpdating, setIsUpdating] = useState(false);

  const checkAndUpdate = useCallback(
    async (txId: string) => {
      if (isUpdating || !updateStatus) return;
      
      setIsUpdating(true);
      try {
        const status = await fetchTransactionStatus(txId);
        if (status && status.status !== "pending") {
          await updateStatus({
            txId: status.txId,
            status: status.status,
            blockHeight: status.blockHeight,
          });
          return status;
        }
        return null;
      } catch (error) {
        console.error("Failed to update transaction status:", error);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateStatus, isUpdating]
  );

  return { checkAndUpdate, isUpdating };
}

/**
 * Hook to poll and update transaction status periodically.
 * Useful for pending transactions that need status updates.
 */
export function usePollTransactionStatus(txId: string | null, enabled = true) {
  const { checkAndUpdate } = useCheckAndUpdateTransactionStatus();
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!txId || !enabled) return;

    // Check immediately
    checkAndUpdate(txId).then((status) => {
      if (status) {
        setLastStatus(status.status);
      }
    });

    // Poll every 10 seconds if still pending
    const interval = setInterval(async () => {
      const status = await checkAndUpdate(txId);
      if (status) {
        setLastStatus(status.status);
        if (status.status !== "pending") {
          // Stop polling once confirmed or failed
          clearInterval(interval);
        }
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [txId, enabled, checkAndUpdate]);

  return { lastStatus };
}

/**
 * Hook to check and update multiple pending transactions.
 */
export function useUpdatePendingTransactions() {
  let updateStatus: ((args: any) => Promise<any>) | null = null;
  try {
    updateStatus = useMutation(api.transactions.updateTransactionStatus);
  } catch {
    // Convex not configured or provider not available
    updateStatus = null;
  }
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePending = useCallback(
    async (txIds: string[]) => {
      if (isUpdating || txIds.length === 0 || !updateStatus) return [];
      
      setIsUpdating(true);
      try {
        const updates = await Promise.all(
          txIds.map(async (txId) => {
            const status = await fetchTransactionStatus(txId);
            if (status && status.status !== "pending") {
              await updateStatus({
                txId: status.txId,
                status: status.status,
                blockHeight: status.blockHeight,
              });
              return { txId, status: status.status };
            }
            return null;
          })
        );

        const successful = updates.filter((u) => u !== null);
        if (successful.length > 0) {
          console.log(`Updated ${successful.length} transaction(s)`, successful);
        }
        
        return successful;
      } catch (error) {
        console.error("Failed to update pending transactions:", error);
        return [];
      } finally {
        setIsUpdating(false);
      }
    },
    [updateStatus, isUpdating]
  );

  return { updatePending, isUpdating };
}
