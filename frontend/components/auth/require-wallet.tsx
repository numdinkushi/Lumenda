"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type RequireWalletProps = {
  children: React.ReactNode;
};

/**
 * Redirects to / if wallet is not connected. Use around app routes (Send, History, Fees).
 */
export function RequireWallet({ children }: RequireWalletProps) {
  const { isConnected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.replace("/");
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">
          Connect your wallet to use this page.
        </p>
        <Button asChild variant="default">
          <Link href="/">Go to home</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
