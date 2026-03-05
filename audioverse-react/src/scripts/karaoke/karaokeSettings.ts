/**
 * karaokeSettings.ts — Per-player karaoke visual settings (bar fills + font).
 *
 * Handles loading, saving, migration (old PlayerBarStyle → new PlayerKaraokeSettings),
 * backend hydration, and legacy wrappers for backward compatibility.
 */

import { syncSettingToBackend, loadUserSettings } from "../settingsSync";
import apiUser from "../api/apiUser";
import { logger } from "../../utils/logger";

const log = logger.scoped('karaokeSettings');

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

/** Visual settings for a single bar type (filled, empty, gold-filled, gold-empty) */
export interface KaraokeBarFill {
    /** Base color override (hex). null = auto (player/accuracy, gray, gold depending on bar type) */
    color: string | null;
    /** Cap style name (e.g. "Pill", "Arrow", "Shield") */
    capStyleName: string;
    /** Overlay pattern name (e.g. "Flames", "Scales") or null */
    patternName: string | null;
    /** Secondary color for pattern overlay (hex) or null for auto */
    patternColor: string | null;
    /** Pattern-only mode: no glossy 3D button, just the pattern fill */
    patternOnly: boolean;
    /** Highlight intensity 0-100 */
    highlight: number;
    /** Glow intensity 0-100 */
    glow: number;
    /** Glass transparency 0-100 (0 = opaque, 100 = fully transparent) */
    glass: number;
    /** Texture URL for tiling, or null */
    textureUrl: string | null;
    /** Texture tile scale factor (0.1–2.0; default 1.0) */
    textureScale: number;
}

/** Font settings for karaoke canvas text (stored per player, only player 1's is used) */
export interface KaraokeFontSettings {
    /** Font family (null = system default / Arial) */
    fontFamily: string | null;
    /** Font size in px */
    fontSize: number;
    /** Font color (hex or CSS, null = auto #fff) */
    fontColor: string | null;
    /** Outline/stroke color (null = no outline) */
    outlineColor: string | null;
    /** Outline width in px (0 = no outline) */
    outlineWidth: number;
    /** Text shadow CSS string (null = none, e.g. "2px 2px 4px #000") */
    shadow: string | null;
}

/** Complete karaoke visual settings per player */
export interface PlayerKaraokeSettings {
    /** Bar fill for sung (hit) regular notes */
    filledBar: KaraokeBarFill;
    /** Bar fill for unsung (empty) regular notes */
    emptyBar: KaraokeBarFill;
    /** Bar fill for sung (hit) golden notes */
    goldFilledBar: KaraokeBarFill;
    /** Bar fill for unsung (empty) golden notes */
    goldEmptyBar: KaraokeBarFill;
    /** Font settings */
    font: KaraokeFontSettings;
    /** When true, gold notes are scored as regular (no 2× multiplier). Max stays 10k. */
    disableGoldNotes?: boolean;
}

// ── Defaults ──

export const DEFAULT_BAR_FILL: KaraokeBarFill = {
    color: null,
    capStyleName: 'Pill',
    patternName: null,
    patternColor: null,
    patternOnly: false,
    highlight: 70,
    glow: 55,
    glass: 0,
    textureUrl: null,
    textureScale: 1.0,
};

export const DEFAULT_EMPTY_BAR_FILL: KaraokeBarFill = {
    ...DEFAULT_BAR_FILL,
    glass: 85,
};

export const DEFAULT_GOLD_EMPTY_BAR_FILL: KaraokeBarFill = {
    ...DEFAULT_BAR_FILL,
    patternName: 'Stars',
};

export const DEFAULT_GOLD_FILLED_BAR_FILL: KaraokeBarFill = {
    ...DEFAULT_BAR_FILL,
    patternName: 'Stars',
};

export const DEFAULT_FONT_SETTINGS: KaraokeFontSettings = {
    fontFamily: null,
    fontSize: 18,
    fontColor: null,
    outlineColor: null,
    outlineWidth: 0,
    shadow: null,
};

export const DEFAULT_KARAOKE_SETTINGS: PlayerKaraokeSettings = {
    filledBar: { ...DEFAULT_BAR_FILL },
    emptyBar: { ...DEFAULT_EMPTY_BAR_FILL },
    goldFilledBar: { ...DEFAULT_GOLD_FILLED_BAR_FILL },
    goldEmptyBar: { ...DEFAULT_GOLD_EMPTY_BAR_FILL },
    font: { ...DEFAULT_FONT_SETTINGS },
    disableGoldNotes: false,
};

// ── Legacy PlayerBarStyle (kept for migration) ──

/** Preset modes for empty (unsung) bar appearance */
export type EmptyBarPreset = 'custom' | 'maxGlass' | 'wireframe' | 'dimTexture' | 'none';

/** @deprecated Use PlayerKaraokeSettings instead */
export interface PlayerBarStyle {
    /** Cap style name (e.g. "Pill", "Arrow", "Shield") */
    capStyleName: string;
    /** Overlay pattern name (e.g. "Flames", "Scales") or null */
    patternName: string | null;
    /** Secondary color for pattern overlay (hex) or null for auto */
    patternColor: string | null;
    /** Pattern-only mode: no glossy 3D button, just the pattern as the bar shape.
     *  Unsung = gray patterned bar, sung = player-colored pattern. */
    patternOnly: boolean;
    /** Highlight intensity 0-100 (ignored in patternOnly) */
    highlight: number;
    /** Glow intensity 0-100 (ignored in patternOnly) */
    glow: number;
    /** Glass factor for empty bars 0-100 */
    emptyGlass: number;
    /** Texture URL for filled (sung) bars, or null for no texture */
    filledTextureUrl: string | null;
    /** Texture URL for empty (unsung) bars, or null for no texture */
    emptyTextureUrl: string | null;
    /** Texture tile scale factor (0.1–2.0; default 1.0 = natural size) */
    textureScale: number;
    /** Empty bar preset — quick setup for empty bar appearance */
    emptyPreset: EmptyBarPreset;
    /** Overlay pattern name for gold (unhit) bars, or null */
    goldPatternName: string | null;
    /** Pattern color for gold bars, or null for auto */
    goldPatternColor: string | null;
    /** Overlay pattern name for gold hit bars, or null (same as goldPatternName) */
    goldHitPatternName: string | null;
    /** Pattern color for gold hit bars, or null for auto */
    goldHitPatternColor: string | null;
    /** Texture URL for gold unhit bars */
    goldEmptyTextureUrl: string | null;
    /** Texture URL for gold hit bars */
    goldFilledTextureUrl: string | null;
    /** Font family for this player's karaoke canvas text (null = default/Arial) */
    fontFamily: string | null;
    /** Font size in px (default 18) */
    fontSize: number;
    /** Font color (hex or CSS, null = auto) */
    fontColor: string | null;
    /** Outline color (null = no outline) */
    fontOutlineColor: string | null;
    /** Outline width in px (default 0 = no outline) */
    fontOutlineWidth: number;
    /** Text shadow CSS string (null = none) */
    fontShadow: string | null;
}

export const DEFAULT_PLAYER_BAR_STYLE: PlayerBarStyle = {
    capStyleName: 'Pill',
    patternName: null,
    patternColor: null,
    patternOnly: false,
    highlight: 70,
    glow: 55,
    emptyGlass: 85,
    filledTextureUrl: null,
    emptyTextureUrl: null,
    textureScale: 1.0,
    emptyPreset: 'custom',
    goldPatternName: 'Stars',
    goldPatternColor: null,
    goldHitPatternName: 'Stars',
    goldHitPatternColor: null,
    goldEmptyTextureUrl: null,
    goldFilledTextureUrl: null,
    fontFamily: null,
    fontSize: 18,
    fontColor: null,
    fontOutlineColor: null,
    fontOutlineWidth: 0,
    fontShadow: null,
};

// ── Storage keys ──

const OLD_STORAGE_KEY = 'audioverse-player-bar-style';
const STORAGE_KEY = 'audioverse-player-karaoke-settings';

function settingsKey(playerId?: number): string {
    return playerId != null ? `${STORAGE_KEY}-${playerId}` : STORAGE_KEY;
}

function oldBarStyleKey(playerId?: number): string {
    return playerId != null ? `${OLD_STORAGE_KEY}-${playerId}` : OLD_STORAGE_KEY;
}

// ── Migration from old flat PlayerBarStyle → new PlayerKaraokeSettings ──

function migrateOldBarStyle(bs: PlayerBarStyle): PlayerKaraokeSettings {
    return {
        filledBar: {
            color: null,
            capStyleName: bs.capStyleName,
            patternName: bs.patternName,
            patternColor: bs.patternColor,
            patternOnly: bs.patternOnly,
            highlight: bs.highlight,
            glow: bs.glow,
            glass: 0,
            textureUrl: bs.filledTextureUrl,
            textureScale: bs.textureScale,
        },
        emptyBar: {
            color: null,
            capStyleName: bs.capStyleName,
            patternName: bs.patternName,
            patternColor: bs.patternColor,
            patternOnly: bs.patternOnly,
            highlight: bs.highlight,
            glow: bs.glow,
            glass: bs.emptyGlass,
            textureUrl: bs.emptyTextureUrl,
            textureScale: bs.textureScale,
        },
        goldFilledBar: {
            color: null,
            capStyleName: bs.capStyleName,
            patternName: bs.goldHitPatternName,
            patternColor: bs.goldHitPatternColor,
            patternOnly: bs.patternOnly,
            highlight: bs.highlight,
            glow: bs.glow,
            glass: 0,
            textureUrl: bs.goldFilledTextureUrl,
            textureScale: bs.textureScale,
        },
        goldEmptyBar: {
            color: null,
            capStyleName: bs.capStyleName,
            patternName: bs.goldPatternName,
            patternColor: bs.goldPatternColor,
            patternOnly: bs.patternOnly,
            highlight: bs.highlight,
            glow: bs.glow,
            glass: 0,
            textureUrl: bs.goldEmptyTextureUrl,
            textureScale: bs.textureScale,
        },
        font: {
            fontFamily: bs.fontFamily,
            fontSize: bs.fontSize,
            fontColor: bs.fontColor,
            outlineColor: bs.fontOutlineColor,
            outlineWidth: bs.fontOutlineWidth,
            shadow: bs.fontShadow,
        },
    };
}

/** Deep-merge a partial karaoke settings with defaults */
function mergeKaraokeSettings(partial: Record<string, unknown>): PlayerKaraokeSettings {
    const def = DEFAULT_KARAOKE_SETTINGS;
    const mergeBar = (defBar: KaraokeBarFill, partialBar?: Record<string, unknown>): KaraokeBarFill => {
        if (!partialBar || typeof partialBar !== 'object') return { ...defBar };
        return { ...defBar, ...partialBar };
    };
    const mergeFont = (defFont: KaraokeFontSettings, partialFont?: Record<string, unknown>): KaraokeFontSettings => {
        if (!partialFont || typeof partialFont !== 'object') return { ...defFont };
        return { ...defFont, ...partialFont };
    };
    return {
        filledBar: mergeBar(def.filledBar, partial.filledBar as Record<string, unknown> | undefined),
        emptyBar: mergeBar(def.emptyBar, partial.emptyBar as Record<string, unknown> | undefined),
        goldFilledBar: mergeBar(def.goldFilledBar, partial.goldFilledBar as Record<string, unknown> | undefined),
        goldEmptyBar: mergeBar(def.goldEmptyBar, partial.goldEmptyBar as Record<string, unknown> | undefined),
        font: mergeFont(def.font, partial.font as Record<string, unknown> | undefined),
        disableGoldNotes: typeof partial.disableGoldNotes === 'boolean' ? partial.disableGoldNotes : def.disableGoldNotes,
    };
}

// ── Load / Save ──

export function loadKaraokeSettings(playerId?: number): PlayerKaraokeSettings {
    try {
        // Try new format first
        const raw = localStorage.getItem(settingsKey(playerId));
        if (raw) {
            const parsed = JSON.parse(raw);
            return mergeKaraokeSettings(parsed);
        }
        // Try migrating old format
        const oldRaw = localStorage.getItem(oldBarStyleKey(playerId));
        if (oldRaw) {
            const oldParsed = JSON.parse(oldRaw);
            const migrated = migrateOldBarStyle({ ...DEFAULT_PLAYER_BAR_STYLE, ...oldParsed });
            // Persist migrated settings in new format
            localStorage.setItem(settingsKey(playerId), JSON.stringify(migrated));
            return migrated;
        }
        // Fallback: try global key
        if (playerId != null) {
            const globalRaw = localStorage.getItem(settingsKey());
            if (globalRaw) {
                return mergeKaraokeSettings(JSON.parse(globalRaw));
            }
            const globalOld = localStorage.getItem(oldBarStyleKey());
            if (globalOld) {
                const migrated = migrateOldBarStyle({ ...DEFAULT_PLAYER_BAR_STYLE, ...JSON.parse(globalOld) });
                return migrated;
            }
        }
    } catch { /* Expected: localStorage or JSON parse may fail */ }
    return {
        filledBar: { ...DEFAULT_BAR_FILL },
        emptyBar: { ...DEFAULT_EMPTY_BAR_FILL },
        goldFilledBar: { ...DEFAULT_GOLD_FILLED_BAR_FILL },
        goldEmptyBar: { ...DEFAULT_GOLD_EMPTY_BAR_FILL },
        font: { ...DEFAULT_FONT_SETTINGS },
    };
}

export function saveKaraokeSettings(settings: PlayerKaraokeSettings, playerId?: number): void {
    const json = JSON.stringify(settings);
    localStorage.setItem(settingsKey(playerId), json);
    // Sync global (non-per-player) settings to backend (legacy path)
    if (playerId == null) {
        syncSettingToBackend({ playerKaraokeSettings: json });
    }
}

/**
 * Persist karaoke settings to the backend for a specific player.
 * Fire-and-forget — errors are logged but do not propagate.
 */
export function syncPlayerKaraokeSettingsToBackend(
    profileId: number,
    playerId: number,
    settings: PlayerKaraokeSettings,
): void {
    // Also save locally
    saveKaraokeSettings(settings, playerId);
    // Push to backend
    apiUser.updateProfilePlayer(profileId, playerId, {
        karaokeSettings: settings as unknown as Record<string, unknown>,
    }).catch(err => {
        log.warn('[karaokeSettings] Failed to sync karaoke settings to backend for player', playerId, err);
    });
}

/**
 * Hydrate localStorage with karaoke settings from backend player data.
 * Call this when player data is fetched to seed localStorage with backend truth.
 */
export function hydrateKaraokeSettingsFromPlayerData(
    playerId: number,
    karaokeSettings: Record<string, unknown> | null | undefined,
): void {
    if (!karaokeSettings || typeof karaokeSettings !== 'object') return;
    try {
        const merged = mergeKaraokeSettings(karaokeSettings);
        localStorage.setItem(settingsKey(playerId), JSON.stringify(merged));
        log.debug('[karaokeSettings] Hydrated karaoke settings for player', playerId);
    } catch {
        /* Expected: localStorage may be full or unavailable */
    }
}

/** Hydrate from backend once */
let _pksHydrated = false;
export async function hydratePlayerKaraokeSettingsFromBackend(): Promise<void> {
    if (_pksHydrated) return;
    _pksHydrated = true;
    const s = await loadUserSettings();
    if (s?.playerKaraokeSettings) {
        try {
            // Only hydrate global key if not already present
            if (!localStorage.getItem(settingsKey())) {
                localStorage.setItem(settingsKey(), s.playerKaraokeSettings);
            }
        } catch { /* Expected: localStorage may be full or unavailable */ }
    }
}

/**
 * Load karaoke settings for all given player IDs.
 * Returns a map playerId → PlayerKaraokeSettings.
 */
export function loadAllKaraokeSettings(playerIds: number[]): Map<number, PlayerKaraokeSettings> {
    const map = new Map<number, PlayerKaraokeSettings>();
    for (const id of playerIds) {
        map.set(id, loadKaraokeSettings(id));
    }
    return map;
}

// ── Legacy wrappers (deprecated — kept for backward compat during transition) ──

/** @deprecated Use loadKaraokeSettings */
export function loadPlayerBarStyle(playerId?: number): PlayerBarStyle {
    try {
        const raw = localStorage.getItem(oldBarStyleKey(playerId));
        if (raw) return { ...DEFAULT_PLAYER_BAR_STYLE, ...JSON.parse(raw) };
        if (playerId != null) {
            const g = localStorage.getItem(oldBarStyleKey());
            if (g) return { ...DEFAULT_PLAYER_BAR_STYLE, ...JSON.parse(g) };
        }
    } catch { /* Expected: localStorage or JSON parse may fail */ }
    return { ...DEFAULT_PLAYER_BAR_STYLE };
}

/** @deprecated Use saveKaraokeSettings */
export function savePlayerBarStyle(style: PlayerBarStyle, playerId?: number): void {
    localStorage.setItem(oldBarStyleKey(playerId), JSON.stringify(style));
}

/** @deprecated Use loadAllKaraokeSettings */
export function loadPlayerBarStyles(playerIds: number[]): Map<number, PlayerBarStyle> {
    const map = new Map<number, PlayerBarStyle>();
    for (const id of playerIds) map.set(id, loadPlayerBarStyle(id));
    return map;
}
