/**
 * Utilities for fetching transaction IDs and details from the blockchain.
 * Used to enrich transfer history with actual transaction IDs.
 */

import { getContractAddresses } from "@/config/contracts";

export interface TransactionInfo {
  txId: string;
  txStatus: "success" | "abort_by_response" | "abort_by_post_condition" | "pending";
  blockHeight: number;
  timestamp: number;
  functionName: string;
}

/**
 * Fetch recent contract call transactions for an address.
 * Returns transactions that called the remittance contract.
 */
export async function fetchRecentTransactions(
  address: string,
  limit: number = 50
): Promise<TransactionInfo[]> {
  const { network, rpcUrl } = getContractAddresses();
  const { contracts } = getContractAddresses();
  const remittanceContract = contracts.remittance;
  const [contractAddress, contractName] = remittanceContract.split(".");

  try {
    // Query transactions for this address
    const url = `${rpcUrl}/extended/v1/address/${address}/transactions?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch transactions: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const transactions: TransactionInfo[] = [];

    for (const tx of data.results || []) {
      // Only include contract calls to our remittance contract
      if (
        tx.tx_type === "contract_call" &&
        tx.contract_call?.contract_id === remittanceContract
      ) {
        const functionName = tx.contract_call?.function_name || "unknown";
        transactions.push({
          txId: tx.tx_id,
          txStatus: tx.tx_status || "pending",
          blockHeight: tx.block_height || 0,
          timestamp: tx.burn_block_time || 0,
          functionName,
        });
      }
    }

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

/**
 * Find transaction IDs for a specific transfer by matching function calls.
 * This is approximate - we match by function name and approximate timing.
 */
export async function findTransactionsForTransfer(
  address: string,
  transferId: number,
  createdAt: number
): Promise<{
  initiateTxId?: string;
  completeTxId?: string;
  cancelTxId?: string;
}> {
  const transactions = await fetchRecentTransactions(address, 100);
  const result: {
    initiateTxId?: string;
    completeTxId?: string;
    cancelTxId?: string;
  } = {};

  // Find transactions around the creation time (within 10 blocks/transactions)
  for (const tx of transactions) {
    const timeDiff = Math.abs(tx.timestamp - createdAt * 1000);
    const isRelevant = timeDiff < 600000; // Within 10 minutes

    if (isRelevant) {
      if (tx.functionName === "initiate-transfer" && !result.initiateTxId) {
        // Check if the function args match this transfer ID (approximate)
        result.initiateTxId = tx.txId;
      } else if (tx.functionName === "complete-transfer" && !result.completeTxId) {
        result.completeTxId = tx.txId;
      } else if (tx.functionName === "cancel-transfer" && !result.cancelTxId) {
        result.cancelTxId = tx.txId;
      }
    }
  }

  return result;
}
