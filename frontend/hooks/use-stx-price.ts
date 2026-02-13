"use client";

import { useState, useEffect } from "react";

/**
 * Hook to fetch STX price in USD.
 * Uses CoinGecko API for price data.
 */
export function useStxPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      setLoading(true);
      setError(null);
      try {
        // CoinGecko API for STX price
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd"
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch price: ${response.statusText}`);
        }
        
        const data = await response.json();
        const stxPrice = data.blockstack?.usd;
        
        if (typeof stxPrice === "number") {
          setPrice(stxPrice);
        } else {
          throw new Error("Invalid price data");
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Failed to fetch price";
        console.error("[useStxPrice] Error:", errMsg);
        setError(errMsg);
        setPrice(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchPrice();

    // Refresh price every 5 minutes
    const interval = setInterval(() => {
      void fetchPrice();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    price,
    loading,
    error,
  };
}
