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
  try {
    return useQuery(
      api.users.getUser,
      address ? { address, network } : "skip"
    );
  } catch {
    return undefined;
  }
}

/**
 * Get or create user record.
 */
export function useGetOrCreateUser() {
  let getOrCreateUser: ((args: any) => Promise<any>) | null = null;
  try {
    getOrCreateUser = useMutation(api.users.getOrCreateUser);
  } catch {
    getOrCreateUser = null;
  }
  const { network } = getConvexNetworkInfo();

  return async (address: string) => {
    if (!getOrCreateUser) {
      return null;
    }
    return await getOrCreateUser({ address, network });
  };
}

/**
 * Update user statistics.
 */
export function useUpdateUserStats() {
  let updateUserStats: ((args: any) => Promise<any>) | null = null;
  try {
    updateUserStats = useMutation(api.users.updateUserStats);
  } catch {
    updateUserStats = null;
  }
  const { network } = getConvexNetworkInfo();

  return async (
    address: string,
    isSender: boolean,
    amount: string
  ) => {
    if (!updateUserStats) {
      return null;
    }
    return await updateUserStats({ address, network, isSender, amount });
  };
}
