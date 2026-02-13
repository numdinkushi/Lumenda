/**
 * React hooks for Convex user operations.
 * Provides easy access to user data and statistics.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getConvexNetworkInfo } from "@/lib/convex/utils";
import { isConvexConfigured } from "@/lib/convex/client";
import type { Id } from "@/convex/_generated/dataModel";

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
 * Get user by address.
 */
export function useUser(address: string | null) {
  const { network } = getConvexNetworkInfo();
  const isConfigured = isConvexConfigured();
  // Always call useQuery unconditionally (React rules)
  const queryResult = useQuery(
    api.users.getUser,
    isConfigured && address ? { address, network } : "skip"
  );
  return isConfigured ? queryResult : undefined;
}

/**
 * Get or create user record.
 */
export function useGetOrCreateUser() {
  // Always call useMutation unconditionally (React rules)
  const getOrCreateUserMutation = useMutation(api.users.getOrCreateUser);
  const { network } = getConvexNetworkInfo();
  const isConfigured = isConvexConfigured();

  return async (address: string): Promise<Id<"users"> | null> => {
    if (!isConfigured) {
      return null;
    }
    return await getOrCreateUserMutation({ address, network } as GetOrCreateUserArgs);
  };
}

/**
 * Update user statistics.
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
      return null;
    }
    return await updateUserStatsMutation({ address, network, isSender, amount } as UpdateUserStatsArgs);
  };
}
