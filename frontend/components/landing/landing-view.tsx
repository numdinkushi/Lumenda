"use client";

import { ConnectWalletPlaceholder } from "@/components/auth/connect-wallet-placeholder";

/**
 * Landing: neon "Lumenda" text + connect CTA. Background comes from layout PageBackground.
 * Shown at / when wallet is not connected.
 */
export function LandingView() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      <div className="flex flex-col items-center text-center gap-6 max-w-xl">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          <span className="text-neon">Lumenda</span>
        </h1>
        <p className="text-foreground/80 text-lg sm:text-xl">
          Send money globally on the Stacks blockchain. Low fees, secure escrow.
        </p>
        <div className="pt-2">
          <ConnectWalletPlaceholder size="lg" />
        </div>
        <p className="text-muted-foreground text-sm">
          Connect with Leather or Hiro wallet to get started
        </p>
      </div>

      <footer className="absolute bottom-6 left-0 right-0 text-center text-sm text-muted-foreground">
        Lumenda · Remittance on Stacks
      </footer>
    </div>
  );
}
