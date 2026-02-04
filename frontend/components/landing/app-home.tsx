"use client";

import Link from "next/link";
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
import { Send, ArrowRightLeft, History, Shield } from "lucide-react";

/**
 * Main app content for home (Send, Recent transfers, How it works).
 * Shown at / when wallet is connected.
 */
export function AppHome() {
  return (
    <>
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
