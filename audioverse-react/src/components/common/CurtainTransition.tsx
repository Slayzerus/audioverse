/**
 * CurtainTransition — Polished full-screen transition overlay
 * for karaoke scene changes (start singing, song end, restart, navigate away).
 *
 * Supports 20+ visual effects. Each effect has a "cover" phase (overlay covers screen)
 * and a "reveal" phase (overlay uncovers screen).
 */
import React, { useEffect, useRef, useMemo } from "react";
import "./CurtainTransition.css";

// ── Effect type ──
export type CurtainEffect =
  | "none"
  | "fade"
  | "fadeWhite"
  | "flash"
  | "wipeDown"
  | "wipeUp"
  | "wipeLeft"
  | "wipeRight"
  | "curtainH"
  | "curtainV"
  | "theaterCurtain"
  | "circleIris"
  | "diamondIris"
  | "starWipe"
  | "diagonalWipe"
  | "blindsH"
  | "blindsV"
  | "zoomFade"
  | "zoomRotate"
  | "doorOpen"
  | "glitch"
  | "pixelate";

/** Label catalog for settings UI */
export const CURTAIN_EFFECTS: { value: CurtainEffect; label: string }[] = [
  { value: "none",           label: "Brak" },
  { value: "fade",           label: "Ściemnienie (czarne)" },
  { value: "fadeWhite",      label: "Rozjaśnienie (białe)" },
  { value: "flash",          label: "Błysk" },
  { value: "wipeDown",       label: "Zasłona w dół" },
  { value: "wipeUp",         label: "Zasłona w górę" },
  { value: "wipeLeft",       label: "Przesunięcie w lewo" },
  { value: "wipeRight",      label: "Przesunięcie w prawo" },
  { value: "curtainH",       label: "Kurtyna pozioma" },
  { value: "curtainV",       label: "Kurtyna pionowa" },
  { value: "theaterCurtain", label: "Kurtyna teatralna 🎭" },
  { value: "circleIris",     label: "Przysłona kołowa" },
  { value: "diamondIris",    label: "Przysłona diamentowa" },
  { value: "starWipe",       label: "Gwiazda ⭐" },
  { value: "diagonalWipe",   label: "Przekątna" },
  { value: "blindsH",        label: "Żaluzje poziome" },
  { value: "blindsV",        label: "Żaluzje pionowe" },
  { value: "zoomFade",       label: "Zoom" },
  { value: "zoomRotate",     label: "Zoom z obrotem" },
  { value: "doorOpen",       label: "Drzwi 3D" },
  { value: "glitch",         label: "Glitch" },
  { value: "pixelate",       label: "Piksele" },
];

// ── Props ──
export interface CurtainTransitionProps {
  /** Whether the transition is active */
  active: boolean;
  /** Visual effect type */
  effect: CurtainEffect;
  /** Phase: "cover" = overlay appears, "reveal" = overlay disappears */
  phase: "cover" | "reveal";
  /** Primary color (default: #0a0a0a) */
  primaryColor?: string;
  /** Secondary color for gradients/accents (default: #1a1a2e) */
  secondaryColor?: string;
  /** Animation duration in ms (default: 800) */
  durationMs?: number;
  /** Called when the transition animation completes */
  onComplete: () => void;
}

// ── Helpers ──
const TWO_PANEL_EFFECTS = new Set<CurtainEffect>(["curtainH", "curtainV", "theaterCurtain", "doorOpen"]);
const BLINDS_EFFECTS = new Set<CurtainEffect>(["blindsH", "blindsV"]);
const BLINDS_COUNT = 8;
const PIXEL_COLS = 8;
const PIXEL_ROWS = 5;

/** Compute radial delay for pixelate cells (center → outward) */
function pixelDelay(index: number, cols: number, rows: number, totalDurationMs: number): number {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const dist = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2);
  return Math.round((dist / maxDist) * totalDurationMs * 0.55);
}

// ── Component ──
const CurtainTransition: React.FC<CurtainTransitionProps> = ({
  active,
  effect,
  phase,
  primaryColor = "#0a0a0a",
  secondaryColor = "#1a1a2e",
  durationMs = 800,
  onComplete,
}) => {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const timerRef = useRef<number>(0);

  // Pixel delays (memoized)
  const pixelDelays = useMemo(() => {
    if (effect !== "pixelate") return [];
    const total = PIXEL_COLS * PIXEL_ROWS;
    return Array.from({ length: total }, (_, i) =>
      pixelDelay(i, PIXEL_COLS, PIXEL_ROWS, durationMs)
    );
  }, [effect, durationMs]);

  // Trigger onComplete after animation duration
  useEffect(() => {
    if (!active || effect === "none") return;
    // For blinds/pixelate the total duration includes staggered delays
    let totalMs = durationMs + 50;
    if (BLINDS_EFFECTS.has(effect)) {
      totalMs = durationMs + BLINDS_COUNT * 40 + 80;
    } else if (effect === "pixelate") {
      const maxDelay = Math.max(0, ...pixelDelays);
      totalMs = durationMs * 0.5 + maxDelay + 80;
    }
    timerRef.current = window.setTimeout(() => onCompleteRef.current(), totalMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, effect, phase, durationMs, pixelDelays]);

  if (!active || effect === "none") return null;

  const classes = `ct-root ct-effect--${effect} ct-phase--${phase}`;
  const style = {
    "--ct-primary": primaryColor,
    "--ct-secondary": secondaryColor,
    "--ct-duration": `${durationMs}ms`,
  } as React.CSSProperties;

  // ── Two-panel effects ──
  if (TWO_PANEL_EFFECTS.has(effect)) {
    return (
      <div className={classes} style={style}>
        <div className="ct-panel ct-panel-1" />
        <div className="ct-panel ct-panel-2" />
      </div>
    );
  }

  // ── Blinds effects ──
  if (BLINDS_EFFECTS.has(effect)) {
    return (
      <div className={classes} style={style}>
        {Array.from({ length: BLINDS_COUNT }, (_, i) => (
          <div
            key={i}
            className="ct-strip"
            style={
              {
                "--ct-strip-i": i,
                "--ct-strip-n": BLINDS_COUNT,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    );
  }

  // ── Glitch effect ──
  if (effect === "glitch") {
    return (
      <div className={classes} style={style}>
        <div className="ct-layer ct-glitch-1" />
        <div className="ct-layer ct-glitch-2" />
        <div className="ct-layer ct-glitch-3" />
      </div>
    );
  }

  // ── Pixelate effect ──
  if (effect === "pixelate") {
    return (
      <div className={classes} style={style}>
        <div
          className="ct-grid"
          style={
            { "--ct-cols": PIXEL_COLS, "--ct-rows": PIXEL_ROWS } as React.CSSProperties
          }
        >
          {pixelDelays.map((delay, i) => (
            <div
              key={i}
              className="ct-cell"
              style={{ "--ct-cell-delay": delay } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Default: single layer ──
  return (
    <div className={classes} style={style}>
      <div className="ct-layer" />
    </div>
  );
};

export default CurtainTransition;
