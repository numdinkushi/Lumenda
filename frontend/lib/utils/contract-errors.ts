/**
 * Contract error utilities for handling common contract-related errors.
 */

/** User-facing message when a network error is detected */
export const NETWORK_ERROR_MESSAGE =
  "Network error. Check your connection and try again.";

/**
 * Check if an error is due to network failure (no response, timeout, CORS, etc.).
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const m = error.message;
  return (
    m.includes("Network error") ||
    m.includes("Failed to fetch") ||
    m.includes("Network request failed") ||
    m.includes("Load failed") ||
    m.includes("ECONNREFUSED") ||
    m.includes("ETIMEDOUT") ||
    m.includes("ENOTFOUND") ||
    m.includes("ERR_NETWORK") ||
    m.includes("ERR_CONNECTION")
  );
}

/**
 * Normalize a caught fetch/network error into a user-facing Error.
 */
export function toNetworkError(cause: unknown, context?: string): Error {
  const prefix = context ? `[${context}] ` : "";
  if (cause instanceof TypeError && cause.message.includes("fetch")) {
    return new Error(`${prefix}${NETWORK_ERROR_MESSAGE}`);
  }
  if (cause instanceof Error) {
    if (isNetworkError(cause)) return cause;
    return new Error(`${prefix}${NETWORK_ERROR_MESSAGE} (${cause.message})`);
  }
  return new Error(`${prefix}${NETWORK_ERROR_MESSAGE}`);
}

/**
 * Check if an error indicates the contract is not deployed.
 * Includes Hiro API errors when contract not indexed (source/interface).
 */
export function isContractNotDeployedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const m = error.message;
  return (
    m.includes("Contract not deployed") ||
    m.includes("NoSuchContract") ||
    m.includes("No contract source data found") ||
    m.includes("No contract interface data found") ||
    m.includes("No such file or directory")
  );
}

/**
 * Extract contract name from deployment error message
 */
export function getContractNameFromError(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const match = error.message.match(/Contract not deployed: ([^.]+)/);
  return match ? match[1] : null;
}

/**
 * Check if an error is a contract-related error that should be handled gracefully
 */
export function isContractError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("contract not deployed") ||
    message.includes("nosuchcontract") ||
    message.includes("read-only call failed")
  );
}
