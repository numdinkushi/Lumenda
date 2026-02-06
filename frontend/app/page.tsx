"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LandingView } from "@/components/landing";
import { useWallet } from "@/contexts/wallet-context";

export default function HomePage() {
  const { isConnected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.replace("/dashboard");
    }
  }, [isConnected, router]);

  if (isConnected) {
    return null;
  }

  return <LandingView />;
}
