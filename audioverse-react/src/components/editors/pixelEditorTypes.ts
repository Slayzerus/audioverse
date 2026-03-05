/**
 * pixelEditorTypes — shared types, constants & helpers for PixelEditor.
 */

import {
  hexToRGBA,
  setPixel,
  type RGBA,
  type BrushShape,
  type SymmetryMode,
} from "./pixelEditorUtils";

/* ─────────────── types ─────────────── */

export type Tool =
  | "pencil"
  | "eraser"
  | "fill"
  | "line"
  | "rect"
  | "ellipse"
  | "eyedropper"
  | "select"
  | "move"
  | "gradient"
  | "dither";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0-255
  locked: boolean;
  blendMode: BlendMode;
}

export type BlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten";

export interface HistoryEntry {
  desc: string;
  cels: Map<string, ImageData>;
  layers: Layer[];
  frameCount: number;
}

export interface Selection {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ─────────────── constants ─────────────── */

export const TOOLS: { id: Tool; icon: string; label: string; key: string }[] = [
  { id: "pencil", icon: "✏", label: "Pencil", key: "B" },
  { id: "eraser", icon: "⌫", label: "Eraser", key: "E" },
  { id: "fill", icon: "🪣", label: "Bucket Fill", key: "G" },
  { id: "line", icon: "╱", label: "Line", key: "L" },
  { id: "rect", icon: "▢", label: "Rectangle", key: "U" },
  { id: "ellipse", icon: "◯", label: "Ellipse", key: "O" },
  { id: "eyedropper", icon: "💧", label: "Eyedropper", key: "I" },
  { id: "select", icon: "⬚", label: "Select", key: "M" },
  { id: "move", icon: "✥", label: "Move", key: "V" },
  { id: "gradient", icon: "▧", label: "Gradient", key: "H" },
  { id: "dither", icon: "▦", label: "Dither", key: "D" },
];

export const BLEND_MODES: BlendMode[] = ["normal", "multiply", "screen", "overlay", "darken", "lighten"];

export const BRUSH_SHAPES: { id: BrushShape; label: string; icon: string }[] = [
  { id: "square", label: "Square", icon: "▪" },
  { id: "circle", label: "Circle", icon: "●" },
  { id: "diamond", label: "Diamond", icon: "◆" },
  { id: "spray", label: "Spray", icon: "░" },
];

export const SYMMETRY_MODES: { id: SymmetryMode; label: string }[] = [
  { id: "none", label: "Off" },
  { id: "h", label: "↔ H" },
  { id: "v", label: "↕ V" },
  { id: "both", label: "✦ Both" },
  { id: "radial4", label: "✿ Radial" },
];

export const DEFAULT_PALETTE = [
  "#000000", "#1d2b53", "#7e2553", "#008751",
  "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8",
  "#ff004d", "#ffa300", "#ffec27", "#00e436",
  "#29adff", "#83769c", "#ff77a8", "#ffccaa",
  "#291814", "#111d35", "#422136", "#125359",
  "#742f29", "#49333b", "#a28879", "#f3ef7d",
  "#be1250", "#ff6c24", "#a8e72e", "#00b543",
  "#065ab5", "#754665", "#ff6e59", "#ff9768",
];

let _layerSeq = 0;
export const lid = () => `l${++_layerSeq}`;

/* ─────────────── helpers ─────────────── */

export const celKey = (f: number, l: number) => `${f}:${l}`;

export const inB = (x: number, y: number, w: number, h: number) =>
  x >= 0 && y >= 0 && x < w && y < h;

export const downloadBlob = (blob: Blob, name: string) => {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
};

/** Hex → RGBA tuple. */
export const hex2t = (hex: string): RGBA => hexToRGBA(hex);

/** Draw ellipse outline using parametric approach. */
export const plotEllipse = (
  data: ImageData,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: RGBA,
  w: number,
  h: number,
  filled = false,
) => {
  if (rx <= 0 && ry <= 0) {
    if (inB(Math.round(cx), Math.round(cy), w, h))
      setPixel(data, Math.round(cx), Math.round(cy), color);
    return;
  }
  if (filled) {
    // filled ellipse
    for (let py = Math.ceil(cy - ry); py <= Math.floor(cy + ry); py++) {
      const t = ry > 0 ? (py - cy) / ry : 0;
      const halfW = rx * Math.sqrt(Math.max(0, 1 - t * t));
      for (let px = Math.ceil(cx - halfW); px <= Math.floor(cx + halfW); px++) {
        if (inB(px, py, w, h)) setPixel(data, px, py, color);
      }
    }
  } else {
    const steps = Math.max(Math.ceil(Math.PI * 2 * Math.max(rx, ry)), 16);
    for (let i = 0; i < steps; i++) {
      const a = (2 * Math.PI * i) / steps;
      const px = Math.round(cx + rx * Math.cos(a));
      const py = Math.round(cy + ry * Math.sin(a));
      if (inB(px, py, w, h)) setPixel(data, px, py, color);
    }
  }
};
