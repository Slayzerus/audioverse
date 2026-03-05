import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import { ALL_THEMES, DEFAULT_THEME_ID, THEME_MAP, loadThemeCatalog, type ThemeDef } from "../themes";
import { loadUserSettings, syncSettingToBackend } from "../scripts/settingsSync";

export type Theme = "dark" | "light"; // kept for backward compat

interface ThemeContextType {
  /** Current theme id (e.g. 'midnight', 'synthwave') */
  themeId: string;
  /** Full theme definition */
  themeDef: ThemeDef;
  /** Legacy compat: 'dark' or 'light' */
  theme: Theme;
  setThemeById: (id: string) => void;
  /** Legacy compat */
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** All available themes */
  availableThemes: ThemeDef[];
}

const STORAGE_KEY = "audioverse-theme-id";

function loadStoredThemeId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEME_MAP[stored]) return stored;
    // Migration: check old key
    const oldKey = localStorage.getItem("app-theme");
    if (oldKey === "light") return "daylight";
  } catch { /* SSR / no storage */ }
  return DEFAULT_THEME_ID;
}

function applyThemeToDOM(themeDef: ThemeDef): void {
  const root = document.documentElement;
  // Set data-theme for any CSS selectors that still reference it
  root.setAttribute("data-theme", themeDef.isDark ? "dark" : "light");
  root.setAttribute("data-skin", themeDef.id);

  // Apply all CSS vars
  for (const [key, value] of Object.entries(themeDef.vars)) {
    root.style.setProperty(key, value);
  }

  // Apply body background (gradient or solid)
  if (themeDef.bodyBackground) {
    document.body.style.background = themeDef.bodyBackground;
  } else {
    document.body.style.background = '';
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [availableThemes, setAvailableThemes] = useState<ThemeDef[]>(() => loadThemeCatalog());
  const [themeId, setThemeIdState] = useState<string>(loadStoredThemeId);
  const initialSyncDone = useRef(false);

  // Hydrate theme from backend on first load (if authenticated)
  useEffect(() => {
    if (initialSyncDone.current) return;
    loadUserSettings().then(s => {
      if (s?.theme && THEME_MAP[s.theme]) {
        setThemeIdState(s.theme);
      }
      initialSyncDone.current = true;
    });
  }, []);

  useEffect(() => {
    setAvailableThemes(loadThemeCatalog());
  }, []);

  const themeMap = useMemo(() => {
    return Object.fromEntries(availableThemes.map((theme) => [theme.id, theme])) as Record<string, ThemeDef>;
  }, [availableThemes]);

  const fallbackTheme = themeMap[DEFAULT_THEME_ID] ?? availableThemes[0] ?? ALL_THEMES[0];
  const themeDef = themeMap[themeId] ?? fallbackTheme;

  useEffect(() => {
    if (!themeMap[themeId] && fallbackTheme?.id) {
      setThemeIdState(fallbackTheme.id);
    }
  }, [themeId, themeMap, fallbackTheme]);

  useEffect(() => {
    applyThemeToDOM(themeDef);
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch { /* Expected: localStorage may be unavailable (SSR/private browsing) */ }
    // Sync to backend (debounced, fire-and-forget)
    if (initialSyncDone.current) {
      syncSettingToBackend({ theme: themeId });
    }
  }, [themeId, themeDef]);

  const setThemeById = useCallback((id: string) => {
    if (themeMap[id]) setThemeIdState(id);
  }, [themeMap]);

  // Legacy compat
  const setTheme = useCallback((t: Theme) => {
    setThemeIdState(t === "light" ? "daylight" : "midnight");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeIdState(prev => {
      const current = themeMap[prev] ?? fallbackTheme;
      const preferred = current.isDark ? "daylight" : "midnight";
      if (themeMap[preferred]) return preferred;

      const opposite = availableThemes.find((theme) => theme.isDark !== current.isDark);
      return opposite?.id ?? fallbackTheme.id;
    });
  }, [themeMap, availableThemes, fallbackTheme]);

  return (
    <ThemeContext.Provider value={{
      themeId,
      themeDef,
      theme: themeDef.isDark ? "dark" : "light",
      setThemeById,
      setTheme,
      toggleTheme,
      availableThemes,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
