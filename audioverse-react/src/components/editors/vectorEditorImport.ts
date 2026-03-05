import { VShape, sid } from "./vectorEditorTypes";

/**
 * Parse an SVG string and return an array of VShape objects.
 * Throws an Error if the SVG is malformed.
 * Returns an empty array if no supported shapes are found.
 */
export function parseSVGToShapes(raw: string): VShape[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "image/svg+xml");
  const errs = doc.querySelector("parsererror");
  if (errs) {
    throw new Error("Invalid SVG");
  }
  const imported: VShape[] = [];
  const elems = doc.querySelectorAll(
    "rect, ellipse, circle, line, polyline, polygon, text",
  );
  elems.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const fill =
      el.getAttribute("fill") || (tag === "line" ? "none" : "#cccccc");
    const stroke = el.getAttribute("stroke") || "none";
    const sw = parseFloat(el.getAttribute("stroke-width") || "1");
    const base: Partial<VShape> = {
      id: sid(),
      fill,
      stroke,
      strokeWidth: sw,
      opacity: 1,
      rotation: 0,
    };
    switch (tag) {
      case "rect": {
        const x = parseFloat(el.getAttribute("x") || "0");
        const y = parseFloat(el.getAttribute("y") || "0");
        const w = parseFloat(el.getAttribute("width") || "0");
        const h = parseFloat(el.getAttribute("height") || "0");
        const rxVal = parseFloat(el.getAttribute("rx") || "0");
        if (rxVal > 0) {
          imported.push({
            ...base,
            type: "roundrect",
            x, y, w, h,
            rx: rxVal,
          } as VShape);
        } else {
          imported.push({
            ...base,
            type: "rect",
            x, y, w, h,
          } as VShape);
        }
        break;
      }
      case "ellipse": {
        const cx2 = parseFloat(el.getAttribute("cx") || "0");
        const cy2 = parseFloat(el.getAttribute("cy") || "0");
        const rx = parseFloat(el.getAttribute("rx") || "0");
        const ry = parseFloat(el.getAttribute("ry") || "0");
        imported.push({
          ...base,
          type: "ellipse",
          x: cx2 - rx,
          y: cy2 - ry,
          w: rx * 2,
          h: ry * 2,
        } as VShape);
        break;
      }
      case "circle": {
        const cx2 = parseFloat(el.getAttribute("cx") || "0");
        const cy2 = parseFloat(el.getAttribute("cy") || "0");
        const r = parseFloat(el.getAttribute("r") || "0");
        imported.push({
          ...base,
          type: "ellipse",
          x: cx2 - r,
          y: cy2 - r,
          w: r * 2,
          h: r * 2,
        } as VShape);
        break;
      }
      case "line": {
        const x1 = parseFloat(el.getAttribute("x1") || "0");
        const y1 = parseFloat(el.getAttribute("y1") || "0");
        const x2 = parseFloat(el.getAttribute("x2") || "0");
        const y2 = parseFloat(el.getAttribute("y2") || "0");
        imported.push({
          ...base,
          type: "line",
          x: x1,
          y: y1,
          x2: x2,
          y2: y2,
          w: Math.abs(x2 - x1),
          h: Math.abs(y2 - y1),
        } as VShape);
        break;
      }
      case "polyline":
      case "polygon": {
        const raw2 = el.getAttribute("points") || "";
        const pts = raw2
          .trim()
          .split(/\s+/)
          .map((p) => {
            const [x, y] = p.split(",").map(Number);
            return { x: x || 0, y: y || 0 };
          });
        if (pts.length > 0) {
          const xs = pts.map((p) => p.x);
          const ys = pts.map((p) => p.y);
          imported.push({
            ...base,
            type: "polyline",
            x: Math.min(...xs),
            y: Math.min(...ys),
            w: Math.max(...xs) - Math.min(...xs),
            h: Math.max(...ys) - Math.min(...ys),
            points: pts,
          } as VShape);
        }
        break;
      }
      case "text": {
        const x = parseFloat(el.getAttribute("x") || "0");
        const y = parseFloat(el.getAttribute("y") || "0");
        const fs = parseFloat(el.getAttribute("font-size") || "24");
        const txt = el.textContent || "";
        imported.push({
          ...base,
          type: "text",
          x,
          y: y - fs,
          w: txt.length * fs * 0.6,
          h: fs,
          text: txt,
          fontSize: fs,
        } as VShape);
        break;
      }
    }
  });
  return imported;
}
