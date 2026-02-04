"use client";

import { Header } from "@/components/layout";
import { LandingView, AppHome } from "@/components/landing";
import { useWallet } from "@/contexts/wallet-context";

export default function HomePage() {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return <LandingView />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container px-4 py-10 md:px-6 md:py-14">
        <AppHome />
      </main>

      <footer className="border-t border-border/50 py-6 mt-auto">
        <div className="container px-4 md:px-6 text-center text-sm text-muted-foreground">
          Lumenda · Remittance on Stacks
        </div>
      </footer>
    </div>
  );
}
