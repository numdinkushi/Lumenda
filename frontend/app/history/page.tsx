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
import { ArrowLeft } from "lucide-react";

export default function HistoryPage() {
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

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Transfer history</CardTitle>
              <CardDescription>
                Your sent and received transfers. Connect wallet to see activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
                No transfers yet. Connect your wallet and send a transfer to see history here.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
