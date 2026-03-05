import { vi, describe, it, expect, beforeEach } from 'vitest';

// Each AnimationControls.start() returns a promise. We need a mock that records calls.
function mockControls() {
  const start = vi.fn().mockResolvedValue(undefined);
  return { start, stop: vi.fn(), set: vi.fn(), mount: vi.fn() };
}

function makeFx() {
  return {
    root: mockControls(),
    body: mockControls(),
    head: mockControls(),
    eyes: mockControls(),
    mouth: mockControls(),
    leftArm: mockControls(),
    rightArm: mockControls(),
    card: mockControls(),
    curse: mockControls(),
  };
}

// We need to mock framer-motion's useAnimationControls since it's only useful in React.
vi.mock('framer-motion', () => ({
  useAnimationControls: () => mockControls(),
  AnimationControls: class {},
}));

import { playPose, runChoreo, type PersonControls, type PersonPose } from '../components/animations/animationHelper';

describe('animationHelper — playPose', () => {
  let fx: ReturnType<typeof makeFx>;

  beforeEach(() => {
    fx = makeFx();
    vi.clearAllMocks();
  });

  const allPoses: PersonPose[] = [
    'idle', 'raiseCard', 'happy', 'angry', 'disappointed', 'swearing',
    'shouting', 'rock', 'danceA', 'danceB', 'danceC',
    'hideDown', 'exitLeft', 'exitRight', 'enterFromLeft', 'enterFromRight',
    'waveHand', 'facepalm', 'shrug', 'nodYes', 'shakeNo',
    'pointRight', 'leanBack', 'jump', 'spin', 'celebrate',
  ];

  allPoses.forEach((pose) => {
    it(`plays pose "${pose}" without error`, async () => {
      await playPose(fx as unknown as PersonControls, pose, { screenW: 1920, screenH: 1080 });
      // At least one controls.start() should have been called
      const allStarts = [
        fx.root.start, fx.body.start, fx.head.start, fx.eyes.start,
        fx.mouth.start, fx.leftArm.start, fx.rightArm.start,
        fx.card.start, fx.curse.start,
      ];
      const totalCalls = allStarts.reduce((sum, s) => sum + s.mock.calls.length, 0);
      expect(totalCalls).toBeGreaterThan(0);
    });
  });

  it('idle calls body.start with oscillation', async () => {
    await playPose(fx as unknown as PersonControls, 'idle');
    expect(fx.body.start).toHaveBeenCalled();
  });

  it('raiseCard raises right arm and shows card', async () => {
    await playPose(fx as unknown as PersonControls, 'raiseCard');
    expect(fx.rightArm.start).toHaveBeenCalled();
    expect(fx.card.start).toHaveBeenCalled();
    // Card should become visible (opacity 1)
    const cardCall = fx.card.start.mock.calls.find((c: any) => c[0]?.opacity === 1);
    expect(cardCall).toBeTruthy();
  });

  it('happy animates mouth and head', async () => {
    await playPose(fx as unknown as PersonControls, 'happy');
    expect(fx.mouth.start).toHaveBeenCalled();
    expect(fx.head.start).toHaveBeenCalled();
  });

  it('angry squints eyes', async () => {
    await playPose(fx as unknown as PersonControls, 'angry');
    expect(fx.eyes.start).toHaveBeenCalled();
    const eyeCall = fx.eyes.start.mock.calls[0][0];
    expect(eyeCall.scaleY).toBeLessThan(1);
  });

  it('hideDown sends root off screen', async () => {
    await playPose(fx as unknown as PersonControls, 'hideDown', { screenH: 800 });
    expect(fx.root.start).toHaveBeenCalled();
    const rootCall = fx.root.start.mock.calls[0][0];
    expect(rootCall.y).toBe(800);
  });

  it('exitLeft moves root to -screenW', async () => {
    await playPose(fx as unknown as PersonControls, 'exitLeft', { screenW: 1920 });
    const rootCall = fx.root.start.mock.calls[0][0];
    expect(rootCall.x).toBe(-1920);
  });

  it('exitRight moves root to +screenW', async () => {
    await playPose(fx as unknown as PersonControls, 'exitRight', { screenW: 1920 });
    const rootCall = fx.root.start.mock.calls[0][0];
    expect(rootCall.x).toBe(1920);
  });

  it('enterFromLeft starts off-screen then animates in', async () => {
    await playPose(fx as unknown as PersonControls, 'enterFromLeft', { screenW: 1920 });
    expect(fx.root.start.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(fx.root.start.mock.calls[0][0].x).toBe(-1920);
    expect(fx.root.start.mock.calls[1][0].x).toBe(0);
  });

  it('enterFromRight starts off-screen then animates in', async () => {
    await playPose(fx as unknown as PersonControls, 'enterFromRight', { screenW: 1920 });
    expect(fx.root.start.mock.calls[0][0].x).toBe(1920);
    expect(fx.root.start.mock.calls[1][0].x).toBe(0);
  });

  it('facepalm moves right arm and tilts head', async () => {
    await playPose(fx as unknown as PersonControls, 'facepalm');
    expect(fx.rightArm.start).toHaveBeenCalled();
    expect(fx.head.start).toHaveBeenCalled();
  });

  it('celebrate raises both arms and root jumps', async () => {
    await playPose(fx as unknown as PersonControls, 'celebrate');
    expect(fx.leftArm.start).toHaveBeenCalled();
    expect(fx.rightArm.start).toHaveBeenCalled();
    expect(fx.root.start).toHaveBeenCalled();
  });

  it('jump makes root go up and back', async () => {
    await playPose(fx as unknown as PersonControls, 'jump');
    const rootCall = fx.root.start.mock.calls[0][0];
    expect(rootCall.y).toEqual([0, -30, 0]);
  });

  it('spin rotates root 360', async () => {
    await playPose(fx as unknown as PersonControls, 'spin');
    const rootCall = fx.root.start.mock.calls[0][0];
    expect(rootCall.rotate).toEqual([0, 360]);
  });

  it('nodYes rotates head', async () => {
    await playPose(fx as unknown as PersonControls, 'nodYes');
    expect(fx.head.start).toHaveBeenCalled();
  });

  it('shakeNo rotates head', async () => {
    await playPose(fx as unknown as PersonControls, 'shakeNo');
    expect(fx.head.start).toHaveBeenCalled();
  });
});

describe('animationHelper — runChoreo', () => {
  it('runs multiple poses in sequence', async () => {
    const fx = makeFx();
    await runChoreo(fx as unknown as PersonControls, [
      { pose: 'idle' },
      { pose: 'happy' },
      { pose: 'jump' },
    ]);
    // All three poses triggered body/root starts
    const totalCalls = fx.root.start.mock.calls.length +
      fx.body.start.mock.calls.length +
      fx.head.start.mock.calls.length;
    expect(totalCalls).toBeGreaterThanOrEqual(3);
  });

  it('respects holdMs delay', async () => {
    const fx = makeFx();
    const start = Date.now();
    await runChoreo(fx as unknown as PersonControls, [
      { pose: 'idle', holdMs: 50 },
      { pose: 'happy' },
    ]);
    // Should have waited at least ~50ms
    expect(Date.now() - start).toBeGreaterThanOrEqual(30); // allow some tolerance
  });

  it('handles empty steps array', async () => {
    const fx = makeFx();
    await runChoreo(fx as unknown as PersonControls, []);
    // No starts should have been called
    const totalCalls = fx.root.start.mock.calls.length;
    expect(totalCalls).toBe(0);
  });
});
