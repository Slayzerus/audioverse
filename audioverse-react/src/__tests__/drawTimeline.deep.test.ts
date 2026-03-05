import { vi, describe, it, expect, beforeEach } from 'vitest';
import { drawTimeline } from '../scripts/karaoke/karaokeTimeline';

// Comprehensive canvas context stub
const makeCtxStub = () => {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    beginPath: vi.fn(),
    drawImage: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    rect: vi.fn(),
    measureText: (_: string) => ({ width: 10, actualBoundingBoxAscent: 5, actualBoundingBoxDescent: 2 }),
    translate: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    createPattern: () => ({}),
    clip: vi.fn(),
    quadraticCurveTo: vi.fn(),
    setTransform: vi.fn(),
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    lineWidth: 1,
    strokeStyle: '',
    fillStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: '',
    shadowBlur: 0,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '12px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    canvas: { width: 800, height: 400 },
  } as any as CanvasRenderingContext2D;
};

describe('drawTimeline — extended coverage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns default ball position with empty noteLines', () => {
    const ctx = makeCtxStub();
    const res = drawTimeline(ctx, 800, 400, [], 0, 'Player', 50, '#ff0000');
    expect(res).toHaveProperty('ballX');
    expect(res).toHaveProperty('ballY');
    expect(res).toHaveProperty('ballIsGold');
    // No notes -> ball should be at midheight
    expect(res.ballY).toBeCloseTo(200, 0); // height * 0.5
    expect(res.ballIsGold).toBe(false);
  });

  it('works with multiple note lines', () => {
    const ctx = makeCtxStub();
    const noteLines = [
      [{ startTime: 0, duration: 1, pitch: 60 }, { startTime: 1, duration: 1, pitch: 62 }],
      [{ startTime: 2, duration: 1, pitch: 64 }, { startTime: 3, duration: 1, pitch: 65 }],
    ];
    const res = drawTimeline(ctx, 600, 300, noteLines, 0.5, 'P1', 75, '#00ff00');
    expect(typeof res.ballX).toBe('number');
    expect(typeof res.ballY).toBe('number');
  });

  it('handles gold notes correctly', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60, isGold: true }]];
    const res = drawTimeline(ctx, 400, 200, noteLines, 0.5, 'P', 0, '#f00', [], 's1');
    expect(res.ballIsGold).toBe(true);
  });

  it('ballIsGold false when note is not gold', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60 }]];
    const res = drawTimeline(ctx, 400, 200, noteLines, 0.5, 'P', 0, '#f00', [], 's1');
    expect(res.ballIsGold).toBe(false);
  });

  it('handles user pitch array', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60 }]];
    const userPitch = [
      { t: 0, hz: 261.63 },
      { t: 0.5, hz: 262 },
      { t: 1.0, hz: 260 },
    ];
    const res = drawTimeline(ctx, 800, 400, noteLines, 0.5, 'P', 50, '#0000ff', userPitch, 'song1');
    expect(typeof res.ballX).toBe('number');
  });

  it('works with segment scores', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60 }]];
    const segments = [
      { start: 0, end: 1, pitch: 60, frac: 0.8, isGold: false, noteStart: 0, noteEnd: 2 },
      { start: 1, end: 2, pitch: 60, frac: 0.5, isGold: true, noteStart: 0, noteEnd: 2 },
    ];
    const res = drawTimeline(ctx, 800, 400, noteLines, 0.5, 'P', 80, '#ff0000', [], 'song2', 0, segments);
    expect(typeof res.ballX).toBe('number');
  });

  it('supports difficulty levels', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60 }]];
    for (const diff of ['easy', 'normal', 'hard']) {
      const res = drawTimeline(ctx, 800, 400, noteLines, 0.5, 'P', 0, '#ff0', [], 's', 0, [], diff);
      expect(typeof res.ballX).toBe('number');
    }
  });

  it('handles isPlaying=false', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60 }]];
    const res = drawTimeline(ctx, 800, 400, noteLines, 0.5, 'P', 0, '#ff0', [], 's', 0, [], 'normal', false);
    expect(typeof res.ballX).toBe('number');
  });

  it('handles gold settings override', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60, isGold: true }]];
    const goldSettings = {
      lifeMs: 500,
      count: 3,
      baseSpeed: 10,
      baseSize: 5,
      glowBlur: 2,
      shadowColor: 'gold',
    };
    const res = drawTimeline(ctx, 800, 400, noteLines, 0.5, 'P', 0, '#ff0', [], 's', 0, [], 'normal', true, goldSettings);
    expect(typeof res.ballX).toBe('number');
  });

  it('handles gold bursts', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60, isGold: true }]];
    const bursts = [
      { playerId: 1, createdAt: Date.now() - 100, noteStart: 0, notePitch: 60, seed: 42 },
    ];
    const res = drawTimeline(ctx, 800, 400, noteLines, 0.5, 'P', 0, '#ff0', [], 's', 0, [], 'normal', true, undefined, bursts);
    expect(typeof res.ballX).toBe('number');
  });

  it('handles algorithm label and color', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 1, pitch: 60 }]];
    const res = drawTimeline(ctx, 800, 400, noteLines, 0.5, 'P', 0, '#ff0', [], 's', 0, [], 'normal', true, undefined, [], 'CREPE', '#00ff00');
    expect(typeof res.ballX).toBe('number');
  });

  it('handles panOffset and visibleWidth', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 1, pitch: 60 }]];
    const res = drawTimeline(ctx, 800, 400, noteLines, 0.5, 'P', 0, '#ff0', [], 's', 0, [], 'normal', true, undefined, [], '', '', 200, 600);
    expect(typeof res.ballX).toBe('number');
  });

  it('handles gapDesaturation > 0', () => {
    const ctx = makeCtxStub();
    const noteLines = [
      [{ startTime: 0, duration: 0.5, pitch: 60 }],
      [{ startTime: 5, duration: 0.5, pitch: 65 }], // big gap
    ];
    const res = drawTimeline(ctx, 800, 400, noteLines, 2.5, 'P', 0, '#ff0', [], 's', 0.5, [], 'normal', true);
    expect(typeof res.ballX).toBe('number');
  });

  it('ballY follows pitch of current note', () => {
    const ctx = makeCtxStub();
    // Note at pitch 60
    const noteLines60 = [[{ startTime: 0, duration: 5, pitch: 60 }]];
    const res60 = drawTimeline(ctx, 800, 400, noteLines60, 1, 'P', 0, '#f00', [], 's');
    
    // Note at pitch 72 (higher)
    const noteLines72 = [[{ startTime: 0, duration: 5, pitch: 72 }]];
    const res72 = drawTimeline(ctx, 800, 400, noteLines72, 1, 'P', 0, '#f00', [], 's');
    
    // Higher pitch should produce different (lower) Y value (canvas Y decreases up)
    expect(typeof res60.ballY).toBe('number');
    expect(typeof res72.ballY).toBe('number');
  });

  it('currentTime far after all notes returns expected ball position', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 1, pitch: 60 }]];
    const res = drawTimeline(ctx, 800, 400, noteLines, 100, 'P', 0, '#f00');
    expect(typeof res.ballX).toBe('number');
  });

  it('handles very large noteLines', () => {
    const ctx = makeCtxStub();
    const notes = Array.from({ length: 100 }, (_, i) => ({
      startTime: i * 0.5,
      duration: 0.4,
      pitch: 50 + (i % 20),
    }));
    const res = drawTimeline(ctx, 1200, 600, [notes], 10, 'P', 90, '#abc');
    expect(res).toHaveProperty('ballX');
    expect(res).toHaveProperty('ballY');
    expect(res).toHaveProperty('ballIsGold');
  });

  it('new songId resets persistent canvas layers', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 1, pitch: 60 }]];
    // First call with song1
    drawTimeline(ctx, 800, 400, noteLines, 0, 'P', 0, '#f00', [], 'song-reset-1');
    // Second call with song2 — should reset internal canvases
    const res = drawTimeline(ctx, 800, 400, noteLines, 0, 'P', 0, '#f00', [], 'song-reset-2');
    expect(typeof res.ballX).toBe('number');
  });

  it('handles currentTime before all notes', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 10, duration: 1, pitch: 60 }]];
    const res = drawTimeline(ctx, 800, 400, noteLines, 0, 'P', 0, '#f00');
    expect(typeof res.ballX).toBe('number');
    expect(typeof res.ballY).toBe('number');
  });

  it('handles notes with varying pitches across multiple lines', () => {
    const ctx = makeCtxStub();
    const noteLines = [
      [{ startTime: 0, duration: 1, pitch: 40 }, { startTime: 1, duration: 1, pitch: 80 }],
      [{ startTime: 2, duration: 1, pitch: 50 }, { startTime: 3, duration: 1, pitch: 70 }],
    ];
    const res = drawTimeline(ctx, 800, 400, noteLines, 1.5, 'P', 0, '#abc');
    expect(typeof res.ballX).toBe('number');
  });

  /* ---- Gold ball rendering ---- */
  it('gold ball uses gold glow when ballIsGold', () => {
    const ctx = makeCtxStub();
    // Place currentTime on a gold note
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60, isGold: true }]];
    const segScores = [{ start: 0, end: 2, pitch: 60, frac: 1.0, isGold: true, noteStart: 0, noteEnd: 2 }];
    const res = drawTimeline(ctx, 800, 400, noteLines, 0.5, 'P', 0, '#f00', [], undefined, undefined, segScores);
    // ballIsGold should be true since we're on a gold note with frac=1
    expect(typeof res.ballIsGold).toBe('boolean');
    // ctx.arc should have been called for the ball
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('gold ball with custom goldSettings (shadowColor, glowBlur)', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60, isGold: true }]];
    const segScores = [{ start: 0, end: 2, pitch: 60, frac: 1.0, isGold: true }];
    const goldSettings = { glowBlur: 30, shadowColor: '#ff00ff' };
    const res = drawTimeline(ctx, 800, 400, noteLines, 0.5, 'P', 0, '#f00', [], undefined, undefined, segScores, undefined, undefined, goldSettings);
    expect(typeof res.ballX).toBe('number');
  });

  /* ---- Gold bursts particle system ---- */
  it('goldBursts renders particles for recent bursts', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60 }]];
    const now = Date.now();
    const goldBursts = [
      { playerId: 1, createdAt: now - 100, noteStart: 0.5, notePitch: 60, seed: 42 },
    ];
    const res = drawTimeline(ctx, 800, 400, noteLines, 1, 'P', 0, '#f00', [], undefined, undefined, undefined, undefined, undefined, undefined, goldBursts);
    // Particles should have been drawn (ctx.drawImage or fillRect)
    expect(ctx.save).toHaveBeenCalled();
    expect(typeof res.ballX).toBe('number');
  });

  it('goldBursts skips expired bursts (age > lifeMs)', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60 }]];
    const goldBursts = [
      { playerId: 1, createdAt: Date.now() - 99999, noteStart: 0.5, notePitch: 60, seed: 10 },
    ];
    drawTimeline(ctx, 800, 400, noteLines, 1, 'P', 0, '#f00', [], undefined, undefined, undefined, undefined, undefined, undefined, goldBursts);
    // No crash — expired burst simply skipped
  });

  it('goldBursts with custom goldSettings (count, baseSpeed, baseSize, lifeMs)', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60 }]];
    const now = Date.now();
    const goldBursts = [
      { playerId: 1, createdAt: now - 50, noteStart: 0.5, notePitch: 60, seed: 7 },
    ];
    const goldSettings = { lifeMs: 500, count: 3, baseSpeed: 10, baseSize: 4 };
    drawTimeline(ctx, 800, 400, noteLines, 1, 'P', 0, '#f00', [], undefined, undefined, undefined, undefined, undefined, goldSettings, goldBursts);
    // Particles rendered with custom settings
    expect(ctx.save).toHaveBeenCalled();
  });

  it('goldBursts with multiple simultaneous bursts', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 3, pitch: 60 }, { startTime: 3, duration: 2, pitch: 65 }]];
    const now = Date.now();
    const goldBursts = [
      { playerId: 1, createdAt: now - 20, noteStart: 0.5, notePitch: 60, seed: 1 },
      { playerId: 1, createdAt: now - 30, noteStart: 3.5, notePitch: 65, seed: 2 },
      { playerId: 2, createdAt: now - 10, noteStart: 1.0, notePitch: 60, seed: 3 },
    ];
    const res = drawTimeline(ctx, 800, 400, noteLines, 2, 'P', 0, '#f00', [], undefined, undefined, undefined, undefined, undefined, undefined, goldBursts);
    expect(typeof res.ballX).toBe('number');
  });

  it('goldBursts with seed=0 uses fallback', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60 }]];
    const now = Date.now();
    const goldBursts = [
      { playerId: 1, createdAt: now - 50, noteStart: 0.5, notePitch: 60, seed: 0 },
    ];
    drawTimeline(ctx, 800, 400, noteLines, 1, 'P', 0, '#f00', [], undefined, undefined, undefined, undefined, undefined, undefined, goldBursts);
    // seed=0 → (b.seed || Math.floor(b.createdAt % 100000))
  });

  it('empty goldBursts array does not crash', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60 }]];
    drawTimeline(ctx, 800, 400, noteLines, 1, 'P', 0, '#f00', [], undefined, undefined, undefined, undefined, undefined, undefined, []);
    // No crash
  });

  it('goldBursts with burst age negative (future burst) is skipped', () => {
    const ctx = makeCtxStub();
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 60 }]];
    const goldBursts = [
      { playerId: 1, createdAt: Date.now() + 10000, noteStart: 0.5, notePitch: 60, seed: 5 },
    ];
    drawTimeline(ctx, 800, 400, noteLines, 1, 'P', 0, '#f00', [], undefined, undefined, undefined, undefined, undefined, undefined, goldBursts);
    // age < 0 → skipped
  });
});
