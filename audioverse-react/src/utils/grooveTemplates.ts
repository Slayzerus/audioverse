/**
 * Groove Templates engine — groove quantize, humanize, and swing.
 * Applies rhythmic feel transformations to MIDI/audio events.
 */

export interface TimedEvent {
  /** Start time in beats */
  time: number;
  /** Duration in beats */
  duration: number;
  /** Velocity 0-127 */
  velocity: number;
  /** Optional pitch (MIDI note) */
  pitch?: number;
}

export interface GrooveTemplate {
  id: string;
  name: string;
  /** Per-step timing offsets (fraction of step, -0.5 to 0.5) */
  timingOffsets: number[];
  /** Per-step velocity scales (0-2, 1 = no change) */
  velocityScales: number[];
  /** Per-step duration scales (0-2, 1 = no change) */
  durationScales: number[];
  /** Steps per bar (typically 8, 16, or 32) */
  stepsPerBar: number;
}

export interface HumanizeConfig {
  /** Max random timing offset in beats (0 = none) */
  timingAmount: number;
  /** Max random velocity offset (0-127 range, 0 = none) */
  velocityAmount: number;
  /** Max random duration offset in beats (0 = none) */
  durationAmount: number;
  /** Seed for reproducible randomization (null = truly random) */
  seed?: number;
}

export interface SwingConfig {
  /** Swing amount 0-1 (0 = straight, 0.67 ≈ triplet feel) */
  amount: number;
  /** Grid resolution in beats for swing application */
  grid: number;
}

export interface GrooveApplyConfig {
  /** Groove template to apply (null = none) */
  template?: GrooveTemplate;
  /** Groove strength 0-1 */
  grooveStrength: number;
  /** Humanize settings */
  humanize?: HumanizeConfig;
  /** Swing settings */
  swing?: SwingConfig;
}

// ── Built-in groove templates ──

export const GROOVE_TEMPLATES: GrooveTemplate[] = [
  {
    id: 'mpc-60-tight',
    name: 'MPC 60 Tight',
    stepsPerBar: 16,
    timingOffsets: [0, 0.02, 0, 0.01, 0, 0.03, 0, 0.01, 0, 0.02, 0, 0.01, 0, 0.03, 0, 0.01],
    velocityScales: [1.1, 0.85, 0.95, 0.8, 1.05, 0.85, 0.9, 0.8, 1.1, 0.85, 0.95, 0.8, 1.05, 0.85, 0.9, 0.8],
    durationScales: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  {
    id: 'mpc-60-swing',
    name: 'MPC 60 Swing',
    stepsPerBar: 16,
    timingOffsets: [0, 0.06, 0, 0.04, 0, 0.07, 0, 0.04, 0, 0.06, 0, 0.04, 0, 0.07, 0, 0.04],
    velocityScales: [1.15, 0.7, 0.9, 0.75, 1.1, 0.7, 0.85, 0.75, 1.15, 0.7, 0.9, 0.75, 1.1, 0.7, 0.85, 0.75],
    durationScales: [1.05, 0.9, 1, 0.95, 1.05, 0.9, 1, 0.95, 1.05, 0.9, 1, 0.95, 1.05, 0.9, 1, 0.95],
  },
  {
    id: 'hip-hop-lazy',
    name: 'Hip-Hop Lazy',
    stepsPerBar: 16,
    timingOffsets: [0, 0.04, 0.01, 0.05, 0, 0.04, 0.02, 0.06, 0, 0.04, 0.01, 0.05, 0, 0.04, 0.02, 0.06],
    velocityScales: [1.2, 0.65, 0.85, 0.6, 1.1, 0.65, 0.8, 0.6, 1.2, 0.65, 0.85, 0.6, 1.1, 0.65, 0.8, 0.6],
    durationScales: [1.1, 1, 1, 0.9, 1.1, 1, 1, 0.9, 1.1, 1, 1, 0.9, 1.1, 1, 1, 0.9],
  },
  {
    id: 'funk-pocket',
    name: 'Funk Pocket',
    stepsPerBar: 16,
    timingOffsets: [0, -0.01, 0.03, 0, 0, -0.01, 0.04, 0, 0, -0.01, 0.03, 0, 0, -0.01, 0.04, 0],
    velocityScales: [1.2, 0.9, 0.7, 1.05, 0.85, 0.9, 0.7, 1.0, 1.15, 0.9, 0.7, 1.05, 0.85, 0.9, 0.7, 1.0],
    durationScales: [1, 0.95, 1.1, 1, 1, 0.95, 1.1, 1, 1, 0.95, 1.1, 1, 1, 0.95, 1.1, 1],
  },
  {
    id: 'shuffle-blues',
    name: 'Shuffle / Blues',
    stepsPerBar: 8,
    timingOffsets: [0, 0.11, 0, 0.11, 0, 0.11, 0, 0.11],
    velocityScales: [1.2, 0.8, 1.1, 0.8, 1.2, 0.8, 1.1, 0.8],
    durationScales: [1.1, 0.8, 1.1, 0.8, 1.1, 0.8, 1.1, 0.8],
  },
  {
    id: 'reggaeton',
    name: 'Reggaeton',
    stepsPerBar: 16,
    timingOffsets: [0, 0, 0, 0.03, 0, 0, 0, 0.03, 0, 0, 0, 0.03, 0, 0, 0, 0.03],
    velocityScales: [1.3, 0.6, 0.9, 1.1, 0.7, 0.6, 0.9, 1.1, 1.3, 0.6, 0.9, 1.1, 0.7, 0.6, 0.9, 1.1],
    durationScales: [1, 1, 1, 0.9, 1, 1, 1, 0.9, 1, 1, 1, 0.9, 1, 1, 1, 0.9],
  },
];

// ── Seeded RNG for humanize ──

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Core functions ──

/** Apply swing to events */
export function applySwing(events: TimedEvent[], config: SwingConfig): TimedEvent[] {
  if (config.amount === 0) return events;

  return events.map((ev) => {
    const gridPos = ev.time / config.grid;
    const gridStep = Math.round(gridPos);
    const isOffbeat = gridStep % 2 === 1;

    if (isOffbeat) {
      const offset = config.grid * config.amount * 0.5;
      return { ...ev, time: ev.time + offset };
    }
    return { ...ev };
  });
}

/** Apply humanize (random offsets) to events */
export function applyHumanize(events: TimedEvent[], config: HumanizeConfig): TimedEvent[] {
  const rng = config.seed != null ? seededRandom(config.seed) : Math.random;

  return events.map((ev) => {
    const timeDelta = (rng() - 0.5) * 2 * config.timingAmount;
    const velDelta = Math.round((rng() - 0.5) * 2 * config.velocityAmount);
    const durDelta = (rng() - 0.5) * 2 * config.durationAmount;

    return {
      ...ev,
      time: Math.max(0, ev.time + timeDelta),
      velocity: Math.max(1, Math.min(127, ev.velocity + velDelta)),
      duration: Math.max(0.01, ev.duration + durDelta),
    };
  });
}

/** Apply groove template to events */
export function applyGrooveTemplate(
  events: TimedEvent[],
  template: GrooveTemplate,
  strength: number = 1,
): TimedEvent[] {
  const stepSize = 4 / template.stepsPerBar; // step size in beats (4 beats per bar)

  return events.map((ev) => {
    // Find nearest groove step
    const stepFloat = ev.time / stepSize;
    const stepIdx = Math.round(stepFloat) % template.stepsPerBar;

    const timingOffset = template.timingOffsets[stepIdx] * stepSize * strength;
    const velScale = 1 + (template.velocityScales[stepIdx] - 1) * strength;
    const durScale = 1 + (template.durationScales[stepIdx] - 1) * strength;

    return {
      ...ev,
      time: Math.max(0, ev.time + timingOffset),
      velocity: Math.max(1, Math.min(127, Math.round(ev.velocity * velScale))),
      duration: Math.max(0.01, ev.duration * durScale),
    };
  });
}

/** Apply full groove configuration (template + humanize + swing) */
export function applyGroove(events: TimedEvent[], config: GrooveApplyConfig): TimedEvent[] {
  let result = [...events.map((e) => ({ ...e }))];

  // 1. Groove template
  if (config.template && config.grooveStrength > 0) {
    result = applyGrooveTemplate(result, config.template, config.grooveStrength);
  }

  // 2. Swing
  if (config.swing && config.swing.amount > 0) {
    result = applySwing(result, config.swing);
  }

  // 3. Humanize
  if (config.humanize) {
    result = applyHumanize(result, config.humanize);
  }

  return result;
}

/** Get template by ID */
export function getGrooveTemplate(id: string): GrooveTemplate | undefined {
  return GROOVE_TEMPLATES.find((t) => t.id === id);
}

/** List all template names */
export function getGrooveTemplateNames(): Array<{ id: string; name: string }> {
  return GROOVE_TEMPLATES.map(({ id, name }) => ({ id, name }));
}
