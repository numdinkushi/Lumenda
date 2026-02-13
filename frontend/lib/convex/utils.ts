/**
 * Utility functions for Convex operations.
 * Provides helper functions for working with Convex data and transactions.
 */

import { getContractAddresses } from "@/config/contracts";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { isConvexConfigured } from "./client";
import type { Id } from "@/convex/_generated/dataModel";

type CreateTransactionArgs = {
  txId: string;
  transferId: number;
  transactionType: "initiate" | "complete" | "cancel";
  userAddress: string;
  contractAddress: string;
  contractName: string;
  network: "testnet" | "mainnet";
  status: "pending" | "success" | "abort_by_response" | "abort_by_post_condition";
  timestamp: number;
  blockHeight?: number;
  metadata?: {
    fee?: string;
    amount?: string;
    recipient?: string;
    sender?: string;
  };
};

type UpsertTransferArgs = {
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
  network: "testnet" | "mainnet";
  contractAddress: string;
};

type GetOrCreateUserArgs = {
  address: string;
  network: "testnet" | "mainnet";
};

type UpdateUserStatsArgs = {
  address: string;
  network: "testnet" | "mainnet";
  isSender: boolean;
  amount: string;
};

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
  // Always call useMutation unconditionally (React rules)
  const createTransactionMutation = useMutation(api.transactions.createTransaction);
  const { network, contractAddress, contractName } = getConvexNetworkInfo();
  const isConfigured = isConvexConfigured();

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
  ): Promise<Id<"transactions"> | null> => {
    if (!isConfigured) {
      // Convex not configured, skip
      return null;
    }
    const timestamp = Math.floor(Date.now() / 1000);

    return await createTransactionMutation({
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
    } as CreateTransactionArgs);
  };
}

/**
 * Sync transfer data from contract to Convex.
 * Call this to cache transfer data for faster access.
 */
export function useSyncTransfer() {
  // Always call useMutation unconditionally (React rules)
  const upsertTransferMutation = useMutation(api.transfers.upsertTransfer);
  const { network, contractAddress } = getConvexNetworkInfo();
  const isConfigured = isConvexConfigured();

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
  }): Promise<{ _id: Id<"transfers">; wasNew: boolean; statusChanged: boolean; previousStatus?: "pending" | "completed" | "cancelled" } | null> => {
    if (!isConfigured) {
      // Convex not configured, skip
      return null;
    }
    const result = await upsertTransferMutation({
      ...transfer,
      network,
      contractAddress,
    } as UpsertTransferArgs);
    return result as { _id: Id<"transfers">; wasNew: boolean; statusChanged: boolean; previousStatus?: "pending" | "completed" | "cancelled" };
  };
}

/**
 * Get or create user record in Convex.
 */
export function useGetOrCreateUser() {
  // Always call useMutation unconditionally (React rules)
  const getOrCreateUserMutation = useMutation(api.users.getOrCreateUser);
  const { network } = getConvexNetworkInfo();
  const isConfigured = isConvexConfigured();

  return async (address: string): Promise<Id<"users"> | null> => {
    if (!isConfigured) {
      // Convex not configured, skip
      return null;
    }
    return await getOrCreateUserMutation({
      address,
      network,
    } as GetOrCreateUserArgs);
  };
}

/**
 * Update user statistics when a transfer occurs.
 */
export function useUpdateUserStats() {
  // Always call useMutation unconditionally (React rules)
  const updateUserStatsMutation = useMutation(api.users.updateUserStats);
  const { network } = getConvexNetworkInfo();
  const isConfigured = isConvexConfigured();

  return async (
    address: string,
    isSender: boolean,
    amount: string
  ): Promise<Id<"users"> | null> => {
    if (!isConfigured) {
      // Convex not configured, skip
      return null;
    }
    return await updateUserStatsMutation({
      address,
      network,
      isSender,
      amount,
    } as UpdateUserStatsArgs);
  };
}

/**
 * Recalculate user statistics from transactions table.
 * This recalculates stats from scratch, useful for fixing inconsistencies.
 */
export function useRecalculateUserStats() {
  // Always call useMutation unconditionally (React rules)
  const recalculateMutation = useMutation(api.users.recalculateUserStats);
  const { network } = getConvexNetworkInfo();
  const isConfigured = isConvexConfigured();

  return async (address: string): Promise<Id<"users"> | null> => {
    if (!isConfigured) {
      return null;
    }
    return await recalculateMutation({
      address,
      network,
    });
  };
}
