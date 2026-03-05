/**
 * Karaoke Pad Session — play karaoke by hitting notes with keyboard/pad instead of singing.
 * Difficulty levels control how many keys are needed (more keys = harder).
 */

export type PadKaraokeDifficulty = 'easy' | 'normal' | 'hard' | 'expert';

export interface PadKaraokeConfig {
  difficulty: PadKaraokeDifficulty;
  /** Number of active keys for this difficulty */
  keyCount: number;
  /** Tolerance in semitones for "correct" hit */
  semitoneTolerance: number;
  /** Window in ms before the note to accept early hits */
  preWindowMs: number;
  /** Window in ms after the note to accept late hits */
  postWindowMs: number;
}

export interface PadKaraokeNote {
  id: number;
  pitch: number;
  startTime: number;
  duration: number;
  lyric?: string;
  isGolden?: boolean;
}

export interface PadKaraokeHit {
  noteId: number;
  padIndex: number;
  accuracy: 'perfect' | 'good' | 'ok' | 'miss';
  timeDeltaMs: number;
  score: number;
}

export interface PadKaraokeResult {
  totalScore: number;
  maxScore: number;
  hits: PadKaraokeHit[];
  combo: number;
  maxCombo: number;
  accuracy: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export const DIFFICULTY_CONFIGS: Record<PadKaraokeDifficulty, PadKaraokeConfig> = {
  easy: { difficulty: 'easy', keyCount: 4, semitoneTolerance: 3, preWindowMs: 200, postWindowMs: 250 },
  normal: { difficulty: 'normal', keyCount: 8, semitoneTolerance: 2, preWindowMs: 150, postWindowMs: 200 },
  hard: { difficulty: 'hard', keyCount: 12, semitoneTolerance: 1, preWindowMs: 100, postWindowMs: 150 },
  expert: { difficulty: 'expert', keyCount: 16, semitoneTolerance: 0, preWindowMs: 80, postWindowMs: 120 },
};

/** Map a MIDI note pitch to a pad index given difficulty key count */
export function pitchToPadIndex(pitch: number, keyCount: number, minPitch: number = 36, maxPitch: number = 84): number {
  const range = maxPitch - minPitch;
  const normalized = Math.max(0, Math.min(1, (pitch - minPitch) / range));
  return Math.min(keyCount - 1, Math.floor(normalized * keyCount));
}

/** Check if a pad press matches an expected note */
export function evaluateHit(
  padIndex: number,
  pressTimeMs: number,
  expectedNote: PadKaraokeNote,
  config: PadKaraokeConfig,
  minPitch: number = 36,
  maxPitch: number = 84,
): PadKaraokeHit {
  const expectedPad = pitchToPadIndex(expectedNote.pitch, config.keyCount, minPitch, maxPitch);
  const timeDelta = pressTimeMs - expectedNote.startTime * 1000;
  const isCorrectPad = padIndex === expectedPad;
  const isInWindow = timeDelta >= -config.preWindowMs && timeDelta <= config.postWindowMs + expectedNote.duration * 1000;

  let accuracy: PadKaraokeHit['accuracy'];
  let score: number;

  if (!isCorrectPad || !isInWindow) {
    accuracy = 'miss';
    score = 0;
  } else {
    const absTimeDelta = Math.abs(timeDelta);
    if (absTimeDelta <= 50) {
      accuracy = 'perfect';
      score = expectedNote.isGolden ? 200 : 100;
    } else if (absTimeDelta <= 120) {
      accuracy = 'good';
      score = expectedNote.isGolden ? 150 : 75;
    } else {
      accuracy = 'ok';
      score = expectedNote.isGolden ? 100 : 50;
    }
  }

  return { noteId: expectedNote.id, padIndex, accuracy, timeDeltaMs: timeDelta, score };
}

/** Calculate final results from all hits */
export function calculateResult(hits: PadKaraokeHit[], totalNotes: number): PadKaraokeResult {
  let totalScore = 0;
  let combo = 0;
  let maxCombo = 0;
  const maxScore = totalNotes * 100;

  for (const hit of hits) {
    totalScore += hit.score;
    if (hit.accuracy !== 'miss') {
      combo++;
      maxCombo = Math.max(maxCombo, combo);
    } else {
      combo = 0;
    }
  }

  // Add combo bonus (10% of total per 10-combo)
  const comboBonus = Math.floor(maxCombo / 10) * (maxScore * 0.1);
  totalScore += comboBonus;

  const accuracy = totalNotes > 0 ? hits.filter(h => h.accuracy !== 'miss').length / totalNotes : 0;

  let grade: PadKaraokeResult['grade'];
  if (accuracy >= 0.95) grade = 'S';
  else if (accuracy >= 0.85) grade = 'A';
  else if (accuracy >= 0.70) grade = 'B';
  else if (accuracy >= 0.55) grade = 'C';
  else if (accuracy >= 0.40) grade = 'D';
  else grade = 'F';

  return { totalScore, maxScore, hits, combo, maxCombo, accuracy, grade };
}

/** Generate a key mapping label for UI display */
export function getPadKeyLabel(padIndex: number, keyCount: number): string {
  const labels4 = ['↑', '←', '↓', '→'];
  const labels8 = ['1', '2', '3', '4', 'Q', 'W', 'E', 'R'];
  const labels12 = ['1', '2', '3', '4', '5', '6', 'Q', 'W', 'E', 'R', 'T', 'Y'];
  const labels16 = ['1', '2', '3', '4', '5', '6', '7', '8', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I'];

  if (keyCount <= 4) return labels4[padIndex] || '';
  if (keyCount <= 8) return labels8[padIndex] || '';
  if (keyCount <= 12) return labels12[padIndex] || '';
  return labels16[padIndex] || '';
}
