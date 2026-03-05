/**
 * settingsSync — lightweight helper for syncing localStorage preferences
 * with the backend user settings API.
 *
 * Each context calls `loadSettingFromBackend(field)` on mount to hydrate from
 * the backend when the user is authenticated.  When the user changes a setting,
 * the context still writes to localStorage (instant) and also calls
 * `syncSettingToBackend({ field: value })` (fire-and-forget).
 */
import { getAccessToken } from "./api/apiUser";
import { getUserSettings, updateUserSettings, type UserSettingsDto, type UpdateUserSettingsPayload } from "./api/apiUser";
import { logger } from "../utils/logger";
const log = logger.scoped('settingsSync');

// ── Debounced backend sync (fire-and-forget) ───────────────────────
const pendingUpdates: UpdateUserSettingsPayload = {};
let syncTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 1500;

/**
 * Queue a partial settings update to the backend.  Calls are debounced
 * so rapid changes (e.g. slider drags) only send one request.
 */
export function syncSettingToBackend(patch: UpdateUserSettingsPayload): void {
  if (!getAccessToken()) return; // not authenticated
  Object.assign(pendingUpdates, patch);
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const payload = { ...pendingUpdates };
    // clear pending
    for (const k of Object.keys(pendingUpdates)) delete (pendingUpdates as Record<string, unknown>)[k];
    syncTimer = null;
    try {
      await updateUserSettings(payload);
    } catch (e) {
      log.warn("failed to sync to backend", e);
    }
  }, SYNC_DEBOUNCE_MS);
}

// ── One-shot loader ────────────────────────────────────────────────

let cachedSettings: UserSettingsDto | null | undefined; // undefined = not loaded yet
let loadPromise: Promise<UserSettingsDto | null> | null = null;

/**
 * Load user settings from backend (cached for the session).
 * Returns null when not authenticated or backend unavailable.
 */
export async function loadUserSettings(): Promise<UserSettingsDto | null> {
  if (!getAccessToken()) return null;
  if (cachedSettings !== undefined) return cachedSettings;
  if (loadPromise) return loadPromise;
  loadPromise = getUserSettings().then(s => {
    cachedSettings = s;
    loadPromise = null;
    return s;
  }).catch(() => {
    /* Expected: network request may fail; caller handles null */
    cachedSettings = null;
    loadPromise = null;
    return null;
  });
  return loadPromise;
}

/** Reset cache (call on logout). */
export function clearSettingsCache(): void {
  cachedSettings = undefined;
  loadPromise = null;
}
