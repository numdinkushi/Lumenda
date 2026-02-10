/**
 * Wallet session storage keys and helpers.
 * Single source of truth for persisted wallet state.
 */

const PREFIX = "lumenda:wallet";

export const WALLET_ADDRESS_KEY = `${PREFIX}:address`;

/**
 * Validate that an address is a Stacks address (starts with ST).
 * This app is Stacks-only, so we reject BTC addresses (tb1..., bc1..., etc.).
 */
function isValidStacksAddress(address: string): boolean {
  return typeof address === "string" && address.length > 0 && address.startsWith("ST");
}

/**
 * Clear any invalid addresses from storage (call on app init).
 * Clears addresses that look like placeholders/dummies or are not Stacks addresses.
 */
export function clearPlaceholderAddresses(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const value = storage.getItem(WALLET_ADDRESS_KEY);
    if (value) {
      // Check for placeholder patterns (not real addresses)
      const upperValue = value.toUpperCase();
      if (
        upperValue.includes("PLACEHOLDER") ||
        upperValue.includes("DUMMY") ||
        upperValue.includes("TEST") ||
        !isValidStacksAddress(value)
      ) {
        storage.removeItem(WALLET_ADDRESS_KEY);
        console.log("[wallet/storage] Cleared invalid address (not a Stacks address):", value);
      }
    }
  } catch (err) {
    console.error("[wallet/storage] Error clearing placeholder:", err);
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStoredAddress(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const value = storage.getItem(WALLET_ADDRESS_KEY);
    if (!value || value.length === 0) return null;
    // Filter out placeholders and non-Stacks addresses (this app is Stacks-only)
    const upperValue = value.toUpperCase();
    if (upperValue.includes("PLACEHOLDER") || upperValue.includes("DUMMY")) {
      storage.removeItem(WALLET_ADDRESS_KEY);
      return null;
    }
    // Reject non-Stacks addresses (e.g. BTC addresses like tb1..., bc1...)
    if (!isValidStacksAddress(value)) {
      console.warn("[wallet/storage] Stored address is not a Stacks address, clearing:", value);
      storage.removeItem(WALLET_ADDRESS_KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function setStoredAddress(address: string | null): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    if (address) {
      // Filter out placeholders
      const upperValue = address.toUpperCase();
      if (upperValue.includes("PLACEHOLDER") || upperValue.includes("DUMMY")) {
        console.warn("[wallet/storage] Attempted to save placeholder address, ignoring");
        return;
      }
      // Reject non-Stacks addresses (this app is Stacks-only)
      if (!isValidStacksAddress(address)) {
        console.error("[wallet/storage] Attempted to save non-Stacks address (this app requires STX), ignoring:", address);
        return;
      }
      storage.setItem(WALLET_ADDRESS_KEY, address);
    } else {
      storage.removeItem(WALLET_ADDRESS_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Clear all wallet storage (useful for debugging).
 * Exposed on window for manual clearing via console.
 */
export function clearAllWalletStorage(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(WALLET_ADDRESS_KEY);
    console.log("[wallet/storage] Cleared all wallet storage");
  } catch (err) {
    console.error("[wallet/storage] Error clearing storage:", err);
  }
}

// Expose to window for debugging (only in development)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as { lumenda?: { clearWallet?: () => void } }).lumenda = {
    clearWallet: clearAllWalletStorage,
  };
}
