/**
 * useVectorEditor — extracted logic + state for VectorEditor.
 * Keeps every useState / useRef / useCallback / useEffect in a single hook
 * so the component file is pure layout.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { VTool, VShape, HistEntry } from "./vectorEditorTypes";
import { sid, cloneShapes, snapToGrid } from "./vectorEditorTypes";
import { buildSVGString, exportSVGFile, exportPNGFile, exportJPGFile, exportWebPFile, exportBMPFile } from "./vectorEditorExport";
import { parseSVGToShapes } from "./vectorEditorImport";

export interface UseVectorEditorOptions {
  artW: number;
  artH: number;
  onSaveToLibrary?: (dataUrl: string, name: string, mimeType: string) => void;
}

export function useVectorEditor({ artW, artH, onSaveToLibrary }: UseVectorEditorOptions) {
  /* ── state ── */
  const [shapes, setShapes] = useState<VShape[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [tool, setTool] = useState<VTool>("pointer");
  const [fillCol, setFillCol] = useState("#5566cc");
  const [strokeCol, setStrokeCol] = useState("#ffffff");
  const [strokeW, setStrokeW] = useState(2);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [shapeOpacity, setShapeOpacity] = useState(1);
  const [cornerRadius, setCornerRadius] = useState(12);
  const [polygonSides, setPolygonSides] = useState(6);
  const [starPoints2, setStarPoints2] = useState(5);
  const [starInnerRatio, setStarInnerRatio] = useState(0.4);
  const [zoom, setZoom] = useState(1);
  const [px, setPx] = useState(0);
  const [py, setPy] = useState(0);
  const [dlgSvg, setDlgSvg] = useState(false);
  const [svgText, setSvgText] = useState("");
  const [snapGrid, setSnapGrid] = useState(false);
  const [gridSize, setGridSize] = useState(16);
  const [hasClipboard, setHasClipboard] = useState(false);

  /* ── refs ── */
  const boxRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const startPt = useRef({ x: 0, y: 0 });
  const pendingShape = useRef<VShape | null>(null);
  const penPts = useRef<{ x: number; y: number }[]>([]);
  const panning = useRef(false);
  const panStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const hist = useRef<HistEntry[]>([]);
  const hIdx = useRef(-1);
  const fInp = useRef<HTMLInputElement>(null);
  const clipboard = useRef<VShape | null>(null);
  const shapesRef = useRef<VShape[]>([]);
  shapesRef.current = shapes;

  /* ── derived ── */
  const selShape = useMemo(
    () => shapes.find((s) => s.id === selId) || null,
    [shapes, selId],
  );

  /* ── history ── */
  const snap = useCallback((s: VShape[]) => {
    hist.current = hist.current.slice(0, hIdx.current + 1);
    hist.current.push({ shapes: cloneShapes(s) });
    if (hist.current.length > 50) {
      hist.current.shift();
      hIdx.current--;
    }
    hIdx.current = hist.current.length - 1;
  }, []);

  useEffect(() => {
    if (hist.current.length === 0) snap([]);
  }, [snap]);

  const undo = useCallback(() => {
    if (hIdx.current <= 0) return;
    hIdx.current--;
    setShapes(cloneShapes(hist.current[hIdx.current].shapes));
  }, []);

  const redo = useCallback(() => {
    if (hIdx.current >= hist.current.length - 1) return;
    hIdx.current++;
    setShapes(cloneShapes(hist.current[hIdx.current].shapes));
  }, []);

  /* ── coordinate transform ── */
  const scr2art = useCallback(
    (cx: number, cy: number) => {
      const r = boxRef.current?.getBoundingClientRect();
      if (!r) return { x: 0, y: 0 };
      let x = (cx - r.left - r.width / 2 - px) / zoom + artW / 2;
      let y = (cy - r.top - r.height / 2 - py) / zoom + artH / 2;
      if (snapGrid) {
        x = snapToGrid(x, gridSize);
        y = snapToGrid(y, gridSize);
      }
      return { x, y };
    },
    [px, py, zoom, artW, artH, snapGrid, gridSize],
  );

  /* ── mouse handlers ── */
  const onDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      e.preventDefault();
      if (e.button === 1) {
        panning.current = true;
        panStart.current = { mx: e.clientX, my: e.clientY, px, py };
        return;
      }
      if (e.button !== 0) return;

      const p = scr2art(e.clientX, e.clientY);
      const defaultBase = {
        fill: fillCol,
        stroke: strokeCol,
        strokeWidth: strokeW,
        opacity: shapeOpacity,
        rotation: 0,
      };

      if (tool === "pointer") {
        let hit: string | null = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
          const s = shapes[i];
          if (p.x >= s.x && p.y >= s.y && p.x <= s.x + s.w && p.y <= s.y + s.h) {
            hit = s.id;
            break;
          }
        }
        setSelId(hit);
        if (hit) {
          drawing.current = true;
          startPt.current = p;
        }
        return;
      }

      if (tool === "pen") {
        penPts.current.push(p);
        if (penPts.current.length === 1) {
          const ns: VShape = {
            id: sid(), type: "polyline", x: p.x, y: p.y, w: 0, h: 0,
            points: [{ x: p.x, y: p.y }], fill: "none", stroke: strokeCol,
            strokeWidth: strokeW, opacity: shapeOpacity, rotation: 0,
          };
          pendingShape.current = ns;
          setShapes((prev) => [...prev, ns]);
        } else {
          const pts = [...penPts.current];
          const xs = pts.map((pp) => pp.x);
          const ys = pts.map((pp) => pp.y);
          setShapes((prev) =>
            prev.map((s) =>
              s.id === pendingShape.current?.id
                ? { ...s, points: pts, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
                : s,
            ),
          );
        }
        return;
      }

      if (tool === "text") {
        const txt = prompt("Enter text:", "Hello");
        if (!txt) return;
        const ns: VShape = {
          id: sid(), type: "text", x: p.x, y: p.y,
          w: txt.length * fontSize * 0.6, h: fontSize,
          ...defaultBase, stroke: "none", strokeWidth: 0,
          text: txt, fontSize, fontFamily,
        };
        const next = [...shapes, ns];
        snap(next);
        setShapes(next);
        setSelId(ns.id);
        return;
      }

      if (tool === "polygon") {
        const r2 = 40;
        const ns: VShape = {
          id: sid(), type: "polygon", x: p.x - r2, y: p.y - r2,
          w: r2 * 2, h: r2 * 2, ...defaultBase, sides: polygonSides,
        };
        drawing.current = true;
        startPt.current = p;
        pendingShape.current = ns;
        setShapes((prev) => [...prev, ns]);
        return;
      }

      if (tool === "star") {
        const r2 = 40;
        const ns: VShape = {
          id: sid(), type: "star", x: p.x - r2, y: p.y - r2,
          w: r2 * 2, h: r2 * 2, ...defaultBase, sides: starPoints2, innerRadius: starInnerRatio,
        };
        drawing.current = true;
        startPt.current = p;
        pendingShape.current = ns;
        setShapes((prev) => [...prev, ns]);
        return;
      }

      // rect / roundrect / ellipse / line / arrow — start drag
      drawing.current = true;
      startPt.current = p;
      const typeMap: Record<string, VShape["type"]> = { line: "line", arrow: "arrow", ellipse: "ellipse", roundrect: "roundrect" };
      const shapeType: VShape["type"] = typeMap[tool] || "rect";
      const isLineLike = shapeType === "line" || shapeType === "arrow";
      const ns: VShape = {
        id: sid(), type: shapeType, x: p.x, y: p.y, w: 0, h: 0,
        x2: p.x, y2: p.y,
        fill: isLineLike ? "none" : fillCol, stroke: strokeCol,
        strokeWidth: strokeW, opacity: shapeOpacity, rotation: 0,
        rx: shapeType === "roundrect" ? cornerRadius : undefined,
      };
      pendingShape.current = ns;
      setShapes((prev) => [...prev, ns]);
    },
    [tool, shapes, scr2art, px, py, fillCol, strokeCol, strokeW, fontSize, fontFamily, snap, shapeOpacity, polygonSides, starPoints2, starInnerRatio, cornerRadius],
  );

  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (panning.current) {
        setPx(panStart.current.px + (e.clientX - panStart.current.mx));
        setPy(panStart.current.py + (e.clientY - panStart.current.my));
        return;
      }
      if (!drawing.current) return;

      const p = scr2art(e.clientX, e.clientY);

      if (tool === "pointer" && selId) {
        const dx = p.x - startPt.current.x;
        const dy = p.y - startPt.current.y;
        startPt.current = p;
        setShapes((prev) =>
          prev.map((s) =>
            s.id === selId
              ? {
                  ...s, x: s.x + dx, y: s.y + dy,
                  x2: s.x2 != null ? s.x2 + dx : undefined,
                  y2: s.y2 != null ? s.y2 + dy : undefined,
                  points: s.points?.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
                }
              : s,
          ),
        );
        return;
      }

      if (!pendingShape.current) return;
      const t = pendingShape.current.type;

      if (t === "polygon" || t === "star") {
        const cx = startPt.current.x;
        const cy = startPt.current.y;
        const dx = p.x - cx;
        const dy = p.y - cy;
        const r2 = Math.sqrt(dx * dx + dy * dy);
        setShapes((prev) =>
          prev.map((s) =>
            s.id === pendingShape.current!.id
              ? { ...s, x: cx - r2, y: cy - r2, w: r2 * 2, h: r2 * 2 }
              : s,
          ),
        );
        return;
      }

      if (t === "rect" || t === "roundrect" || t === "ellipse") {
        const x1 = Math.min(startPt.current.x, p.x);
        const y1 = Math.min(startPt.current.y, p.y);
        const w2 = Math.abs(p.x - startPt.current.x);
        const h2 = Math.abs(p.y - startPt.current.y);
        setShapes((prev) =>
          prev.map((s) =>
            s.id === pendingShape.current!.id ? { ...s, x: x1, y: y1, w: w2, h: h2 } : s,
          ),
        );
      } else if (t === "line" || t === "arrow") {
        setShapes((prev) =>
          prev.map((s) =>
            s.id === pendingShape.current!.id
              ? { ...s, w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y), x2: p.x, y2: p.y }
              : s,
          ),
        );
      }
    },
    [tool, scr2art, selId],
  );

  const onUp = useCallback(() => {
    if (panning.current) { panning.current = false; return; }
    if (drawing.current) {
      drawing.current = false;
      if (pendingShape.current) {
        const ps = pendingShape.current;
        if (ps.type !== "polyline" && ps.type !== "text") {
          const minD = 3;
          const isTiny = ps.type === "line" || ps.type === "arrow"
            ? Math.abs((ps.x2 ?? ps.x) - ps.x) < minD && Math.abs((ps.y2 ?? ps.y) - ps.y) < minD
            : Math.abs(ps.w) < minD && Math.abs(ps.h) < minD;
          if (isTiny) {
            setShapes((prev) => prev.filter((s) => s.id !== ps.id));
            pendingShape.current = null;
            return;
          }
        }
        snap(shapesRef.current);
        pendingShape.current = null;
      }
    }
  }, [snap]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => {
      const n = e.deltaY < 0 ? z * 1.15 : z / 1.15;
      return Math.max(0.1, Math.min(10, n));
    });
  }, []);

  const onDblClick = useCallback(() => {
    if (tool === "pen" && pendingShape.current) {
      snap(shapesRef.current);
      setSelId(pendingShape.current.id);
      pendingShape.current = null;
      penPts.current = [];
    }
  }, [tool, snap]);

  /* ── shape operations ── */
  const deleteShape = useCallback(() => {
    if (!selId) return;
    const next = shapes.filter((s) => s.id !== selId);
    snap(next); setShapes(next); setSelId(null);
  }, [selId, shapes, snap]);

  const bringToFront = useCallback(() => {
    if (!selId) return;
    const next = [...shapes.filter((s) => s.id !== selId), shapes.find((s) => s.id === selId)!];
    snap(next); setShapes(next);
  }, [selId, shapes, snap]);

  const sendToBack = useCallback(() => {
    if (!selId) return;
    const next = [shapes.find((s) => s.id === selId)!, ...shapes.filter((s) => s.id !== selId)];
    snap(next); setShapes(next);
  }, [selId, shapes, snap]);

  const updateSel = useCallback(
    (patch: Partial<VShape>) => {
      if (!selId) return;
      setShapes((prev) => prev.map((s) => (s.id === selId ? { ...s, ...patch } : s)));
    },
    [selId],
  );

  /* ── clipboard ── */
  const copyShape = useCallback(() => {
    if (!selShape) return;
    clipboard.current = JSON.parse(JSON.stringify(selShape));
    setHasClipboard(true);
  }, [selShape]);

  const pasteShape = useCallback(() => {
    if (!clipboard.current) return;
    const ns: VShape = { ...JSON.parse(JSON.stringify(clipboard.current)), id: sid(), x: clipboard.current.x + 20, y: clipboard.current.y + 20 };
    const next = [...shapes, ns];
    snap(next); setShapes(next); setSelId(ns.id);
  }, [shapes, snap]);

  const duplicateShape = useCallback(() => {
    if (!selShape) return;
    const ns: VShape = { ...JSON.parse(JSON.stringify(selShape)), id: sid(), x: selShape.x + 20, y: selShape.y + 20 };
    const next = [...shapes, ns];
    snap(next); setShapes(next); setSelId(ns.id);
  }, [selShape, shapes, snap]);

  /* ── flip ── */
  const flipH = useCallback(() => {
    if (!selId || !selShape) return;
    if (selShape.points) {
      const cx = selShape.x + selShape.w / 2;
      const next = shapes.map((s) =>
        s.id === selId ? { ...s, points: s.points?.map((pt) => ({ x: cx * 2 - pt.x, y: pt.y })) } : s,
      );
      snap(next); setShapes(next);
    } else if (selShape.type === "line" || selShape.type === "arrow") {
      const next = shapes.map((s) => s.id === selId ? { ...s, x: s.x2 ?? s.x, x2: s.x } : s);
      snap(next); setShapes(next);
    } else {
      const newRot = selShape.rotation ? -selShape.rotation : 0;
      const next = shapes.map((s) => s.id === selId ? { ...s, rotation: newRot } : s);
      snap(next); setShapes(next);
    }
  }, [selId, selShape, shapes, snap]);

  const flipV = useCallback(() => {
    if (!selId || !selShape) return;
    if (selShape.points) {
      const cy = selShape.y + selShape.h / 2;
      const next = shapes.map((s) =>
        s.id === selId ? { ...s, points: s.points?.map((pt) => ({ x: pt.x, y: cy * 2 - pt.y })) } : s,
      );
      snap(next); setShapes(next);
    } else if (selShape.type === "line" || selShape.type === "arrow") {
      const next = shapes.map((s) => s.id === selId ? { ...s, y: s.y2 ?? s.y, y2: s.y } : s);
      snap(next); setShapes(next);
    } else {
      const newRot = selShape.rotation ? (180 - selShape.rotation) % 360 : 180;
      const next = shapes.map((s) => s.id === selId ? { ...s, rotation: newRot } : s);
      snap(next); setShapes(next);
    }
  }, [selId, selShape, shapes, snap]);

  /* ── alignment ── */
  const alignShapes = useCallback(
    (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (!selId || !selShape) return;
      let patch: Partial<VShape> = {};
      switch (mode) {
        case "left": patch = { x: 0 }; break;
        case "right": patch = { x: artW - selShape.w }; break;
        case "center": patch = { x: (artW - selShape.w) / 2 }; break;
        case "top": patch = { y: 0 }; break;
        case "bottom": patch = { y: artH - selShape.h }; break;
        case "middle": patch = { y: (artH - selShape.h) / 2 }; break;
      }
      const next = shapes.map((s) => (s.id === selId ? { ...s, ...patch } : s));
      snap(next); setShapes(next);
    },
    [selId, selShape, shapes, snap, artW, artH],
  );

  /* ── SVG import ── */
  const importSVGString = useCallback(
    (raw: string) => {
      try {
        const imported = parseSVGToShapes(raw);
        if (imported.length === 0) { alert("No supported shapes found in SVG."); return; }
        const next = [...shapes, ...imported];
        snap(next); setShapes(next); setDlgSvg(false);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to parse SVG.");
      }
    },
    [shapes, snap],
  );

  const openFile = useCallback(
    async (file: File) => { importSVGString(await file.text()); },
    [importSVGString],
  );

  /* ── new / reset ── */
  const newCanvas = useCallback(() => {
    snap([]); setShapes([]); setSelId(null); setZoom(1); setPx(0); setPy(0);
  }, [snap]);

  /* ── save to library ── */
  const saveToLibrary = useCallback(() => {
    if (!onSaveToLibrary) return;
    const svg = buildSVGString(shapes, artW, artH);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const reader = new FileReader();
    reader.onload = () => {
      const defaultName = "drawing.svg";
      const name = window.prompt("Save to library as:", defaultName);
      if (!name || !name.trim()) return;
      onSaveToLibrary(reader.result as string, name.trim(), "image/svg+xml");
    };
    reader.readAsDataURL(blob);
  }, [shapes, artW, artH, onSaveToLibrary]);

  /* ── export shortcuts ── */
  const exportSVG = useCallback(() => exportSVGFile(shapes, artW, artH), [shapes, artW, artH]);
  const exportPNG = useCallback(() => exportPNGFile(shapes, artW, artH), [shapes, artW, artH]);
  const exportJPG = useCallback(() => exportJPGFile(shapes, artW, artH), [shapes, artW, artH]);
  const exportWebP = useCallback(() => exportWebPFile(shapes, artW, artH), [shapes, artW, artH]);
  const exportBMP = useCallback(() => exportBMPFile(shapes, artW, artH), [shapes, artW, artH]);

  /* ── tool switch helper (finishes pen) ── */
  const switchTool = useCallback(
    (newTool: VTool) => {
      if (tool === "pen" && newTool !== "pen" && pendingShape.current) {
        snap(shapes);
        pendingShape.current = null;
        penPts.current = [];
      }
      setTool(newTool);
    },
    [tool, shapes, snap],
  );

  /* ── keyboard ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); return; }
      if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); return; }
      if (e.ctrlKey && e.key === "c") { e.preventDefault(); copyShape(); return; }
      if (e.ctrlKey && e.key === "v") { e.preventDefault(); pasteShape(); return; }
      if (e.ctrlKey && e.key === "d") { e.preventDefault(); duplicateShape(); return; }
      if (e.key === "Escape") {
        if (pendingShape.current) {
          setShapes((prev) => prev.filter((s) => s.id !== pendingShape.current!.id));
          pendingShape.current = null;
          drawing.current = false;
          penPts.current = [];
        } else {
          setSelId(null);
        }
        return;
      }
      const km: Record<string, VTool> = {
        v: "pointer", r: "rect", u: "roundrect", c: "ellipse", l: "line",
        a: "arrow", g: "polygon", s: "star", p: "pen", t: "text",
      };
      if (km[e.key.toLowerCase()] && !e.ctrlKey && !e.altKey) { setTool(km[e.key.toLowerCase()]); return; }
      if (e.key === "Delete" || e.key === "Backspace") deleteShape();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [undo, redo, deleteShape, copyShape, pasteShape, duplicateShape]);

  /* ── return ── */
  return {
    // state
    shapes, selId, tool, fillCol, strokeCol, strokeW, fontSize, fontFamily,
    shapeOpacity, cornerRadius, polygonSides, starPoints2, starInnerRatio,
    zoom, px, py, dlgSvg, svgText, snapGrid, gridSize, hasClipboard,
    // derived
    selShape,
    // setters
    setTool, setFillCol, setStrokeCol, setStrokeW, setFontSize, setFontFamily,
    setShapeOpacity, setCornerRadius, setPolygonSides, setStarPoints2, setStarInnerRatio,
    setZoom, setDlgSvg, setSvgText, setSnapGrid, setGridSize, setSelId,
    // refs
    boxRef, fInp,
    // mouse handlers
    onDown, onMove, onUp, onWheel, onDblClick,
    // actions
    undo, redo, deleteShape, bringToFront, sendToBack, updateSel,
    copyShape, pasteShape, duplicateShape,
    flipH, flipV, alignShapes,
    importSVGString, openFile, newCanvas,
    exportSVG, exportPNG, exportJPG, exportWebP, exportBMP,
    switchTool, saveToLibrary,
  } as const;
}

/** Return type for sub-component props */
export type VectorEditorAPI = ReturnType<typeof useVectorEditor>;
