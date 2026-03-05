// ─── CC Automation History (Undo/Redo) ─────────────────────────────────────────
// Immutable operation stack for CC lane editing with clipboard support.

import { MidiCCEvent } from '../models/editor/midiTypes';

/** Snapshot of a single CC lane's events */
export interface CCLaneSnapshot {
  layerId: number;
  events: MidiCCEvent[];
}

/** Full undo/redo state */
export interface CCHistoryState {
  past: CCLaneSnapshot[][];
  present: CCLaneSnapshot[];
  future: CCLaneSnapshot[][];
}

const MAX_HISTORY = 100;

/** Create initial history state */
export function createCCHistory(initial: CCLaneSnapshot[]): CCHistoryState {
  return { past: [], present: initial, future: [] };
}

/** Push a new state (used after every edit) */
export function pushCCState(
  history: CCHistoryState,
  next: CCLaneSnapshot[],
): CCHistoryState {
  return {
    past: [...history.past.slice(-(MAX_HISTORY - 1)), history.present],
    present: next,
    future: [],
  };
}

/** Undo — move present to future, pop past to present */
export function undoCC(history: CCHistoryState): CCHistoryState {
  if (history.past.length === 0) return history;
  const prev = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: prev,
    future: [history.present, ...history.future],
  };
}

/** Redo — move present to past, pop future to present */
export function redoCC(history: CCHistoryState): CCHistoryState {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}

/** Can undo? */
export function canUndo(history: CCHistoryState): boolean {
  return history.past.length > 0;
}

/** Can redo? */
export function canRedo(history: CCHistoryState): boolean {
  return history.future.length > 0;
}

// ─── Clipboard ──────────────────────────────────────────────────────────────────

/** Time range for clipboard operations */
export interface CCTimeRange {
  start: number;
  end: number;
}

/** Copy events within a time range (returns deep clone) */
export function copyCCEvents(
  events: MidiCCEvent[],
  range: CCTimeRange,
): MidiCCEvent[] {
  return events
    .filter((e) => e.time >= range.start && e.time <= range.end)
    .map((e) => ({ ...e }));
}

/** Paste events at a target time offset. Generates new IDs. */
export function pasteCCEvents(
  existing: MidiCCEvent[],
  clipboard: MidiCCEvent[],
  targetTime: number,
): MidiCCEvent[] {
  if (clipboard.length === 0) return existing;

  const minTime = Math.min(...clipboard.map((e) => e.time));
  const offset = targetTime - minTime;

  const pasted = clipboard.map((e) => ({
    ...e,
    id: Date.now() + Math.floor(Math.random() * 10000) + e.id,
    time: e.time + offset,
  }));

  return [...existing, ...pasted];
}

/** Cut events within a time range — returns { remaining, cut } */
export function cutCCEvents(
  events: MidiCCEvent[],
  range: CCTimeRange,
): { remaining: MidiCCEvent[]; cut: MidiCCEvent[] } {
  const cut: MidiCCEvent[] = [];
  const remaining: MidiCCEvent[] = [];

  for (const e of events) {
    if (e.time >= range.start && e.time <= range.end) {
      cut.push({ ...e });
    } else {
      remaining.push(e);
    }
  }

  return { remaining, cut };
}

/** Delete events within a time range */
export function deleteCCEventsInRange(
  events: MidiCCEvent[],
  range: CCTimeRange,
): MidiCCEvent[] {
  return events.filter((e) => e.time < range.start || e.time > range.end);
}

/** Select all events within a time range */
export function selectCCEventsInRange(
  events: MidiCCEvent[],
  range: CCTimeRange,
): number[] {
  return events
    .filter((e) => e.time >= range.start && e.time <= range.end)
    .map((e) => e.id);
}

// ─── CC Recording ───────────────────────────────────────────────────────────────

/** Record a real-time CC value into an event list (during playback) */
export function recordCCEvent(
  events: MidiCCEvent[],
  cc: number,
  value: number,
  time: number,
): MidiCCEvent[] {
  const newEvent: MidiCCEvent = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    cc,
    value,
    time,
  };
  return [...events, newEvent];
}

/** Thin out recorded CC events to reduce density (keeps first/last + every Nth) */
export function thinCCEvents(
  events: MidiCCEvent[],
  keepEveryN: number = 3,
): MidiCCEvent[] {
  if (events.length <= 2) return events;
  const sorted = [...events].sort((a, b) => a.time - b.time);
  const result: MidiCCEvent[] = [sorted[0]];
  for (let i = 1; i < sorted.length - 1; i++) {
    if (i % keepEveryN === 0) result.push(sorted[i]);
  }
  result.push(sorted[sorted.length - 1]);
  return result;
}

// ─── Export / Import ────────────────────────────────────────────────────────────

/** Serialize CC events to JSON string */
export function exportCCLane(events: MidiCCEvent[]): string {
  return JSON.stringify(events, null, 2);
}

/** Deserialize CC events from JSON string */
export function importCCLane(json: string): MidiCCEvent[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e: unknown): e is MidiCCEvent =>
        typeof e === 'object' &&
        e !== null &&
        'id' in e &&
        'cc' in e &&
        'value' in e &&
        'time' in e,
    );
  } catch {
    /* Expected: JSON.parse may fail on malformed serialized data */
    return [];
  }
}
