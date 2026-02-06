"use client";

import { useState } from "react";
import { Wallet, LogOut, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/contexts/wallet-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function truncateAddress(addr: string, start = 6, end = 4) {
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}…${addr.slice(-end)}`;
}

type ConnectWalletPlaceholderProps = {
  /** Use "lg" on landing for a more prominent CTA */
  size?: "sm" | "default" | "lg";
};

/**
 * Connect / disconnect Stacks wallet (Leather, Hiro, etc.) via @stacks/connect.
 */
export function ConnectWalletPlaceholder({ size = "sm" }: ConnectWalletPlaceholderProps) {
  const { isConnected, address, connect, disconnect, isConnecting, connectError } =
    useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
      toast.error("Failed to copy address");
    }
  };

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
            onClick={handleCopyAddress}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="size-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copy address
              </>
            )}
          </DropdownMenuItem>
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
    <div className="flex flex-col items-end gap-1">
      {connectError && (
        <p className="text-xs text-destructive max-w-[280px] text-right">
          {connectError}
        </p>
      )}
      <Button
        variant="default"
        size={size}
        className={cn(
          "gap-2 bg-primary text-primary-foreground hover:bg-primary/90",
          "shadow-[0_0_20px_rgba(0,224,255,0.3)] hover:shadow-[0_0_24px_rgba(0,224,255,0.4)]"
        )}
        onClick={() => {
          console.log("[ConnectWallet] Button clicked, calling connect()");
          connect();
        }}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Connecting…
          </>
        ) : (
          <>
            <Wallet className="size-4" aria-hidden />
            Connect wallet
          </>
        )}
      </Button>
    </div>
  );
}
