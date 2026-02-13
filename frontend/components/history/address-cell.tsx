"use client";

/**
 * Address cell component with truncation and copy functionality.
 * Displays an address with a copy button.
 */

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { truncateAddress, copyToClipboard } from "@/lib/utils/address";
import { toast } from "sonner";

interface AddressCellProps {
    address: string;
    className?: string;
}

export function AddressCell({ address, className }: AddressCellProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await copyToClipboard(
            address,
            () => {
                setCopied(true);
                toast.success("Address copied to clipboard");
                setTimeout(() => setCopied(false), 2000);
            },
            () => {
                toast.error("Failed to copy address");
            }
        );
    };

    return (
        <div className={`flex items-center gap-2 ${className || ""}`}>
            <span className="font-mono text-sm">{truncateAddress(address)}</span>
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
                        <p>{copied ? "Copied!" : "Copy address"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
