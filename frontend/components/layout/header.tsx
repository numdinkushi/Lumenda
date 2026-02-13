"use client";

import Image from "next/image";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ConnectWalletPlaceholder } from "@/components/auth/connect-wallet-placeholder";
import { useWallet } from "@/contexts/wallet-context";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Send", href: "/send" },
  { label: "History", href: "/history" },
  { label: "Fees", href: "/fees" },
] as const;

export function Header() {
  const { isConnected } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="container flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        <Link href={isConnected ? "/dashboard" : "/"} className="flex items-center gap-2">
          <Image
            src="/assets/images/logo/logo.png"
            alt="Lumenda"
            width={120}
            height={36}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {isConnected && (
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-1">
              {navItems.map(({ label, href }) => (
                <NavigationMenuItem key={href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "text-foreground/90 hover:text-primary hover:bg-primary/10"
                      )}
                    >
                      {label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        )}

        <div className="flex items-center gap-2">
          <ConnectWalletPlaceholder />
        </div>
      </div>
    </header>
  );
}
