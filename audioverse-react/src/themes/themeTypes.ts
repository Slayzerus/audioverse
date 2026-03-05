// Theme type definitions and CSS variable names
/**
 * Theme / skin definitions for AudioVerse.
 * Each theme defines a full set of CSS custom property values.
 * Themes are applied via data-theme attribute on <html>.
 */

export interface ThemeDef {
  id: string;
  name: string;
  emoji: string;
  /** Optional description */
  description?: string;
  /** Whether this is a dark-base theme (for Bootstrap variant etc.) */
  isDark: boolean;
  /** Optional CSS background pattern/gradient for body */
  bodyBackground?: string;
  vars: Record<string, string>;
}

/** All CSS variable names the theme system controls */
export const THEME_VAR_NAMES = [
  '--bg-primary', '--bg-secondary', '--bg-tertiary', '--bg-elevated',
  '--text-primary', '--text-secondary', '--text-tertiary', '--text-disabled',
  '--border-primary', '--border-secondary',
  '--accent-primary', '--accent-secondary', '--accent-hover',
  '--link-color', '--link-hover',
  '--success', '--warning', '--error', '--info',
  '--shadow-sm', '--shadow-md', '--shadow-lg',
  '--nav-bg', '--nav-text', '--nav-active', '--nav-hover',
  '--dropdown-bg', '--dropdown-text', '--dropdown-hover-bg',
  '--input-bg', '--input-text', '--input-border', '--input-focus-border',
  '--card-bg', '--card-border',
  '--btn-bg', '--btn-text', '--btn-border', '--btn-hover-bg',
  '--scrollbar-track', '--scrollbar-thumb',
] as const;

// ─── Base: Midnight (original dark) ───────────────────────────────