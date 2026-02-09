"use client";

import { useCallback, useState } from "react";
import { getEscrowInfo, type EscrowInfo } from "@/lib/contracts";
import { toast } from "sonner";

/**
 * Hook for escrow contract read operations.
 * Provides reactive state and loading indicators.
 */
export function useEscrow() {
  const [error, setError] = useState<string | null>(null);

  const loadEscrowInfo = useCallback(
    async (transferId: number): Promise<EscrowInfo | null> => {
      try {
        const info = await getEscrowInfo(transferId);
        setError(null);
        return info;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load escrow info";
        setError(msg);
        toast.error(msg);
        return null;
      }
    },
    []
  );

  return {
    error,
    loadEscrowInfo,
  };
}
