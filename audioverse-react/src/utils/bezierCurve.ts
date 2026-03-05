// ─── Bezier Curve Utilities ────────────────────────────────────────────────────
// Cubic Bezier interpolation engine for CC automation lanes.

export interface BezierControlPoint {
  /** Main point position (0-1 range for both axes) */
  x: number;
  y: number;
  /** Outgoing tangent handle (relative offset from point) */
  handleOutX: number;
  handleOutY: number;
  /** Incoming tangent handle (relative offset from point) */
  handleInX: number;
  handleInY: number;
}

/**
 * Evaluate a cubic Bezier at parameter t ∈ [0,1].
 * P(t) = (1-t)³·P0 + 3·(1-t)²·t·P1 + 3·(1-t)·t²·P2 + t³·P3
 */
export function cubicBezier(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/**
 * Evaluate a 2D cubic Bezier segment at parameter t.
 */
export function cubicBezier2D(
  p0: { x: number; y: number },
  cp1: { x: number; y: number },
  cp2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  return {
    x: cubicBezier(p0.x, cp1.x, cp2.x, p3.x, t),
    y: cubicBezier(p0.y, cp1.y, cp2.y, p3.y, t),
  };
}

/**
 * Compute the derivative of a cubic Bezier at t.
 */
export function cubicBezierDerivative(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
): number {
  const u = 1 - t;
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
}

/**
 * Find t for a given x using Newton-Raphson (monotonic cubic Bezier).
 * Used to convert timeline position to Bezier parameter.
 */
export function findTForX(
  p0x: number,
  cp1x: number,
  cp2x: number,
  p3x: number,
  targetX: number,
  tolerance: number = 1e-6,
  maxIter: number = 20,
): number {
  let t = (targetX - p0x) / (p3x - p0x || 1); // Reasonable initial guess
  t = Math.max(0, Math.min(1, t));

  for (let i = 0; i < maxIter; i++) {
    const x = cubicBezier(p0x, cp1x, cp2x, p3x, t);
    const err = x - targetX;
    if (Math.abs(err) < tolerance) return t;
    const dx = cubicBezierDerivative(p0x, cp1x, cp2x, p3x, t);
    if (Math.abs(dx) < 1e-10) break;
    t -= err / dx;
    t = Math.max(0, Math.min(1, t));
  }
  return t;
}

/**
 * Sample a cubic Bezier curve at N evenly spaced x positions.
 * Returns array of {x, y} values.
 */
export function sampleBezierCurve(
  p0: { x: number; y: number },
  cp1: { x: number; y: number },
  cp2: { x: number; y: number },
  p3: { x: number; y: number },
  samples: number = 64,
): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const xTarget = p0.x + (p3.x - p0.x) * (i / samples);
    const t = findTForX(p0.x, cp1.x, cp2.x, p3.x, xTarget);
    result.push({
      x: xTarget,
      y: cubicBezier(p0.y, cp1.y, cp2.y, p3.y, t),
    });
  }
  return result;
}

/**
 * Generate a cubic Bezier SVG path segment.
 */
export function bezierToSVGPath(
  p0: { x: number; y: number },
  cp1: { x: number; y: number },
  cp2: { x: number; y: number },
  p3: { x: number; y: number },
): string {
  return `M ${p0.x},${p0.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${p3.x},${p3.y}`;
}

/**
 * Build default Bezier control points from CC events for smooth interpolation.
 * Each pair of adjacent events gets a smooth cubic Bezier segment.
 */
export function buildBezierSegments(
  events: { time: number; value: number }[],
  duration: number,
): { p0: { x: number; y: number }; cp1: { x: number; y: number }; cp2: { x: number; y: number }; p3: { x: number; y: number } }[] {
  if (events.length < 2) return [];

  const sorted = [...events].sort((a, b) => a.time - b.time);
  const segments: ReturnType<typeof buildBezierSegments> = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];

    const ax = a.time / duration;
    const ay = a.value / 127;
    const bx = b.time / duration;
    const by = b.value / 127;

    // Default smooth handles: 1/3 of the way with same y
    const handleLen = (bx - ax) / 3;

    segments.push({
      p0: { x: ax, y: ay },
      cp1: { x: ax + handleLen, y: ay },
      cp2: { x: bx - handleLen, y: by },
      p3: { x: bx, y: by },
    });
  }

  return segments;
}

/**
 * Interpolate CC value at a given time using Bezier curves.
 * Returns 0-127 clamped integer.
 */
export function interpolateBezierCC(
  events: { time: number; value: number }[],
  duration: number,
  time: number,
): number {
  if (events.length === 0) return 0;
  const sorted = [...events].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  const segments = buildBezierSegments(events, duration);
  const normT = time / duration;

  for (const seg of segments) {
    if (normT >= seg.p0.x && normT <= seg.p3.x) {
      const t = findTForX(seg.p0.x, seg.cp1.x, seg.cp2.x, seg.p3.x, normT);
      const y = cubicBezier(seg.p0.y, seg.cp1.y, seg.cp2.y, seg.p3.y, t);
      return Math.round(Math.max(0, Math.min(127, y * 127)));
    }
  }

  return sorted[sorted.length - 1].value;
}
