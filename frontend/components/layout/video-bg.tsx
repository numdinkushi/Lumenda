"use client";

const VIDEO_SRC = "/assets/video/lumenda_bg.mp4";

/**
 * Full-page animated video background. Use in layout to wrap all pages.
 * Video is blended into the page background (mix-blend-mode + gradient overlay).
 */
export function VideoBg() {
  return (
    <>
      {/* Video blends into page background (soft-light + base color behind video) */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden bg-background"
        aria-hidden
      >
        <video
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-contain object-center select-none opacity-80 mix-blend-soft-light"
        />
      </div>
      {/* Gradient blend: background color from edges + center tint so video melts in */}
      <div
        className="pointer-events-none absolute inset-0 bg-video-blend-overlay"
        aria-hidden
      />
      {/* Sun/spotlight: warm gradient from top-left */}
      <div
        className="pointer-events-none absolute inset-0 bg-sun-gradient"
        aria-hidden
      />
    </>
  );
}
