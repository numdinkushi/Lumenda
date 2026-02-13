"use client";

// Skip prerendering since this page requires client-side Convex hooks
export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState, useRef } from "react";
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
import { formatStx } from "@/lib/stx";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { useUserTransactions } from "@/hooks/use-transactions";
import { useCreateTransaction } from "@/lib/convex/utils";
import { isConvexConfigured } from "@/lib/convex/client";
import { TransactionsTable, type TransactionRow } from "@/components/history/transactions-table";
import { useUpdatePendingTransactions } from "@/hooks/use-transaction-status";

export default function HistoryPage() {
  const { address } = useWallet();
  const { execute: executeContractCall } = useContractCall();
  const { loadTransfer, loadTransferCount } = useRemittance();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const createTransaction = useCreateTransaction();
  const { updatePending } = useUpdatePendingTransactions();

  // Get all transactions for this user from Convex
  const userTransactions = useUserTransactions(address, undefined, 200);

  // Update pending transactions when page loads or userTransactions changes
  useEffect(() => {
    if (userTransactions && userTransactions.length > 0) {
      const pendingTxIds = userTransactions
        .filter((tx) => tx.status === "pending" && tx.txId)
        .map((tx) => tx.txId);

      if (pendingTxIds.length > 0) {
        // Update pending transactions
        updatePending(pendingTxIds).catch((err) => {
          console.error("Failed to update pending transactions:", err);
        });
      }
    }
  }, [userTransactions, updatePending]);

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
    } catch (e) {
      console.error("Failed to load transfers:", e);
      toast.error("Failed to load transfers. Check console for details.");
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [address, loadTransfer, loadTransferCount]);

  const onComplete = async (t: Transfer) => {
    if (t.status !== "pending" || t.recipient !== address || !address) return;
    setActingId(t.id);
    
    // Add a safety timeout to ensure actingId is reset even if something hangs
    const safetyTimeout = setTimeout(() => {
      console.warn("Complete transfer operation timed out, resetting state");
      setActingId(null);
    }, 6 * 60 * 1000); // 6 minutes (slightly longer than requestContractCall timeout)
    
    try {
      const params = buildCompleteTransferParams(t.id);
      const txId = await executeContractCall(params);
      clearTimeout(safetyTimeout);
      
      if (txId) {
        // Track transaction in Convex
        if (isConvexConfigured()) {
          try {
            await createTransaction(
              txId,
              t.id,
              "complete",
              address,
              "pending",
              {
                amount: t.amount,
                fee: t.fee,
                recipient: t.recipient,
                sender: t.sender,
              }
            );
          } catch (convexErr) {
            console.error("Failed to track transaction in Convex:", convexErr);
          }
        }

        const { network, explorerUrl } = getContractAddresses();
        const chainParam = network === "testnet" ? "?chain=testnet" : "";
        const fullExplorerUrl = `${explorerUrl}/txid/${txId}${chainParam}`;

        toast.success(
          <div className="space-y-1">
            <p>Transfer completion submitted</p>
            <a
              href={fullExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline text-blue-400 hover:text-blue-300 block"
            >
              View on explorer (tx: {txId.slice(0, 8)}...)
            </a>
          </div>
        );
        await loadTransfers();
      }
    } catch (err) {
      clearTimeout(safetyTimeout);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("cancelled") || errMsg.includes("closed") || errMsg.includes("timeout")) {
        toast.info("Transaction cancelled. You can try again by clicking Complete.");
      } else {
        toast.error("Complete failed");
      }
      console.error(err);
    } finally {
      clearTimeout(safetyTimeout);
      setActingId(null);
    }
  };

  const onCancel = async (t: Transfer) => {
    if (t.status !== "pending" || t.sender !== address || !address) return;
    setActingId(t.id);
    
    // Add a safety timeout to ensure actingId is reset even if something hangs
    const safetyTimeout = setTimeout(() => {
      console.warn("Cancel transfer operation timed out, resetting state");
      setActingId(null);
    }, 6 * 60 * 1000); // 6 minutes (slightly longer than requestContractCall timeout)
    
    try {
      const params = buildCancelTransferParams(t.id);
      const txId = await executeContractCall(params);
      clearTimeout(safetyTimeout);
      
      if (txId) {
        // Track transaction in Convex
        if (isConvexConfigured()) {
          try {
            await createTransaction(
              txId,
              t.id,
              "cancel",
              address,
              "pending",
              {
                amount: t.amount,
                fee: t.fee,
                recipient: t.recipient,
                sender: t.sender,
              }
            );
          } catch (convexErr) {
            console.error("Failed to track transaction in Convex:", convexErr);
          }
        }

        const { network, explorerUrl } = getContractAddresses();
        const chainParam = network === "testnet" ? "?chain=testnet" : "";
        const fullExplorerUrl = `${explorerUrl}/txid/${txId}${chainParam}`;

        toast.success(
          <div className="space-y-1">
            <p>Transfer cancellation submitted</p>
            <a
              href={fullExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline text-blue-400 hover:text-blue-300 block"
            >
              View on explorer (tx: {txId.slice(0, 8)}...)
            </a>
          </div>
        );
        await loadTransfers();
      }
    } catch (err) {
      clearTimeout(safetyTimeout);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("cancelled") || errMsg.includes("closed") || errMsg.includes("timeout")) {
        toast.info("Transaction cancelled. You can try again by clicking Cancel.");
      } else {
        toast.error("Cancel failed");
      }
      console.error(err);
    } finally {
      clearTimeout(safetyTimeout);
      setActingId(null);
    }
  };

  useEffect(() => {
    void loadTransfers();
  }, [loadTransfers]);

  // Set up periodic refresh for pending transactions
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (userTransactions && userTransactions.length > 0) {
      const hasPending = userTransactions.some((tx) => tx.status === "pending" && tx.txId);

      if (hasPending) {
        // Refresh every 15 seconds if there are pending transactions
        refreshIntervalRef.current = setInterval(() => {
          const pendingTxIds = userTransactions
            .filter((tx) => tx.status === "pending" && tx.txId)
            .map((tx) => tx.txId);

          if (pendingTxIds.length > 0) {
            updatePending(pendingTxIds).catch((err) => {
              console.error("Failed to refresh pending transactions:", err);
            });
          }
        }, 15000); // Check every 15 seconds
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [userTransactions, updatePending]);

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

          <div className="max-w-7xl mx-auto w-full">
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transfer history</CardTitle>
                    <CardDescription>
                      Your sent and received transfers. Complete or cancel pending transfers.
                    </CardDescription>
                    {transfers.some(t => t.status === "pending" && t.recipient === address) && (
                      <div className="mt-3 p-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 text-sm">
                        <p className="text-yellow-400 font-semibold mb-1">⚠️ Pending transfers waiting for completion</p>
                        <p className="text-muted-foreground text-xs">
                          Funds are held in escrow. Click "Complete" on pending transfers where you are the recipient to receive the funds.
                        </p>
                      </div>
                    )}
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
                ) : transfers.length === 0 && (!userTransactions || userTransactions.length === 0) ? (
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
                  <>
                    {/* Show transactions from Convex that don't have matching transfers */}
                    {userTransactions && userTransactions.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold mb-3">Recent Transactions</h3>
                        <TransactionsTable
                          transactions={userTransactions
                            .filter(tx => {
                              // Only show transactions that don't have a matching transfer
                              // or transactions with transferId === 0 (pending/not yet confirmed)
                              return tx.transferId === 0 || !transfers.find(t => t.id === tx.transferId);
                            })
                            .map(tx => tx as TransactionRow)}
                          currentAddress={address || undefined}
                        />
                      </div>
                    )}

                    {/* Show transfers from contract */}
                    {transfers.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Confirmed Transfers</h3>
                        <ul className="space-y-3">
                          {transfers.map((t) => {
                            const { network, explorerUrl } = getContractAddresses();
                            const chainParam = network === "testnet" ? "?chain=testnet" : "";
                            const isSender = t.sender === address;
                            const isRecipient = t.recipient === address;
                            const date = new Date(t.createdAt * 1000).toLocaleString();

                            // Get transaction IDs from Convex for this transfer
                            const initiateTx = userTransactions?.find(
                              tx => tx.transferId === t.id && tx.transactionType === "initiate"
                            );
                            const completeTx = userTransactions?.find(
                              tx => tx.transferId === t.id && tx.transactionType === "complete"
                            );
                            const cancelTx = userTransactions?.find(
                              tx => tx.transferId === t.id && tx.transactionType === "cancel"
                            );

                            const txIds = {
                              initiateTxId: initiateTx?.txId,
                              completeTxId: completeTx?.txId,
                              cancelTxId: cancelTx?.txId,
                            };

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
                                    {t.status === "pending" && isRecipient && (
                                      <p className="text-xs text-yellow-400 mt-1 font-medium">
                                        💰 Funds are in escrow - Click "Complete" to receive them
                                      </p>
                                    )}
                                    {t.status === "pending" && isSender && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Funds are in escrow waiting for recipient to complete
                                      </p>
                                    )}
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
                                        <p className="flex items-center gap-1 flex-wrap">
                                          Initiate TX:{" "}
                                          <a
                                            href={initiateTx?.explorerUrl || `${explorerUrl}/txid/${txIds.initiateTxId}${chainParam}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {txIds.initiateTxId.slice(0, 8)}...
                                            <ExternalLink className="size-3" />
                                          </a>
                                          {initiateTx && initiateTx.status !== "success" && (
                                            <span className={`text-xs ml-1 ${initiateTx.status === "abort_by_response" || initiateTx.status === "abort_by_post_condition"
                                              ? "text-red-400"
                                              : "text-yellow-400"
                                              }`}>
                                              ({initiateTx.status})
                                            </span>
                                          )}
                                        </p>
                                      )}
                                      {txIds.completeTxId && (
                                        <p className="flex items-center gap-1 flex-wrap">
                                          Complete TX:{" "}
                                          <a
                                            href={completeTx?.explorerUrl || `${explorerUrl}/txid/${txIds.completeTxId}${chainParam}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {txIds.completeTxId.slice(0, 8)}...
                                            <ExternalLink className="size-3" />
                                          </a>
                                          {completeTx && completeTx.status !== "success" && (
                                            <span className={`text-xs ml-1 ${completeTx.status === "abort_by_response" || completeTx.status === "abort_by_post_condition"
                                              ? "text-red-400"
                                              : "text-yellow-400"
                                              }`}>
                                              ({completeTx.status})
                                            </span>
                                          )}
                                        </p>
                                      )}
                                      {txIds.cancelTxId && (
                                        <p className="flex items-center gap-1 flex-wrap">
                                          Cancel TX:{" "}
                                          <a
                                            href={cancelTx?.explorerUrl || `${explorerUrl}/txid/${txIds.cancelTxId}${chainParam}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {txIds.cancelTxId.slice(0, 8)}...
                                            <ExternalLink className="size-3" />
                                          </a>
                                          {cancelTx && cancelTx.status !== "success" && (
                                            <span className={`text-xs ml-1 ${cancelTx.status === "abort_by_response" || cancelTx.status === "abort_by_post_condition"
                                              ? "text-red-400"
                                              : "text-yellow-400"
                                              }`}>
                                              ({cancelTx.status})
                                            </span>
                                          )}
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
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RequireWallet>
  );
}
