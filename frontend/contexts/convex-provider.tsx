"use client";

/**
 * Convex provider wrapper for React.
 * Provides Convex client context to all child components.
 */

import { ConvexProvider } from "convex/react";
import { getConvexClient, isConvexConfigured } from "@/lib/convex/client";
import { ReactNode } from "react";

interface ConvexProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides Convex client to the React tree.
 * Should be placed high in the component tree (typically in layout.tsx).
 * 
 * If Convex is not configured, this component simply renders its children
 * without the Convex provider, allowing the app to work without Convex.
 */
export function ConvexProviderWrapper({ children }: ConvexProviderWrapperProps) {
  // Only provide Convex if it's configured
  if (!isConvexConfigured()) {
    console.warn(
      "Convex is not configured. Convex features will be disabled. " +
      "Set NEXT_PUBLIC_CONVEX_URL to enable Convex."
    );
    return <>{children}</>;
  }

  try {
    const client = getConvexClient();
    return <ConvexProvider client={client}>{children}</ConvexProvider>;
  } catch (error) {
    console.error("Failed to initialize Convex client:", error);
    // Fallback: render children without Convex provider
    return <>{children}</>;
  }
}
