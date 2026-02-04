"use client";

const VIDEO_SRC = "/assets/video/lumenda_bg.mp4";

/**
 * Full-page animated video background (landing only).
 * Uses same opacity + overlay as PageBackground so it blends like the image bg.
 */
export function VideoBg() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        <video
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-contain object-center select-none opacity-[0.18]"
        />
      </div>
      {/* Same overlay as image bg – keeps video integrated, not a separate layer */}
      <div
        className="pointer-events-none absolute inset-0 bg-background/55"
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
