/**
 * Wallet session storage keys and helpers.
 * Single source of truth for persisted wallet state.
 */

const PREFIX = "lumenda:wallet";

export const WALLET_ADDRESS_KEY = `${PREFIX}:address`;

/**
 * Clear any invalid addresses from storage (call on app init).
 * Only clears addresses that look like placeholders/dummies.
 */
export function clearPlaceholderAddresses(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const value = storage.getItem(WALLET_ADDRESS_KEY);
    if (value) {
      // Check for placeholder patterns (not real addresses)
      const upperValue = value.toUpperCase();
      if (upperValue.includes("PLACEHOLDER") || upperValue.includes("DUMMY") || upperValue.includes("TEST")) {
        storage.removeItem(WALLET_ADDRESS_KEY);
        console.log("[wallet/storage] Cleared placeholder-like address:", value);
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
    // Only filter out obvious placeholders
    const upperValue = value.toUpperCase();
    if (upperValue.includes("PLACEHOLDER") || upperValue.includes("DUMMY")) {
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
      // Only filter out obvious placeholders
      const upperValue = address.toUpperCase();
      if (upperValue.includes("PLACEHOLDER") || upperValue.includes("DUMMY")) {
        console.warn("[wallet/storage] Attempted to save placeholder address, ignoring");
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
