/**
 * Lumenda brand colors extracted from the logo.
 * Single source of truth for the palette; mirrored in app/globals.css for Tailwind.
 * Use these constants when you need color values in JS/TS (e.g. charts, inline styles).
 */

export const LUMENDA_COLORS = {
  /** Deep indigo – main background */
  background: "#1e1136",
  /** Light cyan tint – primary text on dark */
  foreground: "#e0f7ff",
  /** Neon cyan – primary accent, CTAs, glow */
  primary: "#00e0ff",
  /** Dark for text on primary buttons */
  primaryForeground: "#1e1136",
  /** Electric purple / magenta – gradient start, secondary actions */
  secondary: "#a855f7",
  /** Coral / orange-pink – gradient end, tertiary accent */
  tertiary: "#ff6040",
  /** Purple-pink – gradient mid, highlights */
  accent: "#c084fc",
  /** Darker purple – muted elements, borders */
  muted: "#500050",
  /** Slightly lighter than background – cards, surfaces */
  card: "#2a1a4a",
  /** Subtle border on dark */
  border: "rgba(168, 85, 247, 0.25)",
  /** Input borders */
  input: "rgba(224, 231, 255, 0.12)",
  /** Focus ring */
  ring: "#00e0ff",
  /** Destructive (keep distinct) */
  destructive: "#ef4444",
  /** Chart / data series (gradient-aligned) */
  chart1: "#00e0ff",
  chart2: "#a855f7",
  chart3: "#ff6040",
  chart4: "#c084fc",
  chart5: "#e000ff",
} as const;

export type LumendaColorKey = keyof typeof LUMENDA_COLORS;
