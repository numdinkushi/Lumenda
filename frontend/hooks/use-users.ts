/**
 * React hooks for Convex user operations.
 * Provides easy access to user data and statistics.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getConvexNetworkInfo } from "@/lib/convex/utils";

/**
 * Get user by address.
 */
export function useUser(address: string | null) {
  const { network } = getConvexNetworkInfo();

  return useQuery(
    api.users.getUser,
    address ? { address, network } : "skip"
  );
}

/**
 * Get or create user record.
 */
export function useGetOrCreateUser() {
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const { network } = getConvexNetworkInfo();

  return async (address: string) => {
    return await getOrCreateUser({ address, network });
  };
}

/**
 * Update user statistics.
 */
export function useUpdateUserStats() {
  const updateUserStats = useMutation(api.users.updateUserStats);
  const { network } = getConvexNetworkInfo();

  return async (
    address: string,
    isSender: boolean,
    amount: string
  ) => {
    return await updateUserStats({ address, network, isSender, amount });
  };
}
