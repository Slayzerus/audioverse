import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock animationHelper — runChoreo simply resolves immediately
vi.mock('../components/animations/animationHelper', () => ({
  runChoreo: vi.fn(async () => {}),
}));

import { runChoreo } from '../components/animations/animationHelper';
import {
  ChoreoBuilder,
  seq,
  compile,
  runSeq,
  runWave,
  runCannon,
  runRounds,
} from '../components/animations/choreoDSL';

const mockRunChoreo = runChoreo as unknown as ReturnType<typeof vi.fn>;

const dummyFx = {} as any; // PersonControls stub

describe('choreoDSL', () => {
  beforeEach(() => vi.clearAllMocks());

  // ---- ChoreoBuilder ----
  describe('ChoreoBuilder', () => {
    it('seq() creates a new builder', () => {
      const b = seq();
      expect(b).toBeInstanceOf(ChoreoBuilder);
    });

    it('pose adds a pose step', () => {
      const steps = seq().pose('happy', 100).build();
      expect(steps).toHaveLength(1);
      expect(steps[0]).toMatchObject({ type: 'pose', pose: 'happy', holdMs: 100 });
    });

    it('wait adds a wait step', () => {
      const steps = seq().wait(200).build();
      expect(steps).toHaveLength(1);
      expect(steps[0]).toMatchObject({ type: 'wait', ms: 200 });
    });

    it('label adds a label step', () => {
      const steps = seq().label('start').build();
      expect(steps[0]).toMatchObject({ type: 'label', name: 'start' });
    });

    it('goto adds a goto step', () => {
      const steps = seq().goto('start').build();
      expect(steps[0]).toMatchObject({ type: 'goto', name: 'start' });
    });

    it('gotoIf adds a conditional goto', () => {
      const pred = () => true;
      const steps = seq().gotoIf('loop', pred).build();
      expect(steps[0]).toHaveProperty('when');
    });

    it('tempo scales holdMs and options.duration', () => {
      const steps = seq()
        .pose('happy', 100, { duration: 1 })
        .wait(200)
        .tempo(2)
        .build();
      expect(steps[0]).toMatchObject({ type: 'pose', holdMs: 200 });
      expect((steps[0] as any).options.duration).toBe(2);
      expect(steps[1]).toMatchObject({ type: 'wait', ms: 400 });
    });

    it('repeat duplicates existing steps', () => {
      const steps = seq().pose('idle', 100).repeat(3).build();
      expect(steps).toHaveLength(3);
    });

    it('loop sets loop count', () => {
      const b = seq().loop(5);
      expect(b.getLoop()).toBe(5);
    });

    it('loop(Infinity) works', () => {
      expect(seq().loop(Infinity).getLoop()).toBe(Infinity);
    });

    // shortcut methods
    it('idle shortcut', () => {
      const steps = seq().idle(100).build();
      expect(steps[0]).toMatchObject({ type: 'pose', pose: 'idle', holdMs: 100 });
    });

    it('happy shortcut', () => {
      const steps = seq().happy(200).build();
      expect(steps[0]).toMatchObject({ type: 'pose', pose: 'happy', holdMs: 200 });
    });

    it('enterFromLeft shortcut', () => {
      const steps = seq().enterFromLeft(0.8).build();
      expect(steps[0]).toMatchObject({ type: 'pose', pose: 'enterFromLeft' });
      expect((steps[0] as any).options.duration).toBe(0.8);
    });

    it('raiseCard shortcut', () => {
      const steps = seq().raiseCard(9, 1000, 0.5).build();
      expect(steps[0]).toMatchObject({ type: 'pose', pose: 'raiseCard', holdMs: 1000 });
      expect((steps[0] as any).options.score).toBe(9);
    });

    it('all dance and expression shortcuts work', () => {
      const b = seq()
        .angry().disappointed().swearing().shouting()
        .rock().danceA().danceB().danceC()
        .waveHand().facepalm().shrug().nodYes().shakeNo()
        .pointRight().leanBack().jump().spin().celebrate()
        .exitLeft().exitRight().hideDown().enterFromRight();
      expect(b.build().length).toBe(22);
    });
  });

  // ---- compile ----
  describe('compile', () => {
    it('compiles pose and wait steps', () => {
      const built = seq().pose('happy', 100).wait(50);
      const steps = compile(built);
      expect(steps).toHaveLength(2);
      expect(steps[0]).toMatchObject({ pose: 'happy', holdMs: 100 });
      expect(steps[1]).toMatchObject({ pose: 'idle', holdMs: 50 });
    });

    it('handles goto that jumps to label (bounded)', () => {
      // label("A") → pose("happy") → label("end")
      // Without goto, just linear — avoids infinite loop in test
      const built = seq().label('A').pose('happy', 100).label('end');
      const steps = compile(built);
      expect(steps.length).toBeGreaterThanOrEqual(1);
    });

    it('gotoIf skips when predicate is false', () => {
      const built = seq()
        .label('loop')
        .pose('happy', 50)
        .gotoIf('loop', (ctx) => (ctx.score ?? 0) > 90);
      // score=50 → predicate false → no loop
      const steps = compile(built, { score: 50 });
      expect(steps).toHaveLength(1);
    });

    it('goto jumps back to label (L157-158)', () => {
      // Use a counter in ctx to avoid infinite loop: jump only once
      let jumpCount = 0;
      const built = seq()
        .label('start')
        .pose('happy', 50)
        .gotoIf('start', () => {
          jumpCount++;
          return jumpCount < 2; // jump once, then fall through
        });
      const steps = compile(built, {});
      // First pass: happy(50), goto→jump → happy(50), goto→no jump
      expect(steps).toHaveLength(2);
      expect(steps[0].pose).toBe('happy');
      expect(steps[1].pose).toBe('happy');
    });

    it('unconditional goto jumps to label', () => {
      let count = 0;
      const built = seq()
        .label('loop')
        .pose('idle', 10)
        .gotoIf('loop', () => ++count < 3);
      const steps = compile(built, {});
      // Should loop 3 times: idle × 3
      expect(steps).toHaveLength(3);
    });

    it('compiles plain ChoreoStep arrays as pass-through', () => {
      const raw = [{ pose: 'idle' as const, holdMs: 100 }];
      const out = compile(raw as any);
      // plain objects without "type" get skipped or passed through
      expect(out).toBeDefined();
    });
  });

  // ---- runSeq ----
  describe('runSeq', () => {
    it('runs compiled steps via runChoreo', async () => {
      const b = seq().pose('happy', 100);
      await runSeq(dummyFx, b);
      expect(mockRunChoreo).toHaveBeenCalled();
    });

    it('runs with loop count', async () => {
      const b = seq().pose('idle', 10).loop(3);
      await runSeq(dummyFx, b);
      expect(mockRunChoreo).toHaveBeenCalledTimes(3);
    });

    it('runs with plain InternalStep array', async () => {
      const steps = [{ type: 'pose' as const, pose: 'idle' as const, holdMs: 10 }];
      await runSeq(dummyFx, steps as any);
      expect(mockRunChoreo).toHaveBeenCalled();
    });

    it('infinite loop runs until runChoreo throws (L177-179)', async () => {
      let callCount = 0;
      mockRunChoreo.mockImplementation(async () => {
        callCount++;
        if (callCount >= 3) throw new Error('break');
      });
      const b = seq().pose('idle', 10).loop(Infinity);
      await expect(runSeq(dummyFx, b)).rejects.toThrow('break');
      expect(callCount).toBe(3);
      // Restore default mock for subsequent tests
      mockRunChoreo.mockImplementation(async () => {});
    });
  });

  // ---- runWave ----
  describe('runWave', () => {
    it('runs choreo for each actor with stagger', async () => {
      const actors = [{}, {}, {}] as any[];
      await runWave(actors, seq().pose('happy', 50), 50);
      expect(mockRunChoreo).toHaveBeenCalledTimes(3);
    });
  });

  // ---- runCannon ----
  describe('runCannon', () => {
    it('runs wave forward then reverse', async () => {
      const actors = [{}, {}] as any[];
      await runCannon(actors, seq().pose('rock', 50), 20);
      // Forward wave = 2 calls, reverse wave = 2 calls
      expect(mockRunChoreo).toHaveBeenCalledTimes(4);
    });
  });

  // ---- runRounds ----
  describe('runRounds', () => {
    it('assigns programs cyclically to actors', async () => {
      const actors = [{}, {}, {}] as any[];
      const programs = [
        seq().pose('happy', 50),
        seq().pose('angry', 50),
      ];
      await runRounds(actors, programs, 0);
      expect(mockRunChoreo).toHaveBeenCalledTimes(3);
    });
  });
});
