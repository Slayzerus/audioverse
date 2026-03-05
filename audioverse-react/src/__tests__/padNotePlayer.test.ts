import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  midiToHz,
  buildLanes,
  getLaneForPitch,
  buildPadNoteEvents,
  PadNotePlayer,
  PadDifficulty,
  KEY_MAPS,
  LANE_COLORS,
  PadLane,
} from '../scripts/karaoke/padNotePlayer';
import { parseNotes, KaraokeNoteData } from '../scripts/karaoke/karaokeTimeline';

// ─── midiToHz ─────────────────────────────────────────────────────────────────

describe('midiToHz', () => {
  test('converts MIDI 69 (A4) to 440 Hz', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 1);
  });

  test('converts MIDI 60 (C4) to ~261.6 Hz', () => {
    expect(midiToHz(60)).toBeCloseTo(261.63, 0);
  });

  test('converts MIDI 72 (C5) to ~523.25 Hz', () => {
    expect(midiToHz(72)).toBeCloseTo(523.25, 0);
  });

  test('octave relationship: MIDI+12 → double frequency', () => {
    const hz60 = midiToHz(60);
    const hz72 = midiToHz(72);
    expect(hz72 / hz60).toBeCloseTo(2.0, 4);
  });
});

// ─── buildLanes ───────────────────────────────────────────────────────────────

describe('buildLanes', () => {
  const makeNotes = (pitches: number[]): KaraokeNoteData[][] => {
    return [pitches.map(p => ({ startTime: 0, duration: 1, pitch: p }))];
  };

  test('returns 2 lanes for easy difficulty', () => {
    const lanes = buildLanes(makeNotes([60, 72]), 'easy');
    expect(lanes).toHaveLength(2);
    expect(lanes[0].key).toBe('f');
    expect(lanes[1].key).toBe('j');
  });

  test('returns 4 lanes for normal difficulty', () => {
    const lanes = buildLanes(makeNotes([50, 55, 60, 65, 70, 75]), 'normal');
    expect(lanes).toHaveLength(4);
    expect(lanes.map(l => l.key)).toEqual(['d', 'f', 'j', 'k']);
  });

  test('returns 6 lanes for hard difficulty', () => {
    const lanes = buildLanes(makeNotes([50, 55, 60, 65, 70, 75]), 'hard');
    expect(lanes).toHaveLength(6);
    expect(lanes.map(l => l.key)).toEqual(['s', 'd', 'f', 'j', 'k', 'l']);
  });

  test('first lane catches everything below range', () => {
    const lanes = buildLanes(makeNotes([60, 72]), 'easy');
    expect(lanes[0].minPitch).toBe(-999);
  });

  test('last lane catches everything above range', () => {
    const lanes = buildLanes(makeNotes([60, 72]), 'easy');
    expect(lanes[lanes.length - 1].maxPitch).toBe(999);
  });

  test('handles empty notes gracefully', () => {
    const lanes = buildLanes([[]], 'normal');
    expect(lanes).toHaveLength(4);
    // All lanes should have fallback range
    lanes.forEach(l => {
      expect(l.minPitch).toBe(-999);
      expect(l.maxPitch).toBe(999);
    });
  });

  test('lanes have gamepad button mappings', () => {
    const lanes = buildLanes(makeNotes([60, 72]), 'normal');
    expect(lanes.map(l => l.gamepadButton)).toEqual([3, 2, 0, 1]);
  });

  test('lanes have colors from LANE_COLORS', () => {
    const lanes = buildLanes(makeNotes([60, 72]), 'easy');
    lanes.forEach((l, i) => {
      expect(l.color).toBe(LANE_COLORS[i % LANE_COLORS.length]);
    });
  });
});

// ─── getLaneForPitch ──────────────────────────────────────────────────────────

describe('getLaneForPitch', () => {
  test('assigns pitch to correct lane within range', () => {
    const lanes: PadLane[] = [
      { index: 0, key: 'f', gamepadButton: 0, label: 'F', minPitch: -999, maxPitch: 65, color: '#f00' },
      { index: 1, key: 'j', gamepadButton: 1, label: 'J', minPitch: 66, maxPitch: 999, color: '#00f' },
    ];
    expect(getLaneForPitch(60, lanes)).toBe(0);
    expect(getLaneForPitch(70, lanes)).toBe(1);
  });

  test('boundary pitch goes to correct lane', () => {
    const lanes: PadLane[] = [
      { index: 0, key: 'f', gamepadButton: 0, label: 'F', minPitch: -999, maxPitch: 65, color: '#f00' },
      { index: 1, key: 'j', gamepadButton: 1, label: 'J', minPitch: 66, maxPitch: 999, color: '#00f' },
    ];
    expect(getLaneForPitch(65, lanes)).toBe(0);
    expect(getLaneForPitch(66, lanes)).toBe(1);
  });

  test('falls back to nearest lane for out-of-range pitch', () => {
    // Contrived: lane 0 is 60-65, lane 1 is 70-75 (gap at 66-69)
    const lanes: PadLane[] = [
      { index: 0, key: 'f', gamepadButton: 0, label: 'F', minPitch: 60, maxPitch: 65, color: '#f00' },
      { index: 1, key: 'j', gamepadButton: 1, label: 'J', minPitch: 70, maxPitch: 75, color: '#00f' },
    ];
    // 67 is closer to lane 0 mid (62.5) than lane 1 mid (72.5)
    expect(getLaneForPitch(67, lanes)).toBe(0);
    // 69 is closer to lane 1 mid (72.5) than lane 0 mid (62.5)
    expect(getLaneForPitch(69, lanes)).toBe(1);
  });
});

// ─── buildPadNoteEvents ───────────────────────────────────────────────────────

describe('buildPadNoteEvents', () => {
  test('assigns lane to each note and adds gap offset', () => {
    const noteLines: KaraokeNoteData[][] = [
      [
        { startTime: 0, duration: 1, pitch: 60 },
        { startTime: 1, duration: 1, pitch: 72 },
      ],
    ];
    const lanes = buildLanes(noteLines, 'easy');
    const events = buildPadNoteEvents(noteLines, lanes, 0.5);

    expect(events).toHaveLength(2);
    // gap of 0.5s added
    expect(events[0].note.startTime).toBeCloseTo(0.5);
    expect(events[1].note.startTime).toBeCloseTo(1.5);
    // Different lanes
    expect(events[0].lane).not.toBe(events[1].lane);
  });

  test('events are sorted by start time', () => {
    const noteLines: KaraokeNoteData[][] = [
      [
        { startTime: 3, duration: 1, pitch: 60 },
        { startTime: 1, duration: 1, pitch: 65 },
      ],
    ];
    const lanes = buildLanes(noteLines, 'easy');
    const events = buildPadNoteEvents(noteLines, lanes, 0);

    expect(events[0].note.startTime).toBeLessThanOrEqual(events[1].note.startTime);
  });

  test('includes line and note indices', () => {
    const noteLines: KaraokeNoteData[][] = [
      [{ startTime: 0, duration: 1, pitch: 60 }],
      [{ startTime: 2, duration: 1, pitch: 65 }],
    ];
    const lanes = buildLanes(noteLines, 'easy');
    const events = buildPadNoteEvents(noteLines, lanes, 0);

    expect(events[0].lineIndex).toBe(0);
    expect(events[0].noteIndex).toBe(0);
    expect(events[1].lineIndex).toBe(1);
    expect(events[1].noteIndex).toBe(0);
  });
});

// ─── PadNotePlayer ────────────────────────────────────────────────────────────

describe('PadNotePlayer', () => {
  const noteLines = [
    '#BPM:120',
    ': 0 4 60 lyrics',     // beat 0, duration 4, pitch 60
    ': 8 4 72 more',       // beat 8, duration 4, pitch 72
  ];

  test('constructs with correct number of lanes for each difficulty', () => {
    for (const diff of ['easy', 'normal', 'hard'] as PadDifficulty[]) {
      const player = new PadNotePlayer({
        difficulty: diff,
        noteLines,
        bpm: 120,
        gap: 0,
        onPitch: () => {},
      });
      const expectedLanes = KEY_MAPS[diff].keys.length;
      expect(player.getLanes()).toHaveLength(expectedLanes);
    }
  });

  test('parses note events from UltraStar lines', () => {
    const player = new PadNotePlayer({
      difficulty: 'easy',
      noteLines,
      bpm: 120,
      gap: 0,
      onPitch: () => {},
    });
    const events = player.getEvents();
    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  test('applies gap offset to note events', () => {
    const player = new PadNotePlayer({
      difficulty: 'easy',
      noteLines,
      bpm: 120,
      gap: 1000, // 1000ms = 1s
      onPitch: () => {},
    });
    const events = player.getEvents();
    // First note at beat 0 with BPM 120: time = 0 * 15/120 = 0, +gap 1s = 1s
    expect(events[0].note.startTime).toBeCloseTo(1.0, 1);
  });

  test('start and stop lifecycle works without errors', () => {
    const onPitch = vi.fn();
    const player = new PadNotePlayer({
      difficulty: 'normal',
      noteLines,
      bpm: 120,
      gap: 0,
      onPitch,
    });

    // Should not throw
    player.start(() => 0);
    player.stop();
  });

  test('stop removes keyboard listeners', () => {
    const removeListenerSpy = vi.spyOn(window, 'removeEventListener');
    const player = new PadNotePlayer({
      difficulty: 'easy',
      noteLines,
      bpm: 120,
      gap: 0,
      onPitch: () => {},
    });

    player.start(() => 0);
    player.stop();

    expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    removeListenerSpy.mockRestore();
  });
});

// ─── KEY_MAPS ─────────────────────────────────────────────────────────────────

describe('KEY_MAPS', () => {
  test('easy has 2 keys', () => {
    expect(KEY_MAPS.easy.keys).toHaveLength(2);
    expect(KEY_MAPS.easy.buttons).toHaveLength(2);
    expect(KEY_MAPS.easy.labels).toHaveLength(2);
  });

  test('normal has 4 keys', () => {
    expect(KEY_MAPS.normal.keys).toHaveLength(4);
    expect(KEY_MAPS.normal.buttons).toHaveLength(4);
    expect(KEY_MAPS.normal.labels).toHaveLength(4);
  });

  test('hard has 6 keys', () => {
    expect(KEY_MAPS.hard.keys).toHaveLength(6);
    expect(KEY_MAPS.hard.buttons).toHaveLength(6);
    expect(KEY_MAPS.hard.labels).toHaveLength(6);
  });

  test('each difficulty has matching labels for keys', () => {
    for (const diff of ['easy', 'normal', 'hard'] as PadDifficulty[]) {
      const map = KEY_MAPS[diff];
      expect(map.keys.length).toBe(map.labels.length);
      // labels should be uppercase versions of keys
      map.keys.forEach((k, i) => {
        expect(map.labels[i]).toBe(k.toUpperCase());
      });
    }
  });
});

// ─── Integration: PadNotePlayer with real UltraStar notes ─────────────────────

describe('PadNotePlayer integration with parseNotes', () => {
  test('notes parsed from UltraStar format get correct lane assignments', () => {
    const lines = [
      ': 0 4 50 low',
      ': 4 4 60 mid',
      ': 8 4 70 high',
    ];
    const player = new PadNotePlayer({
      difficulty: 'normal', // 4 lanes
      noteLines: lines,
      bpm: 120,
      gap: 0,
      onPitch: () => {},
    });

    const events = player.getEvents();
    expect(events).toHaveLength(3);

    // Lowest pitch should be in lane 0 or 1
    // Highest pitch should be in lane 2 or 3
    const lowLane = events.find(e => e.note.pitch === 50)!.lane;
    const highLane = events.find(e => e.note.pitch === 70)!.lane;
    expect(highLane).toBeGreaterThan(lowLane);
  });

  test('golden notes are preserved in pad events', () => {
    const lines = [
      '* 0 4 60 golden note',
      ': 4 4 65 normal note',
    ];
    const player = new PadNotePlayer({
      difficulty: 'easy',
      noteLines: lines,
      bpm: 120,
      gap: 0,
      onPitch: () => {},
    });

    const events = player.getEvents();
    const golden = events.find(e => e.note.isGold);
    expect(golden).toBeTruthy();
    expect(golden!.note.pitch).toBe(60);
  });
});
