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
import {
  buildCancelTransferParams,
  buildCompleteTransferParams,
  type Transfer,
} from "@/lib/contracts";
import { formatStx } from "@/lib/stx";
import { toast } from "sonner";

export default function HistoryPage() {
  const { address } = useWallet();
  const { execute: executeContractCall } = useContractCall();
  const { loadTransfer, loadTransferCount } = useRemittance();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

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
        setTransfers([]);
        return;
      }
      const list: Transfer[] = [];
      for (let id = 1; id <= count; id++) {
        const t = await loadTransfer(id);
        if (t && (t.sender === address || t.recipient === address)) list.push(t);
      }
      list.sort((a, b) => b.createdAt - a.createdAt);
      setTransfers(list);
    } catch (e) {
      toast.error("Failed to load transfers");
      console.error(e);
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
                <CardTitle>Transfer history</CardTitle>
                <CardDescription>
                  Your sent and received transfers. Complete or cancel pending transfers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                ) : transfers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
                    No transfers yet. Send a transfer to see history here.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {transfers.map((t) => (
                      <li
                        key={t.id}
                        className="rounded-lg border border-border p-4 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <p className="font-mono text-sm">
                            #{t.id} {formatStx(BigInt(t.amount))} STX → {t.recipient.slice(0, 8)}…
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{t.status}</p>
                        </div>
                        <div className="flex gap-2">
                          {t.status === "pending" && t.recipient === address && (
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
                          {t.status === "pending" && t.sender === address && (
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
                        </div>
                      </li>
                    ))}
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
