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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import {
  buildInitiateTransferParams,
  getFeeRate,
  getPausedStatus,
} from "@/lib/remittance-contracts";
import {
  formatStx,
  remittanceErrorToMessage,
  stxToMicroStx,
} from "@/lib/stx";
import { toast } from "sonner";

export default function SendPage() {
  const { requestContractCall } = useWallet();
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [feeRateBps, setFeeRateBps] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadFeeAndPaused = useCallback(async () => {
    setLoading(true);
    try {
      const [rate, isPaused] = await Promise.all([getFeeRate(), getPausedStatus()]);
      setFeeRateBps(Number(rate));
      setPaused(!!isPaused);
    } catch (e) {
      toast.error("Failed to load fee rate");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeeAndPaused();
  }, [loadFeeAndPaused]);

  const amountMicro = amount.trim() ? stxToMicroStx(amount) : BigInt(0);
  const feeMicro =
    feeRateBps != null && amountMicro > 0
      ? (amountMicro * BigInt(feeRateBps)) / BigInt(10000)
      : BigInt(0);
  const totalMicro = amountMicro + feeMicro;

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
    setSending(true);
    try {
      const params = buildInitiateTransferParams(recipient.trim(), amountMicro);
      const txId = await requestContractCall(params);
      if (txId) {
        toast.success("Transfer initiated");
        setAmount("");
        setRecipient("");
      } else {
        toast.error("Transaction was not sent. Connect a Stacks wallet to sign.");
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Transaction failed";
      const code = typeof err === "object" && err && "code" in err ? Number((err as { code: number }).code) : undefined;
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
                      disabled={paused}
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
                      disabled={paused}
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
                    disabled={paused || loading || sending || amountMicro <= 0 || !recipient.trim()}
                  >
                    {sending ? (
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
