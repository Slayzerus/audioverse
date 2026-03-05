import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";
import {
  loadKaraokeDisplaySettings,
  saveKaraokeDisplaySettings,
  GRADIENT_PRESETS,
  getActiveGradient,
  KARAOKE_FONT_OPTIONS,
  type KaraokeDisplaySettings,
  type KaraokeAnimMode,
} from "../../scripts/karaoke/karaokeDisplaySettings";
import { ensureFontLoaded } from "../../scripts/karaoke/fontCatalog";

const ANIM_MODES: { value: KaraokeAnimMode; label: string; desc: string }[] = [
  { value: "ball", label: "🟡 Ball & Trail", desc: "Classic bouncing ball with paint trail" },
  { value: "wipe", label: "🌊 Wipe", desc: "Color wipe sweeping across note bars" },
  { value: "pulse", label: "💫 Pulse", desc: "Pulsing glow on active notes" },
  { value: "bounce", label: "⬆️ Bounce", desc: "Ball bouncing between syllables" },
];

/** Preview strip showing a gradient */
const GradientPreview: React.FC<{ colors: [string, string, string]; height?: number }> = ({ colors, height = 32 }) => (
  <div
    style={{
      background: `linear-gradient(90deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`,
      height,
      borderRadius: 6,
      border: "1px solid rgba(255,255,255,0.15)",
    }}
  />
);

/** Single color input with hex label */
const ColorInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  focusId: string;
}> = ({ label, value, onChange, focusId }) => (
  <Focusable id={focusId} highlightMode="glow">
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: 36, height: 36, border: "none", cursor: "pointer", borderRadius: 4 }}
      />
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <code style={{ fontSize: 12, color: "var(--text-muted, #888)" }}>{value}</code>
      </div>
    </div>
  </Focusable>
);

const DisplaySettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<KaraokeDisplaySettings>(loadKaraokeDisplaySettings);
  const [saved, setSaved] = useState(false);

  const activeGradient = getActiveGradient(settings);

  // Load selected custom font on mount or change so preview is accurate
  useEffect(() => {
    if (settings.fontFamily) {
      ensureFontLoaded(settings.fontFamily).catch(() => { /* Expected: font loading is best-effort */ });
    }
  }, [settings.fontFamily]);

  const update = useCallback((patch: Partial<KaraokeDisplaySettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveKaraokeDisplaySettings(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return next;
    });
  }, []);

  const updateCustomSung = useCallback((idx: number, color: string) => {
    setSettings(prev => {
      const next = { ...prev, presetId: "custom" as const };
      next.customSungGradient = [...prev.customSungGradient] as [string, string, string];
      next.customSungGradient[idx] = color;
      saveKaraokeDisplaySettings(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return next;
    });
  }, []);

  const updateCustomGold = useCallback((idx: number, color: string) => {
    setSettings(prev => {
      const next = { ...prev, presetId: "custom" as const };
      next.customGoldGradient = [...prev.customGoldGradient] as [string, string, string];
      next.customGoldGradient[idx] = color;
      saveKaraokeDisplaySettings(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return next;
    });
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: "0 16px" }}>
      <h1 style={{ textAlign: "center" }}>{t("displaySettingsPage.title", "Display Settings")}</h1>

      {/* ─── Karaoke Gradient Colors ─── */}
      <section style={{ marginTop: 28 }}>
        <h3>{t("displaySettingsPage.gradientTitle", "Karaoke Gradient Colors")}</h3>
        <p style={{ color: "var(--text-muted, #999)", fontSize: 14, marginBottom: 16 }}>
          {t("displaySettingsPage.gradientDesc", "Choose a color preset or create your own custom gradient for sung lyrics.")}
        </p>

        {/* Preset selector */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
          {GRADIENT_PRESETS.map(preset => (
            <Focusable key={preset.id} id={`disp-preset-${preset.id}`} highlightMode="glow">
              <button
                onClick={() => update({ presetId: preset.id })}
                className={`btn ${settings.presetId === preset.id ? "btn-primary" : "btn-outline-secondary"}`}
                style={{ textAlign: "left", padding: "8px 12px", width: "100%" }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{preset.name}</div>
                <GradientPreview colors={preset.sungGradient} height={20} />
              </button>
            </Focusable>
          ))}
          <Focusable id="disp-preset-custom" highlightMode="glow">
            <button
              onClick={() => update({ presetId: "custom" })}
              className={`btn ${settings.presetId === "custom" ? "btn-primary" : "btn-outline-secondary"}`}
              style={{ textAlign: "left", padding: "8px 12px", width: "100%" }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>🎨 Custom</div>
              <GradientPreview colors={settings.customSungGradient} height={20} />
            </button>
          </Focusable>
        </div>

        {/* Live preview */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
            {t("displaySettingsPage.preview", "Live Preview")}
          </label>
          <div
            style={{
              background: "var(--bg-surface, #1a1a2e)",
              borderRadius: 8,
              padding: "20px 24px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <p style={{
              fontSize: 28,
              fontWeight: 700,
              fontStyle: "italic",
              margin: 0,
              fontFamily: settings.fontFamily || "Arial",
              textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
            }}>
              <span style={{
                background: `linear-gradient(90deg, ${activeGradient.sungGradient[0]} 0%, ${activeGradient.sungGradient[1]} 60%, ${activeGradient.sungGradient[2]} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              } as React.CSSProperties}>
                Sung text looks like{" "}
              </span>
              <span style={{ color: "rgba(255,255,255,0.85)" }}>this</span>
            </p>
            <p style={{
              fontSize: 22,
              fontWeight: 700,
              fontStyle: "italic",
              margin: "8px 0 0",
              textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
            }}>
              <span style={{
                background: `linear-gradient(90deg, ${activeGradient.goldGradient[0]}, ${activeGradient.goldGradient[1]}, ${activeGradient.goldGradient[2]})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: `drop-shadow(0 0 12px ${activeGradient.goldGradient[0]})`,
              } as React.CSSProperties}>
                ★ Golden notes ★
              </span>
            </p>
          </div>
        </div>

        {/* Custom color pickers (only when custom selected) */}
        {settings.presetId === "custom" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
            <div>
              <h5 style={{ marginBottom: 12 }}>{t("displaySettingsPage.sungGradient", "Sung Text Gradient")}</h5>
              <ColorInput label="Start" value={settings.customSungGradient[0]} onChange={c => updateCustomSung(0, c)} focusId="disp-sung-start" />
              <ColorInput label="Middle" value={settings.customSungGradient[1]} onChange={c => updateCustomSung(1, c)} focusId="disp-sung-mid" />
              <ColorInput label="End" value={settings.customSungGradient[2]} onChange={c => updateCustomSung(2, c)} focusId="disp-sung-end" />
              <div style={{ marginTop: 8 }}>
                <GradientPreview colors={settings.customSungGradient} />
              </div>
            </div>
            <div>
              <h5 style={{ marginBottom: 12 }}>{t("displaySettingsPage.goldGradient", "Gold Notes Gradient")}</h5>
              <ColorInput label="Start" value={settings.customGoldGradient[0]} onChange={c => updateCustomGold(0, c)} focusId="disp-gold-start" />
              <ColorInput label="Middle" value={settings.customGoldGradient[1]} onChange={c => updateCustomGold(1, c)} focusId="disp-gold-mid" />
              <ColorInput label="End" value={settings.customGoldGradient[2]} onChange={c => updateCustomGold(2, c)} focusId="disp-gold-end" />
              <div style={{ marginTop: 8 }}>
                <GradientPreview colors={settings.customGoldGradient} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── Animation Mode ─── */}
      <section style={{ marginTop: 32 }}>
        <h3>{t("displaySettingsPage.animTitle", "Timeline Animation")}</h3>
        <p style={{ color: "var(--text-muted, #999)", fontSize: 14, marginBottom: 16 }}>
          {t("displaySettingsPage.animDesc", "Choose how the karaoke timeline animates during singing.")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {ANIM_MODES.map(mode => (
            <Focusable key={mode.value} id={`disp-anim-${mode.value}`} highlightMode="glow">
              <button
                onClick={() => update({ animationMode: mode.value })}
                className={`btn ${settings.animationMode === mode.value ? "btn-primary" : "btn-outline-secondary"}`}
                style={{ textAlign: "left", padding: "10px 14px", width: "100%" }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>{mode.label}</div>
                <div style={{ fontSize: 12, color: settings.animationMode === mode.value ? "rgba(255,255,255,0.8)" : "var(--text-muted, #888)" }}>
                  {mode.desc}
                </div>
              </button>
            </Focusable>
          ))}
        </div>
      </section>

      {/* ─── Font Family ─── */}
      <section style={{ marginTop: 32 }}>
        <h3>Karaoke Font</h3>
        <p style={{ color: "var(--text-muted, #999)", fontSize: 14, marginBottom: 16 }}>
          {t("displaySettingsPage.fontDesc", "Choose a font for the karaoke timeline canvas and lyrics overlay.")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {KARAOKE_FONT_OPTIONS.map(opt => (
            <Focusable key={opt.value} id={`disp-font-${opt.value.replace(/\s+/g, "-")}`} highlightMode="glow">
              <button
                onClick={() => update({ fontFamily: opt.value })}
                className={`btn ${settings.fontFamily === opt.value ? "btn-primary" : "btn-outline-secondary"}`}
                style={{ textAlign: "left", padding: "10px 14px", fontFamily: opt.value, width: "100%" }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: settings.fontFamily === opt.value ? "rgba(255,255,255,0.8)" : "var(--text-muted, #888)" }}>
                  The quick brown fox
                </div>
              </button>
            </Focusable>
          ))}
        </div>
      </section>

      {/* Saved toast */}
      {saved && (
        <div
          className="alert alert-success"
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 1050,
            animation: "fadeIn 0.2s ease",
            maxWidth: 280,
          }}
        >
          ✅ {t("displaySettingsPage.saved", "Settings saved!")}
        </div>
      )}
    </div>
  );
};

export default DisplaySettingsPage;
