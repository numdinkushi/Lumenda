"use client";

import { useMemo } from "react";

/**
 * Respects prefers-reduced-motion for animations.
 * Use to shorten or skip the logo trace on load.
 */
export function useReducedMotion(): boolean {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    return mq.matches;
  }, []);
}
