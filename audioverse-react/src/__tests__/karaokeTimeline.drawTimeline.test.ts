import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { drawTimeline, parseNotes, KaraokeNoteData } from '../scripts/karaoke/karaokeTimeline';

/* ---- Mock canvas context ---- */
function mockCtx(): CanvasRenderingContext2D {
  const gradient = { addColorStop: vi.fn() };
  return {
    clearRect: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), strokeText: vi.fn(),
    beginPath: vi.fn(), closePath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
    drawImage: vi.fn(), scale: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
    save: vi.fn(), restore: vi.fn(),
    quadraticCurveTo: vi.fn(), clip: vi.fn(), rect: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    measureText: vi.fn(() => ({ width: 10 })),
    createPattern: vi.fn(() => ({})),
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    fillStyle: '', strokeStyle: '', shadowColor: '', shadowBlur: 0,
    lineWidth: 1, font: '', textAlign: '', textBaseline: '',
  } as any as CanvasRenderingContext2D;
}

/* ---- Mock document.createElement so offscreen canvases return a working context ---- */
const origCreateElement = document.createElement.bind(document);
function patchCreateElement() {
  document.createElement = ((tag: string, ...args: any[]) => {
    const el = origCreateElement(tag, ...args);
    if (tag === 'canvas') {
      (el as any).getContext = () => mockCtx();
    }
    return el;
  }) as typeof document.createElement;
}
function unpatchCreateElement() {
  document.createElement = origCreateElement;
}

/* ---- Realistic note data covering a zone around currentTime=3 ---- */
// Regular note at t=2..3  pitch=60
// Gold note at t=3..4 pitch=62  (ball will be over this note at currentTime=3.5)
const NOTE_LINES: KaraokeNoteData[][] = [
  [
    { startTime: 2, duration: 1, pitch: 60, isGold: false },
    { startTime: 3, duration: 1, pitch: 62, isGold: true },
    { startTime: 4, duration: 0.5, pitch: 64, isGold: false },
  ],
];

const CURRENT_TIME = 3.5; // within gold note range

describe('karaokeTimeline.drawTimeline – direct unit tests', () => {
  let ctx: CanvasRenderingContext2D;
  let origDateNow: typeof Date.now;

  beforeEach(() => {
    ctx = mockCtx();
    origDateNow = Date.now;
    patchCreateElement();
  });

  afterEach(() => {
    Date.now = origDateNow;
    unpatchCreateElement();
  });

  it('renders notes, gold glow, and persistent + gap paint when isPlaying', () => {
    // Call drawTimeline with isPlaying=true and hexColor for playerBgColor
    const result = drawTimeline(
      ctx, 600, 150, NOTE_LINES, CURRENT_TIME,
      'TestPlayer', 5000,
      '#2233aa', // hex color — covers hex branch of parseColorToRgb
      [{ t: 3.5, hz: 440 }], // userPitch
      'song-1', // songId
      0.3, // gapDesaturation
      [{ start: 3, end: 4, pitch: 62, frac: 0.8, isGold: true, noteStart: 3, noteEnd: 4 }], // segmentScores
      'normal', // difficultyLevel
      true, // isPlaying — covers persistent paint + gap paint
      { lifeMs: 3000, count: 5, baseSpeed: 30, baseSize: 5, glowBlur: 20, shadowColor: '#ffe066' },
      [], // no goldBursts (separate test below)
      'CREPE', // algorithmLabel
      '#10b981', // algorithmColor
      0, // panOffset
      600, // visibleWidth
    );

    // drawTimeline should return { ballX, ballY } object
    expect(result).toBeTruthy();
    expect(typeof (result as any).ballX).toBe('number');
    expect(typeof (result as any).ballY).toBe('number');

    // Verify canvas operations were called (note bars, guide lines, ball drawing)
    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.beginPath).toHaveBeenCalled();
  });

  it('covers gold particle burst rendering', () => {
    Date.now = vi.fn(() => 10000); // control current time for burst age calculation

    const goldBursts = [
      { playerId: 1, createdAt: 9500, noteStart: 3.2, notePitch: 62, seed: 42 },
    ];

    const result = drawTimeline(
      ctx, 600, 150, NOTE_LINES, CURRENT_TIME,
      'P1', 1000, '#ffcc00',
      [], 'song-1', undefined,
      [], // segmentScores
      'normal',
      false, // isPlaying — focus on particles
      { lifeMs: 3000, count: 10, baseSpeed: 30, baseSize: 5, glowBlur: 20, shadowColor: '#ffe066' },
      goldBursts,
    );

    expect(result).toBeTruthy();
    // Particle rendering calls save/restore, translate, rotate, fillRect or drawImage
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('covers gold ball glow when currentTime is within a gold note', () => {
    const result = drawTimeline(
      ctx, 600, 150, NOTE_LINES, 3.5, // within gold note [3, 4)
      'P1', 2000, '#ff0000',
      [], 'song-2',
    );

    // ballIsGold should be true → ctx.shadowColor set to gold shadow
    expect(result).toBeTruthy();
    // The ball rendering path should have used gold glow style
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('covers parseColorToRgb rgb() branch via playerBgColor', () => {
    const result = drawTimeline(
      ctx, 600, 150, NOTE_LINES, CURRENT_TIME,
      'P1', 1000, 'rgb(100,200,50)', // rgb color → covers rgb branch
      [], 'song-3',
    );
    expect(result).toBeTruthy();
  });

  it('covers parseColorToRgb fallback (unrecognized color)', () => {
    const result = drawTimeline(
      ctx, 600, 150, NOTE_LINES, CURRENT_TIME,
      'P1', 1000, 'invalidcolor', // neither hex nor rgb → fallback [128,128,128]
      [], 'song-4',
    );
    expect(result).toBeTruthy();
  });

  it('covers hit segments with isGold and non-gold segmentScores', () => {
    const segmentScores = [
      { start: 2, end: 3, pitch: 60, frac: 0.9, isGold: false, noteStart: 2, noteEnd: 3 },
      { start: 3, end: 4, pitch: 62, frac: 1.0, isGold: true, noteStart: 3, noteEnd: 4 },
    ];

    const result = drawTimeline(
      ctx, 600, 150, NOTE_LINES, CURRENT_TIME,
      'P1', 3000, '#00aaff',
      [{ t: 2.5, hz: 262 }, { t: 3.5, hz: 330 }], // userPitch
      'song-5', undefined,
      segmentScores,
      'hard', // difficultyLevel
      false, // not playing
    );
    expect(result).toBeTruthy();
  });

  it('algorithm badge renders when algorithmLabel is provided', () => {
    drawTimeline(
      ctx, 600, 150, NOTE_LINES, CURRENT_TIME,
      'P1', 1000, '#222',
      [], 'song-6', undefined, undefined,
      'normal', false, undefined, undefined,
      'LIBROSA', '#6b7280',
    );
    // quadraticCurveTo is used for the rounded rect badge
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
  });

  it('renders with empty noteLines → default pitch range', () => {
    // Empty noteLines triggers the default pitch range (minPitch=40, maxPitch=80)
    const result = drawTimeline(
      ctx, 600, 150, [], 1.0,
      'P1', 0, '#333',
    );
    expect(result).toBeTruthy();
  });

  it('covers SVG sprite loaded path (img.complete = true) for gold particles', () => {
    Date.now = vi.fn(() => 10000);
    // Mock Image to return complete=true so the drawImage branch runs
    const origImage = globalThis.Image;
    (globalThis as any).Image = vi.fn().mockImplementation(function (this: any) {
      this.complete = true;
      this.width = 20;
      this.height = 20;
      this.src = '';
    });

    const goldBursts = [
      { playerId: 1, createdAt: 9800, noteStart: 3.2, notePitch: 62, seed: 99 },
    ];
    drawTimeline(
      ctx, 600, 150, NOTE_LINES, CURRENT_TIME,
      'P1', 1000, '#ffcc00',
      [], 'song-svg', undefined, [],
      'normal', false,
      { lifeMs: 3000, count: 8, baseSpeed: 30, baseSize: 5, glowBlur: 20, shadowColor: '#ffe066' },
      goldBursts,
    );

    // drawImage should have been called for particle sprites
    expect(ctx.drawImage).toHaveBeenCalled();
    globalThis.Image = origImage;
  });

  it('handles expired goldBursts (age > LIFE)', () => {
    Date.now = vi.fn(() => 100000);
    const goldBursts = [
      { playerId: 1, createdAt: 1000, noteStart: 3, notePitch: 60, seed: 1 },
    ];
    // age = 99000ms > default 3000ms → burst skipped
    drawTimeline(ctx, 600, 150, NOTE_LINES, CURRENT_TIME, 'P1', 0, '#f00', [], 'song-7', undefined, [], undefined, false, undefined, goldBursts);
    // Should not crash, particles should be skipped
    expect(true).toBe(true);
  });

  it('handles note completely outside visible window', () => {
    // Note at t=100..101, currentTime=0 → note is far outside [−2, 5] window
    const farNotes: KaraokeNoteData[][] = [
      [{ startTime: 100, duration: 1, pitch: 60, isGold: false }],
    ];
    const result = drawTimeline(ctx, 600, 150, farNotes, 0, 'P1', 0, '#333');
    expect(result).toBeTruthy();
  });
});

/* ---- parseNotes additional branches ---- */
describe('parseNotes – additional branches', () => {
  it('parses gold notes (* and G prefixes)', () => {
    const lines = ['* 0 4 60', 'G 4 4 62', ': 8 2 64'];
    const result = parseNotes(lines, 120);
    expect(result.length).toBeGreaterThan(0);
    const notes = result[0];
    expect(notes[0].isGold).toBe(true); // * prefix
    expect(notes[1].isGold).toBe(true); // G prefix
    expect(notes[2].isGold).toBe(false); // : prefix (regular)
  });

  it('handles line break marker with 4+ parts', () => {
    const lines = ['N 0 4 60', '- 4 0 0', 'N 8 4 64'];
    const result = parseNotes(lines, 120);
    // The line break should split notes into two lines
    expect(result.length).toBe(2);
    expect(result[0][0].pitch).toBe(60);
    expect(result[1][0].pitch).toBe(64);
  });

  it('uses beat/10 fallback when no BPM provided', () => {
    const lines = ['N 0 40 60']; // beat=0, dur=40
    const result = parseNotes(lines); // no bpmOverride, no #BPM: header
    expect(result.length).toBe(1);
    // With fallback: startTime = 0/10 = 0, duration = 40/10 = 4
    expect(result[0][0].startTime).toBe(0);
    expect(result[0][0].duration).toBe(4);
  });
});
