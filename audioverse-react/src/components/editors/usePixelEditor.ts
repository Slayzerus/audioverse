/**
 * usePixelEditor — custom hook encapsulating ALL state, refs, callbacks,
 * side-effects and memos for the PixelEditor component.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { logger } from "../../utils/logger";
const log = logger.scoped("PixelEditor");
import {
  parseAseFile,
  aseColorToHex,
  type AseDocument,
} from "./asepriteFormat";
import {
  bresenhamLine,
  floodFill,
  rgbaToHex,
  setPixel,
  getPixel,
  cloneImageData,
  createBlankImageData,
  flipH,
  flipV,
  rotateCW,
  applyBrushStamp,
  applyDitherStamp,
  drawGradient,
  getSymmetryPoints,
  copySelection,
  pasteAt,
  clearSelection,
  type RGBA,
  type BrushConfig,
  type SymmetryMode,
  DEFAULT_BRUSH,
} from "./pixelEditorUtils";
import {
  type Tool,
  type Layer,
  type BlendMode,
  type HistoryEntry,
  type Selection,
  DEFAULT_PALETTE,
  lid,
  celKey,
  inB,
  hex2t,
  plotEllipse,
} from "./pixelEditorTypes";
import {
  exportAse as _doExportAse,
  exportPNG as _doExportPNG,
  exportJPG as _doExportJPG,
  exportWebP as _doExportWebP,
  exportBMP as _doExportBMP,
  exportSVG as _doExportSVG,
  exportSheet as _doExportSheet,
} from "./pixelEditorExports";

/* ── Props & API ── */

export interface UsePixelEditorProps {
  initialWidth?: number;
  initialHeight?: number;
  onSaveToLibrary?: (dataUrl: string, name: string, mimeType: string) => void;
}

export interface PixelEditorAPI {
  /* canvas dimensions */
  dw: number;
  dh: number;
  /* layers */
  layers: Layer[];
  aLi: number;
  setALi: React.Dispatch<React.SetStateAction<number>>;
  /* frames */
  fc: number;
  afi: number;
  setAfi: React.Dispatch<React.SetStateAction<number>>;
  fDur: number[];
  /* tool */
  tool: Tool;
  setTool: React.Dispatch<React.SetStateAction<Tool>>;
  /* colours */
  col1: string;
  setCol1: React.Dispatch<React.SetStateAction<string>>;
  col2: string;
  setCol2: React.Dispatch<React.SetStateAction<string>>;
  /* brush */
  brush: BrushConfig;
  setBrush: React.Dispatch<React.SetStateAction<BrushConfig>>;
  /* view */
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  grid: boolean;
  setGrid: React.Dispatch<React.SetStateAction<boolean>>;
  onion: boolean;
  setOnion: React.Dispatch<React.SetStateAction<boolean>>;
  /* animation */
  fps: number;
  setFps: React.Dispatch<React.SetStateAction<number>>;
  playing: boolean;
  setPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  /* palette */
  pal: string[];
  setPal: React.Dispatch<React.SetStateAction<string[]>>;
  /* cursor */
  cursor: { x: number; y: number } | null;
  setCursor: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  /* dialog */
  dlgNew: boolean;
  setDlgNew: React.Dispatch<React.SetStateAction<boolean>>;
  nw: number;
  setNw: React.Dispatch<React.SetStateAction<number>>;
  nh: number;
  setNh: React.Dispatch<React.SetStateAction<number>>;
  /* selection */
  sel: Selection | null;
  setSel: React.Dispatch<React.SetStateAction<Selection | null>>;
  /* symmetry & shape */
  symmetry: SymmetryMode;
  setSymmetry: React.Dispatch<React.SetStateAction<SymmetryMode>>;
  shapeFilled: boolean;
  setShapeFilled: React.Dispatch<React.SetStateAction<boolean>>;
  /* pressure */
  pressure: number;
  /* hsv picker */
  showHSV: boolean;
  setShowHSV: React.Dispatch<React.SetStateAction<boolean>>;
  /* layer name editing */
  editingLayerName: string | null;
  setEditingLayerName: React.Dispatch<React.SetStateAction<string | null>>;
  /* refs */
  cvRef: React.RefObject<HTMLCanvasElement>;
  boxRef: React.RefObject<HTMLDivElement>;
  fInp: React.RefObject<HTMLInputElement>;
  clipboard: React.MutableRefObject<ImageData | null>;
  drawing: React.MutableRefObject<boolean>;
  panning: React.MutableRefObject<boolean>;
  /* callbacks */
  undo: () => void;
  redo: () => void;
  openFile: (file: File) => Promise<void>;
  exportAse: () => Promise<void>;
  exportPNG: () => void;
  exportJPG: () => void;
  exportWebP: () => void;
  exportBMP: () => void;
  exportSVG: () => void;
  exportSheet: () => void;
  saveToLibrary: () => void;
  addLayer: () => void;
  rmLayer: () => void;
  toggleVis: (i: number) => void;
  toggleLock: (i: number) => void;
  setLayerOpacity: (i: number, op: number) => void;
  setLayerBlendMode: (i: number, mode: BlendMode) => void;
  renameLayer: (i: number, name: string) => void;
  moveLayerUp: () => void;
  moveLayerDown: () => void;
  mergeDown: () => void;
  dupLayer: () => void;
  addFrame: () => void;
  dupFrame: () => void;
  rmFrame: () => void;
  flipCv: (dir: "h" | "v") => void;
  rotateCv: () => void;
  clearCv: () => void;
  newDoc: (w: number, h: number) => void;
  doCopy: () => void;
  doCut: () => void;
  doPaste: () => void;
  doDeleteSel: () => void;
  doSelectAll: () => void;
  doDeselectAll: () => void;
  onDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onWheel: (e: React.WheelEvent) => void;
  /* memos */
  thumbs: string[];
}

/* ═══════════════════════════════════════════
   Hook
   ═══════════════════════════════════════════ */

export function usePixelEditor({
  initialWidth = 64,
  initialHeight = 64,
  onSaveToLibrary,
}: UsePixelEditorProps): PixelEditorAPI {
  /* ── state ── */
  const [dw, setDw] = useState(initialWidth);
  const [dh, setDh] = useState(initialHeight);
  const [layers, setLayers] = useState<Layer[]>(() => [
    { id: lid(), name: "Background", visible: true, opacity: 255, locked: false, blendMode: "normal" },
  ]);
  const [aLi, setALi] = useState(0);
  const [fc, setFc] = useState(1);
  const [afi, setAfi] = useState(0);
  const [fDur, setFDur] = useState<number[]>([100]);
  const [tool, setTool] = useState<Tool>("pencil");
  const [col1, setCol1] = useState("#000000");
  const [col2, setCol2] = useState("#ffffff");
  const [brush, setBrush] = useState<BrushConfig>({ ...DEFAULT_BRUSH });
  const [zoom, setZoom] = useState(8);
  const [px, setPx] = useState(0);
  const [py, setPy] = useState(0);
  const [grid, setGrid] = useState(true);
  const [onion, setOnion] = useState(false);
  const [fps, setFps] = useState(8);
  const [playing, setPlaying] = useState(false);
  const [pal, setPal] = useState(DEFAULT_PALETTE);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [dlgNew, setDlgNew] = useState(false);
  const [nw, setNw] = useState(64);
  const [nh, setNh] = useState(64);
  const [sel, setSel] = useState<Selection | null>(null);
  const [tick, setTick] = useState(0);
  const [symmetry, setSymmetry] = useState<SymmetryMode>("none");
  const [shapeFilled, setShapeFilled] = useState(false);
  const [pressure, setPressure] = useState(0.5);
  const [showHSV, setShowHSV] = useState(false);
  const [editingLayerName, setEditingLayerName] = useState<string | null>(null);

  /* ── refs ── */
  const cvRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const cels = useRef(new Map<string, ImageData>());
  const hist = useRef<HistoryEntry[]>([]);
  const hIdx = useRef(-1);
  const drawing = useRef(false);
  const lastPx = useRef<{ x: number; y: number } | null>(null);
  const tStart = useRef<{ x: number; y: number } | null>(null);
  const preview = useRef<{ fr: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
  const panning = useRef(false);
  const panSt = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const fInp = useRef<HTMLInputElement>(null);
  const btn = useRef(0);
  const curPressure = useRef(0.5);
  const clipboard = useRef<ImageData | null>(null);
  const brushDist = useRef(0);

  /* ── cel access ── */
  const getCel = useCallback(
    (f: number, l: number) => {
      const k = celKey(f, l);
      let c = cels.current.get(k);
      if (!c) {
        c = createBlankImageData(dw, dh);
        cels.current.set(k, c);
      }
      return c;
    },
    [dw, dh],
  );

  /* ── coordinate transform ── */
  const scr2art = useCallback(
    (cx: number, cy: number) => {
      const r = boxRef.current?.getBoundingClientRect();
      if (!r) return { x: 0, y: 0 };
      return {
        x: Math.floor((cx - r.left - px - r.width / 2) / zoom + dw / 2),
        y: Math.floor((cy - r.top - py - r.height / 2) / zoom + dh / 2),
      };
    },
    [px, py, zoom, dw, dh],
  );

  /* ── history ── */
  const snap = useCallback(
    (desc: string) => {
      const m = new Map<string, ImageData>();
      cels.current.forEach((v, k) => m.set(k, cloneImageData(v)));
      hist.current = hist.current.slice(0, hIdx.current + 1);
      hist.current.push({
        desc,
        cels: m,
        layers: JSON.parse(JSON.stringify(layers)),
        frameCount: fc,
      });
      if (hist.current.length > 50) hist.current.shift();
      hIdx.current = hist.current.length - 1;
    },
    [layers, fc],
  );

  const restoreEntry = useCallback((e: HistoryEntry) => {
    cels.current = new Map<string, ImageData>();
    e.cels.forEach((v, k) => cels.current.set(k, cloneImageData(v)));
    setLayers(JSON.parse(JSON.stringify(e.layers)));
    setFc(e.frameCount);
    setTick((t) => t + 1);
  }, []);

  const undo = useCallback(() => {
    if (hIdx.current <= 0) return;
    hIdx.current--;
    restoreEntry(hist.current[hIdx.current]);
  }, [restoreEntry]);

  const redo = useCallback(() => {
    if (hIdx.current >= hist.current.length - 1) return;
    hIdx.current++;
    restoreEntry(hist.current[hIdx.current]);
  }, [restoreEntry]);

  /* Push initial snapshot so first undo works */
  useEffect(() => {
    if (hist.current.length === 0) {
      snap("initial");
    }
  }, [snap]);

  /* ── composite a frame ── */
  const compFrame = useCallback(
    (fi: number) => {
      const cv = new OffscreenCanvas(dw, dh);
      const ctx = cv.getContext("2d")!;
      for (let li = 0; li < layers.length; li++) {
        if (!layers[li].visible) continue;
        const c = cels.current.get(celKey(fi, li));
        if (!c) continue;
        const t = new OffscreenCanvas(dw, dh);
        t.getContext("2d")!.putImageData(c, 0, 0);
        ctx.globalAlpha = layers[li].opacity / 255;
        const bm = layers[li].blendMode;
        if (bm !== "normal") {
          ctx.globalCompositeOperation = bm as GlobalCompositeOperation;
        } else {
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.drawImage(t, 0, 0);
      }
      ctx.globalCompositeOperation = "source-over";
      return ctx.getImageData(0, 0, dw, dh);
    },
    [dw, dh, layers],
  );

  /* ── rendering ── */
  const render = useCallback(() => {
    const canvas = cvRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const cw = box.clientWidth;
    const ch = box.clientHeight;
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    ctx.translate(cw / 2 + px, ch / 2 + py);
    ctx.scale(zoom, zoom);
    ctx.translate(-dw / 2, -dh / 2);

    // checkerboard
    for (let y = 0; y < dh; y++)
      for (let x = 0; x < dw; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#3c3c3c" : "#2c2c2c";
        ctx.fillRect(x, y, 1, 1);
      }

    // onion skin (prev frame)
    if (onion && afi > 0) {
      const oc = new OffscreenCanvas(dw, dh);
      const ox = oc.getContext("2d")!;
      for (let li = 0; li < layers.length; li++) {
        if (!layers[li].visible) continue;
        const c = cels.current.get(celKey(afi - 1, li));
        if (!c) continue;
        const t = new OffscreenCanvas(dw, dh);
        t.getContext("2d")!.putImageData(c, 0, 0);
        ox.globalAlpha = (layers[li].opacity / 255) * 0.25;
        ox.drawImage(t, 0, 0);
      }
      ctx.drawImage(oc, 0, 0);
    }

    // current frame composite
    const comp = new OffscreenCanvas(dw, dh);
    const cc = comp.getContext("2d")!;
    for (let li = 0; li < layers.length; li++) {
      if (!layers[li].visible) continue;
      const c = cels.current.get(celKey(afi, li));
      if (!c) continue;
      const t = new OffscreenCanvas(dw, dh);
      t.getContext("2d")!.putImageData(c, 0, 0);
      cc.globalAlpha = layers[li].opacity / 255;
      const bm = layers[li].blendMode;
      if (bm !== "normal") {
        cc.globalCompositeOperation = bm as GlobalCompositeOperation;
      } else {
        cc.globalCompositeOperation = "source-over";
      }
      cc.drawImage(t, 0, 0);
    }
    cc.globalCompositeOperation = "source-over";
    ctx.drawImage(comp, 0, 0);

    // tool preview (line / rect / ellipse while dragging)
    if (preview.current && drawing.current) {
      const pv = preview.current;
      const clr: RGBA = btn.current === 2 ? hex2t(col2) : hex2t(col1);
      const pvData = cloneImageData(getCel(afi, aLi));
      if (tool === "line") {
        bresenhamLine(pv.fr.x, pv.fr.y, pv.to.x, pv.to.y, (bx, by) => {
          if (inB(bx, by, dw, dh)) setPixel(pvData, bx, by, clr);
        });
      } else if (tool === "rect") {
        const x1 = Math.min(pv.fr.x, pv.to.x), y1 = Math.min(pv.fr.y, pv.to.y);
        const x2 = Math.max(pv.fr.x, pv.to.x), y2 = Math.max(pv.fr.y, pv.to.y);
        if (shapeFilled) {
          for (let y = y1; y <= y2; y++)
            for (let x = x1; x <= x2; x++)
              if (inB(x, y, dw, dh)) setPixel(pvData, x, y, clr);
        } else {
          for (let x = x1; x <= x2; x++) {
            if (inB(x, y1, dw, dh)) setPixel(pvData, x, y1, clr);
            if (inB(x, y2, dw, dh)) setPixel(pvData, x, y2, clr);
          }
          for (let y = y1 + 1; y < y2; y++) {
            if (inB(x1, y, dw, dh)) setPixel(pvData, x1, y, clr);
            if (inB(x2, y, dw, dh)) setPixel(pvData, x2, y, clr);
          }
        }
      } else if (tool === "ellipse") {
        const cx2 = (pv.fr.x + pv.to.x) / 2, cy2 = (pv.fr.y + pv.to.y) / 2;
        const rx = Math.abs(pv.to.x - pv.fr.x) / 2, ry = Math.abs(pv.to.y - pv.fr.y) / 2;
        plotEllipse(pvData, cx2, cy2, rx, ry, clr, dw, dh, shapeFilled);
      } else if (tool === "gradient") {
        const c2: RGBA = btn.current === 2 ? hex2t(col1) : hex2t(col2);
        drawGradient(pvData, pv.fr.x, pv.fr.y, pv.to.x, pv.to.y, clr, c2, sel);
      }
      const pcv = new OffscreenCanvas(dw, dh);
      pcv.getContext("2d")!.putImageData(pvData, 0, 0);
      ctx.globalAlpha = layers[aLi].opacity / 255;
      ctx.drawImage(pcv, 0, 0);
      ctx.globalAlpha = 1;
    }

    // symmetry guides
    if (symmetry !== "none") {
      ctx.strokeStyle = "rgba(255,100,100,0.3)";
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      if (symmetry === "h" || symmetry === "both") {
        ctx.beginPath(); ctx.moveTo(dw / 2, 0); ctx.lineTo(dw / 2, dh); ctx.stroke();
      }
      if (symmetry === "v" || symmetry === "both") {
        ctx.beginPath(); ctx.moveTo(0, dh / 2); ctx.lineTo(dw, dh / 2); ctx.stroke();
      }
      if (symmetry === "radial4") {
        ctx.beginPath();
        ctx.moveTo(dw / 2, 0); ctx.lineTo(dw / 2, dh);
        ctx.moveTo(0, dh / 2); ctx.lineTo(dw, dh / 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // selection marching ants
    if (sel) {
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
      ctx.setLineDash([]);
    }

    // grid
    if (grid && zoom >= 4) {
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1 / zoom;
      for (let x = 0; x <= dw; x++) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, dh); ctx.stroke();
      }
      for (let y = 0; y <= dh; y++) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dw, y); ctx.stroke();
      }
    }

    // border
    ctx.strokeStyle = "rgba(80,100,200,0.4)";
    ctx.lineWidth = 1 / zoom;
    ctx.strokeRect(-0.5 / zoom, -0.5 / zoom, dw + 1 / zoom, dh + 1 / zoom);

    // brush cursor preview
    if (cursor && inB(cursor.x, cursor.y, dw, dh) && (tool === "pencil" || tool === "eraser" || tool === "dither")) {
      const sz = brush.pressureSize ? Math.max(1, Math.round(brush.size * curPressure.current)) : brush.size;
      const half = Math.floor(sz / 2);
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1 / zoom;
      if (brush.shape === "circle") {
        ctx.beginPath();
        ctx.arc(cursor.x + 0.5, cursor.y + 0.5, half + 0.5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(cursor.x - half, cursor.y - half, sz, sz);
      }
    }

    ctx.restore();
  }, [dw, dh, zoom, px, py, layers, afi, aLi, grid, onion, tool, col1, col2, sel, getCel, symmetry, shapeFilled, brush, cursor]);

  /* ── brush drawing with symmetry ── */
  const applyBrushAt = useCallback(
    (x: number, y: number, erase: boolean, pr: number) => {
      const cel = getCel(afi, aLi);
      const clr: RGBA = erase ? [0, 0, 0, 0] : hex2t(btn.current === 2 ? col2 : col1);
      const pts = getSymmetryPoints(x, y, dw, dh, symmetry);
      for (const pt of pts) {
        if (tool === "dither") {
          applyDitherStamp(cel, pt.x, pt.y, clr, brush.size, pr);
        } else {
          applyBrushStamp(cel, pt.x, pt.y, clr, brush, pr, erase);
        }
      }
    },
    [getCel, afi, aLi, col1, col2, brush, dw, dh, symmetry, tool],
  );

  /* ── pointer events (pressure-aware) ── */
  const onDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      btn.current = e.button;
      const pr = e.pressure > 0 ? e.pressure : 0.5;
      curPressure.current = pr;
      setPressure(pr);

      if (e.button === 1) {
        panning.current = true;
        panSt.current = { mx: e.clientX, my: e.clientY, px, py };
        return;
      }
      const p = scr2art(e.clientX, e.clientY);
      setCursor(p);
      if (layers[aLi]?.locked) return;

      switch (tool) {
        case "pencil":
        case "eraser":
        case "dither":
          snap(tool === "pencil" ? "Draw" : tool === "eraser" ? "Erase" : "Dither");
          drawing.current = true;
          lastPx.current = p;
          brushDist.current = 0;
          applyBrushAt(p.x, p.y, tool === "eraser", pr);
          setTick((t) => t + 1);
          break;
        case "fill":
          if (inB(p.x, p.y, dw, dh)) {
            snap("Fill");
            const clr = hex2t(e.button === 2 ? col2 : col1);
            const pts = getSymmetryPoints(p.x, p.y, dw, dh, symmetry);
            const cel = getCel(afi, aLi);
            for (const pt of pts) {
              if (inB(pt.x, pt.y, dw, dh)) {
                floodFill(cel, pt.x, pt.y, clr);
              }
            }
            setTick((t) => t + 1);
          }
          break;
        case "eyedropper": {
          if (inB(p.x, p.y, dw, dh)) {
            const c = getPixel(getCel(afi, aLi), p.x, p.y);
            const hex = rgbaToHex(c);
            if (e.button === 2) setCol2(hex);
            else setCol1(hex);
          }
          break;
        }
        case "line":
        case "rect":
        case "ellipse":
        case "gradient":
          snap(tool[0].toUpperCase() + tool.slice(1));
          drawing.current = true;
          tStart.current = p;
          preview.current = { fr: p, to: p };
          break;
        case "select":
          drawing.current = true;
          tStart.current = p;
          break;
        case "move":
          drawing.current = true;
          lastPx.current = p;
          break;
      }
    },
    [tool, aLi, layers, px, py, scr2art, snap, applyBrushAt, getCel, afi, col1, col2, dw, dh, symmetry],
  );

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const pr = e.pressure > 0 ? e.pressure : 0.5;
      curPressure.current = pr;
      setPressure(pr);

      if (panning.current) {
        setPx(panSt.current.px + (e.clientX - panSt.current.mx));
        setPy(panSt.current.py + (e.clientY - panSt.current.my));
        return;
      }
      const p = scr2art(e.clientX, e.clientY);
      setCursor(p);
      if (!drawing.current) return;

      if (tool === "pencil" || tool === "eraser" || tool === "dither") {
        const last = lastPx.current || p;
        const spacing = Math.max(1, brush.size * (brush.spacing / 100));
        const ddx = p.x - last.x, ddy = p.y - last.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < 0.5) return;
        brushDist.current += dist;
        if (brushDist.current >= spacing) {
          bresenhamLine(last.x, last.y, p.x, p.y, (bx, by) => {
            applyBrushAt(bx, by, tool === "eraser", pr);
          });
          brushDist.current = 0;
        }
        lastPx.current = p;
        setTick((t) => t + 1);
      } else if (tool === "line" || tool === "rect" || tool === "ellipse" || tool === "gradient") {
        preview.current = { fr: tStart.current!, to: p };
        setTick((t) => t + 1);
      } else if (tool === "select") {
        const s = tStart.current!;
        setSel({
          x: Math.min(s.x, p.x),
          y: Math.min(s.y, p.y),
          w: Math.abs(p.x - s.x) + 1,
          h: Math.abs(p.y - s.y) + 1,
        });
      } else if (tool === "move" && sel) {
        const last2 = lastPx.current || p;
        const ddx = p.x - last2.x, ddy = p.y - last2.y;
        if (ddx !== 0 || ddy !== 0) {
          setSel((prev) => (prev ? { ...prev, x: prev.x + ddx, y: prev.y + ddy } : null));
        }
        lastPx.current = p;
      }
    },
    [tool, scr2art, applyBrushAt, brush, sel],
  );

  const onUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (panning.current) {
        panning.current = false;
        return;
      }
      if (!drawing.current) return;
      drawing.current = false;

      const p = scr2art(e.clientX, e.clientY);
      const clr: RGBA = btn.current === 2 ? hex2t(col2) : hex2t(col1);

      if (tool === "line" && tStart.current) {
        const cel = getCel(afi, aLi);
        const pts = getSymmetryPoints(0, 0, dw, dh, symmetry);
        if (symmetry === "none") {
          bresenhamLine(tStart.current.x, tStart.current.y, p.x, p.y, (bx, by) => {
            if (inB(bx, by, dw, dh)) setPixel(cel, bx, by, clr);
          });
        } else {
          const fromPts = getSymmetryPoints(tStart.current.x, tStart.current.y, dw, dh, symmetry);
          const toPts = getSymmetryPoints(p.x, p.y, dw, dh, symmetry);
          for (let i = 0; i < fromPts.length; i++) {
            bresenhamLine(fromPts[i].x, fromPts[i].y, toPts[i].x, toPts[i].y, (bx, by) => {
              if (inB(bx, by, dw, dh)) setPixel(cel, bx, by, clr);
            });
          }
          void pts;
        }
        preview.current = null;
        setTick((t) => t + 1);
      } else if (tool === "rect" && tStart.current) {
        const cel = getCel(afi, aLi);
        const x1 = Math.min(tStart.current.x, p.x), y1 = Math.min(tStart.current.y, p.y);
        const x2 = Math.max(tStart.current.x, p.x), y2 = Math.max(tStart.current.y, p.y);
        if (shapeFilled) {
          for (let y = y1; y <= y2; y++)
            for (let x = x1; x <= x2; x++)
              if (inB(x, y, dw, dh)) setPixel(cel, x, y, clr);
        } else {
          for (let x = x1; x <= x2; x++) {
            if (inB(x, y1, dw, dh)) setPixel(cel, x, y1, clr);
            if (inB(x, y2, dw, dh)) setPixel(cel, x, y2, clr);
          }
          for (let y = y1 + 1; y < y2; y++) {
            if (inB(x1, y, dw, dh)) setPixel(cel, x1, y, clr);
            if (inB(x2, y, dw, dh)) setPixel(cel, x2, y, clr);
          }
        }
        preview.current = null;
        setTick((t) => t + 1);
      } else if (tool === "ellipse" && tStart.current) {
        const cel = getCel(afi, aLi);
        const cx2 = (tStart.current.x + p.x) / 2;
        const cy2 = (tStart.current.y + p.y) / 2;
        const rx = Math.abs(p.x - tStart.current.x) / 2;
        const ry = Math.abs(p.y - tStart.current.y) / 2;
        plotEllipse(cel, cx2, cy2, rx, ry, clr, dw, dh, shapeFilled);
        preview.current = null;
        setTick((t) => t + 1);
      } else if (tool === "gradient" && tStart.current) {
        const cel = getCel(afi, aLi);
        const c2: RGBA = btn.current === 2 ? hex2t(col1) : hex2t(col2);
        drawGradient(cel, tStart.current.x, tStart.current.y, p.x, p.y, clr, c2, sel);
        preview.current = null;
        setTick((t) => t + 1);
      }

      lastPx.current = null;
      tStart.current = null;
    },
    [tool, scr2art, getCel, afi, aLi, col1, col2, dw, dh, shapeFilled, symmetry, sel],
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => {
      const n = e.deltaY < 0 ? z * 1.2 : z / 1.2;
      return Math.max(0.5, Math.min(64, n));
    });
  }, []);

  /* ── clipboard operations ── */
  const doCopy = useCallback(() => {
    if (!sel) return;
    clipboard.current = copySelection(getCel(afi, aLi), sel);
  }, [sel, getCel, afi, aLi]);

  const doCut = useCallback(() => {
    if (!sel) return;
    snap("Cut");
    const cel = getCel(afi, aLi);
    clipboard.current = copySelection(cel, sel);
    clearSelection(cel, sel);
    setTick((t) => t + 1);
  }, [sel, getCel, afi, aLi, snap]);

  const doPaste = useCallback(() => {
    if (!clipboard.current) return;
    snap("Paste");
    const cel = getCel(afi, aLi);
    pasteAt(cel, clipboard.current, sel?.x ?? 0, sel?.y ?? 0);
    setTick((t) => t + 1);
  }, [getCel, afi, aLi, snap, sel]);

  const doDeleteSel = useCallback(() => {
    if (!sel) return;
    snap("Delete Selection");
    clearSelection(getCel(afi, aLi), sel);
    setTick((t) => t + 1);
  }, [sel, getCel, afi, aLi, snap]);

  const doSelectAll = useCallback(() => {
    setSel({ x: 0, y: 0, w: dw, h: dh });
  }, [dw, dh]);

  const doDeselectAll = useCallback(() => {
    setSel(null);
  }, []);

  /* ── file I/O ── */
  const loadAseDoc = useCallback(
    (doc: AseDocument) => {
      setDw(doc.width);
      setDh(doc.height);
      cels.current = new Map();
      const lrs: Layer[] = doc.layers.map((l, i) => ({
        id: lid(),
        name: l.name || `Layer ${i + 1}`,
        visible: l.visible,
        opacity: l.opacity,
        locked: false,
        blendMode: "normal" as BlendMode,
      }));
      setLayers(
        lrs.length
          ? lrs
          : [{ id: lid(), name: "Layer 1", visible: true, opacity: 255, locked: false, blendMode: "normal" }],
      );
      setALi(0);
      setFc(doc.frames.length || 1);
      setAfi(0);
      setFDur(doc.frames.map((f) => f.duration || 100));
      doc.frames.forEach((frame, fi) => {
        frame.cels.forEach((cel) => {
          const data = createBlankImageData(doc.width, doc.height);
          if (cel.pixels && cel.width > 0 && cel.height > 0) {
            for (let y = 0; y < cel.height; y++)
              for (let x = 0; x < cel.width; x++) {
                const dx = cel.x + x, dy = cel.y + y;
                if (dx >= 0 && dy >= 0 && dx < doc.width && dy < doc.height) {
                  const si = (y * cel.width + x) * 4;
                  setPixel(data, dx, dy, [
                    cel.pixels[si], cel.pixels[si + 1], cel.pixels[si + 2], cel.pixels[si + 3],
                  ]);
                }
              }
          }
          cels.current.set(celKey(fi, cel.layerIndex), data);
        });
      });
      if (doc.palette.length) setPal(doc.palette.map(aseColorToHex));
      setZoom(Math.max(1, Math.floor(Math.min(512 / doc.width, 512 / doc.height))));
      setPx(0);
      setPy(0);
      hist.current = [];
      hIdx.current = -1;
      setTick((t) => t + 1);
    },
    [],
  );

  const openFile = useCallback(async (file: File) => {
    if (file.name.match(/\.ase(prite)?$/i)) {
      try {
        const doc = await parseAseFile(await file.arrayBuffer());
        loadAseDoc(doc);
      } catch (err) {
        log.error("ASE parse error", err);
        alert("Failed to parse Aseprite file.");
      }
    } else {
      const img = new Image();
      img.onload = () => {
        const w2 = img.naturalWidth, h2 = img.naturalHeight;
        const cv = new OffscreenCanvas(w2, h2);
        cv.getContext("2d")!.drawImage(img, 0, 0);
        const data = cv.getContext("2d")!.getImageData(0, 0, w2, h2);
        setDw(w2);
        setDh(h2);
        cels.current = new Map([[celKey(0, 0), data]]);
        setLayers([{ id: lid(), name: "Layer 1", visible: true, opacity: 255, locked: false, blendMode: "normal" }]);
        setALi(0);
        setFc(1);
        setAfi(0);
        setFDur([100]);
        setZoom(Math.max(1, Math.floor(Math.min(512 / w2, 512 / h2))));
        setPx(0);
        setPy(0);
        hist.current = [];
        hIdx.current = -1;
        setTick((t) => t + 1);
      };
      img.src = URL.createObjectURL(file);
    }
  }, [loadAseDoc]);

  const exportAse = useCallback(async () => {
    await _doExportAse({ dw, dh, layers, fc, fDur, pal, cels: cels.current });
  }, [dw, dh, layers, fc, fDur, pal]);

  const exportPNG = useCallback(() => {
    _doExportPNG(afi, dw, dh, compFrame);
  }, [afi, dw, dh, compFrame]);

  const exportJPG = useCallback(() => {
    _doExportJPG(afi, dw, dh, compFrame);
  }, [afi, dw, dh, compFrame]);

  const exportWebP = useCallback(() => {
    _doExportWebP(afi, dw, dh, compFrame);
  }, [afi, dw, dh, compFrame]);

  const exportBMP = useCallback(() => {
    _doExportBMP(afi, dw, dh, compFrame);
  }, [afi, dw, dh, compFrame]);

  const exportSVG = useCallback(() => {
    _doExportSVG(afi, dw, dh, compFrame);
  }, [afi, dw, dh, compFrame]);

  const exportSheet = useCallback(() => {
    _doExportSheet(dw, dh, fc, compFrame);
  }, [dw, dh, fc, compFrame]);

  /* ── save to library ── */
  const saveToLibrary = useCallback(() => {
    if (!onSaveToLibrary) return;
    const data = compFrame(afi);
    const cv = document.createElement("canvas");
    cv.width = dw;
    cv.height = dh;
    cv.getContext("2d")!.putImageData(data, 0, 0);
    const dataUrl = cv.toDataURL("image/png");
    const defaultName = `sprite-${dw}x${dh}.png`;
    const name = window.prompt("Save to library as:", defaultName);
    if (!name || !name.trim()) return;
    onSaveToLibrary(dataUrl, name.trim(), "image/png");
  }, [onSaveToLibrary, afi, dw, dh, compFrame]);

  /* ── layer management ── */
  const addLayer = useCallback(() => {
    snap("Add Layer");
    setLayers((ls) => [
      ...ls,
      { id: lid(), name: `Layer ${ls.length + 1}`, visible: true, opacity: 255, locked: false, blendMode: "normal" as BlendMode },
    ]);
    setALi(layers.length);
    setTick((t) => t + 1);
  }, [layers, snap]);

  const rmLayer = useCallback(() => {
    if (layers.length <= 1) return;
    snap("Remove Layer");
    const idx = aLi;
    for (let fi = 0; fi < fc; fi++) {
      cels.current.delete(celKey(fi, idx));
      for (let li = idx + 1; li < layers.length; li++) {
        const c = cels.current.get(celKey(fi, li));
        if (c) {
          cels.current.set(celKey(fi, li - 1), c);
          cels.current.delete(celKey(fi, li));
        }
      }
    }
    setLayers((ls) => ls.filter((_, i) => i !== idx));
    setALi(Math.min(idx, layers.length - 2));
    setTick((t) => t + 1);
  }, [layers, aLi, fc, snap]);

  const toggleVis = useCallback((i: number) => {
    setLayers((ls) => ls.map((l, j) => (j === i ? { ...l, visible: !l.visible } : l)));
    setTick((t) => t + 1);
  }, []);

  const toggleLock = useCallback((i: number) => {
    setLayers((ls) => ls.map((l, j) => (j === i ? { ...l, locked: !l.locked } : l)));
  }, []);

  const setLayerOpacity = useCallback((i: number, op: number) => {
    setLayers((ls) => ls.map((l, j) => (j === i ? { ...l, opacity: op } : l)));
    setTick((t) => t + 1);
  }, []);

  const setLayerBlendMode = useCallback((i: number, mode: BlendMode) => {
    setLayers((ls) => ls.map((l, j) => (j === i ? { ...l, blendMode: mode } : l)));
    setTick((t) => t + 1);
  }, []);

  const renameLayer = useCallback((i: number, name: string) => {
    setLayers((ls) => ls.map((l, j) => (j === i ? { ...l, name } : l)));
  }, []);

  const moveLayerUp = useCallback(() => {
    if (aLi >= layers.length - 1) return;
    snap("Move Layer Up");
    setLayers((ls) => {
      const n = [...ls];
      [n[aLi], n[aLi + 1]] = [n[aLi + 1], n[aLi]];
      return n;
    });
    for (let fi = 0; fi < fc; fi++) {
      const a = cels.current.get(celKey(fi, aLi));
      const b = cels.current.get(celKey(fi, aLi + 1));
      if (a) cels.current.set(celKey(fi, aLi + 1), a);
      else cels.current.delete(celKey(fi, aLi + 1));
      if (b) cels.current.set(celKey(fi, aLi), b);
      else cels.current.delete(celKey(fi, aLi));
    }
    setALi(aLi + 1);
    setTick((t) => t + 1);
  }, [aLi, layers, fc, snap]);

  const moveLayerDown = useCallback(() => {
    if (aLi <= 0) return;
    snap("Move Layer Down");
    setLayers((ls) => {
      const n = [...ls];
      [n[aLi], n[aLi - 1]] = [n[aLi - 1], n[aLi]];
      return n;
    });
    for (let fi = 0; fi < fc; fi++) {
      const a = cels.current.get(celKey(fi, aLi));
      const b = cels.current.get(celKey(fi, aLi - 1));
      if (a) cels.current.set(celKey(fi, aLi - 1), a);
      else cels.current.delete(celKey(fi, aLi - 1));
      if (b) cels.current.set(celKey(fi, aLi), b);
      else cels.current.delete(celKey(fi, aLi));
    }
    setALi(aLi - 1);
    setTick((t) => t + 1);
  }, [aLi, fc, snap]);

  const mergeDown = useCallback(() => {
    if (aLi <= 0) return;
    snap("Merge Down");
    for (let fi = 0; fi < fc; fi++) {
      const top = cels.current.get(celKey(fi, aLi));
      const bot = getCel(fi, aLi - 1);
      if (top) {
        const cv = new OffscreenCanvas(dw, dh);
        const ctx = cv.getContext("2d")!;
        ctx.putImageData(bot, 0, 0);
        const t = new OffscreenCanvas(dw, dh);
        t.getContext("2d")!.putImageData(top, 0, 0);
        ctx.globalAlpha = layers[aLi].opacity / 255;
        ctx.drawImage(t, 0, 0);
        cels.current.set(celKey(fi, aLi - 1), ctx.getImageData(0, 0, dw, dh));
      }
    }
    for (let fi = 0; fi < fc; fi++) {
      cels.current.delete(celKey(fi, aLi));
      for (let li = aLi + 1; li < layers.length; li++) {
        const c = cels.current.get(celKey(fi, li));
        if (c) {
          cels.current.set(celKey(fi, li - 1), c);
          cels.current.delete(celKey(fi, li));
        }
      }
    }
    setLayers((ls) => ls.filter((_, i) => i !== aLi));
    setALi(aLi - 1);
    setTick((t) => t + 1);
  }, [aLi, fc, layers, getCel, dw, dh, snap]);

  const dupLayer = useCallback(() => {
    snap("Duplicate Layer");
    const newL: Layer = { ...layers[aLi], id: lid(), name: layers[aLi].name + " copy" };
    setLayers((ls) => [...ls.slice(0, aLi + 1), newL, ...ls.slice(aLi + 1)]);
    for (let fi = 0; fi < fc; fi++) {
      for (let li = layers.length; li > aLi; li--) {
        const c = cels.current.get(celKey(fi, li));
        if (c) {
          cels.current.set(celKey(fi, li + 1), c);
          cels.current.delete(celKey(fi, li));
        }
      }
      const src = cels.current.get(celKey(fi, aLi));
      if (src) cels.current.set(celKey(fi, aLi + 1), cloneImageData(src));
    }
    setALi(aLi + 1);
    setTick((t) => t + 1);
  }, [aLi, layers, fc, snap]);

  /* ── frame management ── */
  const addFrame = useCallback(() => {
    snap("Add Frame");
    setFc((n) => n + 1);
    setFDur((d) => [...d, 100]);
    setAfi(fc);
    setTick((t) => t + 1);
  }, [fc, snap]);

  const dupFrame = useCallback(() => {
    snap("Dup Frame");
    const ni = fc;
    for (let li = 0; li < layers.length; li++) {
      const c = cels.current.get(celKey(afi, li));
      if (c) cels.current.set(celKey(ni, li), cloneImageData(c));
    }
    setFc((n) => n + 1);
    setFDur((d) => [...d, fDur[afi] || 100]);
    setAfi(ni);
    setTick((t) => t + 1);
  }, [fc, afi, layers, fDur, snap]);

  const rmFrame = useCallback(() => {
    if (fc <= 1) return;
    snap("Remove Frame");
    for (let li = 0; li < layers.length; li++) {
      cels.current.delete(celKey(afi, li));
      for (let f = afi + 1; f < fc; f++) {
        const c = cels.current.get(celKey(f, li));
        if (c) {
          cels.current.set(celKey(f - 1, li), c);
          cels.current.delete(celKey(f, li));
        }
      }
    }
    setFc((n) => n - 1);
    setFDur((d) => d.filter((_, i) => i !== afi));
    setAfi(Math.min(afi, fc - 2));
    setTick((t) => t + 1);
  }, [fc, afi, layers, snap]);

  /* ── canvas ops ── */
  const flipCv = useCallback(
    (dir: "h" | "v") => {
      snap(`Flip ${dir === "h" ? "H" : "V"}`);
      cels.current.forEach((c, k) => cels.current.set(k, dir === "h" ? flipH(c) : flipV(c)));
      setTick((t) => t + 1);
    },
    [snap],
  );

  const rotateCv = useCallback(() => {
    snap("Rotate 90°");
    const n = new Map<string, ImageData>();
    cels.current.forEach((c, k) => n.set(k, rotateCW(c)));
    cels.current = n;
    setDw(dh);
    setDh(dw);
    setTick((t) => t + 1);
  }, [dw, dh, snap]);

  const clearCv = useCallback(() => {
    snap("Clear");
    cels.current.set(celKey(afi, aLi), createBlankImageData(dw, dh));
    setTick((t) => t + 1);
  }, [afi, aLi, dw, dh, snap]);

  const newDoc = useCallback(
    (w: number, h: number) => {
      setDw(w);
      setDh(h);
      cels.current = new Map();
      setLayers([{ id: lid(), name: "Background", visible: true, opacity: 255, locked: false, blendMode: "normal" }]);
      setALi(0);
      setFc(1);
      setAfi(0);
      setFDur([100]);
      setSel(null);
      setZoom(Math.max(1, Math.floor(Math.min(512 / w, 512 / h))));
      setPx(0);
      setPy(0);
      hist.current = [];
      hIdx.current = -1;
      setDlgNew(false);
      setTick((t) => t + 1);
    },
    [],
  );

  /* ── effects ── */
  // render every tick / state change
  useEffect(() => {
    render();
  });

  // keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (dlgNew) return;
      const tgt = e.target as HTMLElement;
      if (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.tagName === "SELECT") return;
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); return; }
      if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); return; }
      if (e.ctrlKey && e.key === "c") { e.preventDefault(); doCopy(); return; }
      if (e.ctrlKey && e.key === "x") { e.preventDefault(); doCut(); return; }
      if (e.ctrlKey && e.key === "v") { e.preventDefault(); doPaste(); return; }
      if (e.ctrlKey && e.key === "a") { e.preventDefault(); doSelectAll(); return; }
      if (e.ctrlKey && e.key === "d") { e.preventDefault(); doDeselectAll(); return; }

      const km: Record<string, Tool> = {
        b: "pencil", e: "eraser", g: "fill", l: "line", u: "rect",
        o: "ellipse", i: "eyedropper", m: "select", v: "move", h: "gradient", d: "dither",
      };
      const k = e.key.toLowerCase();
      if (km[k]) { setTool(km[k]); return; }
      switch (k) {
        case "+": case "=": setZoom((z) => Math.min(64, z * 1.5)); break;
        case "-": setZoom((z) => Math.max(0.5, z / 1.5)); break;
        case "arrowleft": setAfi((f) => Math.max(0, f - 1)); break;
        case "arrowright": setAfi((f) => Math.min(fc - 1, f + 1)); break;
        case "n": if (!e.ctrlKey) addFrame(); break;
        case "delete": if (sel) doDeleteSel(); else clearCv(); break;
        case "x": {
          setCol1((c) => { setCol2(c); return col2; });
          break;
        }
        case "[": setBrush((b) => ({ ...b, size: Math.max(1, b.size - 1) })); break;
        case "]": setBrush((b) => ({ ...b, size: Math.min(64, b.size + 1) })); break;
        case "f": setShapeFilled((f) => !f); break;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [dlgNew, undo, redo, fc, addFrame, clearCv, col2, doCopy, doCut, doPaste, doSelectAll, doDeselectAll, doDeleteSel, sel]);

  // animation playback
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setAfi((f) => (f + 1) % fc), 1000 / fps);
    return () => clearInterval(iv);
  }, [playing, fc, fps]);

  // resize observer
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setTick((t) => t + 1));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── frame thumbnails ── */
  const thumbs = useMemo(() => {
    void tick;
    const out: string[] = [];
    for (let fi = 0; fi < fc; fi++) {
      const cv = document.createElement("canvas");
      cv.width = dw;
      cv.height = dh;
      const ctx = cv.getContext("2d")!;
      for (let li = 0; li < layers.length; li++) {
        if (!layers[li].visible) continue;
        const c = cels.current.get(celKey(fi, li));
        if (!c) continue;
        const t = document.createElement("canvas");
        t.width = dw;
        t.height = dh;
        t.getContext("2d")!.putImageData(c, 0, 0);
        ctx.globalAlpha = layers[li].opacity / 255;
        ctx.drawImage(t, 0, 0);
      }
      out.push(cv.toDataURL());
    }
    return out;
  }, [fc, dw, dh, layers, tick]);

  /* ── return API ── */
  return {
    dw, dh, layers, aLi, setALi, fc, afi, setAfi, fDur,
    tool, setTool, col1, setCol1, col2, setCol2,
    brush, setBrush, zoom, setZoom, grid, setGrid, onion, setOnion,
    fps, setFps, playing, setPlaying, pal, setPal,
    cursor, setCursor, dlgNew, setDlgNew, nw, setNw, nh, setNh,
    sel, setSel, symmetry, setSymmetry, shapeFilled, setShapeFilled,
    pressure, showHSV, setShowHSV, editingLayerName, setEditingLayerName,
    cvRef, boxRef, fInp, clipboard, drawing, panning,
    undo, redo, openFile,
    exportAse, exportPNG, exportJPG, exportWebP, exportBMP, exportSVG, exportSheet,
    saveToLibrary,
    addLayer, rmLayer, toggleVis, toggleLock, setLayerOpacity, setLayerBlendMode,
    renameLayer, moveLayerUp, moveLayerDown, mergeDown, dupLayer,
    addFrame, dupFrame, rmFrame,
    flipCv, rotateCv, clearCv, newDoc,
    doCopy, doCut, doPaste, doDeleteSel, doSelectAll, doDeselectAll,
    onDown, onMove, onUp, onWheel,
    thumbs,
  };
}
