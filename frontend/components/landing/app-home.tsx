"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { Send, ArrowRightLeft, History, Shield, AlertCircle } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { useRemittance } from "@/hooks/use-remittance";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { useUserTransfers } from "@/hooks/use-transfers";
import { formatStx } from "@/lib/stx";
import { truncateAddress } from "@/lib/utils/address";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Transfer } from "@/lib/contracts";

/**
 * Main app content for home (Send, Recent transfers, How it works).
 * Shown at / when wallet is connected.
 */
export function AppHome() {
  const { address } = useWallet();
  const { loadTransfer, loadTransferCount } = useRemittance();
  const { balanceFormatted, usdValueFormatted, loading: balanceLoading } = useWalletBalance(address);
  const recentTransfers = useUserTransfers(address, undefined, 5); // Get latest 5 transfers
  const [pendingTransfers, setPendingTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    if (!address) {
      setPendingTransfers([]);
      return;
    }

    let cancelled = false;

    const loadPendingTransfers = async () => {
      try {
        const count = await loadTransferCount();
        if (cancelled) return;
        
        if (count === null || count === 0) {
          if (!cancelled) setPendingTransfers([]);
          return;
        }
        const list: Transfer[] = [];
        for (let id = 1; id <= count; id++) {
          if (cancelled) return;
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
        if (!cancelled) {
          list.sort((a, b) => b.createdAt - a.createdAt);
          setPendingTransfers(list);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to load pending transfers:", e);
          setPendingTransfers([]);
        }
      }
    };

    void loadPendingTransfers();

    return () => {
      cancelled = true;
    };
  }, [address, loadTransfer, loadTransferCount]);

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
        
        {/* Wallet Balance Display */}
        {address && (
          <div className="mt-8 flex items-center justify-center">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 max-w-md w-full">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <div className="flex flex-col items-center gap-1">
                    {balanceLoading ? (
                      <>
                        <div className="h-8 w-32 animate-pulse bg-muted rounded mb-1" />
                        <div className="h-5 w-20 animate-pulse bg-muted rounded" />
                      </>
                    ) : balanceFormatted ? (
                      <>
                        <p className="text-3xl font-bold text-foreground">
                          {balanceFormatted} <span className="text-lg text-muted-foreground">STX</span>
                        </p>
                        {usdValueFormatted && (
                          <p className="text-lg text-muted-foreground">
                            {usdValueFormatted}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-muted-foreground">-- STX</p>
                        <p className="text-lg text-muted-foreground">--</p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-muted-foreground font-mono">
                      {truncateAddress(address)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(address);
                        toast.success("Address copied to clipboard");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
            {recentTransfers && recentTransfers.length > 0 ? (
              <div className="space-y-3">
                {recentTransfers.slice(0, 5).map((transfer) => {
                  const isSent = transfer.sender === address;
                  const isPending = transfer.status === "pending";
                  const isCompleted = transfer.status === "completed";
                  
                  return (
                    <div
                      key={transfer.transferId}
                      className="rounded-lg border border-border bg-background/50 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            isPending ? "bg-yellow-500" : isCompleted ? "bg-green-500" : "bg-gray-500"
                          }`} />
                          <span className="text-sm font-medium">
                            {isSent ? "Sent" : "Received"}
                          </span>
                        </div>
                        <Badge variant={isPending ? "secondary" : isCompleted ? "default" : "outline"}>
                          {transfer.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isSent ? "To" : "From"}: {truncateAddress(isSent ? transfer.recipient : transfer.sender)}
                        </span>
                        <span className="font-semibold">
                          {formatStx(BigInt(transfer.amount))} STX
                        </span>
                      </div>
                    </div>
                  );
                })}
                <Button asChild variant="outline" size="sm" className="w-full mt-2">
                  <Link href="/history">
                    View all transfers <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No transfers yet. Send your first transfer.
                </div>
                <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                  <Link href="/history">View history</Link>
                </Button>
              </>
            )}
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
