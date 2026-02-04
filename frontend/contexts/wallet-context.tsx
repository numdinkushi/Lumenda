"use client";

import * as React from "react";

type WalletContextValue = {
  isConnected: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
};

const WalletContext = React.createContext<WalletContextValue | null>(null);

const PLACEHOLDER_ADDRESS = "ST2P3Z4K0MQ0VAB0B4A4JHAQAK0P7Y4R7K1PGGR7Z";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [address, setAddress] = React.useState<string | null>(null);

  const connect = React.useCallback(() => {
    setIsConnected(true);
    setAddress(PLACEHOLDER_ADDRESS);
  }, []);

  const disconnect = React.useCallback(() => {
    setIsConnected(false);
    setAddress(null);
  }, []);

  const value = React.useMemo<WalletContextValue>(
    () => ({ isConnected, address, connect, disconnect }),
    [isConnected, address, connect, disconnect]
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
