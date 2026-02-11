/**
 * Utility functions for Convex operations.
 * Provides helper functions for working with Convex data and transactions.
 */

import { getContractAddresses } from "@/config/contracts";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Get network and contract information for Convex operations.
 */
export function getConvexNetworkInfo() {
  const { network, contracts } = getContractAddresses();
  const [contractAddress, contractName] = contracts.remittance.split(".");

  return {
    network: network as "testnet" | "mainnet",
    contractAddress,
    contractName,
  };
}

/**
 * Create transaction record in Convex.
 * Call this immediately after a transaction is submitted to track it.
 */
export function useCreateTransaction() {
  const createTransaction = useMutation(api.transactions.createTransaction);
  const { network, contractAddress, contractName } = getConvexNetworkInfo();

  return async (
    txId: string,
    transferId: number,
    transactionType: "initiate" | "complete" | "cancel",
    userAddress: string,
    status: "pending" | "success" | "abort_by_response" | "abort_by_post_condition" = "pending",
    metadata?: {
      fee?: string;
      amount?: string;
      recipient?: string;
      sender?: string;
    }
  ) => {
    const timestamp = Math.floor(Date.now() / 1000);

    return await createTransaction({
      txId,
      transferId,
      transactionType,
      userAddress,
      contractAddress,
      contractName,
      network,
      status,
      timestamp,
      metadata,
    });
  };
}

/**
 * Sync transfer data from contract to Convex.
 * Call this to cache transfer data for faster access.
 */
export function useSyncTransfer() {
  const upsertTransfer = useMutation(api.transfers.upsertTransfer);
  const { network, contractAddress } = getConvexNetworkInfo();

  return async (transfer: {
    transferId: number;
    sender: string;
    recipient: string;
    amount: string;
    fee: string;
    totalAmount: string;
    status: "pending" | "completed" | "cancelled";
    createdAt: number;
    completedAt?: number;
    cancelledAt?: number;
  }) => {
    return await upsertTransfer({
      ...transfer,
      network,
      contractAddress,
    });
  };
}

/**
 * Get or create user record in Convex.
 */
export function useGetOrCreateUser() {
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const { network } = getConvexNetworkInfo();

  return async (address: string) => {
    return await getOrCreateUser({
      address,
      network,
    });
  };
}

/**
 * Update user statistics when a transfer occurs.
 */
export function useUpdateUserStats() {
  const updateUserStats = useMutation(api.users.updateUserStats);
  const { network } = getConvexNetworkInfo();

  return async (
    address: string,
    isSender: boolean,
    amount: string
  ) => {
    return await updateUserStats({
      address,
      network,
      isSender,
      amount,
    });
  };
}
