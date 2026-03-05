/**
 * Named types for KaraokeTimeline props.
 * Extracted from inline definitions to improve readability and reuse.
 */
import type { KaraokeAnimMode } from "../../../scripts/karaoke/karaokeDisplaySettings";
import type { PlayerKaraokeSettings } from "../../../scripts/karaoke/glossyBarRenderer";

/** Per-note scoring result rendered on the timeline. */
export interface KaraokeSegmentScore {
    start: number;
    end: number;
    pitch: number;
    frac: number;
    isGold?: boolean;
    noteStart?: number;
    noteEnd?: number;
}

/** Gold-note burst particle effect metadata. */
export interface KaraokeGoldBurst {
    playerId: number;
    createdAt: number;
    noteStart: number;
    notePitch: number;
    seed: number;
}

/** Visual tuning for gold-note burst effects. */
export interface KaraokeGoldSettings {
    lifeMs?: number;
    count?: number;
    baseSpeed?: number;
    baseSize?: number;
    glowBlur?: number;
    shadowColor?: string;
}

/** Live combo tracking state. */
export interface KaraokeComboInfo {
    maxCombo: number;
    currentCombo: number;
    totalComboBonus: number;
}

/** Per-verse rating after verse boundary. */
export interface KaraokeVerseRating {
    verseIndex: number;
    hitFraction: number;
    label: string;
    comboBonus: number;
}

/**
 * Config object grouping optional display, layout and visual settings
 * for KaraokeTimeline — reduces props drilling from 24 → 9 top-level props.
 */
export interface KaraokeTimelineConfig {
    /** Player display name (default: "Ziom") */
    playerName?: string;
    /** Current score value (default: 10000) */
    score?: number;
    /** CSS color for player background (default: accent blue) */
    playerBgColor?: string;
    /** Number of players — affects timeline width scaling */
    playerCount?: number;
    /** Whether the karaoke is currently playing */
    isPlaying?: boolean;
    /** Override for vertical position (px) */
    top?: number;
    /** Network latency badge value (ms) */
    latencyMs?: number | null;
    /** Gap between notes desaturation level */
    gapDesaturation?: number;
    /** Difficulty label display */
    difficultyLevel?: string;
    /** Pitch algorithm label */
    algorithmLabel?: string;
    /** Pitch algorithm theme color */
    algorithmColor?: string;
    /** Animation rendering mode */
    animationMode?: KaraokeAnimMode;
    /** Per-player karaoke visual settings */
    karaokeSettings?: PlayerKaraokeSettings | null;
    /** Gold note burst visual tuning */
    goldSettings?: KaraokeGoldSettings;
}
