"use client";

import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Placeholder for wallet connection (Leather / Hiro etc.).
 * Replace with real connect logic when integrating Stacks.
 */
export function ConnectWalletPlaceholder() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled
        >
          <Wallet className="size-4" aria-hidden />
          Connect wallet
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p>Wallet integration coming soon. Connect with Leather or Hiro wallet.</p>
      </TooltipContent>
    </Tooltip>
  );
}
