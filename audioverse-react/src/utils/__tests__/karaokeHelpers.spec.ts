import { describe, it, expect } from "vitest";
import {
    autoCorrelate,
    buildNoteDescriptors,
    buildSegmentScores,
    downsampleAndQuantizePitchPoints,
    estimateLatencyMs,
    getAlgorithmLabel,
    getAlgorithmColor,
    toTrack,
    convertBrowserSongToKaraokeSongFile,
} from "../karaokeHelpers";
import type { KaraokeNoteData } from "../../scripts/karaoke/karaokeTimeline";
import type { NoteScoreResult } from "../karaokeScoring";

/* ═══════════════════════════════════════════════════════════════════
 *  autoCorrelate
 * ═══════════════════════════════════════════════════════════════════ */

describe("autoCorrelate", () => {
    it("returns 0 when signal RMS is below threshold", () => {
        const silent = new Float32Array(2048).fill(0);
        expect(autoCorrelate(silent, 44100)).toBe(0);
    });

    it("returns 0 for very quiet noise below default threshold", () => {
        const quiet = new Float32Array(2048).fill(0.001);
        expect(autoCorrelate(quiet, 44100)).toBe(0);
    });

    it("returns a positive frequency for a loud sine wave", () => {
        const sr = 44100;
        const freq = 440;
        const len = 4096;
        const buf = new Float32Array(len);
        for (let i = 0; i < len; i++) {
            buf[i] = Math.sin(2 * Math.PI * freq * i / sr);
        }
        const detected = autoCorrelate(buf, sr);
        // The simple autocorrelation returns *a* positive frequency for correlated signal
        expect(detected).toBeGreaterThan(0);
    });

    it("returns different values for different frequencies", () => {
        const sr = 44100;
        const len = 4096;
        const make = (freq: number) => {
            const buf = new Float32Array(len);
            for (let i = 0; i < len; i++) buf[i] = Math.sin(2 * Math.PI * freq * i / sr);
            return autoCorrelate(buf, sr);
        };
        const f1 = make(220);
        const f2 = make(880);
        expect(f1).toBeGreaterThan(0);
        expect(f2).toBeGreaterThan(0);
        // Different sine frequencies should produce different detected values
        expect(f1).not.toBeCloseTo(f2, 0);
    });

    it("respects custom rmsThreshold", () => {
        // Generate a very quiet sine
        const sr = 44100;
        const buf = new Float32Array(2048);
        for (let i = 0; i < buf.length; i++) {
            buf[i] = 0.005 * Math.sin(2 * Math.PI * 440 * i / sr);
        }
        // Default threshold (0.01) should reject it
        expect(autoCorrelate(buf, sr)).toBe(0);
        // Lower threshold should detect it
        expect(autoCorrelate(buf, sr, 0.001)).toBeGreaterThan(0);
    });
});

/* ═══════════════════════════════════════════════════════════════════
 *  buildNoteDescriptors
 * ═══════════════════════════════════════════════════════════════════ */

describe("buildNoteDescriptors", () => {
    it("returns empty array for empty noteLines", () => {
        expect(buildNoteDescriptors([], 0)).toEqual([]);
    });

    it("builds descriptors with correct gap offset", () => {
        const noteLines: KaraokeNoteData[][] = [
            [
                { startTime: 1.0, duration: 0.5, pitch: 60 },
                { startTime: 2.0, duration: 0.3, pitch: 62, isGold: true },
            ],
            [
                { startTime: 4.0, duration: 1.0, pitch: 64 },
            ],
        ];
        const gapSec = 0.5;
        const result = buildNoteDescriptors(noteLines, gapSec);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({
            startTime: 1.5, duration: 0.5, pitch: 60,
            isGold: undefined, line: 0, idx: 0,
        });
        expect(result[1]).toEqual({
            startTime: 2.5, duration: 0.3, pitch: 62,
            isGold: true, line: 0, idx: 1,
        });
        expect(result[2]).toEqual({
            startTime: 4.5, duration: 1.0, pitch: 64,
            isGold: undefined, line: 1, idx: 0,
        });
    });

    it("handles zero gap", () => {
        const noteLines: KaraokeNoteData[][] = [
            [{ startTime: 3.0, duration: 0.5, pitch: 55 }],
        ];
        const result = buildNoteDescriptors(noteLines, 0);
        expect(result[0].startTime).toBe(3.0);
    });
});

/* ═══════════════════════════════════════════════════════════════════
 *  buildSegmentScores
 * ═══════════════════════════════════════════════════════════════════ */

describe("buildSegmentScores", () => {
    it("returns empty array for empty perNote", () => {
        expect(buildSegmentScores([], [], 0)).toEqual([]);
    });

    it("maps segments back to timeline coordinates", () => {
        const noteLines: KaraokeNoteData[][] = [
            [{ startTime: 1.0, duration: 0.5, pitch: 60, isGold: true }],
        ];
        const perNote: NoteScoreResult[] = [
            {
                noteKey: "0-0",
                segments: [
                    { segIndex: 0, frac: 0.8, add: 10, segStart: 1.5, segEnd: 2.0, visualStart: 1.5, visualEnd: 2.0 },
                ],
                totalAdded: 10,
            },
        ];
        const gapSec = 0.5;
        const result = buildSegmentScores(perNote, noteLines, gapSec);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            start: 1.0,   // visualStart - gap
            end: 1.5,     // visualEnd - gap
            pitch: 60,
            frac: 0.8,
            isGold: true,
            noteStart: 1.0,
            noteEnd: 1.5,
        });
    });

    it("skips segments with invalid noteKey", () => {
        const noteLines: KaraokeNoteData[][] = [
            [{ startTime: 1.0, duration: 0.5, pitch: 60 }],
        ];
        const perNote: NoteScoreResult[] = [
            {
                noteKey: "5-0", // line 5 doesn't exist
                segments: [
                    { segIndex: 0, frac: 1, add: 5, segStart: 1, segEnd: 2, visualStart: 1, visualEnd: 2 },
                ],
                totalAdded: 5,
            },
        ];
        expect(buildSegmentScores(perNote, noteLines, 0)).toEqual([]);
    });
});

/* ═══════════════════════════════════════════════════════════════════
 *  downsampleAndQuantizePitchPoints
 * ═══════════════════════════════════════════════════════════════════ */

describe("downsampleAndQuantizePitchPoints", () => {
    it("returns all points when count <= maxPoints", () => {
        const pts = [
            { t: 1.1234, hz: 440.7 },
            { t: 2.5678, hz: 220.3 },
        ];
        const result = downsampleAndQuantizePitchPoints(pts, 10);
        expect(result).toHaveLength(2);
        // quantized
        expect(result[0]).toEqual({ t: 1.123, hz: 441 });
        expect(result[1]).toEqual({ t: 2.568, hz: 220 });
    });

    it("downsamples when count > maxPoints", () => {
        const pts = Array.from({ length: 300 }, (_, i) => ({ t: i * 0.01, hz: 440 + i }));
        const result = downsampleAndQuantizePitchPoints(pts, 120);
        expect(result).toHaveLength(120);
    });

    it("quantizes time to 3 decimals and hz to integer", () => {
        const pts = [{ t: 1.99999, hz: 329.627 }];
        const result = downsampleAndQuantizePitchPoints(pts);
        expect(result[0].t).toBe(2);
        expect(result[0].hz).toBe(330);
    });

    it("handles empty input", () => {
        expect(downsampleAndQuantizePitchPoints([])).toEqual([]);
    });
});

/* ═══════════════════════════════════════════════════════════════════
 *  estimateLatencyMs
 * ═══════════════════════════════════════════════════════════════════ */

describe("estimateLatencyMs", () => {
    it("returns 0 when server time equals local time (no offset)", () => {
        const now = Date.now();
        const serverUtc = new Date(now).toISOString();
        expect(estimateLatencyMs(serverUtc, now, 0)).toBe(0);
    });

    it("estimates positive latency correctly", () => {
        const serverTime = new Date("2026-01-01T12:00:00.000Z").getTime();
        const localNow = serverTime + 50; // 50ms later
        expect(estimateLatencyMs("2026-01-01T12:00:00.000Z", localNow, 0)).toBe(50);
    });

    it("accounts for clock offset", () => {
        // Server clock is 100ms ahead → offset = 100
        const serverMs = 1000;
        const localNow = 950; // actual local time
        const offset = 100;   // server - client
        // estimatedClientTime = serverMs - offset = 900
        // latency = 950 - 900 = 50
        const serverUtc = new Date(serverMs).toISOString();
        expect(estimateLatencyMs(serverUtc, localNow, offset)).toBe(50);
    });

    it("never returns negative latency", () => {
        const serverUtc = new Date(2000).toISOString();
        expect(estimateLatencyMs(serverUtc, 1000, 0)).toBe(0);
    });
});

/* ═══════════════════════════════════════════════════════════════════
 *  getAlgorithmLabel / getAlgorithmColor
 * ═══════════════════════════════════════════════════════════════════ */

describe("getAlgorithmLabel", () => {
    it("returns 'Ultrastar' for autocorr", () => {
        expect(getAlgorithmLabel("autocorr")).toBe("Ultrastar");
    });
    it("capitalises other algorithms", () => {
        expect(getAlgorithmLabel("crepe")).toBe("Crepe");
        expect(getAlgorithmLabel("librosa")).toBe("Librosa");
        expect(getAlgorithmLabel("pitchy")).toBe("Pitchy");
    });
});

describe("getAlgorithmColor", () => {
    it("returns known colours for standard algorithms", () => {
        expect(getAlgorithmColor("crepe")).toBe("#a78bfa");
        expect(getAlgorithmColor("librosa")).toBe("#34d399");
        expect(getAlgorithmColor("pitchy")).toBe("#60a5fa");
        expect(getAlgorithmColor("autocorr")).toBe("#555555");
    });
    it("returns fallback for unknown algorithm", () => {
        expect(getAlgorithmColor("unknown")).toBe("#555555");
    });
});

/* ═══════════════════════════════════════════════════════════════════
 *  toTrack
 * ═══════════════════════════════════════════════════════════════════ */

describe("toTrack", () => {
    const baseSong = {
        id: 1,
        title: "Test Song",
        artist: "Test Artist",
        coverPath: "/covers/test.jpg",
        videoPath: "https://www.youtube.com/watch?v=abc123",
        audioPath: "/audio/test.mp3",
        format: 0,
        notes: [],
    } as any;

    it("creates YouTube source from videoPath", () => {
        const track = toTrack(baseSong, "normal");
        expect(track.sources).toHaveLength(1);
        expect(track.sources[0]).toEqual({ kind: "youtube", url: "https://www.youtube.com/watch?v=abc123" });
    });

    it("parses v= shorthand format", () => {
        const song = { ...baseSong, videoPath: "v=dQw4w9WgXcQ" };
        const track = toTrack(song, "normal");
        expect(track.sources[0].url).toContain("dQw4w9WgXcQ");
    });

    it("falls back to audioPath when no YouTube URL", () => {
        const song = { ...baseSong, videoPath: undefined };
        const track = toTrack(song, "normal");
        expect(track.sources).toHaveLength(1);
        expect(track.sources[0]).toEqual({ kind: "audio", url: "/audio/test.mp3" });
    });

    it("returns empty sources for no-music mode", () => {
        const track = toTrack(baseSong, "no-music");
        expect(track.sources).toHaveLength(0);
    });

    it("prefers instrumentalPath in instrumental mode", () => {
        const song = { ...baseSong, videoPath: undefined, instrumentalPath: "/audio/inst.mp3" };
        const track = toTrack(song, "instrumental");
        expect(track.sources[0]).toEqual({ kind: "audio", url: "/audio/inst.mp3" });
    });

    it("ignores bare filenames as audio source", () => {
        const song = { ...baseSong, videoPath: undefined, audioPath: "song.mp3" };
        const track = toTrack(song, "normal");
        expect(track.sources).toHaveLength(0);
    });

    it("populates id, title, artist, coverUrl", () => {
        const track = toTrack(baseSong, "normal");
        expect(track.id).toBe("1");
        expect(track.title).toBe("Test Song");
        expect(track.artist).toBe("Test Artist");
        expect(track.coverUrl).toBe("/covers/test.jpg");
    });
});

/* ═══════════════════════════════════════════════════════════════════
 *  convertBrowserSongToKaraokeSongFile
 * ═══════════════════════════════════════════════════════════════════ */

describe("convertBrowserSongToKaraokeSongFile", () => {
    it("maps standard fields", () => {
        const input = {
            id: 42,
            title: "Rockstar",
            artist: "Nickelback",
            videoPath: "https://youtube.com/watch?v=x",
            audioPath: "/audio/rock.mp3",
            notes: [{ noteLine: ": 0 5 60 la" }],
            bpm: 120,
            gap: 500,
        };
        const result = convertBrowserSongToKaraokeSongFile(input);
        expect(result.id).toBe(42);
        expect(result.title).toBe("Rockstar");
        expect(result.artist).toBe("Nickelback");
        expect(result.videoPath).toBe("https://youtube.com/watch?v=x");
        expect(result.notes).toHaveLength(1);
        expect(result.bpm).toBe(120);
        expect(result.gap).toBe(500);
    });

    it("falls back video → videoPath, then to undefined", () => {
        const input = { title: "T", artist: "A", video: "v=abc" };
        const result = convertBrowserSongToKaraokeSongFile(input);
        expect(result.videoPath).toBe("v=abc");
    });

    it("falls back audio → audioPath, then to undefined", () => {
        const input = { title: "T", artist: "A", audio: "/a.mp3" };
        const result = convertBrowserSongToKaraokeSongFile(input);
        expect(result.audioPath).toBe("/a.mp3");
    });

    it("handles missing fields gracefully", () => {
        const result = convertBrowserSongToKaraokeSongFile({});
        expect(result.title).toBe("");
        expect(result.artist).toBe("");
        expect(result.notes).toEqual([]);
        expect(result.videoPath).toBeUndefined();
    });
});
