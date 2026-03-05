// src/workers/scoringWorker.ts
// Web Worker for offloading karaoke scoring computation from the main thread.

// --- Types (duplicated from karaokeScoring.ts to keep worker self-contained) ---

interface NoteDescriptor {
  startTime: number;
  duration: number;
  pitch: number;
  isGold?: boolean;
  line?: number;
  idx?: number;
}

interface PitchPoint { t: number; hz: number }

interface ScoringParams {
  semitoneTolerance: number;
  preWindow: number;
  postExtra: number;
  segMs?: number;
  completionBonusFactor?: number;
  goldFullBonusFactor?: number;
  difficultyMult?: number;
  disableGoldNotes?: boolean;
}

interface NoteScoreResult {
  noteKey: string;
  segments: Array<{ segIndex: number; frac: number; add: number; segStart: number; segEnd: number; visualStart: number; visualEnd: number }>;
  totalAdded: number;
  completed?: boolean;
  completionBonus?: number;
  goldFullBonus?: number;
}

interface ScoringResult {
  classicScore: number;
  bonusScore: number;
  totalScore: number;
  total: number;
  perNote: NoteScoreResult[];
  combo?: ComboResult;
  verseRatings?: VerseRating[];
}

type VerseRatingLabel = 'Awful' | 'Bad' | 'OK' | 'Good' | 'Great' | 'Perfect';

interface VerseRating {
  verseIndex: number;
  hitFraction: number;
  label: VerseRatingLabel;
  comboBonus: number;
}

interface ComboResult {
  maxCombo: number;
  currentCombo: number;
  totalComboBonus: number;
}

export interface ScoringWorkerRequest {
  id: number;
  notes: NoteDescriptor[];
  points: PitchPoint[];
  params: ScoringParams;
}

export interface ScoringWorkerResponse {
  id: number;
  result: ScoringResult;
}

// --- Scoring functions (duplicated from karaokeScoring.ts) ---

function getVerseRatingLabel(fraction: number): VerseRatingLabel {
  if (fraction >= 0.95) return 'Perfect';
  if (fraction >= 0.80) return 'Great';
  if (fraction >= 0.60) return 'Good';
  if (fraction >= 0.40) return 'OK';
  if (fraction >= 0.20) return 'Bad';
  return 'Awful';
}

function getComboMultiplier(combo: number): number {
  if (combo >= 50) return 3.0;
  if (combo >= 30) return 2.5;
  if (combo >= 20) return 2.0;
  if (combo >= 10) return 1.5;
  return 1.0;
}

function scoreNotesWithPitchPoints(notes: NoteDescriptor[], points: PitchPoint[], params: ScoringParams): ScoringResult {
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
        const midiFloat = 12 * Math.log2(p.hz / 440) + 69;
        const diff = Math.abs(midiFloat - n.pitch);
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
      currentCombo++;
      if (currentCombo > maxCombo) maxCombo = currentCombo;
      verseStats.hit++;

      const comboMult = getComboMultiplier(currentCombo);
      const comboBonus = comboMult > 1 ? Math.round(noteTotalAdded * (comboMult - 1)) : 0;
      totalComboBonus += comboBonus;
      verseStats.comboBonus += comboBonus;

      const allSegments = Math.max(1, Math.ceil((n.duration || 0.25) / segMs));
      const doneSegments = segResults.length;
      const completed = doneSegments >= allSegments;
      const completionBonus = completed ? Math.round(Math.max(10, Math.round(100 * (n.duration || 1))) * completionBonusFactor * ((!disableGold && n.isGold) ? 1.5 : 1) * difficultyMult) : 0;
      const goldFullBonus = (completed && !disableGold && n.isGold) ? Math.round(Math.max(10, Math.round(100 * (n.duration || 1))) * goldFullBonusFactor * difficultyMult) : 0;
      totalCompletionBonus += completionBonus;
      totalGoldFullBonus += goldFullBonus;
      perNote.push({ noteKey: `${n.line ?? 0}-${n.idx ?? 0}`, segments: segResults, totalAdded: noteTotalAdded, completed, completionBonus, goldFullBonus });
    } else {
      currentCombo = 0;
    }
  });

  const verseRatings: VerseRating[] = [];
  for (const [line, vs] of verseMap.entries()) {
    const fraction = vs.total > 0 ? vs.hit / vs.total : 0;
    verseRatings.push({ verseIndex: line, hitFraction: fraction, label: getVerseRatingLabel(fraction), comboBonus: vs.comboBonus });
  }

  const combo: ComboResult = { maxCombo, currentCombo, totalComboBonus };
  const rawBonus = totalComboBonus + totalCompletionBonus + totalGoldFullBonus;
  return {
    classicScore: totalScore,
    bonusScore: rawBonus,
    totalScore: totalScore + rawBonus,
    total: totalScore,
    perNote,
    combo,
    verseRatings,
  };
}

function computeTheoreticalMax(notes: NoteDescriptor[], disableGoldNotes?: boolean): number {
  let max = 0;
  for (const n of notes) {
    const baseTotal = Math.max(10, Math.round(100 * (n.duration || 1)));
    const mult = (!disableGoldNotes && n.isGold) ? 2 : 1;
    max += baseTotal * mult;
  }
  return max;
}

function scaleTo10k(rawScore: number, theoreticalMax: number): number {
  if (theoreticalMax <= 0) return 0;
  return Math.min(10000, Math.round((rawScore / theoreticalMax) * 10000));
}

function scaleResult(result: ScoringResult, notes: NoteDescriptor[], disableGoldNotes?: boolean): ScoringResult {
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

self.onmessage = (e: MessageEvent<ScoringWorkerRequest>) => {
  const { id, notes, points, params } = e.data;
  const rawResult = scoreNotesWithPitchPoints(notes, points, params);
  const result = scaleResult(rawResult, notes, params.disableGoldNotes);
  const response: ScoringWorkerResponse = { id, result };
  self.postMessage(response);
};
