"use client";

/**
 * Convex provider wrapper for React.
 * Provides Convex client context to all child components.
 */

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { getConvexClient, isConvexConfigured } from "@/lib/convex/client";
import { ReactNode, useMemo } from "react";

interface ConvexProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides Convex client to the React tree.
 * Should be placed high in the component tree (typically in layout.tsx).
 * 
 * Always renders the ConvexProvider to ensure hooks can be called unconditionally.
 * If Convex is not configured, uses a dummy client URL to prevent errors.
 */
export function ConvexProviderWrapper({ children }: ConvexProviderWrapperProps) {
  // Always create a client (even if Convex isn't configured) so hooks can be called unconditionally
  const client = useMemo(() => {
    if (isConvexConfigured()) {
      try {
        return getConvexClient();
      } catch (error) {
        console.error("Failed to initialize Convex client:", error);
      }
    } else {
      console.warn(
        "Convex is not configured. Convex features will be disabled. " +
        "Set NEXT_PUBLIC_CONVEX_URL to enable Convex."
      );
    }
    // Return a dummy client with an invalid URL to prevent hook errors
    // The hooks will check isConvexConfigured() before using it
    return new ConvexReactClient("https://dummy.convex.cloud");
  }, []);

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
