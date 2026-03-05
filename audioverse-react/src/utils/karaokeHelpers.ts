/**
 * Pure helper functions extracted from KaraokeManager.tsx for testability.
 *
 * Every export here is a pure function (no React, no DOM, no side effects).
 */

import type { KaraokeSongFile } from "../models/modelsKaraoke";
import type { PlayerTrack } from "../components/controls/player/GenericPlayer";
import type { NoteDescriptor, PitchPoint, NoteScoreResult } from "./karaokeScoring";
import type { KaraokeNoteData } from "../scripts/karaoke/karaokeTimeline";
import { parseVideoMetadata } from "./karaokeMetadata";

// ═══════════════════════════════════════════════════════════════════
//  Autocorrelation pitch detection  (same as UltraStar WP algorithm)
// ═══════════════════════════════════════════════════════════════════

/**
 * Classic autocorrelation pitch estimator.
 * Returns detected frequency in Hz, or 0 if the signal is below `rmsThreshold`.
 */
export function autoCorrelate(
    buf: Float32Array,
    sampleRate: number,
    rmsThreshold: number = 0.01,
): number {
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);
    if (rms < rmsThreshold) return 0;

    let bestOffset = -1;
    let bestCorrelation = 0;
    for (let offset = 20; offset < buf.length / 2; offset++) {
        let correlation = 0;
        for (let i = 0; i < buf.length / 2; i++) correlation += buf[i] * buf[i + offset];
        correlation /= buf.length / 2;
        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestOffset = offset;
        }
    }
    return bestOffset > 0 ? sampleRate / bestOffset : 0;
}

// ═══════════════════════════════════════════════════════════════════
//  Note descriptor builder  (for scoring)
// ═══════════════════════════════════════════════════════════════════

/**
 * Converts parsed KaraokeNoteData[][] + gap (seconds) into a flat
 * NoteDescriptor[] suitable for `scoreNotesWithPitchPoints`.
 */
export function buildNoteDescriptors(
    noteLines: KaraokeNoteData[][],
    gapSec: number,
): NoteDescriptor[] {
    const notes: NoteDescriptor[] = [];
    noteLines.forEach((line, li) => {
        line.forEach((note, ni) => {
            notes.push({
                startTime: note.startTime + gapSec,
                duration: note.duration,
                pitch: note.pitch,
                isGold: note.isGold,
                line: li,
                idx: ni,
            });
        });
    });
    return notes;
}

// ═══════════════════════════════════════════════════════════════════
//  Segment score builder  (for timeline visualization)
// ═══════════════════════════════════════════════════════════════════

export interface SegmentScoreEntry {
    start: number;
    end: number;
    pitch: number;
    frac: number;
    isGold?: boolean;
    noteStart?: number;
    noteEnd?: number;
}

/**
 * Maps per-note scoring results back to timeline-friendly segment entries
 * for canvas visualization.
 */
export function buildSegmentScores(
    perNote: NoteScoreResult[],
    noteLines: KaraokeNoteData[][],
    gapSec: number,
): SegmentScoreEntry[] {
    const segs: SegmentScoreEntry[] = [];
    perNote.forEach((nr) => {
        const [li, ni] = nr.noteKey.split("-").map(Number);
        const srcNote = noteLines[li]?.[ni];
        if (!srcNote) return;
        nr.segments.forEach((s) => {
            segs.push({
                start: s.visualStart - gapSec,
                end: s.visualEnd - gapSec,
                pitch: srcNote.pitch,
                frac: s.frac,
                isGold: srcNote.isGold,
                noteStart: srcNote.startTime,
                noteEnd: srcNote.startTime + srcNote.duration,
            });
        });
    });
    return segs;
}

// ═══════════════════════════════════════════════════════════════════
//  Pitch point down-sampling & quantization  (for RTC publishing)
// ═══════════════════════════════════════════════════════════════════

/**
 * Down-samples an array of pitch points to at most `maxPoints` evenly-spaced
 * entries and quantizes time to 3 decimal places and frequency to integers.
 */
export function downsampleAndQuantizePitchPoints(
    points: PitchPoint[],
    maxPoints: number = 120,
): PitchPoint[] {
    let sampled = points;
    if (points.length > maxPoints) {
        const step = points.length / maxPoints;
        const arr: PitchPoint[] = [];
        for (let i = 0; i < maxPoints; i++) arr.push(points[Math.floor(i * step)]);
        sampled = arr;
    }
    return sampled.map((p) => ({
        t: Math.round(p.t * 1000) / 1000,
        hz: Math.round(p.hz),
    }));
}

// ═══════════════════════════════════════════════════════════════════
//  RTC latency estimation
// ═══════════════════════════════════════════════════════════════════

/**
 * Estimates one-way latency (ms) between a server-recorded timestamp and now,
 * accounting for clock offset.
 */
export function estimateLatencyMs(
    serverTimeUtc: string,
    localNowMs: number,
    clockOffsetMs: number,
): number {
    const serverMs = Date.parse(serverTimeUtc);
    const estimatedClientTimeAtServerRecord = serverMs - clockOffsetMs;
    return Math.max(0, Math.round(localNowMs - estimatedClientTimeAtServerRecord));
}

// ═══════════════════════════════════════════════════════════════════
//  Algorithm label & color
// ═══════════════════════════════════════════════════════════════════

const ALG_COLORS: Record<string, string> = {
    crepe: "#a78bfa",
    librosa: "#34d399",
    pitchy: "#60a5fa",
    autocorr: "#555555",
};

/**
 * Returns a human-readable label for a pitch algorithm ID.
 */
export function getAlgorithmLabel(alg: string): string {
    if (alg === "autocorr") return "Ultrastar";
    return alg.charAt(0).toUpperCase() + alg.slice(1);
}

/**
 * Returns a hex colour associated with the given pitch algorithm.
 */
export function getAlgorithmColor(alg: string): string {
    return ALG_COLORS[alg] ?? "#555555";
}

// Returns a CSS variable fallback for algorithm colours. Use this when setting
// CSS styles so themes can override algorithm colours via `--algo-<id>`.
export function getAlgorithmCssVar(alg: string): string {
    const hex = ALG_COLORS[alg] ?? "#555555";
    return `var(--algo-${alg}, ${hex})`;
}

// ═══════════════════════════════════════════════════════════════════
//  toTrack — KaraokeSongFile → PlayerTrack
// ═══════════════════════════════════════════════════════════════════

/**
 * Converts a `KaraokeSongFile` into a `PlayerTrack` the generic player
 * can consume.  Behaviour depends on `gameMode`:
 *  - modes containing "no-music" → empty sources (a-cappella)
 *  - modes containing "instrumental" → prefer `instrumentalPath`
 *  - default → YouTube > audioPath
 */
export function toTrack(
    song: KaraokeSongFile,
    gameMode: string | undefined,
): PlayerTrack {
    const includeAudio = !gameMode?.includes("no-music");
    const onlyInstrumental = gameMode?.includes("instrumental");

    const sources: PlayerTrack["sources"] = [];

    if (includeAudio) {
        // 1. Prefer YouTube when videoPath contains a YouTube video ID
        if (song.videoPath) {
            let ytUrl = song.videoPath;
            if (ytUrl.startsWith("v=")) {
                const meta = parseVideoMetadata(ytUrl);
                if (meta.youtubeId) {
                    ytUrl = `https://www.youtube.com/watch?v=${meta.youtubeId}`;
                }
            }
            if (/youtu(\.be|be\.com)/i.test(ytUrl)) {
                sources.push({ kind: "youtube", url: ytUrl });
            } else if (/^(https?:\/\/|blob:|data:\/\/|\/)/i.test(song.videoPath)) {
                // Non-YouTube video URL (e.g. hosted mp4) — use "audio" source kind
                // as GenericPlayer handles both audio/video through HTML5 media element
                sources.push({ kind: "audio", url: song.videoPath });
            }
        }

        // 2. If no source yet, try audio paths (only valid URLs, not bare filenames)
        if (sources.length === 0) {
            const audioFile = onlyInstrumental
                ? song.instrumentalPath
                : song.audioPath;
            if (
                audioFile &&
                /^(https?:\/\/|blob:|data:\/\/|\/)/i.test(audioFile)
            ) {
                sources.push({ kind: "audio", url: audioFile });
            }
        }

        // 3. If still no source and youtubeId is present, build YouTube URL from it
        if (sources.length === 0 && song.youtubeId) {
            sources.push({ kind: "youtube", url: `https://www.youtube.com/watch?v=${song.youtubeId}` });
        }
    }

    return {
        id: String(song.id ?? song.title ?? "song"),
        title: song.title ?? "—",
        artist: song.artist ?? "—",
        coverUrl: song.coverPath ?? undefined,
        sources,
    };
}

// ═══════════════════════════════════════════════════════════════════
//  convertBrowserSongToKaraokeSongFile
// ═══════════════════════════════════════════════════════════════════

/**
 * Maps a "browser song" object (from KaraokeSongBrowser) to a proper
 * `KaraokeSongFile`.  Accepts an `any`-ish input shape and normalises it.
 */
export function convertBrowserSongToKaraokeSongFile(
    initialSong: Record<string, unknown>,
): KaraokeSongFile {
    // Dynamic import avoided — KaraokeFormat is just an enum value
    const rawVideo =
        (initialSong.videoPath as string | undefined) ??
        (initialSong.video as string | undefined) ??
        undefined;

    return {
        id: initialSong.id as number | undefined,
        title: (initialSong.title as string) ?? "",
        artist: (initialSong.artist as string) ?? "",
        year: initialSong.year as string | undefined,
        genre: initialSong.genre as string | undefined,
        language: initialSong.language as string | undefined,
        filePath: initialSong.filePath as string | undefined,
        coverPath: initialSong.coverPath as string | undefined,
        audioPath:
            (initialSong.audioPath as string | undefined) ??
            (initialSong.audio as string | undefined) ??
            undefined,
        videoPath: rawVideo,
        format: 0, // KaraokeFormat.Ultrastar = 0
        notes: (initialSong.notes as Array<{ noteLine: string }>) ?? [],
        gap: initialSong.gap as number | undefined,
        bpm: initialSong.bpm as number | undefined,
        videoGap: initialSong.videoGap as number | undefined,
        start: initialSong.start as number | undefined,
        end: initialSong.end as number | undefined,
        youtubeId: initialSong.youtubeId as string | undefined,
        instrumentalPath: initialSong.instrumentalPath as string | undefined,
        isVerified: initialSong.isVerified as boolean | undefined,
        coverImage: initialSong.coverImage as string | undefined,
        backgroundImage: initialSong.backgroundImage as string | undefined,
    } as KaraokeSongFile;
}
