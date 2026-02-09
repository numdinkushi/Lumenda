/**
 * Contract-related constants derived from config.
 * Single source for RPC URL, explorer URL, and network labels used across contract utils.
 */

import { getContractAddresses } from "@/config/contracts";

/** RPC base URL for the current network (Hiro API). */
export function getRpcUrl(): string {
  return getContractAddresses().rpcUrl;
}

/** Explorer base URL for the current network. */
export function getExplorerUrl(): string {
  return getContractAddresses().explorerUrl;
}

/** Current network name for display or API params. */
export function getNetworkName(): "testnet" | "mainnet" {
  return getContractAddresses().network;
}
