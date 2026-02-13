"use client";

/**
 * Transaction link component with truncation and copy functionality.
 * Displays a transaction ID with explorer link and copy button.
 */

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { truncateAddress, copyToClipboard } from "@/lib/utils/address";
import { toast } from "sonner";

interface TransactionLinkProps {
  txId: string;
  explorerUrl?: string;
  className?: string;
}

export function TransactionLink({ txId, explorerUrl, className }: TransactionLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(
      txId,
      () => {
        setCopied(true);
        toast.success("Transaction ID copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        toast.error("Failed to copy transaction ID");
      }
    );
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      {explorerUrl ? (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
        >
          {truncateAddress(txId, 8, 8)}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="font-mono text-sm">{truncateAddress(txId, 8, 8)}</span>
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "Copied!" : "Copy transaction ID"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
