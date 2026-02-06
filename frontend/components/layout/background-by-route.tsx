"use client";

import { usePathname } from "next/navigation";
import { PageBackground } from "@/components/layout/page-background";
import { VideoBg } from "@/components/layout/video-bg";

/**
 * Renders video background on landing (/) only; image background on all other pages.
 */
export function BackgroundByRoute() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return isLanding ? <VideoBg /> : <PageBackground />;
}
