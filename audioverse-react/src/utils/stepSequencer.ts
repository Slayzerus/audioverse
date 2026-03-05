// ─── Step Sequencer Engine ──────────────────────────────────────────────────────
// Pure data model and utilities for a 16/32/64-step sequencer with velocity,
// gate length, and probability. Designed to integrate with the AudioEditor.

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface Step {
  /** Whether this step is active */
  active: boolean;
  /** MIDI note number (0-127) */
  note: number;
  /** Velocity (0-127) */
  velocity: number;
  /** Gate length as fraction of step duration (0-1) */
  gate: number;
  /** Probability of triggering (0-1, 1 = always) */
  probability: number;
  /** Optional slide/glide to next note */
  slide: boolean;
}

export interface SequencerPattern {
  /** Pattern name */
  name: string;
  /** Number of steps (16, 32, or 64) */
  length: 16 | 32 | 64;
  /** Steps data */
  steps: Step[];
  /** BPM (for standalone playback or sync reference) */
  bpm: number;
  /** Swing amount (0-1, 0 = straight, 0.67 = standard swing) */
  swing: number;
  /** Root note for pattern transposition */
  rootNote: number;
  /** CC lane to output to (optional) */
  ccOutput?: number;
}

// ─── Factory ────────────────────────────────────────────────────────────────────

export function createEmptyStep(note: number = 60): Step {
  return { active: false, note, velocity: 100, gate: 0.8, probability: 1.0, slide: false };
}

export function createEmptyPattern(
  name: string = 'New Pattern',
  length: 16 | 32 | 64 = 16,
  bpm: number = 120,
): SequencerPattern {
  return {
    name,
    length,
    steps: Array.from({ length }, () => createEmptyStep()),
    bpm,
    swing: 0,
    rootNote: 60,
  };
}

// ─── Step Operations ────────────────────────────────────────────────────────────

export function toggleStep(pattern: SequencerPattern, index: number): SequencerPattern {
  const steps = pattern.steps.map((s, i) =>
    i === index ? { ...s, active: !s.active } : s,
  );
  return { ...pattern, steps };
}

export function setStepNote(pattern: SequencerPattern, index: number, note: number): SequencerPattern {
  const steps = pattern.steps.map((s, i) =>
    i === index ? { ...s, note: Math.max(0, Math.min(127, note)) } : s,
  );
  return { ...pattern, steps };
}

export function setStepVelocity(pattern: SequencerPattern, index: number, velocity: number): SequencerPattern {
  const steps = pattern.steps.map((s, i) =>
    i === index ? { ...s, velocity: Math.max(0, Math.min(127, velocity)) } : s,
  );
  return { ...pattern, steps };
}

export function setStepGate(pattern: SequencerPattern, index: number, gate: number): SequencerPattern {
  const steps = pattern.steps.map((s, i) =>
    i === index ? { ...s, gate: Math.max(0, Math.min(1, gate)) } : s,
  );
  return { ...pattern, steps };
}

export function setStepProbability(pattern: SequencerPattern, index: number, prob: number): SequencerPattern {
  const steps = pattern.steps.map((s, i) =>
    i === index ? { ...s, probability: Math.max(0, Math.min(1, prob)) } : s,
  );
  return { ...pattern, steps };
}

export function toggleStepSlide(pattern: SequencerPattern, index: number): SequencerPattern {
  const steps = pattern.steps.map((s, i) =>
    i === index ? { ...s, slide: !s.slide } : s,
  );
  return { ...pattern, steps };
}

// ─── Pattern Operations ─────────────────────────────────────────────────────────

/** Transpose all active steps by semitones */
export function transposePattern(pattern: SequencerPattern, semitones: number): SequencerPattern {
  const steps = pattern.steps.map((s) =>
    s.active ? { ...s, note: Math.max(0, Math.min(127, s.note + semitones)) } : s,
  );
  return { ...pattern, steps, rootNote: Math.max(0, Math.min(127, pattern.rootNote + semitones)) };
}

/** Reverse the pattern */
export function reversePattern(pattern: SequencerPattern): SequencerPattern {
  return { ...pattern, steps: [...pattern.steps].reverse() };
}

/** Shift pattern left/right by N steps (wrapping) */
export function shiftPattern(pattern: SequencerPattern, amount: number): SequencerPattern {
  const len = pattern.steps.length;
  const norm = ((amount % len) + len) % len;
  const steps = [...pattern.steps.slice(norm), ...pattern.steps.slice(0, norm)];
  return { ...pattern, steps };
}

/** Randomize velocity for all active steps */
export function randomizeVelocity(pattern: SequencerPattern, min: number = 60, max: number = 127): SequencerPattern {
  const steps = pattern.steps.map((s) =>
    s.active ? { ...s, velocity: Math.floor(min + Math.random() * (max - min + 1)) } : s,
  );
  return { ...pattern, steps };
}

/** Clear all steps (keep pattern structure) */
export function clearPattern(pattern: SequencerPattern): SequencerPattern {
  return { ...pattern, steps: pattern.steps.map(() => createEmptyStep(pattern.rootNote)) };
}

// ─── Playback Timing ────────────────────────────────────────────────────────────

/** Get the duration of one step in seconds */
export function stepDuration(bpm: number, stepsPerBeat: number = 4): number {
  return 60 / bpm / stepsPerBeat;
}

/** Get time offset for a step index, accounting for swing */
export function stepTimeOffset(
  index: number,
  bpm: number,
  swing: number = 0,
  stepsPerBeat: number = 4,
): number {
  const baseDur = stepDuration(bpm, stepsPerBeat);
  const base = index * baseDur;
  // Apply swing to every other step (odd indices)
  if (index % 2 === 1 && swing > 0) {
    return base + baseDur * swing * 0.5;
  }
  return base;
}

/** Should this step trigger? (probability check) */
export function shouldTrigger(step: Step): boolean {
  return step.active && Math.random() < step.probability;
}

// ─── Preset Patterns ────────────────────────────────────────────────────────────

export function createKickPattern(): SequencerPattern {
  const p = createEmptyPattern('Kick', 16);
  [0, 4, 8, 12].forEach((i) => {
    p.steps[i] = { ...p.steps[i], active: true, note: 36, velocity: 110 };
  });
  return p;
}

export function createSnarePattern(): SequencerPattern {
  const p = createEmptyPattern('Snare', 16);
  [4, 12].forEach((i) => {
    p.steps[i] = { ...p.steps[i], active: true, note: 38, velocity: 100 };
  });
  return p;
}

export function createHiHatPattern(): SequencerPattern {
  const p = createEmptyPattern('Hi-Hat', 16);
  for (let i = 0; i < 16; i += 2) {
    p.steps[i] = { ...p.steps[i], active: true, note: 42, velocity: 80 };
  }
  return p;
}

export function createArpPattern(rootNote: number = 60): SequencerPattern {
  const p = createEmptyPattern('Arp', 16, 120);
  const intervals = [0, 4, 7, 12, 7, 4, 0, -5, 0, 3, 7, 12, 7, 3, 0, -5];
  intervals.forEach((interval, i) => {
    p.steps[i] = { ...p.steps[i], active: true, note: rootNote + interval, velocity: 90, gate: 0.5 };
  });
  return { ...p, rootNote };
}

export function createBasslinePattern(rootNote: number = 36): SequencerPattern {
  const p = createEmptyPattern('Bassline', 16, 120);
  const notes = [0, 0, 7, 0, 5, 5, 3, 0, 0, 0, 7, 12, 5, 5, 3, 0];
  const active = [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0];
  notes.forEach((n, i) => {
    p.steps[i] = { ...p.steps[i], active: !!active[i], note: rootNote + n, velocity: 100, gate: 0.7 };
  });
  return { ...p, rootNote };
}

// ─── Serialization ──────────────────────────────────────────────────────────────

export function serializePattern(pattern: SequencerPattern): string {
  return JSON.stringify(pattern, null, 2);
}

export function deserializePattern(json: string): SequencerPattern | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.steps)) return null;
    return parsed as SequencerPattern;
  } catch {
    /* Expected: JSON.parse may fail on malformed pattern data */
    return null;
  }
}
