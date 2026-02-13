"use client";

// Skip prerendering since this page requires client-side Convex hooks
export const dynamic = "force-dynamic";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { useContractCall } from "@/hooks/use-contract-call";
import { useRemittance } from "@/hooks/use-remittance";
import { useFeeRate } from "@/hooks/use-fee-rate";
import { buildInitiateTransferParams } from "@/lib/contracts";
import { getContractAddresses } from "@/config/contracts";
import {
  formatStx,
  remittanceErrorToMessage,
  stxToMicroStx,
} from "@/lib/stx";
import { toast } from "sonner";
import { useCreateTransaction } from "@/lib/convex/utils";
import { isConvexConfigured } from "@/lib/convex/client";

export default function SendPage() {
  const { address } = useWallet();
  const { execute: executeContractCall, loading: calling } = useContractCall();
  const { paused, loadPausedStatus } = useRemittance();
  const { feeRate, loading: feeLoading } = useFeeRate();
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);
  const createTransaction = useCreateTransaction();

  // Load paused status on mount
  useState(() => {
    void loadPausedStatus();
  });

  const amountMicro = amount.trim() ? stxToMicroStx(amount) : BigInt(0);
  const feeRateBps = feeRate ? Number(feeRate) : null;
  const feeMicro =
    feeRateBps != null && amountMicro > 0
      ? (amountMicro * BigInt(feeRateBps)) / BigInt(10000)
      : BigInt(0);
  const totalMicro = amountMicro + feeMicro;
  const loading = feeLoading || calling;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paused) {
      toast.error("Contract is paused");
      return;
    }
    if (!amount.trim() || amountMicro <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!recipient.trim()) {
      toast.error("Enter recipient address");
      return;
    }
    if (address && recipient.trim().toUpperCase() === address.toUpperCase()) {
      toast.error("Cannot send to yourself. Please use a different recipient address.");
      return;
    }
    setSending(true);
    try {
      const params = buildInitiateTransferParams(recipient.trim(), amountMicro);
      const txId = await executeContractCall(params);
      
      if (txId && address) {
        const { network, explorerUrl } = getContractAddresses();
        const chainParam = network === "testnet" ? "?chain=testnet" : "";
        const fullExplorerUrl = `${explorerUrl}/txid/${txId}${chainParam}`;
        
        // Track transaction in Convex immediately (transferId will be 0 until we know it)
        if (isConvexConfigured()) {
          try {
            await createTransaction(
              txId,
              0, // Placeholder transferId - will be updated when transaction confirms
              "initiate",
              address,
              "pending", // Will be updated when we check transaction status
              {
                amount: amountMicro.toString(),
                fee: feeMicro.toString(),
                recipient: recipient.trim(),
                sender: address,
              }
            );
          } catch (convexErr) {
            // Don't fail the transaction if Convex tracking fails
            console.error("Failed to track transaction in Convex:", convexErr);
          }
        }
        
        toast.success(
          <div className="space-y-1">
            <p>Transaction submitted</p>
            <a
              href={fullExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline text-blue-400 hover:text-blue-300 block"
            >
              View on explorer (tx: {txId.slice(0, 8)}...)
            </a>
            <p className="text-xs text-muted-foreground">
              Check your Leather wallet to approve. Transaction may take 1-2 minutes to confirm.
            </p>
          </div>,
          { duration: 10000 }
        );
        setAmount("");
        setRecipient("");
        await loadPausedStatus();
      }
      // When txId is null, useContractCall already toasts; ensure loading ends in finally
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string; }).message)
          : "Transaction failed";
      const code = typeof err === "object" && err && "code" in err ? Number((err as { code: number; }).code) : undefined;
      toast.error(code != null ? remittanceErrorToMessage(code) : msg);
    } finally {
      setSending(false);
    }
  };

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

          <div className="max-w-lg mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Send money</CardTitle>
                <CardDescription>
                  Enter amount and recipient. Fee is calculated from the current contract rate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (STX)</Label>
                    <Input
                      id="amount"
                      type="text"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-background/50"
                      disabled={paused === true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient address</Label>
                    <Input
                      id="recipient"
                      type="text"
                      placeholder="ST1PQHQKV0..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="bg-background/50 font-mono text-sm"
                      disabled={paused === true}
                    />
                  </div>
                  {loading ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading fee…
                    </p>
                  ) : feeRateBps != null && amountMicro > 0 ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Fee: {formatStx(feeMicro)} STX ({(feeRateBps / 100).toFixed(2)}%)</p>
                      <p>Total: {formatStx(totalMicro)} STX</p>
                    </div>
                  ) : null}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={paused === true || loading || sending || amountMicro <= 0 || !recipient.trim()}
                  >
                    {sending || calling ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Sending…
                      </>
                    ) : (
                      "Send"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RequireWallet>
  );
}
