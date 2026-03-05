import { describe, test, expect } from 'vitest';
import {
  cubicBezier,
  cubicBezier2D,
  cubicBezierDerivative,
  findTForX,
  sampleBezierCurve,
  bezierToSVGPath,
  buildBezierSegments,
  interpolateBezierCC,
} from '../utils/bezierCurve';

describe('cubicBezier', () => {
  test('returns p0 at t=0', () => {
    expect(cubicBezier(10, 20, 30, 40, 0)).toBe(10);
  });

  test('returns p3 at t=1', () => {
    expect(cubicBezier(10, 20, 30, 40, 1)).toBe(40);
  });

  test('returns midpoint for linear control points at t=0.5', () => {
    expect(cubicBezier(0, 1 / 3, 2 / 3, 1, 0.5)).toBeCloseTo(0.5, 5);
  });
});

describe('cubicBezier2D', () => {
  test('evaluates 2D point at t=0 and t=1', () => {
    const p0 = { x: 0, y: 0 };
    const cp1 = { x: 0.33, y: 0.5 };
    const cp2 = { x: 0.66, y: 0.5 };
    const p3 = { x: 1, y: 1 };

    const start = cubicBezier2D(p0, cp1, cp2, p3, 0);
    expect(start.x).toBeCloseTo(0, 5);
    expect(start.y).toBeCloseTo(0, 5);

    const end = cubicBezier2D(p0, cp1, cp2, p3, 1);
    expect(end.x).toBeCloseTo(1, 5);
    expect(end.y).toBeCloseTo(1, 5);
  });
});

describe('cubicBezierDerivative', () => {
  test('returns non-zero for non-degenerate curve', () => {
    const d = cubicBezierDerivative(0, 0.33, 0.66, 1, 0.5);
    expect(d).toBeGreaterThan(0);
  });
});

describe('findTForX', () => {
  test('finds correct t for linear interpolation', () => {
    const t = findTForX(0, 1 / 3, 2 / 3, 1, 0.5);
    expect(t).toBeCloseTo(0.5, 3);
  });

  test('returns 0 for x at start', () => {
    const t = findTForX(0, 0.33, 0.66, 1, 0);
    expect(t).toBeCloseTo(0, 3);
  });

  test('returns 1 for x at end', () => {
    const t = findTForX(0, 0.33, 0.66, 1, 1);
    expect(t).toBeCloseTo(1, 3);
  });
});

describe('sampleBezierCurve', () => {
  test('returns correct number of samples', () => {
    const p0 = { x: 0, y: 0 };
    const cp1 = { x: 0.33, y: 0 };
    const cp2 = { x: 0.66, y: 1 };
    const p3 = { x: 1, y: 1 };
    const samples = sampleBezierCurve(p0, cp1, cp2, p3, 10);
    expect(samples).toHaveLength(11); // 0..10 inclusive
  });

  test('first and last sample match endpoints', () => {
    const samples = sampleBezierCurve(
      { x: 0, y: 0 }, { x: 0.33, y: 0 }, { x: 0.66, y: 1 }, { x: 1, y: 1 }, 20
    );
    expect(samples[0].x).toBeCloseTo(0, 3);
    expect(samples[samples.length - 1].x).toBeCloseTo(1, 3);
  });
});

describe('bezierToSVGPath', () => {
  test('generates valid SVG path string', () => {
    const path = bezierToSVGPath(
      { x: 0, y: 0 }, { x: 10, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 50 }
    );
    expect(path).toContain('M 0,0');
    expect(path).toContain('C 10,20');
  });
});

describe('buildBezierSegments', () => {
  test('returns empty for 0 or 1 events', () => {
    expect(buildBezierSegments([], 10)).toHaveLength(0);
    expect(buildBezierSegments([{ time: 0, value: 64 }], 10)).toHaveLength(0);
  });

  test('returns N-1 segments for N events', () => {
    const events = [
      { time: 0, value: 0 },
      { time: 5, value: 127 },
      { time: 10, value: 64 },
    ];
    expect(buildBezierSegments(events, 10)).toHaveLength(2);
  });
});

describe('interpolateBezierCC', () => {
  test('returns first value before first event', () => {
    const events = [
      { time: 2, value: 80 },
      { time: 8, value: 40 },
    ];
    expect(interpolateBezierCC(events, 10, 0)).toBe(80);
  });

  test('returns last value after last event', () => {
    const events = [
      { time: 2, value: 80 },
      { time: 8, value: 40 },
    ];
    expect(interpolateBezierCC(events, 10, 10)).toBe(40);
  });

  test('interpolates between events', () => {
    const events = [
      { time: 0, value: 0 },
      { time: 10, value: 127 },
    ];
    const mid = interpolateBezierCC(events, 10, 5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(127);
  });

  test('returns 0 for empty events', () => {
    expect(interpolateBezierCC([], 10, 5)).toBe(0);
  });
});
