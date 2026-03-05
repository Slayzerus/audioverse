import React, { useCallback, useEffect, useRef } from "react";
import { getAudioContext, resumeAudioContext } from "../../scripts/audioContext";

export interface AudioActivationOverlayProps {
  /** Called once audio has been activated (user gesture completed). */
  onActivated: () => void;
  /** Optional label – defaults to "Aktywuj audio 🔊" */
  label?: string;
  /** Optional subtitle text */
  subtitle?: string;
}

/**
 * Full-screen overlay that activates (resumes) the Web Audio AudioContext
 * via a user gesture.  Responds to mouse click, Enter/Space, or any
 * gamepad button, so it works seamlessly on TV / console setups.
 */
const AudioActivationOverlay: React.FC<AudioActivationOverlayProps> = ({
  onActivated,
  label = "Aktywuj audio 🔊",
  subtitle = "Kliknij lub naciśnij przycisk na padzie, aby uruchomić dźwięk",
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const activate = useCallback(() => {
    try {
      // Create/resume global AudioContext synchronously within user-gesture call-stack
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => { /* Expected: AudioContext resume may fail silently */ });
      }
    } catch {
      // swallow – best-effort
    }
    // Also fire the async helper
    resumeAudioContext().catch(() => { /* Expected: AudioContext resume is best-effort */ });
    onActivated();
  }, [onActivated]);

  // Auto-focus the button
  useEffect(() => {
    btnRef.current?.focus();
  }, []);

  // Listen for any gamepad button press
  useEffect(() => {
    let raf: number;
    const poll = () => {
      const pads = navigator.getGamepads
        ? Array.from(navigator.getGamepads()).filter(Boolean)
        : [];
      for (const pad of pads) {
        if (pad?.buttons.some((b) => b.pressed)) {
          activate();
          return;
        }
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [activate]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.85)",
      }}
      onClick={activate}
    >
      <button
        ref={btnRef}
        style={{
          fontSize: 36,
          fontWeight: 700,
          padding: "28px 56px",
          borderRadius: 16,
          border: "none",
          background: "linear-gradient(135deg,#6366f1,#06b6d4)",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(99,102,241,.4)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          activate();
        }}
      >
        {label}
      </button>
      <p style={{ color: "#aaa", marginTop: 20, fontSize: 16, textAlign: "center" }}>
        {subtitle}
      </p>
    </div>
  );
};

export default AudioActivationOverlay;
