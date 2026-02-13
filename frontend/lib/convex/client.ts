/**
 * Convex client configuration and initialization.
 * Provides a configured Convex client for the application.
 */

import { ConvexReactClient } from "convex/react";

/**
 * Get the Convex URL from environment variables.
 * Returns undefined if not configured.
 */
function getConvexUrl(): string | undefined {
  if (typeof window === "undefined") {
    // Server-side: return undefined (Next.js will handle this)
    return undefined;
  }

  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url || url.trim() === "") {
    return undefined;
  }

  return url;
}

/**
 * Check if Convex is properly configured.
 */
export function isConvexConfigured(): boolean {
  const url = getConvexUrl();
  return !!url;
}

/**
 * Create and export the Convex client instance.
 * Only creates the client if a valid URL is available.
 * This client is used throughout the application for Convex operations.
 */
let convexClient: ConvexReactClient | null = null;

export function getConvexClient(): ConvexReactClient {
  if (!convexClient) {
    const url = getConvexUrl();
    if (!url) {
      throw new Error(
        "Convex is not configured. Please set NEXT_PUBLIC_CONVEX_URL in your environment variables."
      );
    }
    convexClient = new ConvexReactClient(url);
  }
  return convexClient;
}
