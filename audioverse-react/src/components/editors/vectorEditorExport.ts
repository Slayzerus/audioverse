import { VShape, downloadBlob, polygonPoints, starPoints } from "./vectorEditorTypes";

/** Build SVG markup string from shapes */
export function buildSVGString(shapes: VShape[], artW: number, artH: number): string {
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${artW}" height="${artH}" viewBox="0 0 ${artW} ${artH}">`,
  ];
  // Arrow marker definition
  parts.push(`  <defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="context-stroke"/></marker></defs>`);
  for (const s of shapes) {
    const opacityAttr = s.opacity < 1 ? ` opacity="${s.opacity.toFixed(2)}"` : "";
    const rotAttr = s.rotation ? ` transform="rotate(${s.rotation} ${s.x + s.w / 2} ${s.y + s.h / 2})"` : "";
    switch (s.type) {
      case "rect":
        parts.push(
          `  <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"${opacityAttr}${rotAttr} />`,
        );
        break;
      case "roundrect":
        parts.push(
          `  <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx || 12}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"${opacityAttr}${rotAttr} />`,
        );
        break;
      case "ellipse":
        parts.push(
          `  <ellipse cx="${s.x + s.w / 2}" cy="${s.y + s.h / 2}" rx="${s.w / 2}" ry="${s.h / 2}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"${opacityAttr}${rotAttr} />`,
        );
        break;
      case "line":
        parts.push(
          `  <line x1="${s.x}" y1="${s.y}" x2="${s.x2}" y2="${s.y2}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"${opacityAttr} />`,
        );
        break;
      case "arrow":
        parts.push(
          `  <line x1="${s.x}" y1="${s.y}" x2="${s.x2}" y2="${s.y2}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" marker-end="url(#arrowhead)"${opacityAttr} />`,
        );
        break;
      case "polyline":
        if (s.points) {
          const pts = s.points.map((p) => `${p.x},${p.y}`).join(" ");
          parts.push(
            `  <polyline points="${pts}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"${opacityAttr} />`,
          );
        }
        break;
      case "polygon": {
        const cx2 = s.x + s.w / 2;
        const cy2 = s.y + s.h / 2;
        const r2 = Math.min(s.w, s.h) / 2;
        const pts = polygonPoints(cx2, cy2, r2, s.sides || 6, s.rotation);
        parts.push(
          `  <polygon points="${pts}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"${opacityAttr} />`,
        );
        break;
      }
      case "star": {
        const cx2 = s.x + s.w / 2;
        const cy2 = s.y + s.h / 2;
        const r2 = Math.min(s.w, s.h) / 2;
        const ir = r2 * (s.innerRadius || 0.4);
        const pts = starPoints(cx2, cy2, r2, ir, s.sides || 5, s.rotation);
        parts.push(
          `  <polygon points="${pts}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"${opacityAttr} />`,
        );
        break;
      }
      case "text": {
        const esc = (s.text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const ff = (s.fontFamily || "sans-serif").replace(/"/g, "&quot;");
        parts.push(
          `  <text x="${s.x}" y="${s.y + (s.fontSize || 24)}" font-size="${s.fontSize || 24}" font-family="${ff}" fill="${s.fill}"${opacityAttr}>${esc}</text>`,
        );
        break;
      }
    }
  }
  parts.push("</svg>");
  return parts.join("\n");
}

/** Helper to render SVG to an Image, then invoke a callback with the loaded image */
function svgToImage(svg: string, onLoad: (img: HTMLImageElement) => void, onError?: () => void) {
  const img = new Image();
  if (onError) img.onerror = onError;
  img.onload = () => onLoad(img);
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export function exportSVGFile(shapes: VShape[], artW: number, artH: number): void {
  const svg = buildSVGString(shapes, artW, artH);
  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "drawing.svg");
}

export function exportPNGFile(shapes: VShape[], artW: number, artH: number): void {
  const svg = buildSVGString(shapes, artW, artH);
  svgToImage(svg, (img) => {
    const cv = document.createElement("canvas");
    cv.width = artW;
    cv.height = artH;
    cv.getContext("2d")!.drawImage(img, 0, 0);
    cv.toBlob((b) => b && downloadBlob(b, "drawing.png"));
  }, () => alert("Failed to export PNG."));
}

export function exportJPGFile(shapes: VShape[], artW: number, artH: number): void {
  const svg = buildSVGString(shapes, artW, artH);
  svgToImage(svg, (img) => {
    const cv = document.createElement("canvas");
    cv.width = artW;
    cv.height = artH;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, artW, artH);
    ctx.drawImage(img, 0, 0);
    cv.toBlob((b) => b && downloadBlob(b, "drawing.jpg"), "image/jpeg", 0.92);
  });
}

export function exportWebPFile(shapes: VShape[], artW: number, artH: number): void {
  const svg = buildSVGString(shapes, artW, artH);
  svgToImage(svg, (img) => {
    const cv = document.createElement("canvas");
    cv.width = artW;
    cv.height = artH;
    cv.getContext("2d")!.drawImage(img, 0, 0);
    cv.toBlob((b) => b && downloadBlob(b, "drawing.webp"), "image/webp", 0.92);
  });
}

export function exportBMPFile(shapes: VShape[], artW: number, artH: number): void {
  const svg = buildSVGString(shapes, artW, artH);
  svgToImage(svg, (img) => {
    const cv = document.createElement("canvas");
    cv.width = artW;
    cv.height = artH;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, artW, artH);
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, artW, artH);
    const w = artW, h = artH;
    const rowSize = Math.ceil((w * 3) / 4) * 4;
    const pixelDataSize = rowSize * h;
    const fileSize = 54 + pixelDataSize;
    const buf = new ArrayBuffer(fileSize);
    const view = new DataView(buf);
    view.setUint8(0, 0x42); view.setUint8(1, 0x4d);
    view.setUint32(2, fileSize, true);
    view.setUint32(10, 54, true);
    view.setUint32(14, 40, true);
    view.setInt32(18, w, true);
    view.setInt32(22, h, true);
    view.setUint16(26, 1, true);
    view.setUint16(28, 24, true);
    view.setUint32(34, pixelDataSize, true);
    const d = id.data;
    for (let y = 0; y < h; y++) {
      const srcRow = (h - 1 - y) * w * 4;
      const dstRow = 54 + y * rowSize;
      for (let x = 0; x < w; x++) {
        const si = srcRow + x * 4;
        const di = dstRow + x * 3;
        view.setUint8(di, d[si + 2]);
        view.setUint8(di + 1, d[si + 1]);
        view.setUint8(di + 2, d[si]);
      }
    }
    downloadBlob(new Blob([buf], { type: "image/bmp" }), "drawing.bmp");
  });
}
