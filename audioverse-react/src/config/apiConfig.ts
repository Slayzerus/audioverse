/**
 * Centralized API URL configuration.
 *
 * Single source of truth for the backend API root URL.
 * Priority: Vite env → CRA env → window global → default (localhost).
 *
 * All other modules (audioverseApiClient, hub services, etc.)
 * should import API_ROOT from here.
 */

// TypeScript requires `var` in `declare global` blocks; `let`/`const` are not allowed.
declare global {
    // eslint-disable-next-line no-var
    var __AUDIOVERSE_API_ROOT__: string | undefined;
}

/** Default fallback used in local development. */
const DEFAULT_API_ROOT = "http://localhost:5000";

// safe Vite env retrieval (import.meta.env.*)
const fromVite = (() => {
    try {
        return import.meta.env.VITE_AUDIOVERSE_API_ROOT as string | undefined;
    } catch {
        return undefined;
    }
})();

// CRA-style env (for backward compat / SSR)
const fromCra = ((globalThis as Record<string, unknown>)
    ?.process as { env?: Record<string, string | undefined> } | undefined)
    ?.env?.REACT_APP_AUDIOVERSE_API_ROOT;

// Window override (e.g. <script>window.__AUDIOVERSE_API_ROOT__="..."</script>)
const fromWindow = globalThis.__AUDIOVERSE_API_ROOT__;

/**
 * Resolved API root URL.
 *
 * @example
 *   import { API_ROOT } from '@/config/apiConfig';
 *   fetch(`${API_ROOT}/api/health`);
 */
export const API_ROOT: string = fromVite || fromCra || fromWindow || DEFAULT_API_ROOT;
