/* ─── types ─── */

export type VTool =
  | "pointer"
  | "rect"
  | "roundrect"
  | "ellipse"
  | "line"
  | "arrow"
  | "polygon"
  | "star"
  | "pen"
  | "text";

export interface VShape {
  id: string;
  type: "rect" | "roundrect" | "ellipse" | "line" | "polyline" | "text" | "polygon" | "star" | "arrow";
  x: number;
  y: number;
  w: number;
  h: number;
  // line / arrow
  x2?: number;
  y2?: number;
  // pen points
  points?: { x: number; y: number }[];
  // appearance
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  // text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  // transform
  rotation: number;
  // round rect
  rx?: number;
  // polygon / star
  sides?: number;
  innerRadius?: number; // for star only (0-1 ratio)
}

export interface HistEntry {
  shapes: VShape[];
}

/* ─── helpers ─── */

let _sid = 0;
export const sid = () => `s${++_sid}`;

export const cloneShapes = (s: VShape[]): VShape[] =>
  JSON.parse(JSON.stringify(s));

export const downloadBlob = (blob: Blob, name: string) => {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
};

export const TOOLS: { id: VTool; icon: string; label: string; key: string }[] = [
  { id: "pointer", icon: "↖", label: "Select", key: "V" },
  { id: "rect", icon: "▢", label: "Rectangle", key: "R" },
  { id: "roundrect", icon: "▣", label: "Rounded Rect", key: "U" },
  { id: "ellipse", icon: "◯", label: "Ellipse", key: "C" },
  { id: "line", icon: "╱", label: "Line", key: "L" },
  { id: "arrow", icon: "→", label: "Arrow", key: "A" },
  { id: "polygon", icon: "⬡", label: "Polygon", key: "G" },
  { id: "star", icon: "★", label: "Star", key: "S" },
  { id: "pen", icon: "✎", label: "Pen (polyline)", key: "P" },
  { id: "text", icon: "T", label: "Text", key: "T" },
];

export const FONTS = [
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
  "Arial",
  "Georgia",
  "Courier New",
  "Times New Roman",
  "Verdana",
];

/** Generate polygon points string for n-sided regular polygon */
export function polygonPoints(cx: number, cy: number, r: number, sides: number, rotation: number): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 + (rotation * Math.PI) / 180;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

/** Generate star points string */
export function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number, rotation: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI * i) / points - Math.PI / 2 + (rotation * Math.PI) / 180;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

/** Snap a value to grid */
export function snapToGrid(val: number, gridSize: number): number {
  return Math.round(val / gridSize) * gridSize;
}
