import { describe, test, expect } from 'vitest';

// ─── useServiceWorker (unit-testable parts) ─────────────────────────────────────
// Since SW registration requires browser APIs, we test the hook contract shape.

describe('useServiceWorker module', () => {
  test('exports useServiceWorker function', async () => {
    const mod = await import('../hooks/useServiceWorker');
    expect(typeof mod.useServiceWorker).toBe('function');
  });
});

// ─── useMidiLearn module structure ──────────────────────────────────────────────

describe('useMidiLearn module', () => {
  test('exports useMidiLearn and useMPE', async () => {
    const mod = await import('../scripts/midi/useMidiLearn');
    expect(typeof mod.useMidiLearn).toBe('function');
    expect(typeof mod.useMPE).toBe('function');
  });
});

// ─── useCCAutomation module structure ───────────────────────────────────────────

describe('useCCAutomation module', () => {
  test('exports useCCAutomation hook', async () => {
    const mod = await import('../hooks/useCCAutomation');
    expect(typeof mod.useCCAutomation).toBe('function');
  });
});

// ─── useStepSequencer module structure ──────────────────────────────────────────

describe('useStepSequencer module', () => {
  test('exports useStepSequencer hook', async () => {
    const mod = await import('../hooks/useStepSequencer');
    expect(typeof mod.useStepSequencer).toBe('function');
  });
});
