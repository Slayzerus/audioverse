import { describe, test, expect } from 'vitest';
import {
  createCCHistory,
  pushCCState,
  undoCC,
  redoCC,
  canUndo,
  canRedo,
  copyCCEvents,
  pasteCCEvents,
  cutCCEvents,
  deleteCCEventsInRange,
  selectCCEventsInRange,
  recordCCEvent,
  thinCCEvents,
  exportCCLane,
  importCCLane,
} from '../utils/ccAutomation';
import type { MidiCCEvent } from '../models/editor/midiTypes';

const makeEvent = (id: number, cc: number, value: number, time: number): MidiCCEvent => ({
  id, cc, value, time,
});

describe('CC History (undo/redo)', () => {
  test('initial state has no undo/redo', () => {
    const h = createCCHistory([]);
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  test('push creates undo state', () => {
    let h = createCCHistory([{ layerId: 0, events: [] }]);
    h = pushCCState(h, [{ layerId: 0, events: [makeEvent(1, 1, 64, 1)] }]);
    expect(canUndo(h)).toBe(true);
    expect(canRedo(h)).toBe(false);
  });

  test('undo restores previous state', () => {
    const initial = [{ layerId: 0, events: [] }];
    let h = createCCHistory(initial);
    h = pushCCState(h, [{ layerId: 0, events: [makeEvent(1, 1, 64, 1)] }]);
    h = undoCC(h);
    expect(h.present).toEqual(initial);
    expect(canRedo(h)).toBe(true);
    expect(canUndo(h)).toBe(false);
  });

  test('redo restores next state', () => {
    let h = createCCHistory([{ layerId: 0, events: [] }]);
    const next = [{ layerId: 0, events: [makeEvent(1, 1, 64, 1)] }];
    h = pushCCState(h, next);
    h = undoCC(h);
    h = redoCC(h);
    expect(h.present).toEqual(next);
  });

  test('push clears future', () => {
    let h = createCCHistory([{ layerId: 0, events: [] }]);
    h = pushCCState(h, [{ layerId: 0, events: [makeEvent(1, 1, 64, 1)] }]);
    h = undoCC(h);
    h = pushCCState(h, [{ layerId: 0, events: [makeEvent(2, 1, 100, 2)] }]);
    expect(canRedo(h)).toBe(false);
  });
});

describe('CC Clipboard', () => {
  const events: MidiCCEvent[] = [
    makeEvent(1, 1, 10, 0),
    makeEvent(2, 1, 50, 2),
    makeEvent(3, 1, 90, 5),
    makeEvent(4, 1, 120, 8),
  ];

  test('copy returns events in range', () => {
    const copied = copyCCEvents(events, { start: 1, end: 6 });
    expect(copied).toHaveLength(2);
    expect(copied[0].id).toBe(2);
    expect(copied[1].id).toBe(3);
  });

  test('paste offsets time correctly', () => {
    const clipboard = copyCCEvents(events, { start: 0, end: 2 });
    const result = pasteCCEvents([], clipboard, 10);
    expect(result).toHaveLength(2);
    expect(result[0].time).toBe(10); // offset = 10 - 0 = 10
    expect(result[1].time).toBe(12); // 2 + 10 = 12
  });

  test('cut separates events', () => {
    const { remaining, cut } = cutCCEvents(events, { start: 1, end: 6 });
    expect(remaining).toHaveLength(2);
    expect(cut).toHaveLength(2);
  });

  test('delete range removes events', () => {
    const result = deleteCCEventsInRange(events, { start: 1, end: 6 });
    expect(result).toHaveLength(2);
  });

  test('select range returns IDs', () => {
    const ids = selectCCEventsInRange(events, { start: 0, end: 3 });
    expect(ids).toEqual([1, 2]);
  });
});

describe('CC Recording', () => {
  test('recordCCEvent appends new event', () => {
    const events: MidiCCEvent[] = [];
    const result = recordCCEvent(events, 1, 64, 1.5);
    expect(result).toHaveLength(1);
    expect(result[0].cc).toBe(1);
    expect(result[0].value).toBe(64);
    expect(result[0].time).toBe(1.5);
  });

  test('thinCCEvents reduces density', () => {
    const events = Array.from({ length: 30 }, (_, i) => makeEvent(i, 1, i * 4, i * 0.1));
    const thinned = thinCCEvents(events, 5);
    expect(thinned.length).toBeLessThan(events.length);
    // First and last always kept
    expect(thinned[0].id).toBe(0);
    expect(thinned[thinned.length - 1].id).toBe(29);
  });
});

describe('CC Export/Import', () => {
  test('export produces valid JSON', () => {
    const events = [makeEvent(1, 1, 64, 1.0)];
    const json = exportCCLane(events);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  test('import restores events', () => {
    const events = [makeEvent(1, 1, 64, 1.0)];
    const json = exportCCLane(events);
    const imported = importCCLane(json);
    expect(imported).toHaveLength(1);
    expect(imported[0].cc).toBe(1);
  });

  test('import returns empty for invalid JSON', () => {
    expect(importCCLane('not json')).toEqual([]);
    expect(importCCLane('[]')).toEqual([]);
  });
});
