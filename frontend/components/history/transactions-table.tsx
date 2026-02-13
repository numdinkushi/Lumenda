"use client";

/**
 * Transactions table component.
 * Displays transactions in a professional table format.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { formatStx } from "@/lib/stx";
import { AddressCell } from "./address-cell";
import { TransactionLink } from "./transaction-link";
import { getContractAddresses } from "@/config/contracts";
import type { Id } from "@/convex/_generated/dataModel";

export interface TransactionRow {
  _id: Id<"transactions">;
  txId: string;
  transferId: number;
  transactionType: "initiate" | "complete" | "cancel";
  userAddress: string;
  status: "pending" | "success" | "abort_by_response" | "abort_by_post_condition";
  timestamp: number;
  explorerUrl?: string;
  metadata?: {
    fee?: string;
    amount?: string;
    recipient?: string;
    sender?: string;
  };
}

interface TransactionsTableProps {
  transactions: TransactionRow[];
  currentAddress?: string;
}

export function TransactionsTable({ transactions, currentAddress }: TransactionsTableProps) {
  const { network, explorerUrl } = getContractAddresses();
  const chainParam = network === "testnet" ? "?chain=testnet" : "";

  const getStatusBadge = (status: TransactionRow["status"]) => {
    const variants = {
      success: "default",
      pending: "secondary",
      abort_by_response: "destructive",
      abort_by_post_condition: "destructive",
    } as const;

    const colors = {
      success: "bg-green-500/20 text-green-400 border-green-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      abort_by_response: "bg-red-500/20 text-red-400 border-red-500/30",
      abort_by_post_condition: "bg-red-500/20 text-red-400 border-red-500/30",
    };

    return (
      <Badge
        variant={variants[status]}
        className={colors[status]}
      >
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getTypeLabel = (type: TransactionRow["transactionType"]) => {
    const labels = {
      initiate: "Initiate",
      complete: "Complete",
      cancel: "Cancel",
    };
    return labels[type];
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border w-full overflow-x-auto">
      <Table className="w-full min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[150px]">Amount</TableHead>
            <TableHead className="min-w-[180px]">From</TableHead>
            <TableHead className="min-w-[180px]">To</TableHead>
            <TableHead className="min-w-[200px]">Transaction ID</TableHead>
            <TableHead className="w-[180px]">Date</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const date = new Date(tx.timestamp * 1000).toLocaleString();
            const fullExplorerUrl = tx.explorerUrl || `${explorerUrl}/txid/${tx.txId}${chainParam}`;

            return (
              <TableRow key={tx._id}>
                <TableCell className="font-medium">
                  {getTypeLabel(tx.transactionType)}
                </TableCell>
                <TableCell>{getStatusBadge(tx.status)}</TableCell>
                <TableCell>
                  {tx.metadata?.amount ? (
                    <div className="flex flex-col">
                      <span className="font-mono">
                        {formatStx(BigInt(tx.metadata.amount))} STX
                      </span>
                      {tx.metadata.fee && Number(tx.metadata.fee) > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Fee: {formatStx(BigInt(tx.metadata.fee))} STX
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {tx.metadata?.sender ? (
                    <AddressCell address={tx.metadata.sender} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {tx.metadata?.recipient ? (
                    <AddressCell address={tx.metadata.recipient} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {tx.txId ? (
                    <TransactionLink txId={tx.txId} explorerUrl={fullExplorerUrl} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {date}
                </TableCell>
                <TableCell>
                  {tx.txId && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8"
                    >
                      <a
                        href={fullExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
