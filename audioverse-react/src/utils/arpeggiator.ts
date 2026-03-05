/**
 * Arpeggiator engine — generates arpeggiated patterns from held notes.
 * Supports multiple modes, octave range, rate, gate, and pattern variations.
 */

export type ArpMode = 'up' | 'down' | 'updown' | 'downup' | 'random' | 'as-played' | 'chord';

export interface ArpConfig {
  mode: ArpMode;
  /** Octave range (1-4) */
  octaves: number;
  /** Rate in note divisions relative to BPM (e.g., '1/8', '1/16') */
  rate: ArpRate;
  /** Gate length as fraction of step duration (0-1) */
  gate: number;
  /** Velocity pattern (if null, uses original velocities) */
  velocityPattern?: number[];
  /** Swing amount (0-1) */
  swing: number;
  /** Number of repeats per note before advancing */
  repeats: number;
  /** Latch mode — keeps arp running after keys released */
  latch: boolean;
}

export type ArpRate = '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/32' | '1/4T' | '1/8T' | '1/16T';

export interface ArpNote {
  pitch: number;
  velocity: number;
  originalOrder: number;
}

export interface ArpEvent {
  pitch: number;
  velocity: number;
  startTime: number;
  duration: number;
  step: number;
}

/** Rate divisions in beats (quarter notes) */
const RATE_MAP: Record<ArpRate, number> = {
  '1/1': 4,
  '1/2': 2,
  '1/4': 1,
  '1/8': 0.5,
  '1/16': 0.25,
  '1/32': 0.125,
  '1/4T': 1 / 1.5, // triplet
  '1/8T': 0.5 / 1.5,
  '1/16T': 0.25 / 1.5,
};

export const DEFAULT_ARP_CONFIG: ArpConfig = {
  mode: 'up',
  octaves: 1,
  rate: '1/8',
  gate: 0.8,
  swing: 0,
  repeats: 1,
  latch: false,
};

/** Expand held notes across octave range */
function expandOctaves(notes: ArpNote[], octaves: number): ArpNote[] {
  const expanded: ArpNote[] = [];
  for (let oct = 0; oct < octaves; oct++) {
    for (const note of notes) {
      expanded.push({ ...note, pitch: note.pitch + oct * 12 });
    }
  }
  return expanded;
}

/** Sort notes for the given arp mode and return the sequence */
export function buildArpSequence(heldNotes: ArpNote[], config: ArpConfig): ArpNote[] {
  if (heldNotes.length === 0) return [];

  const expanded = expandOctaves(heldNotes, config.octaves);

  const sortedUp = [...expanded].sort((a, b) => a.pitch - b.pitch);
  const sortedDown = [...expanded].sort((a, b) => b.pitch - a.pitch);

  let sequence: ArpNote[];

  switch (config.mode) {
    case 'up':
      sequence = sortedUp;
      break;
    case 'down':
      sequence = sortedDown;
      break;
    case 'updown':
      sequence = [...sortedUp, ...sortedDown.slice(1, -1)];
      break;
    case 'downup':
      sequence = [...sortedDown, ...sortedUp.slice(1, -1)];
      break;
    case 'random':
      sequence = [...expanded].sort(() => Math.random() - 0.5);
      break;
    case 'as-played':
      sequence = [...expanded].sort((a, b) => a.originalOrder - b.originalOrder);
      break;
    case 'chord':
      sequence = expanded; // all at once
      break;
    default:
      sequence = sortedUp;
  }

  // Apply repeats
  if (config.repeats > 1) {
    const repeated: ArpNote[] = [];
    for (const note of sequence) {
      for (let r = 0; r < config.repeats; r++) {
        repeated.push(note);
      }
    }
    sequence = repeated;
  }

  return sequence;
}

/** Generate timed arp events from a sequence */
export function generateArpEvents(
  heldNotes: ArpNote[],
  config: ArpConfig,
  bpm: number,
  startTime: number = 0,
  cycleCount: number = 1,
): ArpEvent[] {
  const sequence = buildArpSequence(heldNotes, config);
  if (sequence.length === 0) return [];

  const beatDuration = 60 / bpm;
  const stepDuration = RATE_MAP[config.rate] * beatDuration;
  const noteDuration = stepDuration * config.gate;
  const events: ArpEvent[] = [];

  const isChordMode = config.mode === 'chord';
  const totalSteps = isChordMode ? cycleCount : sequence.length * cycleCount;

  for (let step = 0; step < totalSteps; step++) {
    // Apply swing to even steps
    const swingOffset = (step % 2 === 1) ? stepDuration * config.swing * 0.5 : 0;
    const time = startTime + step * stepDuration + swingOffset;

    if (isChordMode) {
      // In chord mode, play all notes simultaneously each step
      for (const note of sequence) {
        const velocity = config.velocityPattern
          ? config.velocityPattern[step % config.velocityPattern.length]
          : note.velocity;
        events.push({ pitch: note.pitch, velocity, startTime: time, duration: noteDuration, step });
      }
    } else {
      const noteIdx = step % sequence.length;
      const note = sequence[noteIdx];
      const velocity = config.velocityPattern
        ? config.velocityPattern[step % config.velocityPattern.length]
        : note.velocity;
      events.push({ pitch: note.pitch, velocity, startTime: time, duration: noteDuration, step });
    }
  }

  return events;
}

/** Get available arp modes with descriptions */
export function getArpModes(): Array<{ mode: ArpMode; label: string; description: string }> {
  return [
    { mode: 'up', label: 'Up', description: 'Notes played low to high' },
    { mode: 'down', label: 'Down', description: 'Notes played high to low' },
    { mode: 'updown', label: 'Up/Down', description: 'Alternates up then down' },
    { mode: 'downup', label: 'Down/Up', description: 'Alternates down then up' },
    { mode: 'random', label: 'Random', description: 'Random note order' },
    { mode: 'as-played', label: 'As Played', description: 'Order in which notes were pressed' },
    { mode: 'chord', label: 'Chord', description: 'All notes played simultaneously' },
  ];
}

/** Get available rates */
export function getArpRates(): ArpRate[] {
  return Object.keys(RATE_MAP) as ArpRate[];
}
