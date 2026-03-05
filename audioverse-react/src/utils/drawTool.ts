/**
 * Draw tool for CC automation — pencil/line/curve drawing modes
 * Generates CC events from mouse/touch gestures on a timeline.
 */

import type { MidiCCEvent } from '../models/editor/midiTypes';

export type DrawMode = 'pencil' | 'line' | 'curve' | 'step' | 'ramp';

export interface DrawPoint {
  time: number;   // seconds
  value: number;  // 0-127
}

export interface DrawToolConfig {
  mode: DrawMode;
  cc: number;
  resolution: number;  // minimum time between generated points (seconds)
  smoothing: number;   // 0-1, amount of smoothing applied
  snap: boolean;       // snap values to grid
  snapDivisions: number; // how many value divisions (e.g. 16 for coarse, 128 for fine)
}

let nextEventId = Date.now();

/** Generate a unique event ID */
function genId(): number {
  return nextEventId++;
}

/** Generate CC events from pencil-drawn points */
export function pencilDraw(points: DrawPoint[], cc: number, resolution: number = 0.01): MidiCCEvent[] {
  if (points.length === 0) return [];
  const events: MidiCCEvent[] = [];
  let lastTime = -Infinity;

  for (const p of points) {
    if (p.time - lastTime >= resolution) {
      events.push({ id: genId(), cc, value: clampValue(p.value), time: p.time });
      lastTime = p.time;
    }
  }
  return events;
}

/** Generate CC events forming a straight line between two points */
export function lineDraw(start: DrawPoint, end: DrawPoint, cc: number, steps: number = 32): MidiCCEvent[] {
  const events: MidiCCEvent[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    events.push({
      id: genId(),
      cc,
      value: clampValue(lerp(start.value, end.value, t)),
      time: lerp(start.time, end.time, t),
    });
  }
  return events;
}

/** Generate CC events along a curve (quadratic bezier) */
export function curveDraw(
  start: DrawPoint,
  control: DrawPoint,
  end: DrawPoint,
  cc: number,
  steps: number = 48
): MidiCCEvent[] {
  const events: MidiCCEvent[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const time = quadBezier(start.time, control.time, end.time, t);
    const value = quadBezier(start.value, control.value, end.value, t);
    events.push({ id: genId(), cc, value: clampValue(value), time });
  }
  return events;
}

/** Generate CC events in step pattern */
export function stepDraw(start: DrawPoint, end: DrawPoint, cc: number, stepCount: number = 8): MidiCCEvent[] {
  const events: MidiCCEvent[] = [];
  const timeStep = (end.time - start.time) / stepCount;
  const valueStep = (end.value - start.value) / stepCount;

  for (let i = 0; i < stepCount; i++) {
    const time = start.time + i * timeStep;
    const value = clampValue(start.value + i * valueStep);
    // Two points per step for flat segments
    events.push({ id: genId(), cc, value, time });
    events.push({ id: genId(), cc, value, time: time + timeStep - 0.001 });
  }
  return events;
}

/** Generate CC events along an exponential ramp */
export function rampDraw(start: DrawPoint, end: DrawPoint, cc: number, curvature: number = 2, steps: number = 32): MidiCCEvent[] {
  const events: MidiCCEvent[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const curved = Math.pow(t, curvature);
    events.push({
      id: genId(),
      cc,
      value: clampValue(lerp(start.value, end.value, curved)),
      time: lerp(start.time, end.time, t),
    });
  }
  return events;
}

/** Smooth an array of CC events using moving average */
export function smoothEvents(events: MidiCCEvent[], windowSize: number = 3): MidiCCEvent[] {
  if (events.length < windowSize) return events;
  const sorted = [...events].sort((a, b) => a.time - b.time);
  return sorted.map((ev, i) => {
    const startIdx = Math.max(0, i - Math.floor(windowSize / 2));
    const endIdx = Math.min(sorted.length, startIdx + windowSize);
    const window = sorted.slice(startIdx, endIdx);
    const avgValue = window.reduce((s, e) => s + e.value, 0) / window.length;
    return { ...ev, value: clampValue(Math.round(avgValue)) };
  });
}

/** Snap CC event values to grid divisions */
export function snapValues(events: MidiCCEvent[], divisions: number = 16): MidiCCEvent[] {
  const step = 127 / divisions;
  return events.map(ev => ({
    ...ev,
    value: clampValue(Math.round(ev.value / step) * step),
  }));
}

/** Apply draw tool with given config to generate events */
export function applyDrawTool(
  config: DrawToolConfig,
  points: DrawPoint[]
): MidiCCEvent[] {
  let events: MidiCCEvent[];

  switch (config.mode) {
    case 'pencil':
      events = pencilDraw(points, config.cc, config.resolution);
      break;
    case 'line':
      events = points.length >= 2
        ? lineDraw(points[0], points[points.length - 1], config.cc)
        : [];
      break;
    case 'curve':
      if (points.length >= 3) {
        events = curveDraw(points[0], points[Math.floor(points.length / 2)], points[points.length - 1], config.cc);
      } else if (points.length >= 2) {
        events = lineDraw(points[0], points[points.length - 1], config.cc);
      } else {
        events = [];
      }
      break;
    case 'step':
      events = points.length >= 2
        ? stepDraw(points[0], points[points.length - 1], config.cc)
        : [];
      break;
    case 'ramp':
      events = points.length >= 2
        ? rampDraw(points[0], points[points.length - 1], config.cc)
        : [];
      break;
    default:
      events = [];
  }

  if (config.smoothing > 0) {
    const windowSize = Math.max(2, Math.round(config.smoothing * 8));
    events = smoothEvents(events, windowSize);
  }

  if (config.snap) {
    events = snapValues(events, config.snapDivisions);
  }

  return events;
}

// --- Helpers ---

function clampValue(v: number): number {
  return Math.max(0, Math.min(127, Math.round(v)));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function quadBezier(p0: number, p1: number, p2: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}
