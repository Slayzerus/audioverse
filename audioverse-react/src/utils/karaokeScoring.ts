
export interface NoteDescriptor {
  startTime: number;
  duration: number;
  pitch: number;
  isGold?: boolean;
  line?: number;
  idx?: number;
}

export interface PitchPoint { t: number; hz: number }

export interface ScoringParams {
  semitoneTolerance: number;
  preWindow: number;
  postExtra: number;
  segMs?: number;
  completionBonusFactor?: number;
  goldFullBonusFactor?: number;
  difficultyMult?: number;
  /** When true, gold notes are treated as regular (ScoreFactor=1 instead of 2). */
  disableGoldNotes?: boolean;
}

export interface NoteScoreResult {
  noteKey: string;
  segments: Array<{ segIndex: number; frac: number; add: number; segStart: number; segEnd: number; visualStart: number; visualEnd: number }>;
  totalAdded: number;
  completed?: boolean;
  completionBonus?: number;
  goldFullBonus?: number;
}

/** Aggregated note-level statistics for backend submission. */
export interface NoteStats {
  /** Notes where the player scored > 0 */
  hits: number;
  /** Notes with zero score */
  misses: number;
  /** Partially-hit notes (some segments scored, not all) */
  good: number;
  /** Fully-completed notes (all segments scored) */
  perfect: number;
  /** Longest consecutive note-hit streak */
  maxCombo: number;
}

export interface ScoringResult {
  /** Classic score: note hits with gold 2× (UltraStar rules). Raw before scaling, 0–10 000 after. */
  classicScore: number;
  /** Bonus points: combo + completion + gold-full bonuses. Raw before scaling, uncapped after. */
  bonusScore: number;
  /** Total = classicScore + bonusScore */
  totalScore: number;
  /** @deprecated Alias for classicScore — backward compat with tests */
  total: number;
  perNote: NoteScoreResult[];
  combo?: ComboResult;
  verseRatings?: VerseRating[];
  /** Aggregated hit/miss/good/perfect/combo stats for backend XP formula. */
  noteStats?: NoteStats;
}

/** Rating labels for verse performance (UltraStar-style) */
export type VerseRatingLabel = 'Awful' | 'Bad' | 'OK' | 'Good' | 'Great' | 'Perfect';

export interface VerseRating {
  verseIndex: number;
  hitFraction: number; // 0-1: fraction of notes in this verse that were hit
  label: VerseRatingLabel;
  comboBonus: number;  // bonus points from combo during this verse
}

export interface ComboResult {
  maxCombo: number;
  currentCombo: number;
  totalComboBonus: number;
}

/** Map a hit fraction (0-1) to a rating label */
export function getVerseRatingLabel(fraction: number): VerseRatingLabel {
  if (fraction >= 0.95) return 'Perfect';
  if (fraction >= 0.80) return 'Great';
  if (fraction >= 0.60) return 'Good';
  if (fraction >= 0.40) return 'OK';
  if (fraction >= 0.20) return 'Bad';
  return 'Awful';
}

/** Combo multiplier: combo >= 10 → 1.5x, >= 20 → 2x, >= 30 → 2.5x, >= 50 → 3x */
export function getComboMultiplier(combo: number): number {
  if (combo >= 50) return 3.0;
  if (combo >= 30) return 2.5;
  if (combo >= 20) return 2.0;
  if (combo >= 10) return 1.5;
  return 1.0;
}

// Simple scoring implementation ported from KaraokeManager scoring loop.
export function scoreNotesWithPitchPoints(notes: NoteDescriptor[], points: PitchPoint[], params: ScoringParams) : ScoringResult {
  const { semitoneTolerance, preWindow, postExtra } = params;
  const segMs = params.segMs ?? 0.25;
  const completionBonusFactor = typeof params.completionBonusFactor === 'number' ? params.completionBonusFactor : 0.15;
  const goldFullBonusFactor = typeof params.goldFullBonusFactor === 'number' ? params.goldFullBonusFactor : 0.30;
  const difficultyMult = typeof params.difficultyMult === 'number' ? params.difficultyMult : 1;
  const disableGold = !!params.disableGoldNotes;
  let totalScore = 0;
  let totalCompletionBonus = 0;
  let totalGoldFullBonus = 0;
  const perNote: NoteScoreResult[] = [];

  // Combo tracking
  let currentCombo = 0;
  let maxCombo = 0;
  let totalComboBonus = 0;

  // Verse tracking — group notes by line for verse ratings
  const verseMap = new Map<number, { total: number; hit: number; comboBonus: number }>();

  notes.forEach((n, _ni) => {
    const noteStart = n.startTime;
    const noteEnd = n.startTime + n.duration;
    const windowStart = noteStart - preWindow;
    const windowEnd = noteEnd + postExtra;
    // if no points inside window -> skip
    const inWindow = points.filter(p => p.t >= windowStart && p.t <= windowEnd && p.hz > 0);
    if (!inWindow || inWindow.length === 0) return;

    const segments = Math.max(1, Math.ceil((n.duration || 0.25) / segMs));
    const baseTotal = Math.max(10, Math.round(100 * (n.duration || 1)));
    const basePerSeg = Math.max(1, Math.round(baseTotal / segments));

    let noteTotalAdded = 0;
    const segResults: NoteScoreResult['segments'] = [];

    for (let si = 0; si < segments; si++) {
      const segStart = noteStart + (si * (n.duration / segments));
      const segEnd = noteStart + ((si + 1) * (n.duration / segments));
      const segPad = Math.min(0.06, (n.duration / segments) * 0.2);
      const sStart = segStart - segPad;
      const sEnd = segEnd + segPad;
      const segPts = points.filter(p => p.t >= sStart && p.t <= sEnd && p.hz > 0);
      if (!segPts || segPts.length === 0) continue;

      let accSum = 0;
      segPts.forEach(p => {
        // Convert Hz to UltraStar pitch with octave folding (same as timeline renderer)
        const midiFloat = 12 * Math.log2(p.hz / 440) + 69;
        // Pitch class 0-11 then octave-fold to match the note's UltraStar pitch
        let detected = ((midiFloat % 12) + 12) % 12;
        while (detected - n.pitch > 6) detected -= 12;
        while (detected - n.pitch < -6) detected += 12;
        const diff = Math.abs(detected - n.pitch);
        accSum += diff;
      });
      const avgDiff = accSum / segPts.length;

      let frac = 0;
      if (semitoneTolerance <= 0) {
        frac = avgDiff === 0 ? 1 : 0;
      } else {
        const maxDiff = semitoneTolerance * 2;
        frac = Math.max(0, 1 - Math.min(avgDiff / maxDiff, 1));
      }
      if (frac <= 0) continue;

      const mult = (!disableGold && n.isGold) ? 2 : 1;
      const add = Math.round(basePerSeg * mult * frac);
      if (add > 0) {
        totalScore += add;
        noteTotalAdded += add;
        segResults.push({ segIndex: si, frac, add, segStart: sStart, segEnd: sEnd, visualStart: segStart, visualEnd: segEnd });
      }
    }

    // Track verse stats
    const verseLine = n.line ?? 0;
    if (!verseMap.has(verseLine)) {
      verseMap.set(verseLine, { total: 0, hit: 0, comboBonus: 0 });
    }
    const verseStats = verseMap.get(verseLine)!;
    verseStats.total++;

    if (noteTotalAdded > 0) {
      // Note was hit — increment combo
      currentCombo++;
      if (currentCombo > maxCombo) maxCombo = currentCombo;
      verseStats.hit++;

      // Apply combo multiplier bonus
      const comboMult = getComboMultiplier(currentCombo);
      const comboBonus = comboMult > 1 ? Math.round(noteTotalAdded * (comboMult - 1)) : 0;
      totalComboBonus += comboBonus;
      verseStats.comboBonus += comboBonus;

      // check completion (all segments scored)
      const allSegments = Math.max(1, Math.ceil((n.duration || 0.25) / segMs));
      const doneSegments = segResults.length;
      const completed = doneSegments >= allSegments;
      // compute bonuses
      const completionBonus = completed ? Math.round(Math.max(10, Math.round(100 * (n.duration || 1))) * completionBonusFactor * ((!disableGold && n.isGold) ? 1.5 : 1) * difficultyMult) : 0;
      const goldFullBonus = (completed && !disableGold && n.isGold) ? Math.round(Math.max(10, Math.round(100 * (n.duration || 1))) * goldFullBonusFactor * difficultyMult) : 0;
      totalCompletionBonus += completionBonus;
      totalGoldFullBonus += goldFullBonus;
      perNote.push({ noteKey: `${n.line ?? 0}-${n.idx ?? 0}`, segments: segResults, totalAdded: noteTotalAdded, completed, completionBonus, goldFullBonus });
    } else {
      // Note was missed — break combo
      currentCombo = 0;
    }
  });

  // Build verse ratings from verseMap
  const verseRatings: VerseRating[] = [];
  for (const [line, vs] of verseMap.entries()) {
    const fraction = vs.total > 0 ? vs.hit / vs.total : 0;
    verseRatings.push({ verseIndex: line, hitFraction: fraction, label: getVerseRatingLabel(fraction), comboBonus: vs.comboBonus });
  }

  const combo: ComboResult = { maxCombo, currentCombo: 0, totalComboBonus };
  const rawBonus = totalComboBonus + totalCompletionBonus + totalGoldFullBonus;

  // Derive note-level stats for backend XP formula
  const hitNotes = perNote.length;
  const perfectNotes = perNote.filter(n => n.completed).length;
  const noteStats: NoteStats = {
    hits: hitNotes,
    misses: notes.length - hitNotes,
    good: hitNotes - perfectNotes,
    perfect: perfectNotes,
    maxCombo,
  };

  return {
    classicScore: totalScore,
    bonusScore: rawBonus,
    totalScore: totalScore + rawBonus,
    total: totalScore,
    perNote,
    combo,
    verseRatings,
    noteStats,
  };
}

/**
 * Compute the theoretical maximum raw segment score (perfect play on every note).
 * This equals 10 000 in the scaled UI — songs of any length map to the same max.
 */
export function computeTheoreticalMax(notes: NoteDescriptor[], disableGoldNotes?: boolean): number {
  let max = 0;
  for (const n of notes) {
    const baseTotal = Math.max(10, Math.round(100 * (n.duration || 1)));
    const mult = (!disableGoldNotes && n.isGold) ? 2 : 1;
    max += baseTotal * mult;
  }
  return max;
}

/**
 * Scale a raw segment score to the 0–10 000 range.
 * 10 000 = perfect performance regardless of song length.
 */
export function scaleTo10k(rawScore: number, theoreticalMax: number): number {
  if (theoreticalMax <= 0) return 0;
  return Math.min(10000, Math.round((rawScore / theoreticalMax) * 10000));
}

/**
 * Scale a full ScoringResult using UltraStar 10k normalization.
 * - classicScore: capped at 10 000 (UltraStar parity)
 * - bonusScore: scaled proportionally but uncapped (combo/completion/gold-full)
 * - totalScore: classicScore + bonusScore
 * - total: alias for classicScore (backward compat)
 */
export function scaleResult(result: ScoringResult, notes: NoteDescriptor[], disableGoldNotes?: boolean): ScoringResult {
  const max = computeTheoreticalMax(notes, disableGoldNotes);
  if (max <= 0) return { ...result, classicScore: 0, bonusScore: 0, totalScore: 0, total: 0 };
  const classic = scaleTo10k(result.classicScore, max);
  const bonus = Math.round((result.bonusScore / max) * 10000);
  return {
    ...result,
    classicScore: classic,
    bonusScore: bonus,
    totalScore: classic + bonus,
    total: classic,
  };
}

export default { scoreNotesWithPitchPoints, computeTheoreticalMax, scaleTo10k, scaleResult };
