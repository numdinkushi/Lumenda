"use client";

import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/contexts/wallet-context";
import { cn } from "@/lib/utils";

function truncateAddress(addr: string, start = 6, end = 4) {
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}…${addr.slice(-end)}`;
}

type ConnectWalletPlaceholderProps = {
  /** Use "lg" on landing for a more prominent CTA */
  size?: "sm" | "default" | "lg";
};

/**
 * Connect / disconnect wallet. Uses WalletContext (placeholder); replace with real Stacks wallet when integrating.
 */
export function ConnectWalletPlaceholder({ size = "sm" }: ConnectWalletPlaceholderProps) {
  const { isConnected, address, connect, disconnect } = useWallet();

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={size}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Wallet className="size-4" aria-hidden />
            {truncateAddress(address)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={disconnect}
            className="gap-2 text-muted-foreground"
          >
            <LogOut className="size-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="default"
      size={size}
      className={cn(
        "gap-2 bg-primary text-primary-foreground hover:bg-primary/90",
        "shadow-[0_0_20px_rgba(0,224,255,0.3)] hover:shadow-[0_0_24px_rgba(0,224,255,0.4)]"
      )}
      onClick={connect}
    >
      <Wallet className="size-4" aria-hidden />
      Connect wallet
    </Button>
  );
}
