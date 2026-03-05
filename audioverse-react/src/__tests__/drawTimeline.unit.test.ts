import { drawTimeline } from '../scripts/karaoke/karaokeTimeline';

// minimal canvas 2D context stub with commonly used methods
const makeCtxStub = () => {
  return {
    clearRect: () => {},
    fillRect: () => {},
    fillText: () => {},
    beginPath: () => {},
    drawImage: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    moveTo: () => {},
    lineTo: () => {},
      closePath: () => {},
      rect: () => {},
    measureText: (_: string) => ({ width: 10 }),
    translate: () => {},
    scale: () => {},
    save: () => {},
    restore: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createPattern: () => ({}),
    clip: () => {},
    quadraticCurveTo: () => {},
    lineWidth: 1,
    strokeStyle: '',
    fillStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: '',
    shadowBlur: 0,
  } as any as CanvasRenderingContext2D;
};

describe('drawTimeline unit', () => {
  test('returns ball position and gold flag for simple song', () => {
    // localStorage shim is provided by vitest.setup.ts

    const ctx = makeCtxStub();
    const width = 700;
    const height = 200;
    // single line with one note at beat 0 length 1, pitch 60
    const noteLines = [[{ startTime: 0, duration: 1, pitch: 60 }]];

    // currentTime=0 -> timelineStart=-2, timelineEnd=5 -> ballX = ((0-(-2))/7)*width = 2/7*width
    const res = drawTimeline(ctx, width, height, noteLines, 0, 'P', 0, '#ff0000', [], 'song1', 0, [], 'normal', true, undefined, []);
    expect(typeof res.ballX).toBe('number');
    expect(typeof res.ballY).toBe('number');
    expect(typeof res.ballIsGold).toBe('boolean');
    const expectedX = (2 / 7) * width;
    expect(Math.abs(res.ballX - expectedX)).toBeLessThan(2);
  });

  test('ballIsGold true when note is gold', () => {
    // localStorage shim is provided by vitest.setup.ts
    const ctx = makeCtxStub();
    const width = 400;
    const height = 120;
    const noteLines = [[{ startTime: 0, duration: 2, pitch: 50, isGold: true }]];
    const res = drawTimeline(ctx, width, height, noteLines, 0.5, 'P', 0, '#00ff00', [], 's', 0, [], 'normal', true, undefined, []);
    expect(res.ballIsGold).toBe(true);
  });
});
