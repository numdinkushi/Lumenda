"use client";

import { useEffect, useState } from "react";
import { getFeeRate } from "@/lib/contracts";
import { isContractNotDeployedError } from "@/lib/utils/contract-errors";
import { toast } from "sonner";

const FEE_UNAVAILABLE_MSG =
  "Fee rate unavailable. The contract may still be indexing on the API — you can still try sending.";

/**
 * Simple hook to fetch and cache the fee rate.
 * Auto-loads on mount and provides refresh function.
 * On "contract not deployed" (Hiro API not indexed yet), we show a short message and still allow sending.
 */
export function useFeeRate() {
  const [feeRate, setFeeRate] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const rate = await getFeeRate();
      setFeeRate(rate);
      setError(null);
    } catch (err) {
      const isNotDeployed = isContractNotDeployedError(err);
      const shortMsg = isNotDeployed ? FEE_UNAVAILABLE_MSG : (err instanceof Error ? err.message : "Failed to load fee rate");
      setError(shortMsg);
      toast.error(shortMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return {
    feeRate,
    loading,
    error,
    refresh,
  };
}
