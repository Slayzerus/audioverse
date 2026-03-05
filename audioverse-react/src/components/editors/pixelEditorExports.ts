/**
 * pixelEditorExports — pixel editor file export utilities as pure functions.
 */

import {
  type AseDocument,
  createEmptyAseDocument,
  writeAseFile,
  hexToAseColor,
} from "./asepriteFormat";
import type { Layer } from "./pixelEditorTypes";
import { celKey, downloadBlob } from "./pixelEditorTypes";
import { logger } from "../../utils/logger";

const log = logger.scoped("PixelEditorExports");

export interface ExportContext {
  dw: number;
  dh: number;
  layers: Layer[];
  fc: number;
  fDur: number[];
  pal: string[];
  cels: Map<string, ImageData>;
}

export async function exportAse(ctx: ExportContext): Promise<void> {
  const { dw, dh, layers, fc, fDur, pal, cels } = ctx;
  const doc = createEmptyAseDocument(dw, dh);
  doc.layers = layers.map((l) => ({
    name: l.name,
    visible: l.visible,
    opacity: l.opacity,
    blendMode: 0,
    childLevel: 0,
    layerType: 0,
  }));
  doc.palette = pal.map(hexToAseColor);
  doc.frames = [];
  for (let fi = 0; fi < fc; fi++) {
    const frameCels: AseDocument["frames"][0]["cels"] = [];
    for (let li = 0; li < layers.length; li++) {
      const cel = cels.get(celKey(fi, li));
      if (!cel) continue;
      // tight bounding box
      let x1 = dw,
        y1 = dh,
        x2 = -1,
        y2 = -1;
      for (let y = 0; y < dh; y++)
        for (let x = 0; x < dw; x++) {
          if (cel.data[(y * dw + x) * 4 + 3] > 0) {
            x1 = Math.min(x1, x);
            y1 = Math.min(y1, y);
            x2 = Math.max(x2, x);
            y2 = Math.max(y2, y);
          }
        }
      if (x2 < 0) continue;
      const cw2 = x2 - x1 + 1,
        ch2 = y2 - y1 + 1;
      const px2 = new Uint8Array(cw2 * ch2 * 4);
      for (let y = 0; y < ch2; y++)
        for (let x = 0; x < cw2; x++) {
          const si = ((y1 + y) * dw + (x1 + x)) * 4;
          const di = (y * cw2 + x) * 4;
          px2[di] = cel.data[si];
          px2[di + 1] = cel.data[si + 1];
          px2[di + 2] = cel.data[si + 2];
          px2[di + 3] = cel.data[si + 3];
        }
      frameCels.push({
        layerIndex: li,
        x: x1,
        y: y1,
        opacity: 255,
        width: cw2,
        height: ch2,
        pixels: px2,
      });
    }
    doc.frames.push({ duration: fDur[fi] || 100, cels: frameCels });
  }
  try {
    const buf = await writeAseFile(doc);
    downloadBlob(new Blob([buf]), "sprite.ase");
  } catch (err) {
    log.error("Export ASE failed", err);
    alert("Export failed.");
  }
}

export function exportPNG(
  afi: number,
  dw: number,
  dh: number,
  compFrame: (fi: number) => ImageData,
): void {
  const data = compFrame(afi);
  const cv = document.createElement("canvas");
  cv.width = dw;
  cv.height = dh;
  cv.getContext("2d")!.putImageData(data, 0, 0);
  cv.toBlob((b) => b && downloadBlob(b, "sprite.png"));
}

export function exportJPG(
  afi: number,
  dw: number,
  dh: number,
  compFrame: (fi: number) => ImageData,
): void {
  const data = compFrame(afi);
  const cv = document.createElement("canvas");
  cv.width = dw;
  cv.height = dh;
  const ctx = cv.getContext("2d")!;
  // JPG doesn't support transparency — fill white background first
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dw, dh);
  // Use drawImage instead of putImageData to properly composite over white
  const tmp = document.createElement("canvas");
  tmp.width = dw;
  tmp.height = dh;
  tmp.getContext("2d")!.putImageData(data, 0, 0);
  ctx.drawImage(tmp, 0, 0);
  cv.toBlob((b) => b && downloadBlob(b, "sprite.jpg"), "image/jpeg", 0.92);
}

export function exportWebP(
  afi: number,
  dw: number,
  dh: number,
  compFrame: (fi: number) => ImageData,
): void {
  const data = compFrame(afi);
  const cv = document.createElement("canvas");
  cv.width = dw;
  cv.height = dh;
  cv.getContext("2d")!.putImageData(data, 0, 0);
  cv.toBlob((b) => b && downloadBlob(b, "sprite.webp"), "image/webp", 0.92);
}

export function exportBMP(
  afi: number,
  dw: number,
  dh: number,
  compFrame: (fi: number) => ImageData,
): void {
  const data = compFrame(afi);
  // Build BMP file manually (24-bit uncompressed)
  const w = dw, h = dh;
  const rowSize = Math.ceil((w * 3) / 4) * 4;
  const pixelDataSize = rowSize * h;
  const fileSize = 54 + pixelDataSize;
  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);
  // BMP Header
  view.setUint8(0, 0x42); view.setUint8(1, 0x4d); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true); // pixel data offset
  // DIB Header (BITMAPINFOHEADER)
  view.setUint32(14, 40, true); // header size
  view.setInt32(18, w, true);
  view.setInt32(22, h, true);
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // bpp
  view.setUint32(34, pixelDataSize, true);
  // Pixel data (bottom-up, BGR)
  const d = data.data;
  for (let y = 0; y < h; y++) {
    const srcRow = (h - 1 - y) * w * 4;
    const dstRow = 54 + y * rowSize;
    for (let x = 0; x < w; x++) {
      const si = srcRow + x * 4;
      const di = dstRow + x * 3;
      view.setUint8(di, d[si + 2]);     // B
      view.setUint8(di + 1, d[si + 1]); // G
      view.setUint8(di + 2, d[si]);     // R
    }
  }
  downloadBlob(new Blob([buf], { type: "image/bmp" }), "sprite.bmp");
}

export function exportSVG(
  afi: number,
  dw: number,
  dh: number,
  compFrame: (fi: number) => ImageData,
): void {
  // Trace pixel art to SVG by emitting 1 rect per non-transparent pixel
  const data = compFrame(afi);
  const d = data.data;
  const rects: string[] = [];
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const i = (y * dw + x) * 4;
      const a = d[i + 3];
      if (a === 0) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const hex = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
      if (a < 255) {
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${hex}" opacity="${(a / 255).toFixed(2)}"/>`);
      } else {
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${hex}"/>`);
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dw}" height="${dh}" viewBox="0 0 ${dw} ${dh}" shape-rendering="crispEdges">\n${rects.join("\n")}\n</svg>`;
  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "sprite.svg");
}

export function exportSheet(
  dw: number,
  dh: number,
  fc: number,
  compFrame: (fi: number) => ImageData,
): void {
  const cv = document.createElement("canvas");
  cv.width = dw * fc;
  cv.height = dh;
  const ctx = cv.getContext("2d")!;
  for (let fi = 0; fi < fc; fi++) {
    const fd = compFrame(fi);
    const tmp = new OffscreenCanvas(dw, dh);
    tmp.getContext("2d")!.putImageData(fd, 0, 0);
    ctx.drawImage(tmp, fi * dw, 0);
  }
  cv.toBlob((b) => b && downloadBlob(b, "spritesheet.png"));
}
