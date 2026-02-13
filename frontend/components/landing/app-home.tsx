"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Send, ArrowRightLeft, History, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { useRemittance } from "@/hooks/use-remittance";
import { formatStx } from "@/lib/stx";
import type { Transfer } from "@/lib/contracts";

/**
 * Main app content for home (Send, Recent transfers, How it works).
 * Shown at / when wallet is connected.
 */
export function AppHome() {
  const { address } = useWallet();
  const { loadTransfer, loadTransferCount } = useRemittance();
  const [pendingTransfers, setPendingTransfers] = useState<Transfer[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);

  const loadPendingTransfers = useCallback(async () => {
    if (!address) {
      setPendingTransfers([]);
      setLoadingPending(false);
      return;
    }
    setLoadingPending(true);
    try {
      const count = await loadTransferCount();
      if (count === null || count === 0) {
        setPendingTransfers([]);
        return;
      }
      const list: Transfer[] = [];
      for (let id = 1; id <= count; id++) {
        try {
          const t = await loadTransfer(id);
          if (t && t.status === "pending" && t.recipient === address) {
            list.push(t);
          }
        } catch (e) {
          // Skip individual transfer errors
          console.warn(`Failed to load transfer ${id}:`, e);
        }
      }
      list.sort((a, b) => b.createdAt - a.createdAt);
      setPendingTransfers(list);
    } catch (e) {
      console.error("Failed to load pending transfers:", e);
      setPendingTransfers([]);
    } finally {
      setLoadingPending(false);
    }
  }, [address, loadTransfer, loadTransferCount]);

  useEffect(() => {
    void loadPendingTransfers();
  }, [loadPendingTransfers]);

  return (
    <>
      {/* Notification banner for pending transfers waiting completion */}
      {pendingTransfers.length > 0 && (
        <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertTitle className="text-yellow-400 font-semibold">
            {pendingTransfers.length} Pending Transfer{pendingTransfers.length > 1 ? "s" : ""} Waiting for You
          </AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground mt-2 space-y-2">
            <p>
              You have {pendingTransfers.length} transfer{pendingTransfers.length > 1 ? "s" : ""} with funds waiting in escrow.
              Complete {pendingTransfers.length > 1 ? "them" : "it"} to receive your money.
            </p>
            <div className="space-y-1">
              {pendingTransfers.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <span>
                    Transfer #{t.id}: {formatStx(BigInt(t.amount))} STX from {t.sender.slice(0, 8)}...
                  </span>
                </div>
              ))}
              {pendingTransfers.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{pendingTransfers.length - 3} more transfer{pendingTransfers.length - 3 > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <Button asChild size="sm" variant="default" className="mt-2">
              <Link href="/history">
                Go to History to Complete <ArrowRightLeft className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <section className="text-center space-y-4 mb-16">
        <Badge variant="secondary" className="mb-2">
          Stacks · Low fees
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Send money globally with{" "}
          <span className="text-primary">Lumenda</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Fast, secure remittance. Choose an action below.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        <Card className="border-primary/20 bg-card/80 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Send className="size-5" />
              Send money
            </CardTitle>
            <CardDescription>
              Enter amount and recipient. Contract integration coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-background/50 p-4 text-sm text-muted-foreground">
              Placeholder: amount input, recipient address, and send button will go here.
            </div>
            <Button asChild className="w-full gap-2" variant="default">
              <Link href="/send">
                Go to Send <ArrowRightLeft className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="size-5" />
              Recent transfers
            </CardTitle>
            <CardDescription>Your latest activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No transfers yet. Send your first transfer.
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link href="/history">View history</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mt-16 max-w-3xl mx-auto">
        <Tabs defaultValue="how" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
            <TabsTrigger value="how">How it works</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="how" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Connect your Stacks wallet (Leather or Hiro).</li>
                  <li>Enter amount and recipient address.</li>
                  <li>Confirm and send — funds are locked in escrow until completion.</li>
                  <li>Recipient claims the transfer; you can cancel before that.</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security" className="mt-4">
            <Card>
              <CardContent className="pt-6 flex items-start gap-3">
                <Shield className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="text-muted-foreground text-sm space-y-1">
                  <p>Funds are held in a Clarity smart contract on Stacks. Only you or the recipient can release or refund. No custody by us.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
