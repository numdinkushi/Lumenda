"use client";

import Link from "next/link";
import { Header } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getContractAddresses } from "@/config/contracts";
import { getRpcUrl, getExplorerUrl } from "@/constants/contracts";

/**
 * Verification page: shows which network, deployer, RPC, and contract IDs the app is using.
 * Use this to confirm .env and config match the explorer (e.g. after "Contract not deployed").
 */
export default function VerifyPage() {
  const addresses = getContractAddresses();
  const rpcUrl = getRpcUrl();
  const explorerUrl = getExplorerUrl();
  const explorerAddressLink = `${explorerUrl}/address/${addresses.deployer}?chain=${addresses.network}`;

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

        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract config</CardTitle>
              <CardDescription>
                Values used for contract calls. If you see &quot;Contract not deployed&quot;, compare
                deployer with the address on the explorer (copy-paste to avoid 0 vs O typo).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 font-mono text-sm">
              <div>
                <span className="text-muted-foreground">Network:</span>{" "}
                <span className="font-semibold">{addresses.network}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Deployer:</span>{" "}
                <span className="break-all">{addresses.deployer}</span>
              </div>
              <div>
                <span className="text-muted-foreground">RPC URL:</span>{" "}
                <a
                  href={rpcUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline break-all"
                >
                  {rpcUrl}
                </a>
              </div>
              <div>
                <span className="text-muted-foreground">Remittance:</span>{" "}
                <span className="break-all">{addresses.contracts.remittance}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Escrow:</span>{" "}
                <span className="break-all">{addresses.contracts.escrow}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Env and troubleshooting</CardTitle>
              <CardDescription>
                Set in <code className="text-xs bg-muted px-1 rounded">frontend/.env.local</code> and
                restart the dev server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <code>NEXT_PUBLIC_STACKS_NETWORK=testnet</code> (or mainnet)
                </li>
                <li>
                  <code>NEXT_PUBLIC_STACKS_DEPLOYER_ADDRESS</code> = deployer from explorer (use
                  copy; avoid letter &quot;O&quot; vs digit &quot;0&quot;)
                </li>
                <li>
                  If Leather shows &quot;Not a valid contract&quot;, set Leather to <strong>Testnet</strong> (Settings
                  → Network) so it looks up the contract on the same network as this app.
                </li>
              </ul>
              <Button variant="outline" size="sm" asChild>
                <a href={explorerAddressLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4 mr-2" />
                  Open deployer on explorer
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
