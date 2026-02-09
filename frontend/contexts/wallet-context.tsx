"use client";

import * as React from "react";
import { useStacksWallet } from "@/hooks/use-stacks-wallet";
import type { ContractCallParams } from "@/lib/contracts";

export type WalletContextValue = {
  isConnected: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
  /** Request wallet to sign and broadcast a contract call. Returns txid or null. */
  requestContractCall: (params: ContractCallParams) => Promise<string | null>;
  /** True while connect is in progress */
  isConnecting: boolean;
  /** Last connect error; clear when user retries */
  connectError: string | null;
};

const WalletContext = React.createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useStacksWallet();

  const connect = React.useCallback(() => {
    void wallet.connect();
  }, [wallet]);

  const disconnect = React.useCallback(() => {
    void wallet.disconnect();
  }, [wallet]);

  const value = React.useMemo<WalletContextValue>(
    () => ({
      isConnected: wallet.isConnected,
      address: wallet.address,
      connect,
      disconnect,
      requestContractCall: wallet.requestContractCall,
      isConnecting: wallet.isConnecting,
      connectError: wallet.connectError,
    }),
    [
      wallet.isConnected,
      wallet.address,
      wallet.isConnecting,
      wallet.connectError,
      wallet.requestContractCall,
      connect,
      disconnect,
    ]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = React.useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
}
