"use client";

import Image from "next/image";

/**
 * Lumenda logo background with fixed opacity and overlay.
 * Renders two layers (logo + overlay) to be used inside a relative container.
 * Used in the root layout so all pages share this exact background.
 */
export function PageBackground() {
  return (
    <>
      {/* Full logo visible, centered, no crop */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <Image
          src="/assets/images/logo/logo.png"
          alt=""
          fill
          className="object-contain object-center opacity-[0.18] select-none"
          priority
          sizes="100vw"
        />
      </div>
      {/* Overlay – same as landing */}
      <div
        className="pointer-events-none absolute inset-0 bg-background/55"
        aria-hidden
      />
      {/* Sun/spotlight: warm gradient from top-left, mature and subtle */}
      <div
        className="pointer-events-none absolute inset-0 bg-sun-gradient"
        aria-hidden
      />
    </>
  );
}
