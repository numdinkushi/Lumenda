"use client";

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
import { ArrowLeft } from "lucide-react";

export default function FeesPage() {
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
            <CardContent>
              <div className="rounded-lg border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                Placeholder: current fee rate and fee calculator will be shown here after contract integration.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
    </RequireWallet>
  );
}
