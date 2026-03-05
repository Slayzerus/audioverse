import type { ThemeDef } from './themeTypes';
import { ALL_THEMES } from './themeRegistry';
import { syncSettingToBackend, loadUserSettings } from '../scripts/settingsSync';

export const THEME_CATALOG_STORAGE_KEY = "audioverse-theme-catalog";

function isThemeDef(value: unknown): value is ThemeDef {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ThemeDef>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.emoji !== "string" ||
    typeof candidate.isDark !== "boolean" ||
    !candidate.vars ||
    typeof candidate.vars !== "object"
  ) {
    return false;
  }
  return Object.values(candidate.vars).every((entry) => typeof entry === "string");
}

export function loadThemeCatalog(): ThemeDef[] {
  try {
    const raw = localStorage.getItem(THEME_CATALOG_STORAGE_KEY);
    if (!raw) return ALL_THEMES;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ALL_THEMES;

    const validThemes = parsed.filter(isThemeDef);
    if (validThemes.length === 0) return ALL_THEMES;

    return validThemes;
  } catch {
    /* Expected: localStorage or JSON.parse may fail */
    return ALL_THEMES;
  }
}

/** Hydrate from backend once */
let _catalogHydrated = false;
export async function hydrateThemeCatalogFromBackend(): Promise<void> {
  if (_catalogHydrated) return;
  _catalogHydrated = true;
  const s = await loadUserSettings();
  if (s?.customThemes) {
    try {
      const remote = JSON.parse(s.customThemes);
      if (Array.isArray(remote) && remote.length > 0) {
        localStorage.setItem(THEME_CATALOG_STORAGE_KEY, JSON.stringify(remote));
      }
    } catch { /* Expected: remote theme JSON may be malformed */ }
  }
}

export function saveThemeCatalog(themes: ThemeDef[]): void {
  const json = JSON.stringify(themes);
  localStorage.setItem(THEME_CATALOG_STORAGE_KEY, json);
  syncSettingToBackend({ customThemes: json });
}

export function resetThemeCatalog(): void {
  localStorage.removeItem(THEME_CATALOG_STORAGE_KEY);
  syncSettingToBackend({ customThemes: null });
}
