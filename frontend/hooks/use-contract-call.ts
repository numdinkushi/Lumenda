"use client";

import { useCallback, useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import type { ContractCallParams } from "@/lib/contracts";
import { toast } from "sonner";

/**
 * Hook for executing contract calls via wallet.
 * Handles loading state and error handling.
 */
export function useContractCall() {
  const { requestContractCall } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (params: ContractCallParams): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        const txId = await requestContractCall(params);
        if (txId) {
          setError(null);
          return txId;
        }
        // Null = user cancelled or wallet rejected (e.g. "Not a valid contract")
        const msg =
          "Transaction was not sent. If Leather shows \"Not a valid contract\", switch Leather to Testnet (Settings → Network).";
        setError(msg);
        toast.error(msg);
        return null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        const isUserRejection = /rejected|denied|cancel|user said no/i.test(msg);
        setError(msg);
        if (isUserRejection) {
          toast.info("Transaction cancelled");
        } else {
          toast.error(msg);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [requestContractCall]
  );

  return {
    execute,
    loading,
    error,
  };
}
