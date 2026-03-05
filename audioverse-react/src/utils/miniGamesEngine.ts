/**
 * Mini-games engine — procedurally generates musical challenges from songs.
 * Supports multiple game types: rhythm, melody, chord recognition, ear training.
 * Challenges can be generated either procedurally (seeded RNG) or from actual
 * karaoke song note data (UltraStar KaraokeNoteData).
 */

import type { KaraokeNoteData } from '../scripts/karaoke/karaokeTimeline';

export type MiniGameType = 'rhythm' | 'melody' | 'chord' | 'interval' | 'sequence';

export interface MiniGameConfig {
  type: MiniGameType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Duration in seconds */
  duration: number;
  /** BPM from the source song */
  bpm: number;
  /** Seed for deterministic generation */
  seed: number;
}

export interface MiniGameChallenge {
  id: number;
  type: MiniGameType;
  /** Time in seconds when this challenge appears */
  time: number;
  /** Expected answer — depends on game type */
  answer: number | number[] | string;
  /** Display options for multiple choice */
  options?: string[];
  /** Points for correct answer */
  points: number;
  /** Time limit in ms to answer */
  timeLimit: number;
}

export interface MiniGameState {
  config: MiniGameConfig;
  challenges: MiniGameChallenge[];
  currentIndex: number;
  score: number;
  maxScore: number;
  streak: number;
  bestStreak: number;
  answers: MiniGameAnswer[];
  isComplete: boolean;
  startedAt: number;
}

export interface MiniGameAnswer {
  challengeId: number;
  answer: number | number[] | string;
  correct: boolean;
  responseTimeMs: number;
}

export interface MiniGameResult {
  score: number;
  maxScore: number;
  accuracy: number;
  streak: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  avgResponseMs: number;
  gameType: MiniGameType;
}

// Seeded random number generator (same as midiSeedGenerator pattern)
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const INTERVAL_NAMES = ['Unison', 'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th', 'Tritone', 'Perfect 5th', 'Minor 6th', 'Major 6th', 'Minor 7th', 'Major 7th', 'Octave'];
const CHORD_TYPES = ['Major', 'Minor', 'Dim', 'Aug', 'Sus4', 'Dom7', 'Maj7', 'Min7'];

/** Generate rhythm challenges: tap along to a pattern */
function generateRhythmChallenges(config: MiniGameConfig, rng: () => number): MiniGameChallenge[] {
  const beatLength = 60 / config.bpm;
  const totalBeats = Math.floor(config.duration / beatLength);
  const challenges: MiniGameChallenge[] = [];
  const patternsPerLevel = [4, 6, 8, 12, 16];
  const count = Math.min(patternsPerLevel[config.difficulty - 1], totalBeats);

  for (let i = 0; i < count; i++) {
    const beatIndex = Math.floor(rng() * totalBeats);
    const subdivision = config.difficulty >= 3 ? (rng() > 0.5 ? 0.5 : 1) : 1;
    challenges.push({
      id: i,
      type: 'rhythm',
      time: beatIndex * beatLength + (subdivision === 0.5 ? beatLength / 2 : 0),
      answer: beatIndex,
      points: config.difficulty >= 4 ? 20 : 10,
      timeLimit: Math.max(200, 600 - config.difficulty * 80),
    });
  }

  return challenges.sort((a, b) => a.time - b.time);
}

/** Generate melody challenges: identify the note being played */
function generateMelodyChallenges(config: MiniGameConfig, rng: () => number): MiniGameChallenge[] {
  const challenges: MiniGameChallenge[] = [];
  const count = 4 + config.difficulty * 2;
  const interval = config.duration / count;

  for (let i = 0; i < count; i++) {
    const noteIndex = Math.floor(rng() * 12);
    const optionCount = Math.min(2 + config.difficulty, 6);
    const options = new Set<string>([NOTE_NAMES[noteIndex]]);
    while (options.size < optionCount) {
      options.add(NOTE_NAMES[Math.floor(rng() * 12)]);
    }

    challenges.push({
      id: i,
      type: 'melody',
      time: i * interval,
      answer: NOTE_NAMES[noteIndex],
      options: [...options].sort(),
      points: 15,
      timeLimit: Math.max(1000, 4000 - config.difficulty * 600),
    });
  }

  return challenges;
}

/** Generate chord recognition challenges */
function generateChordChallenges(config: MiniGameConfig, rng: () => number): MiniGameChallenge[] {
  const challenges: MiniGameChallenge[] = [];
  const count = 3 + config.difficulty;
  const interval = config.duration / count;
  const availableChords = CHORD_TYPES.slice(0, 2 + config.difficulty);

  for (let i = 0; i < count; i++) {
    const root = NOTE_NAMES[Math.floor(rng() * 12)];
    const chordType = availableChords[Math.floor(rng() * availableChords.length)];
    const answer = `${root} ${chordType}`;
    const options = new Set<string>([answer]);
    while (options.size < Math.min(4, 2 + config.difficulty)) {
      const r = NOTE_NAMES[Math.floor(rng() * 12)];
      const ct = availableChords[Math.floor(rng() * availableChords.length)];
      options.add(`${r} ${ct}`);
    }

    challenges.push({
      id: i,
      type: 'chord',
      time: i * interval,
      answer,
      options: [...options].sort(),
      points: 20,
      timeLimit: Math.max(2000, 6000 - config.difficulty * 800),
    });
  }

  return challenges;
}

/** Generate interval recognition challenges */
function generateIntervalChallenges(config: MiniGameConfig, rng: () => number): MiniGameChallenge[] {
  const challenges: MiniGameChallenge[] = [];
  const count = 4 + config.difficulty * 2;
  const interval = config.duration / count;
  const maxInterval = Math.min(6 + config.difficulty * 2, 13);

  for (let i = 0; i < count; i++) {
    const semitones = Math.floor(rng() * maxInterval);
    const options = new Set<string>([INTERVAL_NAMES[semitones]]);
    while (options.size < Math.min(4, 2 + config.difficulty)) {
      options.add(INTERVAL_NAMES[Math.floor(rng() * maxInterval)]);
    }

    challenges.push({
      id: i,
      type: 'interval',
      time: i * interval,
      answer: INTERVAL_NAMES[semitones],
      options: [...options].sort(),
      points: 15,
      timeLimit: Math.max(1500, 5000 - config.difficulty * 700),
    });
  }

  return challenges;
}

/** Generate sequence memory challenges: repeat a sequence of notes */
function generateSequenceChallenges(config: MiniGameConfig, rng: () => number): MiniGameChallenge[] {
  const challenges: MiniGameChallenge[] = [];
  const count = 3 + Math.floor(config.difficulty / 2);
  const interval = config.duration / count;

  for (let i = 0; i < count; i++) {
    const seqLength = 2 + config.difficulty + i;
    const sequence = Array.from({ length: seqLength }, () => Math.floor(rng() * 8));

    challenges.push({
      id: i,
      type: 'sequence',
      time: i * interval,
      answer: sequence,
      points: seqLength * 5,
      timeLimit: seqLength * 1500,
    });
  }

  return challenges;
}

/** Generate a complete mini-game from config */
export function generateMiniGame(config: MiniGameConfig): MiniGameState {
  const rng = seededRandom(config.seed);

  let challenges: MiniGameChallenge[];
  switch (config.type) {
    case 'rhythm': challenges = generateRhythmChallenges(config, rng); break;
    case 'melody': challenges = generateMelodyChallenges(config, rng); break;
    case 'chord': challenges = generateChordChallenges(config, rng); break;
    case 'interval': challenges = generateIntervalChallenges(config, rng); break;
    case 'sequence': challenges = generateSequenceChallenges(config, rng); break;
    default: challenges = [];
  }

  const maxScore = challenges.reduce((sum, c) => sum + c.points, 0);

  return {
    config,
    challenges,
    currentIndex: 0,
    score: 0,
    maxScore,
    streak: 0,
    bestStreak: 0,
    answers: [],
    isComplete: false,
    startedAt: 0,
  };
}

/** Submit an answer and advance the game state */
export function submitAnswer(
  state: MiniGameState,
  answer: number | number[] | string,
  responseTimeMs: number
): MiniGameState {
  if (state.isComplete || state.currentIndex >= state.challenges.length) {
    return { ...state, isComplete: true };
  }

  const challenge = state.challenges[state.currentIndex];
  let correct: boolean;

  if (Array.isArray(challenge.answer) && Array.isArray(answer)) {
    correct = challenge.answer.length === answer.length &&
      challenge.answer.every((v, i) => v === (answer as number[])[i]);
  } else {
    correct = challenge.answer === answer;
  }

  const newAnswer: MiniGameAnswer = {
    challengeId: challenge.id,
    answer,
    correct,
    responseTimeMs,
  };

  const streak = correct ? state.streak + 1 : 0;
  const bestStreak = Math.max(state.bestStreak, streak);
  const score = state.score + (correct ? challenge.points : 0);
  const nextIndex = state.currentIndex + 1;

  return {
    ...state,
    currentIndex: nextIndex,
    score,
    streak,
    bestStreak,
    answers: [...state.answers, newAnswer],
    isComplete: nextIndex >= state.challenges.length,
  };
}

/** Calculate final game result */
export function calculateMiniGameResult(state: MiniGameState): MiniGameResult {
  const accuracy = state.challenges.length > 0
    ? state.answers.filter(a => a.correct).length / state.challenges.length
    : 0;

  const avgResponseMs = state.answers.length > 0
    ? state.answers.reduce((sum, a) => sum + a.responseTimeMs, 0) / state.answers.length
    : 0;

  let grade: MiniGameResult['grade'];
  if (accuracy >= 0.95) grade = 'S';
  else if (accuracy >= 0.85) grade = 'A';
  else if (accuracy >= 0.70) grade = 'B';
  else if (accuracy >= 0.55) grade = 'C';
  else if (accuracy >= 0.40) grade = 'D';
  else grade = 'F';

  return {
    score: state.score,
    maxScore: state.maxScore,
    accuracy,
    streak: state.bestStreak,
    grade,
    avgResponseMs,
    gameType: state.config.type,
  };
}

/** Get all available game types with descriptions */
export function getGameTypes(): Array<{ type: MiniGameType; name: string; description: string }> {
  return [
    { type: 'rhythm', name: 'Rhythm Tap', description: 'Tap along to the beat pattern' },
    { type: 'melody', name: 'Name That Note', description: 'Identify the note being played' },
    { type: 'chord', name: 'Chord Master', description: 'Recognize chord types' },
    { type: 'interval', name: 'Interval Ear', description: 'Identify musical intervals' },
    { type: 'sequence', name: 'Memory Melody', description: 'Repeat the sequence of notes' },
  ];
}

// ---------------------------------------------------------------------------
// Song-specific mini-game generation
// ---------------------------------------------------------------------------

/** Flatten nested KaraokeNoteData[][] into a single sorted array */
function flattenNotes(noteLines: KaraokeNoteData[][]): KaraokeNoteData[] {
  return noteLines.flat().sort((a, b) => a.startTime - b.startTime);
}

/** UltraStar pitch → chromatic note name (0 = C in UltraStar standard mapping) */
function pitchToNoteName(pitch: number): string {
  return NOTE_NAMES[((pitch % 12) + 12) % 12];
}

/** Rhythm challenges from actual note onsets */
function rhythmFromSong(
  notes: KaraokeNoteData[],
  difficulty: 1 | 2 | 3 | 4 | 5,
): MiniGameChallenge[] {
  if (notes.length === 0) return [];
  const patternsPerLevel = [6, 10, 16, 22, 30];
  const count = Math.min(patternsPerLevel[difficulty - 1], notes.length);
  // Pick evenly spaced notes to avoid clusters
  const step = Math.max(1, Math.floor(notes.length / count));
  const picked: KaraokeNoteData[] = [];
  for (let i = 0; i < notes.length && picked.length < count; i += step) {
    picked.push(notes[i]);
  }
  return picked.map((n, i) => ({
    id: i,
    type: 'rhythm' as MiniGameType,
    time: n.startTime,
    answer: i,
    points: n.isGold ? 20 : 10,
    timeLimit: Math.max(200, 600 - difficulty * 80),
  }));
}

/** Melody (Name That Note) challenges from actual song pitches */
function melodyFromSong(
  notes: KaraokeNoteData[],
  difficulty: 1 | 2 | 3 | 4 | 5,
  rng: () => number,
): MiniGameChallenge[] {
  if (notes.length === 0) return [];
  const count = Math.min(4 + difficulty * 2, notes.length);
  const step = Math.max(1, Math.floor(notes.length / count));
  const challenges: MiniGameChallenge[] = [];
  const pitchesInSong = [...new Set(notes.map(n => pitchToNoteName(n.pitch)))];

  for (let idx = 0, ci = 0; idx < notes.length && ci < count; idx += step, ci++) {
    const note = notes[idx];
    const answer = pitchToNoteName(note.pitch);
    const optionCount = Math.min(2 + difficulty, 6);
    const options = new Set<string>([answer]);
    // Add distractors from notes actually in the song first, then random
    for (const p of pitchesInSong) {
      if (options.size >= optionCount) break;
      options.add(p);
    }
    while (options.size < optionCount) {
      options.add(NOTE_NAMES[Math.floor(rng() * 12)]);
    }

    challenges.push({
      id: ci,
      type: 'melody',
      time: note.startTime,
      answer,
      options: [...options].sort(),
      points: 15,
      timeLimit: Math.max(1000, 4000 - difficulty * 600),
    });
  }
  return challenges;
}

/** Chord challenges — analyze groups of close notes for interval patterns */
function chordFromSong(
  notes: KaraokeNoteData[],
  difficulty: 1 | 2 | 3 | 4 | 5,
  rng: () => number,
): MiniGameChallenge[] {
  if (notes.length < 3) return [];
  // Group notes that start within 0.15 s of each other
  const groups: KaraokeNoteData[][] = [];
  let group: KaraokeNoteData[] = [notes[0]];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].startTime - notes[i - 1].startTime < 0.15) {
      group.push(notes[i]);
    } else {
      if (group.length >= 2) groups.push(group);
      group = [notes[i]];
    }
  }
  if (group.length >= 2) groups.push(group);

  // Deduce chord quality from interval set
  const identifyChord = (pitches: number[]): string | null => {
    const sorted = [...new Set(pitches.map(p => ((p % 12) + 12) % 12))].sort((a, b) => a - b);
    if (sorted.length < 2) return null;
    const intervals = sorted.slice(1).map(p => p - sorted[0]);
    const root = NOTE_NAMES[sorted[0]];
    // Simple pattern matching
    const iv = intervals.join(',');
    const chordMap: Record<string, string> = {
      '4,7': 'Major', '3,7': 'Minor', '3,6': 'Dim', '4,8': 'Aug',
      '5,7': 'Sus4', '4,7,10': 'Dom7', '4,7,11': 'Maj7', '3,7,10': 'Min7',
    };
    return chordMap[iv] ? `${root} ${chordMap[iv]}` : null;
  };

  const availableChords = CHORD_TYPES.slice(0, 2 + difficulty);
  const challenges: MiniGameChallenge[] = [];
  let ci = 0;
  const maxCount = 3 + difficulty;

  for (const g of groups) {
    if (ci >= maxCount) break;
    const chord = identifyChord(g.map(n => n.pitch));
    if (!chord) continue;
    const options = new Set<string>([chord]);
    while (options.size < Math.min(4, 2 + difficulty)) {
      const r = NOTE_NAMES[Math.floor(rng() * 12)];
      const ct = availableChords[Math.floor(rng() * availableChords.length)];
      options.add(`${r} ${ct}`);
    }
    challenges.push({
      id: ci,
      type: 'chord',
      time: g[0].startTime,
      answer: chord,
      options: [...options].sort(),
      points: 20,
      timeLimit: Math.max(2000, 6000 - difficulty * 800),
    });
    ci++;
  }

  // If song had few chord groups, fill with RNG-based challenges
  if (challenges.length === 0) {
    return generateChordChallenges(
      { type: 'chord', difficulty, duration: notes[notes.length - 1].startTime, bpm: 120, seed: Math.floor(rng() * 100000) },
      rng,
    );
  }
  return challenges;
}

/** Interval challenges from consecutive note pitch differences */
function intervalFromSong(
  notes: KaraokeNoteData[],
  difficulty: 1 | 2 | 3 | 4 | 5,
  rng: () => number,
): MiniGameChallenge[] {
  if (notes.length < 2) return [];
  const pairs: Array<{ time: number; semitones: number }> = [];
  for (let i = 0; i < notes.length - 1; i++) {
    const semi = Math.abs(notes[i + 1].pitch - notes[i].pitch);
    if (semi <= 12) pairs.push({ time: notes[i].startTime, semitones: semi });
  }
  if (pairs.length === 0) return [];

  const count = Math.min(4 + difficulty * 2, pairs.length);
  const step = Math.max(1, Math.floor(pairs.length / count));
  const maxInterval = Math.min(6 + difficulty * 2, 13);
  const challenges: MiniGameChallenge[] = [];

  for (let idx = 0, ci = 0; idx < pairs.length && ci < count; idx += step, ci++) {
    const pair = pairs[idx];
    const answer = INTERVAL_NAMES[pair.semitones] ?? INTERVAL_NAMES[0];
    const options = new Set<string>([answer]);
    while (options.size < Math.min(4, 2 + difficulty)) {
      options.add(INTERVAL_NAMES[Math.floor(rng() * maxInterval)]);
    }
    challenges.push({
      id: ci,
      type: 'interval',
      time: pair.time,
      answer,
      options: [...options].sort(),
      points: 15,
      timeLimit: Math.max(1500, 5000 - difficulty * 700),
    });
  }
  return challenges;
}

/** Sequence (Memory Melody) challenges from real melodic fragments */
function sequenceFromSong(
  notes: KaraokeNoteData[],
  noteLines: KaraokeNoteData[][],
  difficulty: 1 | 2 | 3 | 4 | 5,
): MiniGameChallenge[] {
  // Use verse lines as natural phrase boundaries
  const phrases = noteLines.filter(line => line.length >= 3);
  if (phrases.length === 0 && notes.length < 3) return [];

  const count = Math.min(3 + Math.floor(difficulty / 2), phrases.length || 3);
  const challenges: MiniGameChallenge[] = [];

  for (let ci = 0; ci < count; ci++) {
    const seqLength = 2 + difficulty + ci;
    let sequence: number[];

    if (ci < phrases.length) {
      // Take first N pitches from the phrase, map to 0-7 range
      const phrase = phrases[ci];
      const pitches = phrase.slice(0, seqLength).map(n => ((n.pitch % 8) + 8) % 8);
      sequence = pitches;
    } else {
      // Fall back to consecutive notes
      const start = Math.min(ci * seqLength, Math.max(0, notes.length - seqLength));
      sequence = notes.slice(start, start + seqLength).map(n => ((n.pitch % 8) + 8) % 8);
    }

    challenges.push({
      id: ci,
      type: 'sequence',
      time: (phrases[ci]?.[0]?.startTime ?? ci * 5),
      answer: sequence,
      points: sequence.length * 5,
      timeLimit: sequence.length * 1500,
    });
  }
  return challenges;
}

/**
 * Generate a mini-game from actual karaoke song note data.
 * Instead of random generation, challenges are derived from the song's pitches,
 * rhythms, and melodic patterns.
 *
 * @param noteLines  Parsed UltraStar notes (from `parseNotes()`)
 * @param type       Mini-game type
 * @param difficulty 1-5
 * @param seed       Optional seed for distractors RNG (defaults to Date.now())
 */
export function generateMiniGameFromSong(
  noteLines: KaraokeNoteData[][],
  type: MiniGameType,
  difficulty: 1 | 2 | 3 | 4 | 5,
  seed?: number,
): MiniGameState {
  const rng = seededRandom(seed ?? Date.now());
  const flat = flattenNotes(noteLines);
  const duration = flat.length > 0 ? flat[flat.length - 1].startTime + flat[flat.length - 1].duration : 60;

  let challenges: MiniGameChallenge[];
  switch (type) {
    case 'rhythm':   challenges = rhythmFromSong(flat, difficulty); break;
    case 'melody':   challenges = melodyFromSong(flat, difficulty, rng); break;
    case 'chord':    challenges = chordFromSong(flat, difficulty, rng); break;
    case 'interval': challenges = intervalFromSong(flat, difficulty, rng); break;
    case 'sequence': challenges = sequenceFromSong(flat, noteLines, difficulty); break;
    default:         challenges = [];
  }

  const maxScore = challenges.reduce((sum, c) => sum + c.points, 0);
  const bpm = flat.length > 1
    ? Math.round(60 / ((flat[flat.length - 1].startTime - flat[0].startTime) / flat.length))
    : 120;

  return {
    config: { type, difficulty, duration, bpm, seed: seed ?? 0 },
    challenges,
    currentIndex: 0,
    score: 0,
    maxScore,
    streak: 0,
    bestStreak: 0,
    answers: [],
    isComplete: false,
    startedAt: 0,
  };
}

/**
 * Analyze a song's note data and return which mini-game types are well-suited.
 * Some game types need a minimum amount of data to produce meaningful challenges.
 */
export function getSuitableGameTypes(noteLines: KaraokeNoteData[][]): MiniGameType[] {
  const flat = flattenNotes(noteLines);
  const types: MiniGameType[] = [];

  if (flat.length >= 4)  types.push('rhythm');
  if (flat.length >= 4)  types.push('melody');
  if (flat.length >= 2)  types.push('interval');
  if (noteLines.some(l => l.length >= 3)) types.push('sequence');

  // Chord analysis — need groups of close notes
  const hasChordGroups = flat.some((n, i) =>
    i < flat.length - 1 && flat[i + 1].startTime - n.startTime < 0.15
  );
  if (hasChordGroups || flat.length >= 6) types.push('chord');

  return types;
}
