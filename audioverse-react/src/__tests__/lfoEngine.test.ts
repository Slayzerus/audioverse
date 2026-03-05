import { describe, test, expect } from 'vitest';
import {
  waveformValue,
  evaluateLFO,
  evaluateLFOAsCC,
  syncDivisionToHz,
  sampleLFOToCCEvents,
  sampleLFOForDisplay,
  createDefaultLFO,
  serializeLFO,
  deserializeLFO,
} from '../utils/lfoEngine';

describe('waveformValue', () => {
  test('sine has correct range', () => {
    for (let p = 0; p <= 1; p += 0.1) {
      const v = waveformValue('sine', p);
      expect(v).toBeGreaterThanOrEqual(-1.01);
      expect(v).toBeLessThanOrEqual(1.01);
    }
  });

  test('triangle returns -1 at p=0, 0 at p=0.25, 1 at p=0.5', () => {
    expect(waveformValue('triangle', 0)).toBeCloseTo(-1, 4);
    expect(waveformValue('triangle', 0.25)).toBeCloseTo(0, 4);
    expect(waveformValue('triangle', 0.5)).toBeCloseTo(1, 4);
  });

  test('sawtooth ranges from -1 to 1', () => {
    expect(waveformValue('sawtooth', 0)).toBeCloseTo(-1, 4);
    expect(waveformValue('sawtooth', 0.999)).toBeCloseTo(1, 1);
  });

  test('square returns 1 or -1', () => {
    expect(waveformValue('square', 0.2)).toBe(1);
    expect(waveformValue('square', 0.7)).toBe(-1);
  });
});

describe('evaluateLFO', () => {
  test('disabled LFO returns center', () => {
    const lfo = { ...createDefaultLFO(), enabled: false, center: 0.7 };
    expect(evaluateLFO(lfo, 5)).toBe(0.7);
  });

  test('output is clamped 0-1', () => {
    const lfo = { ...createDefaultLFO(), depth: 1.0, center: 0.5 };
    for (let t = 0; t < 10; t += 0.1) {
      const v = evaluateLFO(lfo, t);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  test('BPM sync changes frequency', () => {
    const lfo = { ...createDefaultLFO(), syncToBpm: true, syncDivision: '1/4' as const };
    const v1 = evaluateLFO(lfo, 0.3, 120);
    const v2 = evaluateLFO(lfo, 0.3, 60);
    // Different BPM → different values at same time
    expect(v1).not.toBeCloseTo(v2, 2);
  });
});

describe('evaluateLFOAsCC', () => {
  test('returns value in 0-127 range', () => {
    const lfo = createDefaultLFO();
    for (let t = 0; t < 5; t += 0.1) {
      const cc = evaluateLFOAsCC(lfo, t);
      expect(cc).toBeGreaterThanOrEqual(0);
      expect(cc).toBeLessThanOrEqual(127);
    }
  });
});

describe('syncDivisionToHz', () => {
  test('quarter note at 120 BPM = 2 Hz', () => {
    expect(syncDivisionToHz(120, '1/4')).toBeCloseTo(2, 4);
  });

  test('whole note at 120 BPM = 0.5 Hz', () => {
    expect(syncDivisionToHz(120, '1/1')).toBeCloseTo(0.5, 4);
  });
});

describe('sampleLFOToCCEvents', () => {
  test('generates correct number of events', () => {
    const lfo = createDefaultLFO();
    const events = sampleLFOToCCEvents(lfo, 0, 1, 1, 10);
    expect(events.length).toBe(11); // 10 samples + 1
  });

  test('all events have correct CC number', () => {
    const lfo = createDefaultLFO();
    const events = sampleLFOToCCEvents(lfo, 0, 2, 74, 5);
    events.forEach(e => expect(e.cc).toBe(74));
  });
});

describe('sampleLFOForDisplay', () => {
  test('produces points within bounds', () => {
    const lfo = createDefaultLFO();
    const points = sampleLFOForDisplay(lfo, 400, 100, 2, undefined, 50);
    expect(points).toHaveLength(51);
    points.forEach(p => {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(400);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(100);
    });
  });
});

describe('LFO serialization', () => {
  test('roundtrip serialize/deserialize', () => {
    const lfo = createDefaultLFO();
    const json = serializeLFO(lfo);
    const restored = deserializeLFO(json);
    expect(restored).not.toBeNull();
    expect(restored!.waveform).toBe('sine');
    expect(restored!.rate).toBe(1.0);
  });

  test('deserialize invalid returns null', () => {
    expect(deserializeLFO('invalid')).toBeNull();
    expect(deserializeLFO('{"name":"test"}')).toBeNull();
  });
});
