/**
 * pixelEditorUtils.ts — Drawing algorithms for the pixel editor.
 * Bresenham line, midpoint ellipse, flood fill, selection, brush shapes,
 * pressure-aware blending, dithering, gradient, symmetry etc.
 */

export type RGBA = [number, number, number, number];

export type BrushShape = 'square' | 'circle' | 'diamond' | 'spray';
export type SymmetryMode = 'none' | 'h' | 'v' | 'both' | 'radial4';

export interface BrushConfig {
  size: number;
  shape: BrushShape;
  opacity: number;      // 0-100
  flow: number;          // 0-100, per-stamp opacity
  spacing: number;       // 1-100, % of brush size
  pressureSize: boolean; // pressure affects size
  pressureOpacity: boolean; // pressure affects opacity
  hardness: number;      // 0-100, edge falloff for circle brush
}

export const DEFAULT_BRUSH: BrushConfig = {
  size: 1,
  shape: 'square',
  opacity: 100,
  flow: 100,
  spacing: 25,
  pressureSize: true,
  pressureOpacity: false,
  hardness: 100,
};

/** Read a pixel from ImageData at (x,y). Returns [r,g,b,a]. */
export function getPixel(data: ImageData, x: number, y: number): RGBA {
  if (x < 0 || y < 0 || x >= data.width || y >= data.height) return [0, 0, 0, 0];
  const i = (y * data.width + x) * 4;
  return [data.data[i], data.data[i + 1], data.data[i + 2], data.data[i + 3]];
}

/** Set a pixel in ImageData at (x,y). */
export function setPixel(data: ImageData, x: number, y: number, color: RGBA) {
  if (x < 0 || y < 0 || x >= data.width || y >= data.height) return;
  const i = (y * data.width + x) * 4;
  data.data[i] = color[0];
  data.data[i + 1] = color[1];
  data.data[i + 2] = color[2];
  data.data[i + 3] = color[3];
}

/** Blend a pixel onto ImageData at (x,y) with alpha compositing. */
export function blendPixel(data: ImageData, x: number, y: number, color: RGBA, strength = 1) {
  if (x < 0 || y < 0 || x >= data.width || y >= data.height) return;
  const i = (y * data.width + x) * 4;
  const sa = (color[3] / 255) * strength;
  if (sa <= 0) return;
  const da = data.data[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  data.data[i] = Math.round((color[0] * sa + data.data[i] * da * (1 - sa)) / oa);
  data.data[i + 1] = Math.round((color[1] * sa + data.data[i + 1] * da * (1 - sa)) / oa);
  data.data[i + 2] = Math.round((color[2] * sa + data.data[i + 2] * da * (1 - sa)) / oa);
  data.data[i + 3] = Math.round(oa * 255);
}

/** Generate brush mask: returns array of {dx, dy, strength} offsets. */
export function getBrushMask(cfg: BrushConfig, pressure = 0.5): { dx: number; dy: number; strength: number }[] {
  const sz = cfg.pressureSize ? Math.max(1, Math.round(cfg.size * pressure)) : cfg.size;
  const half = Math.floor(sz / 2);
  const flowMul = cfg.flow / 100;
  const opaMul = (cfg.opacity / 100) * (cfg.pressureOpacity ? pressure : 1);
  const mask: { dx: number; dy: number; strength: number }[] = [];

  for (let dy = -half; dy < sz - half; dy++) {
    for (let dx = -half; dx < sz - half; dx++) {
      let inBrush = false;
      let dist = 0;
      switch (cfg.shape) {
        case 'square':
          inBrush = true;
          dist = Math.max(Math.abs(dx), Math.abs(dy)) / Math.max(half, 0.5);
          break;
        case 'circle': {
          const r = Math.sqrt(dx * dx + dy * dy);
          inBrush = r <= half + 0.5;
          dist = half > 0 ? r / half : 0;
          break;
        }
        case 'diamond':
          inBrush = Math.abs(dx) + Math.abs(dy) <= half;
          dist = half > 0 ? (Math.abs(dx) + Math.abs(dy)) / half : 0;
          break;
        case 'spray':
          inBrush = Math.random() < 0.3 && Math.sqrt(dx * dx + dy * dy) <= half + 0.5;
          dist = 0;
          break;
      }
      if (!inBrush) continue;
      // hardness: 100 = hard edge, 0 = soft falloff
      const hardFactor = cfg.hardness / 100;
      const edge = dist > hardFactor ? Math.max(0, 1 - (dist - hardFactor) / (1 - hardFactor + 0.001)) : 1;
      mask.push({ dx, dy, strength: edge * flowMul * opaMul });
    }
  }
  return mask;
}

/** Apply brush stamp at (x,y) with all brush settings. */
export function applyBrushStamp(
  data: ImageData, x: number, y: number,
  color: RGBA, cfg: BrushConfig, pressure = 0.5,
  erase = false,
) {
  const mask = getBrushMask(cfg, pressure);
  for (const { dx, dy, strength } of mask) {
    const gx = x + dx, gy = y + dy;
    if (gx < 0 || gy < 0 || gx >= data.width || gy >= data.height) continue;
    if (erase) {
      const cur = getPixel(data, gx, gy);
      const newA = Math.max(0, cur[3] - Math.round(255 * strength));
      setPixel(data, gx, gy, [cur[0], cur[1], cur[2], newA]);
    } else {
      blendPixel(data, gx, gy, color, strength);
    }
  }
}

/** Get symmetry points for a coordinate. */
export function getSymmetryPoints(
  x: number, y: number, w: number, h: number, mode: SymmetryMode
): { x: number; y: number }[] {
  const pts = [{ x, y }];
  switch (mode) {
    case 'h':
      pts.push({ x: w - 1 - x, y });
      break;
    case 'v':
      pts.push({ x, y: h - 1 - y });
      break;
    case 'both':
      pts.push({ x: w - 1 - x, y }, { x, y: h - 1 - y }, { x: w - 1 - x, y: h - 1 - y });
      break;
    case 'radial4': {
      const cx = w / 2, cy = h / 2;
      const dx = x - cx, dy = y - cy;
      pts.push(
        { x: Math.round(cx - dy), y: Math.round(cy + dx) },
        { x: Math.round(cx - dx), y: Math.round(cy - dy) },
        { x: Math.round(cx + dy), y: Math.round(cy - dx) },
      );
      break;
    }
  }
  return pts;
}

/** Draw a linear gradient between two points on ImageData. */
export function drawGradient(
  data: ImageData,
  x0: number, y0: number, x1: number, y1: number,
  color1: RGBA, color2: RGBA,
  sel?: { x: number; y: number; w: number; h: number } | null,
) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const sx = sel?.x ?? 0, sy = sel?.y ?? 0;
  const sw = sel?.w ?? data.width, sh = sel?.h ?? data.height;
  for (let py = sy; py < sy + sh; py++) {
    for (let px = sx; px < sx + sw; px++) {
      const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / (len * len)));
      const c: RGBA = [
        Math.round(color1[0] + (color2[0] - color1[0]) * t),
        Math.round(color1[1] + (color2[1] - color1[1]) * t),
        Math.round(color1[2] + (color2[2] - color1[2]) * t),
        Math.round(color1[3] + (color2[3] - color1[3]) * t),
      ];
      setPixel(data, px, py, c);
    }
  }
}

/** Ordered dithering 4x4 Bayer matrix. */
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Apply dithered brush stamp. */
export function applyDitherStamp(
  data: ImageData, x: number, y: number,
  color: RGBA, size: number, pressure = 0.5,
) {
  const half = Math.floor(size / 2);
  const threshold = pressure * 16;
  for (let dy = -half; dy < size - half; dy++) {
    for (let dx = -half; dx < size - half; dx++) {
      const gx = x + dx, gy = y + dy;
      if (gx < 0 || gy < 0 || gx >= data.width || gy >= data.height) continue;
      const bayer = BAYER4[((gy % 4) + 4) % 4][((gx % 4) + 4) % 4];
      if (bayer < threshold) {
        setPixel(data, gx, gy, color);
      }
    }
  }
}

/** Copy pixels from a selection region. */
export function copySelection(
  data: ImageData, sel: { x: number; y: number; w: number; h: number }
): ImageData {
  const out = new ImageData(sel.w, sel.h);
  for (let y = 0; y < sel.h; y++) {
    for (let x = 0; x < sel.w; x++) {
      const px = getPixel(data, sel.x + x, sel.y + y);
      setPixel(out, x, y, px);
    }
  }
  return out;
}

/** Paste ImageData at position. */
export function pasteAt(
  dst: ImageData, src: ImageData, ox: number, oy: number,
) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const px = getPixel(src, x, y);
      if (px[3] > 0) blendPixel(dst, ox + x, oy + y, px, 1);
    }
  }
}

/** Clear pixels in selection region. */
export function clearSelection(
  data: ImageData, sel: { x: number; y: number; w: number; h: number }
) {
  for (let y = sel.y; y < sel.y + sel.h; y++) {
    for (let x = sel.x; x < sel.x + sel.w; x++) {
      setPixel(data, x, y, [0, 0, 0, 0]);
    }
  }
}

/** HSV to RGB conversion. h: 0-360, s: 0-1, v: 0-1. Returns [r,g,b] 0-255. */
export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60) { r1 = c; g1 = x; }
  else if (h < 120) { r1 = x; g1 = c; }
  else if (h < 180) { g1 = c; b1 = x; }
  else if (h < 240) { g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

/** RGB to HSV conversion. r,g,b: 0-255. Returns [h: 0-360, s: 0-1, v: 0-1]. */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d > 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }
  return [h, s, v];
}

/** Bresenham line — calls callback for each pixel along the line. */
export function bresenhamLine(
  x0: number, y0: number, x1: number, y1: number,
  cb: (x: number, y: number) => void
) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    cb(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/** Draw a filled rectangle. */
export function fillRect(
  data: ImageData,
  x0: number, y0: number, x1: number, y1: number,
  color: RGBA
) {
  const minX = Math.max(0, Math.min(x0, x1));
  const maxX = Math.min(data.width - 1, Math.max(x0, x1));
  const minY = Math.max(0, Math.min(y0, y1));
  const maxY = Math.min(data.height - 1, Math.max(y0, y1));
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++)
      setPixel(data, x, y, color);
}

/** Draw rectangle outline. */
export function strokeRect(
  data: ImageData,
  x0: number, y0: number, x1: number, y1: number,
  color: RGBA
) {
  bresenhamLine(x0, y0, x1, y0, (x, y) => setPixel(data, x, y, color));
  bresenhamLine(x1, y0, x1, y1, (x, y) => setPixel(data, x, y, color));
  bresenhamLine(x1, y1, x0, y1, (x, y) => setPixel(data, x, y, color));
  bresenhamLine(x0, y1, x0, y0, (x, y) => setPixel(data, x, y, color));
}

/** Midpoint ellipse algorithm — filled. */
export function fillEllipse(
  data: ImageData,
  cx: number, cy: number, rx: number, ry: number,
  color: RGBA
) {
  if (rx <= 0 || ry <= 0) { setPixel(data, cx, cy, color); return; }
  let x = 0, y = ry;
  let d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
  let dx = 2 * ry * ry * x, dy = 2 * rx * rx * y;

  while (dx < dy) {
    for (let xi = cx - x; xi <= cx + x; xi++) {
      setPixel(data, xi, cy + y, color);
      setPixel(data, xi, cy - y, color);
    }
    if (d1 < 0) { x++; dx += 2 * ry * ry; d1 += dx + ry * ry; }
    else { x++; y--; dx += 2 * ry * ry; dy -= 2 * rx * rx; d1 += dx - dy + ry * ry; }
  }

  let d2 = ry * ry * (x + 0.5) * (x + 0.5) + rx * rx * (y - 1) * (y - 1) - rx * rx * ry * ry;
  while (y >= 0) {
    for (let xi = cx - x; xi <= cx + x; xi++) {
      setPixel(data, xi, cy + y, color);
      setPixel(data, xi, cy - y, color);
    }
    if (d2 > 0) { y--; dy -= 2 * rx * rx; d2 += rx * rx - dy; }
    else { y--; x++; dx += 2 * ry * ry; dy -= 2 * rx * rx; d2 += dx - dy + rx * rx; }
  }
}

/** Midpoint ellipse — outline only. */
export function strokeEllipse(
  data: ImageData,
  cx: number, cy: number, rx: number, ry: number,
  color: RGBA
) {
  if (rx <= 0 || ry <= 0) { setPixel(data, cx, cy, color); return; }
  let x = 0, y = ry;
  let d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
  let dx = 2 * ry * ry * x, dy = 2 * rx * rx * y;

  const plot4 = (px: number, py: number) => {
    setPixel(data, cx + px, cy + py, color);
    setPixel(data, cx - px, cy + py, color);
    setPixel(data, cx + px, cy - py, color);
    setPixel(data, cx - px, cy - py, color);
  };

  while (dx < dy) {
    plot4(x, y);
    if (d1 < 0) { x++; dx += 2 * ry * ry; d1 += dx + ry * ry; }
    else { x++; y--; dx += 2 * ry * ry; dy -= 2 * rx * rx; d1 += dx - dy + ry * ry; }
  }

  let d2 = ry * ry * (x + 0.5) * (x + 0.5) + rx * rx * (y - 1) * (y - 1) - rx * rx * ry * ry;
  while (y >= 0) {
    plot4(x, y);
    if (d2 > 0) { y--; dy -= 2 * rx * rx; d2 += rx * rx - dy; }
    else { y--; x++; dx += 2 * ry * ry; dy -= 2 * rx * rx; d2 += dx - dy + rx * rx; }
  }
}

/** Flood fill — fills connected region of same color with new color. */
export function floodFill(data: ImageData, startX: number, startY: number, fillColor: RGBA) {
  const w = data.width, h = data.height;
  if (startX < 0 || startY < 0 || startX >= w || startY >= h) return;

  const target = getPixel(data, startX, startY);
  if (colorsEqual(target, fillColor)) return;

  const stack = [startX, startY];
  const visited = new Uint8Array(w * h);

  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    const key = y * w + x;

    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    if (visited[key]) continue;
    visited[key] = 1;

    const current = getPixel(data, x, y);
    if (!colorsEqual(current, target)) continue;

    setPixel(data, x, y, fillColor);
    stack.push(x - 1, y, x + 1, y, x, y - 1, x, y + 1);
  }
}

/** Check if two RGBA colors are equal (with small tolerance for alpha). */
export function colorsEqual(a: RGBA, b: RGBA, tolerance = 0): boolean {
  return Math.abs(a[0] - b[0]) <= tolerance &&
    Math.abs(a[1] - b[1]) <= tolerance &&
    Math.abs(a[2] - b[2]) <= tolerance &&
    Math.abs(a[3] - b[3]) <= tolerance;
}

/** Parse hex color string to RGBA. */
export function hexToRGBA(hex: string, alpha = 255): RGBA {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
    alpha,
  ];
}

/** Convert RGBA to hex string. */
export function rgbaToHex(c: RGBA): string {
  return '#' + [c[0], c[1], c[2]].map(v => v.toString(16).padStart(2, '0')).join('');
}

/** Draw checkerboard pattern (for transparency indication). */
export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number, height: number,
  cellSize: number,
  color1 = '#ffffff',
  color2 = '#cccccc'
) {
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      ctx.fillStyle = ((x / cellSize + y / cellSize) % 2 === 0) ? color1 : color2;
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }
}

/** Generate spritesheet from frames (horizontal strip). */
export function generateSpritesheet(
  frames: ImageData[],
  cols?: number
): { canvas: HTMLCanvasElement; frameWidth: number; frameHeight: number; cols: number; rows: number } | null {
  if (frames.length === 0) return null;
  const fw = frames[0].width, fh = frames[0].height;
  const c = cols ?? frames.length;
  const r = Math.ceil(frames.length / c);
  const canvas = document.createElement('canvas');
  canvas.width = fw * c;
  canvas.height = fh * r;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  frames.forEach((frame, i) => {
    const x = (i % c) * fw;
    const y = Math.floor(i / c) * fh;
    ctx.putImageData(frame, x, y);
  });
  return { canvas, frameWidth: fw, frameHeight: fh, cols: c, rows: r };
}

/** Create blank ImageData. */
export function createBlankImageData(width: number, height: number): ImageData {
  return new ImageData(width, height);
}

/** Clone ImageData. */
export function cloneImageData(src: ImageData): ImageData {
  const dst = new ImageData(src.width, src.height);
  dst.data.set(src.data);
  return dst;
}

/** Composite two ImageData layers (src over dst), respecting opacity. */
export function compositeOver(dst: ImageData, src: ImageData, srcOpacity = 255, offsetX = 0, offsetY = 0) {
  for (let sy = 0; sy < src.height; sy++) {
    const dy = sy + offsetY;
    if (dy < 0 || dy >= dst.height) continue;
    for (let sx = 0; sx < src.width; sx++) {
      const dx = sx + offsetX;
      if (dx < 0 || dx >= dst.width) continue;
      const si = (sy * src.width + sx) * 4;
      const di = (dy * dst.width + dx) * 4;
      const sa = (src.data[si + 3] * srcOpacity) / 255 / 255;
      if (sa <= 0) continue;
      const da = dst.data[di + 3] / 255;
      const oa = sa + da * (1 - sa);
      if (oa <= 0) continue;
      dst.data[di] = (src.data[si] * sa + dst.data[di] * da * (1 - sa)) / oa;
      dst.data[di + 1] = (src.data[si + 1] * sa + dst.data[di + 1] * da * (1 - sa)) / oa;
      dst.data[di + 2] = (src.data[si + 2] * sa + dst.data[di + 2] * da * (1 - sa)) / oa;
      dst.data[di + 3] = oa * 255;
    }
  }
}

/** Flip ImageData horizontally. */
export function flipH(src: ImageData): ImageData {
  const dst = new ImageData(src.width, src.height);
  for (let y = 0; y < src.height; y++)
    for (let x = 0; x < src.width; x++) {
      const si = (y * src.width + x) * 4;
      const di = (y * src.width + (src.width - 1 - x)) * 4;
      dst.data[di] = src.data[si]; dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2]; dst.data[di + 3] = src.data[si + 3];
    }
  return dst;
}

/** Flip ImageData vertically. */
export function flipV(src: ImageData): ImageData {
  const dst = new ImageData(src.width, src.height);
  for (let y = 0; y < src.height; y++)
    for (let x = 0; x < src.width; x++) {
      const si = (y * src.width + x) * 4;
      const di = ((src.height - 1 - y) * src.width + x) * 4;
      dst.data[di] = src.data[si]; dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2]; dst.data[di + 3] = src.data[si + 3];
    }
  return dst;
}

/** Rotate ImageData 90° clockwise. Returns new ImageData with swapped dimensions. */
export function rotateCW(src: ImageData): ImageData {
  const dst = new ImageData(src.height, src.width);
  for (let y = 0; y < src.height; y++)
    for (let x = 0; x < src.width; x++) {
      const si = (y * src.width + x) * 4;
      const di = (x * dst.width + (dst.width - 1 - y)) * 4;
      dst.data[di] = src.data[si]; dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2]; dst.data[di + 3] = src.data[si + 3];
    }
  return dst;
}
