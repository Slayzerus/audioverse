import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { NOTE_SOUND_SETS, loadSoundSetId, saveSoundSetId } from "../../config/noteSoundSets";
import { preloadNoteBuffers, playNoteBuffer } from "../NoteRiver";
import { resumeAudioContext } from "../../scripts/audioContext";

/**
 * Theme/skin picker — dropdown palette showing all available skins
 * with colored preview swatches. Replaces the old ThemeToggle.
 */
const ThemePicker: React.FC = () => {
  const { themeId, themeDef, setThemeById, availableThemes } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [soundSetId, setSoundSetId] = useState(loadSoundSetId);
  const [tooltipSet, setTooltipSet] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={t("nav.themePicker", "Change theme")}
        title={t("nav.themePicker", "Change theme")}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-primary)",
          borderRadius: 8,
          minHeight: 40,
          padding: "4px 12px",
          color: "var(--text-primary)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          fontSize: 14,
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 18 }}>{themeDef.emoji}</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 10000,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            borderRadius: 12,
            boxShadow: "var(--shadow-lg)",
            padding: 8,
            minWidth: 280,
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {/* ── Skin grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 4,
            }}
          >
          {availableThemes.map((skin) => {
            const isActive = skin.id === themeId;
            const bg1 = skin.vars["--bg-primary"];
            const bg2 = skin.vars["--bg-secondary"];
            const accent = skin.vars["--accent-primary"];
            const accent2 = skin.vars["--accent-secondary"] || accent;
            const text = skin.vars["--text-primary"];

            return (
              <button
                key={skin.id}
                onClick={() => {
                  setThemeById(skin.id);
                  setOpen(false);
                }}
                aria-label={skin.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: isActive
                    ? `2px solid ${accent}`
                    : "2px solid transparent",
                  background: isActive
                    ? "var(--bg-tertiary)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                  width: "100%",
                  color: "var(--text-primary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--bg-secondary)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Color swatch */}
                <div
                  style={{
                    width: 32,
                    height: 24,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${bg1} 0%, ${bg2} 50%, ${accent} 100%)`,
                    border: `1px solid ${accent}`,
                    flexShrink: 0,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Mini accent dot */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: accent2,
                    }}
                  />
                  {/* Mini text preview */}
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      left: 3,
                      fontSize: 5,
                      color: text,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    Aa
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>
                    {skin.emoji} {skin.name}
                  </span>
                  {skin.description && (
                    <span style={{ fontSize: 10, opacity: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {skin.description}
                    </span>
                  )}
                </div>

                {isActive && (
                  <span style={{ marginLeft: "auto", color: accent, fontSize: 14 }}>✓</span>
                )}
              </button>
            );
          })}
          </div>

          {/* ── Divider ── */}
          <div style={{
            height: 1,
            background: "var(--border-primary)",
            margin: "8px 0",
          }} />

          {/* ── Note sound picker ── */}
          <div style={{ padding: "0 2px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-primary)" }}>
              {t("nav.noteSound", "Note sound")}
            </div>
            {NOTE_SOUND_SETS.map((ss) => {
              const isActive = ss.id === soundSetId;
              return (
                <div key={ss.id} style={{ display: "flex", alignItems: "center", gap: 4, position: "relative" }}>
                  <button
                    onClick={() => {
                      setSoundSetId(ss.id);
                      saveSoundSetId(ss.id);
                    }}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
                      background: isActive ? "var(--bg-tertiary)" : "transparent",
                      cursor: "pointer",
                      color: "var(--text-primary)",
                      fontSize: 12,
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 14 }}>{ss.emoji}</span>
                    <span style={{ fontWeight: isActive ? 700 : 400 }}>{ss.name}</span>
                    {isActive && <span style={{ marginLeft: "auto", color: "var(--accent-primary)", fontSize: 12 }}>✓</span>}
                  </button>

                  {/* Play preview button */}
                  {ss.dir && (
                    <button
                      title={t("nav.previewSound", "Preview")}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          resumeAudioContext();
                          await preloadNoteBuffers(ss.id);
                          // Play a quick C5 (MIDI 72) preview
                          playNoteBuffer(72);
                        } catch { /* Expected: audio preview may fail if AudioContext is suspended or buffers not loaded */ }
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-secondary, var(--text-primary))",
                        fontSize: 14,
                        padding: "2px 4px",
                        borderRadius: 4,
                        opacity: 0.6,
                        transition: "opacity 0.15s",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                    >
                      ▶
                    </button>
                  )}

                  {/* Attribution tooltip */}
                  {ss.attribution && (
                    <button
                      title={ss.attribution}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTooltipSet(tooltipSet === ss.id ? null : ss.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-secondary, var(--text-primary))",
                        fontSize: 12,
                        padding: "2px 4px",
                        borderRadius: 4,
                        opacity: 0.5,
                        transition: "opacity 0.15s",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
                    >
                      ℹ
                    </button>
                  )}

                  {/* Attribution popup */}
                  {tooltipSet === ss.id && ss.attribution && (
                    <div style={{
                      position: "absolute",
                      bottom: "calc(100% + 4px)",
                      right: 0,
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 10,
                      color: "var(--text-secondary, var(--text-primary))",
                      boxShadow: "var(--shadow-md, 0 2px 8px rgba(0,0,0,.3))",
                      maxWidth: 240,
                      whiteSpace: "normal",
                      zIndex: 10001,
                      lineHeight: 1.4,
                    }}>
                      {ss.attribution}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemePicker;
