/**
 * Utilities for checking transaction status on the blockchain.
 * Used to update Convex records when transactions confirm.
 */

import { getContractAddresses } from "@/config/contracts";

export interface TransactionStatus {
  txId: string;
  status: "pending" | "success" | "abort_by_response" | "abort_by_post_condition";
  blockHeight?: number;
  timestamp?: number;
}

/**
 * Fetch transaction status from the Stacks API.
 * @param txId - Transaction ID to check
 * @returns Transaction status or null if not found
 */
export async function fetchTransactionStatus(txId: string): Promise<TransactionStatus | null> {
  try {
    const { rpcUrl } = getContractAddresses();
    const url = `${rpcUrl}/extended/v1/tx/${txId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        // Transaction not found yet (still pending)
        return { txId, status: "pending" };
      }
      throw new Error(`Failed to fetch transaction: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map Stacks API status to our status format
    let status: TransactionStatus["status"] = "pending";
    if (data.tx_status === "success") {
      status = "success";
    } else if (data.tx_status === "abort_by_response") {
      status = "abort_by_response";
    } else if (data.tx_status === "abort_by_post_condition") {
      status = "abort_by_post_condition";
    }

    return {
      txId,
      status,
      blockHeight: data.block_height || undefined,
      timestamp: data.burn_block_time || undefined,
    };
  } catch (error) {
    console.error("Error fetching transaction status:", error);
    return null;
  }
}

/**
 * Check and update transaction status for multiple transactions.
 * @param txIds - Array of transaction IDs to check
 * @returns Map of txId to TransactionStatus
 */
export async function fetchMultipleTransactionStatuses(
  txIds: string[]
): Promise<Map<string, TransactionStatus>> {
  const results = new Map<string, TransactionStatus>();
  
  // Fetch all in parallel
  const promises = txIds.map(async (txId) => {
    const status = await fetchTransactionStatus(txId);
    if (status) {
      results.set(txId, status);
    }
  });

  await Promise.all(promises);
  return results;
}
