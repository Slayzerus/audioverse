/**
 * Theme system barrel – re-exports everything from the split theme modules.
 * Import from `../themes` (resolves to this index.ts) to keep existing APIs intact.
 */

// Types & constants
export { type ThemeDef, THEME_VAR_NAMES } from './themeTypes';

// Theme registry
export { ALL_THEMES, THEME_MAP, DEFAULT_THEME_ID } from './themeRegistry';

// Catalog persistence
export { THEME_CATALOG_STORAGE_KEY, loadThemeCatalog, saveThemeCatalog, resetThemeCatalog } from './themeCatalog';
