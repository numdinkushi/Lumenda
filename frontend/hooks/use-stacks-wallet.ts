"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContractCallParams } from "@/lib/remittance-contracts";
import {
  connectWallet,
  disconnectWallet,
  getCachedAddress,
  requestContractCall as requestContractCallLib,
} from "@/lib/wallet";
import { clearPlaceholderAddresses } from "@/lib/wallet/storage";

export interface UseStacksWalletResult {
  /** Whether an address is set (from current connect or cache) */
  isConnected: boolean;
  /** Current Stacks address or null */
  address: string | null;
  /** True while connect() is in progress */
  isConnecting: boolean;
  /** Last connect error message, cleared on next connect attempt */
  connectError: string | null;
  /** Open wallet connection flow. On success, address is set. */
  connect: () => Promise<void>;
  /** Disconnect and clear address */
  disconnect: () => Promise<void>;
  /** Request wallet to sign and broadcast a contract call. Returns txid or null. */
  requestContractCall: (params: ContractCallParams) => Promise<string | null>;
}

/**
 * Hook for Stacks wallet connection and contract calls.
 * Restores address from storage on mount so session persists across reloads.
 */
export function useStacksWallet(): UseStacksWalletResult {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Restore address from @stacks/connect localStorage on mount
  useEffect(() => {
    // Clear any invalid placeholders first
    clearPlaceholderAddresses();
    
    // Try to get address from @stacks/connect's localStorage
    const restoreAddress = async () => {
      try {
        // First try our own cache
        const cached = getCachedAddress();
        if (cached) {
          console.log("[useStacksWallet] Restored address from our cache:", cached);
          setAddress(cached);
          return;
        }

        // Then try @stacks/connect's getLocalStorage() if package is installed
        try {
          const { getConnectModule } = await import("@/lib/wallet/stacks-connect");
          const connectModule = await getConnectModule();
          const mod = connectModule as { getLocalStorage?: () => { addresses?: { stx?: Array<{ address: string }> } } | null };
          if (typeof mod.getLocalStorage === "function") {
            const userData = mod.getLocalStorage();
            if (userData?.addresses?.stx && userData.addresses.stx.length > 0) {
              const addr = userData.addresses.stx[0].address;
              console.log("[useStacksWallet] Restored address from @stacks/connect:", addr);
              setAddress(addr);
              const { setStoredAddress } = await import("@/lib/wallet/storage");
              setStoredAddress(addr);
              return;
            }
          }
        } catch (err) {
          // Package not installed - silently continue, error will show when user tries to connect
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("@stacks/connect")) {
            console.warn("[useStacksWallet] @stacks/connect not installed - install with: npm install @stacks/connect");
          }
        }

        console.log("[useStacksWallet] No cached address found - user needs to connect");
        setAddress(null);
      } catch (err) {
        console.warn("[useStacksWallet] Error restoring address:", err);
        setAddress(null);
      }
    };

    void restoreAddress();
  }, []);

  const connect = useCallback(async () => {
    setConnectError(null);
    setIsConnecting(true);
    try {
      const result = await connectWallet();
      if (result && result.address) {
        setAddress(result.address);
        setConnectError(null);
      } else {
        setConnectError("Could not get address from wallet. Please try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setConnectError(message);
      console.error("[useStacksWallet] connect error:", err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setAddress(null);
    setConnectError(null);
  }, []);

  const requestContractCall = useCallback(
    async (params: ContractCallParams): Promise<string | null> => {
      return requestContractCallLib(params);
    },
    []
  );

  return {
    isConnected: !!address,
    address,
    isConnecting,
    connectError,
    connect,
    disconnect,
    requestContractCall,
  };
}
