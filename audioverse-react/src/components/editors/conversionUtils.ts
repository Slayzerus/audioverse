/**
 * conversionUtils.ts — Convert between raster (pixel) and vector (SVG) formats.
 */

/**
 * Rasterize an SVG string to ImageData at given dimensions.
 */
export async function svgToImageData(
  svgString: string,
  width: number,
  height: number
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(ctx.getImageData(0, 0, width, height));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize SVG'));
    };
    img.src = url;
  });
}

/**
 * Auto-trace raster ImageData to SVG paths.
 * Simple contour-based approach: finds outlines of non-transparent regions.
 * Returns an SVG string.
 */
export function imageDataToSVG(data: ImageData, scale = 1): string {
  const w = data.width, h = data.height;
  const paths: string[] = [];

  // Group pixels by color, then trace each color group
  const colorGroups = new Map<string, Array<[number, number]>>();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data.data[i + 3];
      if (a < 128) continue; // skip transparent
      const key = `${data.data[i]},${data.data[i + 1]},${data.data[i + 2]}`;
      if (!colorGroups.has(key)) colorGroups.set(key, []);
      colorGroups.get(key)!.push([x, y]);
    }
  }

  for (const [colorKey, pixels] of colorGroups) {
    const [r, g, b] = colorKey.split(',').map(Number);
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

    // Create a bitmap for this color
    const bitmap = new Uint8Array(w * h);
    for (const [x, y] of pixels) bitmap[y * w + x] = 1;

    // Simple RLE-based rect merging for pixel art (more efficient than individual rects)
    const rects = mergePixelsToRects(bitmap, w, h);

    for (const rect of rects) {
      const [rx, ry, rw, rh] = rect;
      paths.push(`<rect x="${rx * scale}" y="${ry * scale}" width="${rw * scale}" height="${rh * scale}" fill="${hex}" />`);
    }
  }

  const svgW = w * scale, svgH = h * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" shape-rendering="crispEdges">\n${paths.join('\n')}\n</svg>`;
}

/**
 * Merge adjacent pixels into larger rectangles for cleaner SVG output.
 * Greedy row-based merging algorithm.
 */
function mergePixelsToRects(bitmap: Uint8Array, w: number, h: number): Array<[number, number, number, number]> {
  const used = new Uint8Array(w * h);
  const rects: Array<[number, number, number, number]> = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!bitmap[y * w + x] || used[y * w + x]) continue;

      // Find max width of run starting at (x, y)
      let rw = 0;
      while (x + rw < w && bitmap[y * w + x + rw] && !used[y * w + x + rw]) rw++;

      // Extend height
      let rh = 1;
      outer: while (y + rh < h) {
        for (let dx = 0; dx < rw; dx++) {
          if (!bitmap[(y + rh) * w + x + dx] || used[(y + rh) * w + x + dx]) break outer;
        }
        rh++;
      }

      // Mark used
      for (let dy = 0; dy < rh; dy++)
        for (let dx = 0; dx < rw; dx++)
          used[(y + dy) * w + x + dx] = 1;

      rects.push([x, y, rw, rh]);
    }
  }

  return rects;
}

/**
 * Parse an SVG string and extract basic shapes into a structured format.
 */
export interface VectorShape {
  type: 'rect' | 'ellipse' | 'line' | 'path' | 'polygon';
  fill: string;
  stroke: string;
  strokeWidth: number;
  d?: string; // for path
  x?: number; y?: number;
  width?: number; height?: number;
  rx?: number; ry?: number; // for ellipse
  cx?: number; cy?: number;
  x1?: number; y1?: number; x2?: number; y2?: number; // for line
  points?: Array<[number, number]>; // for polygon
}

export function parseSVGShapes(svgString: string): { width: number; height: number; shapes: VectorShape[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return { width: 64, height: 64, shapes: [] };

  const width = parseFloat(svg.getAttribute('width') || '64');
  const height = parseFloat(svg.getAttribute('height') || '64');
  const shapes: VectorShape[] = [];

  function processElement(el: Element) {
    const fill = el.getAttribute('fill') || 'none';
    const stroke = el.getAttribute('stroke') || 'none';
    const strokeWidth = parseFloat(el.getAttribute('stroke-width') || '1');

    switch (el.tagName.toLowerCase()) {
      case 'rect':
        shapes.push({
          type: 'rect', fill, stroke, strokeWidth,
          x: parseFloat(el.getAttribute('x') || '0'),
          y: parseFloat(el.getAttribute('y') || '0'),
          width: parseFloat(el.getAttribute('width') || '0'),
          height: parseFloat(el.getAttribute('height') || '0'),
        });
        break;
      case 'ellipse':
        shapes.push({
          type: 'ellipse', fill, stroke, strokeWidth,
          cx: parseFloat(el.getAttribute('cx') || '0'),
          cy: parseFloat(el.getAttribute('cy') || '0'),
          rx: parseFloat(el.getAttribute('rx') || '0'),
          ry: parseFloat(el.getAttribute('ry') || '0'),
        });
        break;
      case 'circle': {
        const r = parseFloat(el.getAttribute('r') || '0');
        shapes.push({
          type: 'ellipse', fill, stroke, strokeWidth,
          cx: parseFloat(el.getAttribute('cx') || '0'),
          cy: parseFloat(el.getAttribute('cy') || '0'),
          rx: r, ry: r,
        });
        break;
      }
      case 'line':
        shapes.push({
          type: 'line', fill, stroke, strokeWidth,
          x1: parseFloat(el.getAttribute('x1') || '0'),
          y1: parseFloat(el.getAttribute('y1') || '0'),
          x2: parseFloat(el.getAttribute('x2') || '0'),
          y2: parseFloat(el.getAttribute('y2') || '0'),
        });
        break;
      case 'path':
        shapes.push({
          type: 'path', fill, stroke, strokeWidth,
          d: el.getAttribute('d') || '',
        });
        break;
      case 'polygon': {
        const pts = (el.getAttribute('points') || '').trim().split(/\s+/).map(p => {
          const [x, y] = p.split(',').map(Number);
          return [x || 0, y || 0] as [number, number];
        });
        shapes.push({ type: 'polygon', fill, stroke, strokeWidth, points: pts });
        break;
      }
      case 'g':
        for (const child of Array.from(el.children)) processElement(child);
        break;
    }
  }

  for (const child of Array.from(svg.children)) processElement(child);
  return { width, height, shapes };
}

/**
 * Build SVG string from VectorShape array.
 */
export function shapesToSVG(shapes: VectorShape[], width: number, height: number): string {
  const elements = shapes.map(s => {
    const base = `fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"`;
    switch (s.type) {
      case 'rect':
        return `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" ${base} />`;
      case 'ellipse':
        return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" ${base} />`;
      case 'line':
        return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" ${base} />`;
      case 'path':
        return `<path d="${s.d}" ${base} />`;
      case 'polygon':
        return `<polygon points="${(s.points || []).map(p => p.join(',')).join(' ')}" ${base} />`;
      default:
        return '';
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${elements.join('\n')}\n</svg>`;
}
