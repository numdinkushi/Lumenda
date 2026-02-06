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
import { getFeeRate } from "@/lib/remittance-contracts";
import { formatStx, stxToMicroStx } from "@/lib/stx";

export default function FeesPage() {
  const [feeRateBps, setFeeRateBps] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [calcAmount, setCalcAmount] = useState("");

  const loadFee = useCallback(async () => {
    setLoading(true);
    try {
      const rate = await getFeeRate();
      setFeeRateBps(Number(rate));
    } catch {
      setFeeRateBps(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFee();
  }, [loadFee]);

  const amountMicro = calcAmount.trim() ? stxToMicroStx(calcAmount) : BigInt(0);
  const feeMicro =
    feeRateBps != null && amountMicro > 0
      ? (amountMicro * BigInt(feeRateBps)) / BigInt(10000)
      : BigInt(0);

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
                <CardTitle>Fees</CardTitle>
                <CardDescription>
                  Lumenda uses a small fee on each transfer. Rate is set by the contract.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading fee rate…
                  </p>
                ) : feeRateBps != null ? (
                  <div className="rounded-lg border border-border bg-background/50 p-4 space-y-2 text-sm">
                    <p className="font-medium">Current fee rate</p>
                    <p className="text-muted-foreground">
                      {(feeRateBps / 100).toFixed(2)}% ({(feeRateBps / 10000).toFixed(4)} of amount)
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Could not load fee rate.</p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="calc-amount">Fee calculator: amount (STX)</Label>
                  <Input
                    id="calc-amount"
                    type="text"
                    placeholder="0.00"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="bg-background/50"
                  />
                  {feeRateBps != null && amountMicro > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Fee: {formatStx(feeMicro)} STX
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RequireWallet>
  );
}
