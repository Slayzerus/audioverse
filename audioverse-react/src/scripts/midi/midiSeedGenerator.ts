/* ────────────────────────────────────────────────────────────
   midiSeedGenerator.ts
   Procedural MIDI content generator for seeding the AudioEditor.
   Generates multi-layer MIDI data (melody, bass, chords, drums)
   based on configurable parameters (key, scale, tempo, bars).
   ──────────────────────────────────────────────────────────── */

import type { MidiNote } from "../../models/editor/midiTypes";

// ── Scale definitions (semitone intervals from root) ──

const SCALES: Record<string, number[]> = {
    major:        [0, 2, 4, 5, 7, 9, 11],
    minor:        [0, 2, 3, 5, 7, 8, 10],
    dorian:       [0, 2, 3, 5, 7, 9, 10],
    mixolydian:   [0, 2, 4, 5, 7, 9, 10],
    pentatonic:   [0, 2, 4, 7, 9],
    minorPenta:   [0, 3, 5, 7, 10],
    blues:        [0, 3, 5, 6, 7, 10],
    chromatic:    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// ── Common chord progressions (scale degrees, 0-indexed) ──

const PROGRESSIONS: Record<string, number[][]> = {
    pop:     [[0, 4, 7], [5, 9, 0], [7, 11, 2], [5, 9, 0]],  // I V vi IV (simplified)
    rock:    [[0, 4, 7], [5, 9, 0], [3, 7, 10], [5, 9, 0]],   // I V iii IV
    jazz:    [[0, 4, 7, 11], [2, 5, 9, 0], [5, 9, 0, 4], [0, 4, 7, 11]], // Imaj7 ii7 V7 Imaj7
    blues12: [[0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7],
              [5, 9, 0], [5, 9, 0], [0, 4, 7], [0, 4, 7],
              [7, 11, 2], [5, 9, 0], [0, 4, 7], [7, 11, 2]],
};

// ── Drum patterns (General MIDI drum map) ──

const GM_KICK   = 36;
const GM_SNARE  = 38;
const GM_HIHAT  = 42;
const GM_RIDE   = 51;
const GM_CRASH  = 49;

interface DrumHit { step: number; pitch: number; vel: number }

const DRUM_PATTERNS: Record<string, DrumHit[]> = {
    basic: [
        { step: 0,  pitch: GM_KICK,  vel: 110 },
        { step: 0,  pitch: GM_HIHAT, vel: 80 },
        { step: 2,  pitch: GM_HIHAT, vel: 70 },
        { step: 4,  pitch: GM_SNARE, vel: 100 },
        { step: 4,  pitch: GM_HIHAT, vel: 80 },
        { step: 6,  pitch: GM_HIHAT, vel: 70 },
        { step: 8,  pitch: GM_KICK,  vel: 100 },
        { step: 10, pitch: GM_HIHAT, vel: 70 },
        { step: 12, pitch: GM_SNARE, vel: 100 },
        { step: 12, pitch: GM_HIHAT, vel: 80 },
        { step: 14, pitch: GM_HIHAT, vel: 70 },
    ],
    rock: [
        { step: 0,  pitch: GM_KICK,  vel: 120 },
        { step: 0,  pitch: GM_CRASH, vel: 90 },
        { step: 4,  pitch: GM_SNARE, vel: 110 },
        { step: 4,  pitch: GM_HIHAT, vel: 80 },
        { step: 8,  pitch: GM_KICK,  vel: 110 },
        { step: 8,  pitch: GM_HIHAT, vel: 80 },
        { step: 10, pitch: GM_KICK,  vel: 90 },
        { step: 12, pitch: GM_SNARE, vel: 110 },
        { step: 12, pitch: GM_HIHAT, vel: 80 },
    ],
    swing: [
        { step: 0,  pitch: GM_RIDE,  vel: 90 },
        { step: 3,  pitch: GM_RIDE,  vel: 70 },
        { step: 4,  pitch: GM_RIDE,  vel: 80 },
        { step: 8,  pitch: GM_RIDE,  vel: 90 },
        { step: 11, pitch: GM_RIDE,  vel: 70 },
        { step: 12, pitch: GM_RIDE,  vel: 80 },
        { step: 4,  pitch: GM_KICK,  vel: 80 },
        { step: 12, pitch: GM_SNARE, vel: 70 },
    ],
};

// ── Config ──

export interface SeedConfig {
    /** Root note (0=C, 1=C#, ..., 11=B) */
    root: number;
    /** Scale name (key into SCALES) */
    scale: keyof typeof SCALES;
    /** BPM */
    tempo: number;
    /** Number of bars to generate */
    bars: number;
    /** Chord progression style */
    progression: keyof typeof PROGRESSIONS;
    /** Drum pattern style */
    drumPattern: keyof typeof DRUM_PATTERNS;
    /** Sixteenth-note density for melody (0..1) */
    density: number;
    /** Base octave for melody (3-5) */
    octave: number;
    /** Seed for pseudo-random (0 = truly random) */
    seed: number;
}

export const DEFAULT_SEED_CONFIG: SeedConfig = {
    root: 0,  // C
    scale: "pentatonic",
    tempo: 120,
    bars: 8,
    progression: "pop",
    drumPattern: "basic",
    density: 0.5,
    octave: 4,
    seed: 0,
};

export interface SeedResult {
    melody:  MidiNote[];
    bass:    MidiNote[];
    chords:  MidiNote[];
    drums:   MidiNote[];
    config:  SeedConfig;
}

// ── Simple seeded PRNG (Mulberry32) ──

function mulberry32(seed: number) {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Generator ──

let nextId = 1;
const mkId = () => nextId++;

/** Beat duration in seconds at given BPM. */
const beatSec = (bpm: number) => 60 / bpm;

/** 16th-note duration in seconds. */
const sixteenthSec = (bpm: number) => beatSec(bpm) / 4;

/** Get MIDI pitch from scale degree + root + octave. */
function scalePitch(root: number, scaleDegrees: number[], degree: number, octave: number): number {
    const len = scaleDegrees.length;
    const octaveOffset = Math.floor(degree / len);
    const idx = ((degree % len) + len) % len;
    return root + scaleDegrees[idx] + (octave + octaveOffset) * 12;
}

/** Generate the complete seed. */
export function generateSeed(cfg: SeedConfig = DEFAULT_SEED_CONFIG): SeedResult {
    nextId = 1;
    const rand = cfg.seed > 0 ? mulberry32(cfg.seed) : Math.random;
    const sc = SCALES[cfg.scale] ?? SCALES.pentatonic;
    const prog = PROGRESSIONS[cfg.progression] ?? PROGRESSIONS.pop;
    const drum = DRUM_PATTERNS[cfg.drumPattern] ?? DRUM_PATTERNS.basic;
    const bSec = beatSec(cfg.tempo);
    const sSec = sixteenthSec(cfg.tempo);
    const barsTotal = Math.max(1, cfg.bars);
    const stepsPerBar = 16; // 16th notes per bar (4/4 time)

    const melody:  MidiNote[] = [];
    const bass:    MidiNote[] = [];
    const chords:  MidiNote[] = [];
    const drums:   MidiNote[] = [];

    let prevDegree = 0;

    for (let bar = 0; bar < barsTotal; bar++) {
        const barStart = bar * 4 * bSec; // 4 beats per bar
        const progIdx = bar % prog.length;
        const chordDegrees = prog[progIdx];

        // ── Chords: one chord per bar (whole notes) ──
        for (const deg of chordDegrees) {
            chords.push({
                id: mkId(),
                pitch: scalePitch(cfg.root, sc, deg, cfg.octave - 1),
                start: barStart,
                duration: 4 * bSec - 0.01,
                velocity: 70 + Math.floor(rand() * 20),
            });
        }

        // ── Bass: root note of chord, quarter notes ──
        const bassRoot = chordDegrees[0];
        for (let beat = 0; beat < 4; beat++) {
            // Vary: sometimes walk to next degree
            const walkDeg = beat === 2 ? bassRoot + (rand() > 0.5 ? 2 : 0) : bassRoot;
            bass.push({
                id: mkId(),
                pitch: scalePitch(cfg.root, sc, walkDeg, cfg.octave - 2),
                start: barStart + beat * bSec,
                duration: bSec * 0.9,
                velocity: 80 + Math.floor(rand() * 30),
            });
        }

        // ── Melody: probabilistic 16th-note generation ──
        for (let step = 0; step < stepsPerBar; step++) {
            if (rand() > cfg.density) continue; // skip based on density
            const t = barStart + step * sSec;
            // Stepwise motion with occasional leaps
            const leap = rand() > 0.8 ? (rand() > 0.5 ? 2 : -2) : (rand() > 0.5 ? 1 : -1);
            prevDegree = Math.max(-3, Math.min(sc.length + 3, prevDegree + leap));
            // Duration: 1-4 sixteenth notes
            const durSteps = 1 + Math.floor(rand() * 3);
            melody.push({
                id: mkId(),
                pitch: scalePitch(cfg.root, sc, prevDegree, cfg.octave),
                start: t,
                duration: durSteps * sSec * 0.95,
                velocity: 85 + Math.floor(rand() * 30),
            });
        }

        // ── Drums: pattern per bar ──
        for (const hit of drum) {
            drums.push({
                id: mkId(),
                pitch: hit.pitch,
                start: barStart + hit.step * sSec,
                duration: sSec * 0.8,
                velocity: hit.vel + Math.floor(rand() * 10 - 5),
            });
        }
    }

    return { melody, bass, chords, drums, config: cfg };
}

// ── Helpers for UI ──

export const SCALE_NAMES = Object.keys(SCALES);
export const PROGRESSION_NAMES = Object.keys(PROGRESSIONS);
export const DRUM_PATTERN_NAMES = Object.keys(DRUM_PATTERNS);
export { NOTE_NAMES };
