/**
 * vocalPerformanceMetrics.ts — Scientific vocal performance analysis engine.
 *
 * Computes detailed acoustic metrics from karaoke pitch data:
 *  - Pitch accuracy (cent deviation, semitone error distribution)
 *  - Vocal range analysis (F0 min/max, tessitura, used intervals)
 *  - Temporal analysis (onset precision, rhythm stability)
 *  - Vibrato detection (rate, extent, regularity)
 *  - Spectral statistics (pitch class distribution, jitter, shimmer proxy)
 *  - Per-verse breakdown with grade labels
 *  - Microphone configuration snapshot
 */

import type { PitchPoint, NoteDescriptor, ComboResult } from "./karaokeScoring";

/** Loose VerseRating that accepts label: string (compatible with useKaraokeManager) */
export interface VerseRatingInput {
  verseIndex: number;
  hitFraction: number;
  label: string;
  comboBonus: number;
}

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

/** Single point in pitch-over-time chart data */
export interface PitchChartPoint {
  t: number;      // seconds
  sung: number;   // MIDI note (fractional) or 0
  expected: number; // expected MIDI note or 0
}

/** Histogram bin for pitch deviation */
export interface DeviationBin {
  centRange: string;   // e.g. "−50 to −25"
  count: number;
  pct: number;
}

/** Pitch class usage (chromagram) */
export interface PitchClassUsage {
  note: string;       // C, C#, D, ...
  count: number;
  pct: number;
}

/** Per-verse performance snapshot */
export interface VerseMetric {
  verseIndex: number;
  label: string;         // Awful…Perfect
  hitFraction: number;   // 0–1
  avgCentDeviation: number;
  noteCount: number;
  notesHit: number;
  comboBonus: number;
}

/** Vibrato analysis result */
export interface VibratoStats {
  detected: boolean;
  avgRateHz: number;       // typical 5–7 Hz
  avgExtentCents: number;  // ±cents swing
  regularityPct: number;   // 0–100
}

/** Microphone settings snapshot */
export interface MicSettingsSnapshot {
  deviceId: string;
  deviceLabel: string;
  algorithm: string;
  gain: number;
  rmsThreshold: number;
  pitchThreshold: number;
  smoothingWindow: number;
  hysteresisFrames: number;
  useHanning: boolean;
  latencyOffsetMs: number;
  monitorEnabled: boolean;
  monitorVolume: number;
}

/** Complete performance report for one player */
export interface VocalPerformanceReport {
  // Identity
  playerName: string;
  playerColor: string;
  songTitle: string;
  songArtist: string;
  songBpm: number;
  difficulty: string;
  timestamp: string;            // ISO date

  // Scores
  classicScore: number;         // 0–10 000
  bonusScore: number;
  totalScore: number;
  maxCombo: number;
  totalComboBonus: number;

  // Pitch accuracy
  totalPitchPoints: number;
  avgCentDeviation: number;     // mean absolute cent error
  medianCentDeviation: number;
  stdDevCents: number;          // standard deviation of cent errors
  intonationAccuracyPct: number; // % within ±50 cents of target
  perfectHitPct: number;        // % within ±15 cents
  pitchDeviationHistogram: DeviationBin[];

  // Vocal range
  lowestHz: number;
  highestHz: number;
  lowestNote: string;           // e.g. "A2"
  highestNote: string;          // e.g. "C5"
  rangeInSemitones: number;
  tessituraLow: string;         // 10th–90th percentile
  tessituraHigh: string;

  // Chromagram
  pitchClassDistribution: PitchClassUsage[];

  // Vibrato
  vibrato: VibratoStats;

  // Temporal
  avgOnsetDeviationMs: number;  // how early/late the singer attacks notes
  rhythmStabilityPct: number;   // consistency of onset timing

  // Jitter & shimmer (pitch stability proxies)
  jitterPct: number;            // cycle-to-cycle pitch variation
  shimmerProxy: number;         // amplitude stability (from RMS silence ratio)

  // Verse breakdown
  verseMetrics: VerseMetric[];

  // Microphone
  micSettings: MicSettingsSnapshot | null;

  // Chart data
  pitchOverTime: PitchChartPoint[];
  accuracyOverTime: { t: number; accuracy: number }[]; // rolling accuracy %
}

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function hzToMidi(hz: number): number {
  return 12 * Math.log2(hz / 440) + 69;
}

function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[Math.round(midi) % 12];
  const octave = Math.floor(Math.round(midi) / 12) - 1;
  return `${note}${octave}`;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/* ═══════════════════════════════════════════
   Main analysis function
   ═══════════════════════════════════════════ */

export function computeVocalPerformanceReport(params: {
  playerName: string;
  playerColor: string;
  songTitle: string;
  songArtist: string;
  songBpm: number;
  difficulty: string;
  pitchPoints: PitchPoint[];
  notes: NoteDescriptor[];
  verseRatings: VerseRatingInput[];
  combo: ComboResult | null;
  classicScore: number;
  bonusScore: number;
  totalScore: number;
  micSettings: MicSettingsSnapshot | null;
}): VocalPerformanceReport {
  const {
    playerName, playerColor, songTitle, songArtist, songBpm, difficulty,
    pitchPoints, notes, verseRatings, combo,
    classicScore, bonusScore, totalScore, micSettings,
  } = params;

  // Filter valid pitch points (hz > 0)
  const validPoints = pitchPoints.filter(p => p.hz > 0);
  const validMidis = validPoints.map(p => hzToMidi(p.hz));

  // ──────────── Pitch Accuracy ────────────
  const centDeviations: number[] = [];
  const pitchOverTime: PitchChartPoint[] = [];
  const onsetDeviationsMs: number[] = [];

  // Sort notes by startTime for binary-search lookups
  const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime);

  /** Binary-search: find expected MIDI note at time t.  O(log n) per lookup. */
  function findExpectedMidi(t: number): number {
    let lo = 0, hi = sortedNotes.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const n = sortedNotes[mid];
      if (t < n.startTime) { hi = mid - 1; }
      else if (t > n.startTime + n.duration) { lo = mid + 1; }
      else { return n.pitch; }
    }
    return 0;
  }

  // Build pitchOverTime & cent deviations using binary search
  for (const pt of pitchPoints) {
    const sungMidi = pt.hz > 0 ? hzToMidi(pt.hz) : 0;
    const expectedMidi = findExpectedMidi(pt.t);
    pitchOverTime.push({ t: pt.t, sung: sungMidi, expected: expectedMidi });

    if (sungMidi > 0 && expectedMidi > 0) {
      const centDev = (sungMidi - expectedMidi) * 100; // 1 semitone = 100 cents
      centDeviations.push(centDev);
    }
  }

  // Onset analysis: validPoints are already time-ordered from the mic stream.
  // For each note, binary-search the first valid pitch point in [startTime-0.3, startTime+duration].
  let onsetScanIdx = 0; // linear sweep since both lists are time-sorted
  for (const n of sortedNotes) {
    const tLo = n.startTime - 0.3;
    const tHi = n.startTime + n.duration;
    // Advance scan pointer to the first point >= tLo
    while (onsetScanIdx < validPoints.length && validPoints[onsetScanIdx].t < tLo) onsetScanIdx++;
    if (onsetScanIdx < validPoints.length && validPoints[onsetScanIdx].t <= tHi) {
      onsetDeviationsMs.push((validPoints[onsetScanIdx].t - n.startTime) * 1000);
    }
  }

  const absCentDeviations = centDeviations.map(Math.abs);
  const sortedAbsCents = [...absCentDeviations].sort((a, b) => a - b);
  const avgCentDev = absCentDeviations.length > 0
    ? absCentDeviations.reduce((a, b) => a + b, 0) / absCentDeviations.length
    : 0;
  const medianCentDev = percentile(sortedAbsCents, 50);
  const stdDevCents = absCentDeviations.length > 1
    ? Math.sqrt(absCentDeviations.reduce((sum, d) => sum + (d - avgCentDev) ** 2, 0) / (absCentDeviations.length - 1))
    : 0;
  const within50 = absCentDeviations.filter(d => d <= 50).length;
  const within15 = absCentDeviations.filter(d => d <= 15).length;
  const intonationPct = absCentDeviations.length > 0 ? (within50 / absCentDeviations.length) * 100 : 0;
  const perfectPct = absCentDeviations.length > 0 ? (within15 / absCentDeviations.length) * 100 : 0;

  // Deviation histogram — single-pass bucket classification
  const histLabels = ["< −100", "−100 to −50", "−50 to −25", "−25 to −15", "−15 to 0",
                       "0 to +15", "+15 to +25", "+25 to +50", "+50 to +100", "> +100"];
  const histCounts = new Array(10).fill(0);
  for (const d of centDeviations) {
    const idx = d < -100 ? 0 : d < -50 ? 1 : d < -25 ? 2 : d < -15 ? 3 : d < 0 ? 4
              : d < 15 ? 5 : d < 25 ? 6 : d < 50 ? 7 : d < 100 ? 8 : 9;
    histCounts[idx]++;
  }
  const deviationHistogram: DeviationBin[] = histLabels.map((label, i) => ({
    centRange: label,
    count: histCounts[i],
    pct: centDeviations.length > 0 ? (histCounts[i] / centDeviations.length) * 100 : 0,
  }));

  // ──────────── Vocal Range ────────────
  const sortedHz = validPoints.map(p => p.hz).sort((a, b) => a - b);
  const lowestHz = sortedHz.length > 0 ? sortedHz[0] : 0;
  const highestHz = sortedHz.length > 0 ? sortedHz[sortedHz.length - 1] : 0;
  const lowestMidi = lowestHz > 0 ? hzToMidi(lowestHz) : 0;
  const highestMidi = highestHz > 0 ? hzToMidi(highestHz) : 0;
  const rangeInSemitones = highestMidi - lowestMidi;
  const sortedMidis = [...validMidis].sort((a, b) => a - b);
  const tessLow = percentile(sortedMidis, 10);
  const tessHigh = percentile(sortedMidis, 90);

  // ──────────── Chromagram ────────────
  const pitchClassCounts = new Array(12).fill(0);
  for (const m of validMidis) {
    const pc = Math.round(m) % 12;
    if (pc >= 0 && pc < 12) pitchClassCounts[pc]++;
  }
  const totalPc = pitchClassCounts.reduce((a: number, b: number) => a + b, 0);
  const pitchClassDistribution: PitchClassUsage[] = NOTE_NAMES.map((name, i) => ({
    note: name,
    count: pitchClassCounts[i],
    pct: totalPc > 0 ? (pitchClassCounts[i] / totalPc) * 100 : 0,
  }));

  // ──────────── Vibrato Detection ────────────
  const vibrato = analyzeVibrato(validPoints);

  // ──────────── Temporal Metrics ────────────
  const avgOnsetMs = onsetDeviationsMs.length > 0
    ? onsetDeviationsMs.reduce((a, b) => a + b, 0) / onsetDeviationsMs.length
    : 0;
  const onsetStdDev = onsetDeviationsMs.length > 1
    ? Math.sqrt(onsetDeviationsMs.reduce((s, d) => s + (d - avgOnsetMs) ** 2, 0) / (onsetDeviationsMs.length - 1))
    : 0;
  // Rhythm stability: inverse of onset std dev, mapped to 0-100
  const rhythmStab = onsetStdDev > 0 ? Math.max(0, Math.min(100, 100 - onsetStdDev / 2)) : 100;

  // ──────────── Jitter (pitch stability) ────────────
  let jitterSum = 0;
  let jitterCount = 0;
  for (let i = 1; i < validMidis.length; i++) {
    const diff = Math.abs(validMidis[i] - validMidis[i - 1]);
    jitterSum += diff;
    jitterCount++;
  }
  const jitterPct = jitterCount > 0 ? (jitterSum / jitterCount) * 100 / 12 : 0; // normalized

  // Shimmer proxy: ratio of silent frames to total
  const silentFrames = pitchPoints.filter(p => p.hz <= 0).length;
  const shimmerProxy = pitchPoints.length > 0
    ? (1 - silentFrames / pitchPoints.length) * 100
    : 0;

  // ──────────── Verse Metrics ────────────
  // Pre-group notes by verse
  const notesByVerse = new Map<number, NoteDescriptor[]>();
  for (const n of notes) {
    const v = n.line ?? 0;
    if (!notesByVerse.has(v)) notesByVerse.set(v, []);
    notesByVerse.get(v)!.push(n);
  }

  // Pre-compute per-verse cent deviations using single scan over validPoints.
  // For each valid point, binary-search its matching note, then attribute to that note's verse.
  const verseCentDevsMap = new Map<number, number[]>();
  for (const pt of validPoints) {
    const expectedMidi = findExpectedMidi(pt.t);
    if (expectedMidi <= 0) continue;
    // Find which note (to get verse index)
    let lo = 0, hi = sortedNotes.length - 1, noteVerse = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const n = sortedNotes[mid];
      if (pt.t < n.startTime) { hi = mid - 1; }
      else if (pt.t > n.startTime + n.duration) { lo = mid + 1; }
      else { noteVerse = n.line ?? 0; break; }
    }
    if (noteVerse < 0) continue;
    const centDev = Math.abs((hzToMidi(pt.hz) - expectedMidi) * 100);
    if (!verseCentDevsMap.has(noteVerse)) verseCentDevsMap.set(noteVerse, []);
    verseCentDevsMap.get(noteVerse)!.push(centDev);
  }

  const verseMetrics: VerseMetric[] = verseRatings.map(vr => {
    const verseNotes = notesByVerse.get(vr.verseIndex) ?? [];
    const verseCentDevs = verseCentDevsMap.get(vr.verseIndex) ?? [];
    const avgCent = verseCentDevs.length > 0
      ? verseCentDevs.reduce((a, b) => a + b, 0) / verseCentDevs.length : 0;

    return {
      verseIndex: vr.verseIndex,
      label: vr.label,
      hitFraction: vr.hitFraction,
      avgCentDeviation: Math.round(avgCent * 10) / 10,
      noteCount: verseNotes.length,
      notesHit: Math.round(vr.hitFraction * verseNotes.length),
      comboBonus: vr.comboBonus,
    };
  });

  // ──────────── Rolling accuracy (for chart) — two-pointer sliding window ────────────
  const windowSec = 2;
  const stepSec = 0.5;
  const maxT = pitchPoints.length > 0 ? pitchPoints[pitchPoints.length - 1].t : 0;
  const accuracyOverTime: { t: number; accuracy: number }[] = [];

  // Pre-filter to only voiced points with expected pitch (once, not per step)
  const voicedChartPts = pitchOverTime.filter(p => p.sung > 0 && p.expected > 0);

  if (voicedChartPts.length > 0) {
    let wLo = 0; // left pointer into voicedChartPts
    let wHi = 0; // right pointer (exclusive)
    let hitsInWindow = 0;

    for (let t = 0; t <= maxT; t += stepSec) {
      const tLo = t - windowSec / 2;
      const tHi = t + windowSec / 2;

      // Advance right pointer: add points entering the window
      while (wHi < voicedChartPts.length && voicedChartPts[wHi].t < tHi) {
        if (Math.abs(voicedChartPts[wHi].sung - voicedChartPts[wHi].expected) <= 0.5) hitsInWindow++;
        wHi++;
      }
      // Advance left pointer: remove points leaving the window
      while (wLo < wHi && voicedChartPts[wLo].t < tLo) {
        if (Math.abs(voicedChartPts[wLo].sung - voicedChartPts[wLo].expected) <= 0.5) hitsInWindow--;
        wLo++;
      }
      const count = wHi - wLo;
      accuracyOverTime.push({ t, accuracy: count > 0 ? (hitsInWindow / count) * 100 : 0 });
    }
  } else {
    for (let t = 0; t <= maxT; t += stepSec) {
      accuracyOverTime.push({ t, accuracy: 0 });
    }
  }

  return {
    playerName,
    playerColor,
    songTitle,
    songArtist,
    songBpm,
    difficulty,
    timestamp: new Date().toISOString(),
    classicScore,
    bonusScore,
    totalScore,
    maxCombo: combo?.maxCombo ?? 0,
    totalComboBonus: combo?.totalComboBonus ?? 0,
    totalPitchPoints: pitchPoints.length,
    avgCentDeviation: Math.round(avgCentDev * 10) / 10,
    medianCentDeviation: Math.round(medianCentDev * 10) / 10,
    stdDevCents: Math.round(stdDevCents * 10) / 10,
    intonationAccuracyPct: Math.round(intonationPct * 10) / 10,
    perfectHitPct: Math.round(perfectPct * 10) / 10,
    pitchDeviationHistogram: deviationHistogram,
    lowestHz: Math.round(lowestHz * 10) / 10,
    highestHz: Math.round(highestHz * 10) / 10,
    lowestNote: lowestMidi > 0 ? midiToNoteName(lowestMidi) : "—",
    highestNote: highestMidi > 0 ? midiToNoteName(highestMidi) : "—",
    rangeInSemitones: Math.round(rangeInSemitones * 10) / 10,
    tessituraLow: tessLow > 0 ? midiToNoteName(tessLow) : "—",
    tessituraHigh: tessHigh > 0 ? midiToNoteName(tessHigh) : "—",
    pitchClassDistribution,
    vibrato,
    avgOnsetDeviationMs: Math.round(avgOnsetMs * 10) / 10,
    rhythmStabilityPct: Math.round(rhythmStab * 10) / 10,
    jitterPct: Math.round(jitterPct * 100) / 100,
    shimmerProxy: Math.round(shimmerProxy * 10) / 10,
    verseMetrics,
    micSettings,
    pitchOverTime,
    accuracyOverTime,
  };
}

/* ═══════════════════════════════════════════
   Vibrato analysis
   ═══════════════════════════════════════════ */

function analyzeVibrato(points: PitchPoint[]): VibratoStats {
  if (points.length < 20) {
    return { detected: false, avgRateHz: 0, avgExtentCents: 0, regularityPct: 0 };
  }

  // Convert to MIDI
  const midis = points.map(p => hzToMidi(p.hz));
  const times = points.map(p => p.t);

  // Sliding window vibrato detection — O(n) two-pointer approach
  const windowSize = 0.5; // seconds
  const rates: number[] = [];
  const extents: number[] = [];

  let wLeft = 0;
  // Maintain a running sum & count for the window to compute mean incrementally
  let windowSum = 0;
  let windowCount = 0;

  for (let wRight = 0; wRight < points.length; wRight++) {
    // Add point to window
    windowSum += midis[wRight];
    windowCount++;

    // Shrink window from the left if it exceeds windowSize
    while (wLeft < wRight && times[wRight] - times[wLeft] >= windowSize) {
      windowSum -= midis[wLeft];
      windowCount--;
      wLeft++;
    }

    // Only analyze when we've accumulated enough points and hit a window boundary
    // Process every ~10th point to avoid redundant work (still O(n) overall)
    if (windowCount < 6 || (wRight - wLeft) % 10 !== 0) continue;

    // Count zero-crossings of the detrended signal within this window
    const mean = windowSum / windowCount;
    let crossings = 0;
    let prevSign = midis[wLeft] - mean;
    let maxSwing = Math.abs(prevSign);
    for (let k = wLeft + 1; k <= wRight; k++) {
      const val = midis[k] - mean;
      if (val * prevSign < 0) crossings++;
      prevSign = val;
      const absVal = Math.abs(val);
      if (absVal > maxSwing) maxSwing = absVal;
    }

    const duration = times[wRight] - times[wLeft];
    if (duration <= 0) continue;
    const rate = (crossings / 2) / duration;
    if (rate >= 3 && rate <= 12) {
      rates.push(rate);
      extents.push(maxSwing * 100); // cents
    }
  }

  if (rates.length < 3) {
    return { detected: false, avgRateHz: 0, avgExtentCents: 0, regularityPct: 0 };
  }

  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  const avgExtent = extents.reduce((a, b) => a + b, 0) / extents.length;

  // Regularity: how consistent is the rate?
  const rateStdDev = Math.sqrt(rates.reduce((s, r) => s + (r - avgRate) ** 2, 0) / rates.length);
  const regularity = Math.max(0, Math.min(100, 100 - rateStdDev * 20));

  return {
    detected: true,
    avgRateHz: Math.round(avgRate * 10) / 10,
    avgExtentCents: Math.round(avgExtent * 10) / 10,
    regularityPct: Math.round(regularity),
  };
}
