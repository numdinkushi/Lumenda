"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout";
import { RequireWallet } from "@/components/auth/require-wallet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { useContractCall } from "@/hooks/use-contract-call";
import { useRemittance } from "@/hooks/use-remittance";
import { getContractAddresses } from "@/config/contracts";
import {
  buildCancelTransferParams,
  buildCompleteTransferParams,
  type Transfer,
} from "@/lib/contracts";
import { fetchRecentTransactions } from "@/lib/contracts/transactions";
import { formatStx } from "@/lib/stx";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

export default function HistoryPage() {
  const { address } = useWallet();
  const { execute: executeContractCall } = useContractCall();
  const { loadTransfer, loadTransferCount } = useRemittance();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [transferTxIds, setTransferTxIds] = useState<Record<number, {
    initiateTxId?: string;
    completeTxId?: string;
    cancelTxId?: string;
  }>>({});

  const loadTransfers = useCallback(async () => {
    if (!address) {
      setTransfers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const count = await loadTransferCount();
      if (count === null) {
        console.warn("Failed to get transfer count");
        setTransfers([]);
        return;
      }
      if (count === 0) {
        setTransfers([]);
        return;
      }
      const list: Transfer[] = [];
      for (let id = 1; id <= count; id++) {
        try {
          const t = await loadTransfer(id);
          if (t && (t.sender === address || t.recipient === address)) {
            list.push(t);
          }
        } catch (e) {
          // Skip individual transfer errors, continue loading others
          console.warn(`Failed to load transfer ${id}:`, e);
        }
      }
      list.sort((a, b) => b.createdAt - a.createdAt);
      setTransfers(list);

      // Fetch transaction IDs for each transfer
      if (list.length > 0 && address) {
        const txIdMap: Record<number, {
          initiateTxId?: string;
          completeTxId?: string;
          cancelTxId?: string;
        }> = {};

        // Fetch all recent transactions once
        const allTransactions = await fetchRecentTransactions(address, 100);

        // Match transactions to transfers
        for (const transfer of list) {
          const matchingTxs = allTransactions.filter(tx => {
            const timeDiff = Math.abs(tx.timestamp - transfer.createdAt * 1000);
            return timeDiff < 600000; // Within 10 minutes
          });

          for (const tx of matchingTxs) {
            if (tx.functionName === "initiate-transfer" && !txIdMap[transfer.id]?.initiateTxId) {
              if (!txIdMap[transfer.id]) txIdMap[transfer.id] = {};
              txIdMap[transfer.id].initiateTxId = tx.txId;
            } else if (tx.functionName === "complete-transfer" && transfer.completedAt) {
              const completeTimeDiff = Math.abs(tx.timestamp - transfer.completedAt * 1000);
              if (completeTimeDiff < 600000) {
                if (!txIdMap[transfer.id]) txIdMap[transfer.id] = {};
                txIdMap[transfer.id].completeTxId = tx.txId;
              }
            } else if (tx.functionName === "cancel-transfer" && transfer.cancelledAt) {
              const cancelTimeDiff = Math.abs(tx.timestamp - transfer.cancelledAt * 1000);
              if (cancelTimeDiff < 600000) {
                if (!txIdMap[transfer.id]) txIdMap[transfer.id] = {};
                txIdMap[transfer.id].cancelTxId = tx.txId;
              }
            }
          }
        }

        setTransferTxIds(txIdMap);
      }
    } catch (e) {
      console.error("Failed to load transfers:", e);
      toast.error("Failed to load transfers. Check console for details.");
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [address, loadTransfer, loadTransferCount]);

  const onComplete = async (t: Transfer) => {
    if (t.status !== "pending" || t.recipient !== address) return;
    setActingId(t.id);
    try {
      const params = buildCompleteTransferParams(t.id);
      const txId = await executeContractCall(params);
      if (txId) {
        toast.success("Transfer completed");
        await loadTransfers();
      }
    } catch (err) {
      toast.error("Complete failed");
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  const onCancel = async (t: Transfer) => {
    if (t.status !== "pending" || t.sender !== address) return;
    setActingId(t.id);
    try {
      const params = buildCancelTransferParams(t.id);
      const txId = await executeContractCall(params);
      if (txId) {
        toast.success("Transfer cancelled");
        await loadTransfers();
      }
    } catch (err) {
      toast.error("Cancel failed");
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  useEffect(() => {
    void loadTransfers();
  }, [loadTransfers]);

  return (
    <RequireWallet>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container px-4 py-10 md:px-6 md:py-14">
          <Button variant="ghost" size="sm" className="mb-6 gap-2 -ml-2" asChild>
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transfer history</CardTitle>
                    <CardDescription>
                      Your sent and received transfers. Complete or cancel pending transfers.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTransfers()}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Refresh"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                ) : transfers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-2">
                    <p className="text-muted-foreground text-sm">
                      No transfers found for your address.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Transfers only appear here after they are successfully submitted and confirmed on-chain.
                      If you sent a transfer but don&apos;t see it, check your Leather wallet to ensure the transaction was approved.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {transfers.map((t) => {
                      const { network, explorerUrl } = getContractAddresses();
                      const chainParam = network === "testnet" ? "?chain=testnet" : "";
                      const isSender = t.sender === address;
                      const isRecipient = t.recipient === address;
                      const date = new Date(t.createdAt * 1000).toLocaleString();
                      const txIds = transferTxIds[t.id] || {};

                      return (
                        <li
                          key={t.id}
                          className="rounded-lg border border-border p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">
                                  Transfer #{t.id}
                                </p>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded capitalize ${t.status === "completed"
                                      ? "bg-green-500/20 text-green-400"
                                      : t.status === "cancelled"
                                        ? "bg-red-500/20 text-red-400"
                                        : "bg-yellow-500/20 text-yellow-400"
                                    }`}
                                >
                                  {t.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {isSender ? "Sent" : "Received"}{" "}
                                <span className="font-mono">
                                  {formatStx(BigInt(t.amount))} STX
                                </span>
                                {t.fee && Number(t.fee) > 0 && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    (fee: {formatStx(BigInt(t.fee))} STX)
                                  </span>
                                )}
                              </p>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <p>
                                  {isSender ? "To" : "From"}:{" "}
                                  <span className="font-mono">
                                    {isSender ? t.recipient : t.sender}
                                  </span>
                                </p>
                                <p>Created: {date}</p>
                                {t.completedAt && (
                                  <p>Completed: {new Date(t.completedAt * 1000).toLocaleString()}</p>
                                )}
                                {t.cancelledAt && (
                                  <p>Cancelled: {new Date(t.cancelledAt * 1000).toLocaleString()}</p>
                                )}
                                {txIds.initiateTxId && (
                                  <p className="flex items-center gap-1">
                                    Initiate TX:{" "}
                                    <a
                                      href={`${explorerUrl}/txid/${txIds.initiateTxId}${chainParam}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-blue-400 hover:text-blue-300 underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {txIds.initiateTxId.slice(0, 8)}...
                                    </a>
                                  </p>
                                )}
                                {txIds.completeTxId && (
                                  <p className="flex items-center gap-1">
                                    Complete TX:{" "}
                                    <a
                                      href={`${explorerUrl}/txid/${txIds.completeTxId}${chainParam}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-blue-400 hover:text-blue-300 underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {txIds.completeTxId.slice(0, 8)}...
                                    </a>
                                  </p>
                                )}
                                {txIds.cancelTxId && (
                                  <p className="flex items-center gap-1">
                                    Cancel TX:{" "}
                                    <a
                                      href={`${explorerUrl}/txid/${txIds.cancelTxId}${chainParam}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-blue-400 hover:text-blue-300 underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {txIds.cancelTxId.slice(0, 8)}...
                                    </a>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {t.status === "pending" && isRecipient && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  disabled={actingId !== null}
                                  onClick={() => onComplete(t)}
                                >
                                  {actingId === t.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    "Complete"
                                  )}
                                </Button>
                              )}
                              {t.status === "pending" && isSender && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actingId !== null}
                                  onClick={() => onCancel(t)}
                                >
                                  {actingId === t.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    "Cancel"
                                  )}
                                </Button>
                              )}
                              {txIds.initiateTxId ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  asChild
                                >
                                  <a
                                    href={`${explorerUrl}/txid/${txIds.initiateTxId}${chainParam}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    <ExternalLink className="size-3" />
                                    View TX
                                  </a>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  asChild
                                >
                                  <a
                                    href={`${explorerUrl}/address/${isSender ? t.sender : t.recipient}${chainParam}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    <ExternalLink className="size-3" />
                                    Explorer
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RequireWallet>
  );
}
