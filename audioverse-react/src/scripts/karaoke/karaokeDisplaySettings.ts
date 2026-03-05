/**
 * Karaoke display settings — user-configurable visual options
 * persisted in localStorage and applied as CSS custom properties.
 */
import type { CurtainEffect } from "../../components/common/CurtainTransition";
import { loadUserSettings, syncSettingToBackend } from "../settingsSync";
export type { CurtainEffect };

const STORAGE_KEY = "audioverse-karaoke-display";

/** Gradient color preset definition */
export interface GradientPreset {
  id: string;
  name: string;
  /** [start, mid, end] hex colors for the sung-text sweep */
  sungGradient: [string, string, string];
  /** Gold note gradient */
  goldGradient: [string, string, string];
  /** Glow color for active syllables */
  glowColor: string;
}

import { FONT_CATALOG } from "./fontCatalog";

/** Karaoke animation mode */
export type KaraokeAnimMode = "ball" | "wipe" | "pulse" | "bounce";

/** Font options for karaoke display — system fonts + fonts from public/fonts/ catalog */
export const KARAOKE_FONT_OPTIONS: { value: string; label: string }[] = [
  // System fonts
  { value: "Arial", label: "Arial (default)" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet MS" },
  { value: "Impact, sans-serif", label: "Impact" },
  // Catalog fonts from public/fonts/
  ...FONT_CATALOG.map(f => ({ value: f.family, label: f.family })),
];

/** Persisted display settings */
export interface KaraokeDisplaySettings {
  /** Color preset id or 'custom' */
  presetId: string;
  /** Custom gradient colors (used when presetId === 'custom') */
  customSungGradient: [string, string, string];
  customGoldGradient: [string, string, string];
  customGlowColor: string;
  /** Animation mode for the timeline canvas */
  animationMode: KaraokeAnimMode;
  /** Font family for canvas text and lyrics overlay */
  fontFamily: string;

  // ── Curtain transition settings ──
  /** Transition effect shown between karaoke scenes */
  transitionEffect: CurtainEffect;
  /** Primary curtain / overlay color */
  curtainPrimaryColor: string;
  /** Secondary accent color (gradients, trims) */
  curtainSecondaryColor: string;
  /** Transition animation duration in ms */
  curtainDurationMs: number;
  /** Enter immersive mode (hide navbar) while singing */
  immersiveMode: boolean;
}

/** Built-in gradient presets */
export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: "default",
    name: "Cyan → Yellow → Amber",
    sungGradient: ["#00e5ff", "#ffe600", "#ffab00"],
    goldGradient: ["#FFD700", "#FFA000", "#FFD700"],
    glowColor: "rgba(0,229,255,0.6)",
  },
  {
    id: "neon-pink",
    name: "Neon Pink → Violet → Blue",
    sungGradient: ["#ff1493", "#9b59b6", "#3498db"],
    goldGradient: ["#FFD700", "#FF69B4", "#FFD700"],
    glowColor: "rgba(255,20,147,0.6)",
  },
  {
    id: "fire",
    name: "Red → Orange → Yellow",
    sungGradient: ["#ff1744", "#ff9100", "#ffea00"],
    goldGradient: ["#FFD700", "#FF6D00", "#FFD700"],
    glowColor: "rgba(255,23,68,0.6)",
  },
  {
    id: "ocean",
    name: "Deep Blue → Teal → Aqua",
    sungGradient: ["#1a237e", "#00897b", "#00e5ff"],
    goldGradient: ["#FFD700", "#00BCD4", "#FFD700"],
    glowColor: "rgba(0,137,123,0.6)",
  },
  {
    id: "forest",
    name: "Green → Lime → Yellow",
    sungGradient: ["#1b5e20", "#76ff03", "#ffea00"],
    goldGradient: ["#FFD700", "#76ff03", "#FFD700"],
    glowColor: "rgba(118,255,3,0.6)",
  },
  {
    id: "retro",
    name: "Orange → Pink → Purple",
    sungGradient: ["#ff6d00", "#e91e63", "#7b1fa2"],
    goldGradient: ["#FFD700", "#E91E63", "#FFD700"],
    glowColor: "rgba(233,30,99,0.6)",
  },
];

const DEFAULT_SETTINGS: KaraokeDisplaySettings = {
  presetId: "default",
  customSungGradient: ["#00e5ff", "#ffe600", "#ffab00"],
  customGoldGradient: ["#FFD700", "#FFA000", "#FFD700"],
  customGlowColor: "rgba(0,229,255,0.6)",
  animationMode: "ball",
  fontFamily: "Arial",
  transitionEffect: "none" as CurtainEffect,
  curtainPrimaryColor: "#8b0000",
  curtainSecondaryColor: "#1a0000",
  curtainDurationMs: 900,
  immersiveMode: false,
};

/** Load settings from localStorage, with backend hydration on first call */
let _hydratedFromBackend = false;
export function loadKaraokeDisplaySettings(): KaraokeDisplaySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<KaraokeDisplaySettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* Expected: localStorage or JSON parse may fail */ }
  return { ...DEFAULT_SETTINGS };
}

/** Hydrate from backend once (call early in app lifecycle) */
export async function hydrateKaraokeDisplayFromBackend(): Promise<void> {
  if (_hydratedFromBackend) return;
  _hydratedFromBackend = true;
  const s = await loadUserSettings();
  if (s?.karaokeDisplaySettings) {
    try {
      const remote = JSON.parse(s.karaokeDisplaySettings);
      const merged = { ...DEFAULT_SETTINGS, ...remote };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch { /* Expected: remote settings JSON may be malformed */ }
  }
}

/** Save settings to localStorage + backend */
export function saveKaraokeDisplaySettings(settings: KaraokeDisplaySettings): void {
  const json = JSON.stringify(settings);
  localStorage.setItem(STORAGE_KEY, json);
  applyKaraokeDisplayVars(settings);
  syncSettingToBackend({ karaokeDisplaySettings: json });
}

/** Get the active gradient colors based on current settings */
export function getActiveGradient(settings: KaraokeDisplaySettings): {
  sungGradient: [string, string, string];
  goldGradient: [string, string, string];
  glowColor: string;
} {
  if (settings.presetId === "custom") {
    return {
      sungGradient: settings.customSungGradient,
      goldGradient: settings.customGoldGradient,
      glowColor: settings.customGlowColor,
    };
  }
  const preset = GRADIENT_PRESETS.find(p => p.id === settings.presetId);
  if (preset) {
    return {
      sungGradient: preset.sungGradient,
      goldGradient: preset.goldGradient,
      glowColor: preset.glowColor,
    };
  }
  return {
    sungGradient: DEFAULT_SETTINGS.customSungGradient,
    goldGradient: DEFAULT_SETTINGS.customGoldGradient,
    glowColor: DEFAULT_SETTINGS.customGlowColor,
  };
}

/** Apply karaoke display CSS custom properties to :root */
export function applyKaraokeDisplayVars(settings: KaraokeDisplaySettings): void {
  const { sungGradient, goldGradient, glowColor } = getActiveGradient(settings);
  const root = document.documentElement;

  root.style.setProperty(
    "--karaoke-sung-gradient",
    `linear-gradient(90deg, ${sungGradient[0]} 0%, ${sungGradient[1]} 60%, ${sungGradient[2]} 100%)`
  );
  root.style.setProperty(
    "--karaoke-gold-gradient",
    `linear-gradient(90deg, ${goldGradient[0]}, ${goldGradient[1]}, ${goldGradient[2]})`
  );
  root.style.setProperty(
    "--karaoke-gold-glow-first",
    `0 0 12px ${goldGradient[0]}`
  );
  root.style.setProperty(
    "--karaoke-active-glow",
    `0 0 10px ${glowColor}, 0 0 4px ${sungGradient[1]}80`
  );
  root.style.setProperty(
    "--karaoke-active-drop-first",
    `0 0 6px ${glowColor}`
  );
  root.style.setProperty(
    "--karaoke-active-bg",
    `linear-gradient(90deg, transparent 0%, ${sungGradient[0]}14 20%, ${sungGradient[1]}10 80%, transparent 100%)`
  );
  root.style.setProperty("--karaoke-font-family", settings.fontFamily || "Arial");
}

/** Initialize karaoke display vars on app startup */
export function initKaraokeDisplaySettings(): void {
  const settings = loadKaraokeDisplaySettings();
  applyKaraokeDisplayVars(settings);
}
