/**
 * PadNotePlayer — rhythm game engine for karaoke pad mode.
 *
 * Instead of singing into a microphone, the player hits keyboard/gamepad buttons.
 * Notes are divided into N lanes (based on difficulty). When the correct lane key
 * is held during an active note, pitch points are injected into the standard
 * livePitch pipeline → scoring works automatically.
 *
 * Difficulty mapping:
 *   easy   → 2 lanes (F / J)
 *   normal → 4 lanes (D / F / J / K)
 *   hard   → 6 lanes (S / D / F / J / K / L)
 *
 * Gamepad mapping:
 *   easy   → A(0) / B(1)
 *   normal → Y(3) / X(2) / A(0) / B(1)
 *   hard   → LB(4) / Y(3) / X(2) / A(0) / B(1) / RB(5)
 */

import { KaraokeNoteData, parseNotes } from './karaokeTimeline';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PadDifficulty = 'easy' | 'normal' | 'hard';

export interface PadLane {
  index: number;         // 0-based lane number (bottom = 0)
  key: string;           // keyboard key (e.g. 'f', 'j')
  gamepadButton: number; // standard gamepad button index
  label: string;         // display label (e.g. 'F', 'A')
  minPitch: number;      // inclusive MIDI pitch for this lane
  maxPitch: number;      // inclusive MIDI pitch for this lane
  color: string;         // lane indicator color
}

export interface PadNoteEvent {
  note: KaraokeNoteData;
  lane: number;          // which lane this note belongs to
  lineIndex: number;     // verse/line index
  noteIndex: number;     // note index within line
}

export interface PadHitFeedback {
  type: 'perfect' | 'good' | 'miss';
  lane: number;
  time: number;
}

export interface PadConfig {
  difficulty: PadDifficulty;
  noteLines: string[];   // raw UltraStar note lines
  bpm?: number;
  gap?: number;          // gap in ms
  onPitch: (hz: number) => void;               // inject a pitch point
  onHitFeedback?: (feedback: PadHitFeedback) => void;
  onLaneActive?: (activeLanes: boolean[]) => void; // which lanes are currently pressed
  onCurrentNote?: (note: PadNoteEvent | null) => void;  // currently expected note
}

// ─── Lane Colors ──────────────────────────────────────────────────────────────

const LANE_COLORS = [
  'var(--player-color-1, #ef4444)', // red
  'var(--player-color-2, #f59e0b)', // amber
  'var(--player-color-3, #10b981)', // emerald
  'var(--player-color-4, #3b82f6)', // blue
  'var(--player-color-5, #8b5cf6)', // violet
  'var(--player-color-6, #ec4899)', // pink
];

// ─── Key/Button Mappings ──────────────────────────────────────────────────────

const KEY_MAPS: Record<PadDifficulty, { keys: string[]; buttons: number[]; labels: string[] }> = {
  easy: {
    keys: ['f', 'j'],
    buttons: [0, 1],         // A, B
    labels: ['F', 'J'],
  },
  normal: {
    keys: ['d', 'f', 'j', 'k'],
    buttons: [3, 2, 0, 1],   // Y, X, A, B
    labels: ['D', 'F', 'J', 'K'],
  },
  hard: {
    keys: ['s', 'd', 'f', 'j', 'k', 'l'],
    buttons: [4, 3, 2, 0, 1, 5], // LB, Y, X, A, B, RB
    labels: ['S', 'D', 'F', 'J', 'K', 'L'],
  },
};

// ─── Helper: MIDI pitch → Hz ──────────────────────────────────────────────────

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ─── Build Lanes from Notes ───────────────────────────────────────────────────

export function buildLanes(
  allNotes: KaraokeNoteData[][],
  difficulty: PadDifficulty,
): PadLane[] {
  const mapping = KEY_MAPS[difficulty];
  const laneCount = mapping.keys.length;

  // Collect all unique MIDI pitches from the song
  const pitches: number[] = [];
  for (const line of allNotes) {
    for (const n of line) {
      if (!pitches.includes(n.pitch)) pitches.push(n.pitch);
    }
  }
  pitches.sort((a, b) => a - b);

  if (pitches.length === 0) {
    // No notes — return empty lanes with wide ranges
    return mapping.keys.map((key, i) => ({
      index: i,
      key,
      gamepadButton: mapping.buttons[i],
      label: mapping.labels[i],
      minPitch: -999,
      maxPitch: 999,
      color: LANE_COLORS[i % LANE_COLORS.length],
    }));
  }

  const minP = pitches[0];
  const maxP = pitches[pitches.length - 1];
  const range = maxP - minP + 1;

  const lanes: PadLane[] = [];
  for (let i = 0; i < laneCount; i++) {
    const laneLow = minP + Math.floor((range * i) / laneCount);
    const laneHigh = minP + Math.floor((range * (i + 1)) / laneCount) - 1;
    lanes.push({
      index: i,
      key: mapping.keys[i],
      gamepadButton: mapping.buttons[i],
      label: mapping.labels[i],
      minPitch: i === 0 ? -999 : laneLow,            // first lane catches everything below
      maxPitch: i === laneCount - 1 ? 999 : laneHigh, // last lane catches everything above
      color: LANE_COLORS[i % LANE_COLORS.length],
    });
  }
  return lanes;
}

/** Determine which lane a note pitch belongs to */
export function getLaneForPitch(pitch: number, lanes: PadLane[]): number {
  for (const lane of lanes) {
    if (pitch >= lane.minPitch && pitch <= lane.maxPitch) return lane.index;
  }
  // Fallback: nearest lane
  let best = 0;
  let bestDist = Infinity;
  for (const lane of lanes) {
    const mid = (lane.minPitch + lane.maxPitch) / 2;
    const d = Math.abs(pitch - mid);
    if (d < bestDist) { bestDist = d; best = lane.index; }
  }
  return best;
}

// ─── Annotate Notes with Lane Info ────────────────────────────────────────────

export function buildPadNoteEvents(
  noteLines: KaraokeNoteData[][],
  lanes: PadLane[],
  gapSec: number,
): PadNoteEvent[] {
  const events: PadNoteEvent[] = [];
  for (let li = 0; li < noteLines.length; li++) {
    for (let ni = 0; ni < noteLines[li].length; ni++) {
      const note = { ...noteLines[li][ni] };
      // Apply gap offset
      note.startTime += gapSec;
      events.push({
        note,
        lane: getLaneForPitch(note.pitch, lanes),
        lineIndex: li,
        noteIndex: ni,
      });
    }
  }
  // Sort by start time
  events.sort((a, b) => a.note.startTime - b.note.startTime);
  return events;
}

// ─── PadNotePlayer Class ──────────────────────────────────────────────────────

export class PadNotePlayer {
  private config: PadConfig;
  private lanes: PadLane[] = [];
  private events: PadNoteEvent[] = [];
  private raf: number | null = null;
  private keysDown = new Set<string>();
  private gamepadButtonsDown = new Set<number>();
  private running = false;
  private getCurrentTime: () => number = () => 0;
  private lastFeedbackTime = 0;
  private lastActiveNote: PadNoteEvent | null = null;

  // Pre/post tolerance for note windows (generous for fun gameplay)
  private preWindow = 0.15;
  private postWindow = 0.15;

  constructor(config: PadConfig) {
    this.config = config;

    // Parse notes
    const noteLines = parseNotes(config.noteLines, config.bpm);
    const gapSec = (config.gap ?? 0) / 1000;

    // Build lanes
    this.lanes = buildLanes(noteLines, config.difficulty);

    // Build events with gap applied
    this.events = buildPadNoteEvents(noteLines, this.lanes, gapSec);

    // Adjust tolerance by difficulty
    switch (config.difficulty) {
      case 'easy':
        this.preWindow = 0.25;
        this.postWindow = 0.25;
        break;
      case 'normal':
        this.preWindow = 0.15;
        this.postWindow = 0.15;
        break;
      case 'hard':
        this.preWindow = 0.08;
        this.postWindow = 0.08;
        break;
    }
  }

  getLanes(): PadLane[] {
    return this.lanes;
  }

  getEvents(): PadNoteEvent[] {
    return this.events;
  }

  /** Start the input loop. Provide a function that returns current playback time. */
  start(getCurrentTime: () => number) {
    if (this.running) return;
    this.running = true;
    this.getCurrentTime = getCurrentTime;

    // Keyboard listeners
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Start RAF loop
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keysDown.clear();
    this.gamepadButtonsDown.clear();
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Ignore if typing in input
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    this.keysDown.add(e.key.toLowerCase());
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keysDown.delete(e.key.toLowerCase());
  }

  private pollGamepad() {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    if (!pads.length) return;
    const pad = pads[0];
    if (!pad) return;

    this.gamepadButtonsDown.clear();
    for (let i = 0; i < pad.buttons.length; i++) {
      if (pad.buttons[i]?.pressed) {
        this.gamepadButtonsDown.add(i);
      }
    }
  }

  /** Check which lanes are currently pressed (keyboard OR gamepad) */
  private getActiveLanes(): boolean[] {
    const active = new Array(this.lanes.length).fill(false);
    for (const lane of this.lanes) {
      if (this.keysDown.has(lane.key) || this.gamepadButtonsDown.has(lane.gamepadButton)) {
        active[lane.index] = true;
      }
    }
    return active;
  }

  /** Find the note currently active at the given time */
  private findActiveNote(t: number): PadNoteEvent | null {
    for (const ev of this.events) {
      const start = ev.note.startTime - this.preWindow;
      const end = ev.note.startTime + ev.note.duration + this.postWindow;
      if (t >= start && t <= end) return ev;
    }
    return null;
  }

  private loop = () => {
    if (!this.running) return;

    const t = this.getCurrentTime();

    // Poll gamepad
    this.pollGamepad();

    // Get active lanes
    const activeLanes = this.getActiveLanes();
    this.config.onLaneActive?.(activeLanes);

    // Find current active note
    const activeNote = this.findActiveNote(t);
    if (activeNote !== this.lastActiveNote) {
      this.lastActiveNote = activeNote;
      this.config.onCurrentNote?.(activeNote);
    }

    // Check if any lane key is pressed
    const anyLanePressed = activeLanes.some(Boolean);

    if (anyLanePressed && activeNote) {
      const correctLane = activeNote.lane;
      const pressedLane = activeLanes.indexOf(true);

      if (activeLanes[correctLane]) {
        // Correct lane pressed → inject exact target Hz (perfect match)
        const targetHz = midiToHz(activeNote.note.pitch);
        this.config.onPitch(targetHz);

        // Feedback
        if (t - this.lastFeedbackTime > 0.3) {
          this.lastFeedbackTime = t;
          this.config.onHitFeedback?.({ type: 'perfect', lane: correctLane, time: t });
        }
      } else if (pressedLane >= 0) {
        // Wrong lane → inject offset Hz (will score as miss/partial due to semitone diff)
        const laneDistance = Math.abs(pressedLane - correctLane);
        const offsetSemitones = laneDistance * 3; // 3 semitones off per lane distance
        const wrongHz = midiToHz(activeNote.note.pitch + offsetSemitones);
        this.config.onPitch(wrongHz);

        if (t - this.lastFeedbackTime > 0.3) {
          this.lastFeedbackTime = t;
          this.config.onHitFeedback?.({ type: 'miss', lane: pressedLane, time: t });
        }
      }
    } else if (anyLanePressed && !activeNote) {
      // Pressed outside any note window — no pitch injected (harmless)
    }

    this.raf = requestAnimationFrame(this.loop);
  };
}

// ─── Exports for testing ──────────────────────────────────────────────────────

export { KEY_MAPS, LANE_COLORS };
