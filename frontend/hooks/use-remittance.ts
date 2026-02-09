"use client";

import { useCallback, useState } from "react";
import {
  getFeeRate,
  getTransferCount,
  getTransfer,
  getTransferStatus,
  getPausedStatus,
  type Transfer,
} from "@/lib/contracts";
import { toast } from "sonner";

/**
 * Hook for remittance contract read operations.
 * Provides reactive state and loading indicators.
 */
export function useRemittance() {
  const [feeRate, setFeeRate] = useState<bigint | null>(null);
  const [transferCount, setTransferCount] = useState<number | null>(null);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeeRate = useCallback(async () => {
    try {
      const rate = await getFeeRate();
      setFeeRate(rate);
      setError(null);
      return rate;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load fee rate";
      setError(msg);
      toast.error(msg);
      return null;
    }
  }, []);

  const loadTransferCount = useCallback(async () => {
    try {
      const count = await getTransferCount();
      setTransferCount(count);
      setError(null);
      return count;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load transfer count";
      setError(msg);
      return null;
    }
  }, []);

  const loadPausedStatus = useCallback(async () => {
    try {
      const isPaused = await getPausedStatus();
      setPaused(isPaused);
      setError(null);
      return isPaused;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load paused status";
      setError(msg);
      return null;
    }
  }, []);

  const loadTransfer = useCallback(async (transferId: number): Promise<Transfer | null> => {
    try {
      const transfer = await getTransfer(transferId);
      setError(null);
      return transfer;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load transfer";
      setError(msg);
      return null;
    }
  }, []);

  const loadTransferStatus = useCallback(
    async (transferId: number): Promise<string | null> => {
      try {
        const status = await getTransferStatus(transferId);
        setError(null);
        return status;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load transfer status";
        setError(msg);
        return null;
      }
    },
    []
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadFeeRate(), loadTransferCount(), loadPausedStatus()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load contract data";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [loadFeeRate, loadTransferCount, loadPausedStatus]);

  return {
    feeRate,
    transferCount,
    paused,
    loading,
    error,
    loadFeeRate,
    loadTransferCount,
    loadPausedStatus,
    loadTransfer,
    loadTransferStatus,
    loadAll,
  };
}
