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
  let createTransaction: ((args: any) => Promise<any>) | null = null;
  try {
    createTransaction = useMutation(api.transactions.createTransaction);
  } catch {
    // Convex not configured or provider not available
    createTransaction = null;
  }
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
    if (!createTransaction) {
      // Convex not configured, skip
      return null;
    }
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
  let upsertTransfer: ((args: any) => Promise<any>) | null = null;
  try {
    upsertTransfer = useMutation(api.transfers.upsertTransfer);
  } catch {
    // Convex not configured or provider not available
    upsertTransfer = null;
  }
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
    if (!upsertTransfer) {
      // Convex not configured, skip
      return null;
    }
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
  let getOrCreateUser: ((args: any) => Promise<any>) | null = null;
  try {
    getOrCreateUser = useMutation(api.users.getOrCreateUser);
  } catch {
    // Convex not configured or provider not available
    getOrCreateUser = null;
  }
  const { network } = getConvexNetworkInfo();

  return async (address: string) => {
    if (!getOrCreateUser) {
      // Convex not configured, skip
      return null;
    }
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
  let updateUserStats: ((args: any) => Promise<any>) | null = null;
  try {
    updateUserStats = useMutation(api.users.updateUserStats);
  } catch {
    // Convex not configured or provider not available
    updateUserStats = null;
  }
  const { network } = getConvexNetworkInfo();

  return async (
    address: string,
    isSender: boolean,
    amount: string
  ) => {
    if (!updateUserStats) {
      // Convex not configured, skip
      return null;
    }
    return await updateUserStats({
      address,
      network,
      isSender,
      amount,
    });
  };
}
