"use client";

import { useState, useEffect } from "react";
import { getStacksNetwork } from "@/lib/utils/contract-helpers";
import { formatStx, microStxToStx } from "@/lib/stx";
import { useStxPrice } from "./use-stx-price";

/**
 * Hook to fetch and manage wallet balance.
 * Uses Stacks API to get STX balance for the connected address.
 */
export function useWalletBalance(address: string | null) {
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { price: stxPrice } = useStxPrice();

  useEffect(() => {
    if (!address) {
      setBalance(null);
      setError(null);
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const network = getStacksNetwork();
        // Use getAccountApiUrl if available, otherwise construct manually
        const apiUrl = typeof network.getAccountApiUrl === "function" 
          ? network.getAccountApiUrl(address)
          : `${network.coreApiUrl}/v2/accounts/${address}?proof=0`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch balance: ${response.statusText}`);
        }
        
        const data = await response.json();
        // Balance is returned in microSTX (1 STX = 1,000,000 microSTX)
        const balanceMicroStx = BigInt(data.balance || "0");
        setBalance(balanceMicroStx);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Failed to fetch balance";
        console.error("[useWalletBalance] Error:", errMsg);
        setError(errMsg);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(() => {
      void fetchBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [address]);

  // Calculate USD value
  const usdValue = balance !== null && stxPrice !== null
    ? microStxToStx(balance) * stxPrice
    : null;

  const usdValueFormatted = usdValue !== null
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(usdValue)
    : null;

  return {
    balance,
    balanceFormatted: balance !== null ? formatStx(balance) : null,
    usdValue,
    usdValueFormatted,
    loading,
    error,
  };
}
