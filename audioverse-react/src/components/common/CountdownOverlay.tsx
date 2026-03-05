import React from "react";

export interface CountdownOverlayProps {
  /** Number of seconds remaining (null = hidden) */
  seconds: number | null;
  /** z-index (default 350) */
  zIndex?: number;
}

/**
 * Full-screen countdown overlay (3… 2… 1…).
 * Renders nothing when seconds is null.
 */
const CountdownOverlay: React.FC<CountdownOverlayProps> = React.memo(function CountdownOverlay({ seconds, zIndex = 350 }) {
  if (seconds === null) return null;
    return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay-bg, rgba(0,0,0,0.7))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 144,
          fontWeight: 900,
          color: "var(--text-on-overlay, #fff)",
          textShadow: "var(--countdown-text-shadow, 0 0 60px rgba(99,102,241,0.8), 0 8px 32px rgba(0,0,0,0.5))",
          animation: "pulse 0.9s ease-in-out infinite",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {seconds}
      </div>
    </div>
  );
});
CountdownOverlay.displayName = "CountdownOverlay";

export default CountdownOverlay;
