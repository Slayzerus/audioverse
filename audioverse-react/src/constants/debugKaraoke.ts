/**
 * Global debug flag for the entire karaoke flow.
 *
 * When enabled, detailed step-by-step console.log messages are emitted
 * across all karaoke-related hooks and services — visible even in
 * production builds (bypasses the scoped logger level).
 *
 * Toggle via:
 *  - Environment variable: VITE_DEBUG_KARAOKE=true in .env
 *  - Browser console at runtime: window.DEBUG_KARAOKE = true
 *
 * Usage in any karaoke file:
 *   import { dkLog } from '../../constants/debugKaraoke';
 *   dkLog('stepName', 'message', { extra });
 */

/** Master switch — set VITE_DEBUG_KARAOKE=true in .env, or at runtime: window.DEBUG_KARAOKE = true */
export const DEBUG_KARAOKE: boolean =
    typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_DEBUG_KARAOKE === 'true';
    // ← fallback is OFF by default; enable via env var or window.DEBUG_KARAOKE at runtime

/** Shorthand logger that only prints when DEBUG_KARAOKE or window.DEBUG_KARAOKE is on. */
export function dkLog(step: string, message: string, ...args: unknown[]): void {
    const enabled =
        DEBUG_KARAOKE ||
        (typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).DEBUG_KARAOKE);
    if (!enabled) return;
    // eslint-disable-next-line no-console
    console.log(
        `%c[KARAOKE-DEBUG]%c [${step}] ${message}`,
        'background:#6c3483;color:#fff;padding:1px 4px;border-radius:3px;font-weight:bold',
        'color:#6c3483;font-weight:bold',
        ...args,
    );
}
