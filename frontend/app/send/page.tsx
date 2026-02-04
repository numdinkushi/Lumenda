import Link from "next/link";
import { Header } from "@/components/layout";
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
import { ArrowLeft } from "lucide-react";

export default function SendPage() {
  return (
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
                Placeholder form. Contract integration will connect here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (STX)</Label>
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  disabled
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient address</Label>
                <Input
                  id="recipient"
                  type="text"
                  placeholder="ST1PQHQKV0..."
                  disabled
                  className="bg-background/50 font-mono text-sm"
                />
              </div>
              <Button className="w-full" disabled>
                Send (connect wallet first)
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
