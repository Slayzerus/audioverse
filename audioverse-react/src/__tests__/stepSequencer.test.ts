import { describe, test, expect } from 'vitest';
import {
  createEmptyPattern,
  createEmptyStep,
  toggleStep,
  setStepNote,
  setStepVelocity,
  setStepGate,
  setStepProbability,
  toggleStepSlide,
  transposePattern,
  reversePattern,
  shiftPattern,
  randomizeVelocity,
  clearPattern,
  stepDuration,
  stepTimeOffset,
  shouldTrigger,
  createKickPattern,
  createSnarePattern,
  createHiHatPattern,
  createArpPattern,
  createBasslinePattern,
  serializePattern,
  deserializePattern,
} from '../utils/stepSequencer';

describe('Step factory', () => {
  test('createEmptyStep defaults', () => {
    const s = createEmptyStep();
    expect(s.active).toBe(false);
    expect(s.note).toBe(60);
    expect(s.velocity).toBe(100);
    expect(s.gate).toBe(0.8);
    expect(s.probability).toBe(1.0);
    expect(s.slide).toBe(false);
  });

  test('createEmptyPattern has correct length', () => {
    const p = createEmptyPattern('Test', 32);
    expect(p.length).toBe(32);
    expect(p.steps).toHaveLength(32);
    expect(p.name).toBe('Test');
  });
});

describe('Step editing', () => {
  test('toggleStep flips active', () => {
    const p = createEmptyPattern();
    const toggled = toggleStep(p, 0);
    expect(toggled.steps[0].active).toBe(true);
    expect(toggleStep(toggled, 0).steps[0].active).toBe(false);
  });

  test('setStepNote clamps 0-127', () => {
    const p = createEmptyPattern();
    expect(setStepNote(p, 0, 200).steps[0].note).toBe(127);
    expect(setStepNote(p, 0, -5).steps[0].note).toBe(0);
    expect(setStepNote(p, 0, 72).steps[0].note).toBe(72);
  });

  test('setStepVelocity clamps 0-127', () => {
    const p = createEmptyPattern();
    expect(setStepVelocity(p, 0, 150).steps[0].velocity).toBe(127);
    expect(setStepVelocity(p, 0, -1).steps[0].velocity).toBe(0);
  });

  test('setStepGate clamps 0-1', () => {
    const p = createEmptyPattern();
    expect(setStepGate(p, 0, 2).steps[0].gate).toBe(1);
    expect(setStepGate(p, 0, 0.5).steps[0].gate).toBe(0.5);
  });

  test('setStepProbability clamps 0-1', () => {
    const p = createEmptyPattern();
    expect(setStepProbability(p, 0, 1.5).steps[0].probability).toBe(1);
  });

  test('toggleStepSlide toggles', () => {
    const p = createEmptyPattern();
    expect(toggleStepSlide(p, 0).steps[0].slide).toBe(true);
  });
});

describe('Pattern operations', () => {
  test('transposePattern shifts notes', () => {
    let p = createEmptyPattern();
    p = toggleStep(p, 0);
    p = setStepNote(p, 0, 60);
    const t = transposePattern(p, 5);
    expect(t.steps[0].note).toBe(65);
    expect(t.rootNote).toBe(65);
  });

  test('reversePattern reverses step order', () => {
    let p = createEmptyPattern('', 4);
    p = setStepNote(p, 0, 60);
    p = setStepNote(p, 3, 72);
    const r = reversePattern(p);
    expect(r.steps[0].note).toBe(72);
    expect(r.steps[3].note).toBe(60);
  });

  test('shiftPattern wraps around', () => {
    let p = createEmptyPattern('', 4);
    p = toggleStep(p, 0);
    const shifted = shiftPattern(p, 1);
    expect(shifted.steps[0].active).toBe(false);
    expect(shifted.steps[3].active).toBe(true);
  });

  test('randomizeVelocity stays in min-max', () => {
    let p = createEmptyPattern('', 16);
    for (let i = 0; i < 16; i++) p = toggleStep(p, i);
    const r = randomizeVelocity(p, 80, 100);
    r.steps.forEach(s => {
      expect(s.velocity).toBeGreaterThanOrEqual(80);
      expect(s.velocity).toBeLessThanOrEqual(100);
    });
  });

  test('clearPattern deactivates all steps', () => {
    let p = createEmptyPattern('', 16);
    p = toggleStep(p, 0);
    p = toggleStep(p, 4);
    const c = clearPattern(p);
    c.steps.forEach(s => expect(s.active).toBe(false));
  });
});

describe('Playback timing', () => {
  test('stepDuration at 120 BPM, 4 steps/beat', () => {
    const dur = stepDuration(120, 4);
    expect(dur).toBeCloseTo(0.125, 4); // 60/120/4 = 0.125s
  });

  test('stepTimeOffset with no swing', () => {
    expect(stepTimeOffset(0, 120)).toBeCloseTo(0, 4);
    expect(stepTimeOffset(4, 120)).toBeCloseTo(0.5, 4);
  });

  test('shouldTrigger respects probability', () => {
    const always = createEmptyStep();
    always.active = true;
    always.probability = 1;
    expect(shouldTrigger(always)).toBe(true);

    const never = createEmptyStep();
    never.active = true;
    never.probability = 0;
    expect(shouldTrigger(never)).toBe(false);

    const inactive = createEmptyStep();
    inactive.active = false;
    inactive.probability = 1;
    expect(shouldTrigger(inactive)).toBe(false);
  });
});

describe('Preset patterns', () => {
  test('kick pattern has 4 hits', () => {
    const p = createKickPattern();
    expect(p.steps.filter(s => s.active)).toHaveLength(4);
  });

  test('snare pattern has 2 hits', () => {
    const p = createSnarePattern();
    expect(p.steps.filter(s => s.active)).toHaveLength(2);
  });

  test('hihat pattern has 8 hits', () => {
    const p = createHiHatPattern();
    expect(p.steps.filter(s => s.active)).toHaveLength(8);
  });

  test('arp pattern has 16 active steps', () => {
    const p = createArpPattern();
    expect(p.steps.filter(s => s.active)).toHaveLength(16);
  });

  test('bassline pattern has correct number of hits', () => {
    const p = createBasslinePattern();
    expect(p.steps.filter(s => s.active).length).toBeGreaterThan(0);
  });
});

describe('Serialization', () => {
  test('serialize/deserialize roundtrip', () => {
    const p = createKickPattern();
    const json = serializePattern(p);
    const restored = deserializePattern(json);
    expect(restored).not.toBeNull();
    expect(restored!.name).toBe('Kick');
    expect(restored!.steps).toHaveLength(16);
  });

  test('deserialize invalid JSON returns null', () => {
    expect(deserializePattern('invalid')).toBeNull();
    expect(deserializePattern('{"name":"test"}')).toBeNull();
  });
});
