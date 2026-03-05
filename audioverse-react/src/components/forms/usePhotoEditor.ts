/**
 * usePhotoEditor.ts — Custom hook encapsulating all PhotoEditor state & logic.
 *
 * Extracts ~500 lines of state, effects, callbacks, and memoised values
 * out of the god-component so that the main component file is pure composition.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    PHOTO_FILTERS,
    DEFAULT_ADJUSTMENTS,
    renderToCanvas,
    canvasToFile,
    type AdjustmentValues,
    type FilterParams,
    type FilterDefinition,
} from "../../scripts/photoFilters";
import {
    type Overlay,
    type DrawingOverlay,
    type DrawingStroke,
    renderAllOverlays,
    renderLiveStroke,
    hitTestOverlay,
    createEmojiOverlay,
    createTextOverlay,
    createShapeOverlay,
    createDrawingOverlay,
    createFrameOverlay,
    serializeEditorState,
    deserializeEditorState,
    EMOJI_CATALOG,
} from "../../scripts/photoOverlays";
import {
    type PhotoEditorProps,
    type EditorTab,
    type FilterCategory,
} from "./photoEditorTypes";
import {
    getExportBlob,
    handleDownloadBlob,
    handleCopyImageToClipboard,
    handleNativeShare,
    type ExportParams,
} from "./photoEditorActions";

// ── Internal types ──

type EditorState = {
    selectedFilter: string;
    filterIntensity: number;
    adjustments: AdjustmentValues;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    cropRect: { x: number; y: number; w: number; h: number } | null;
    overlays: Overlay[];
};

// ── Public API type ──

export interface PhotoEditorAPI {
    // i18n
    t: ReturnType<typeof useTranslation>["t"];
    // Props pass-through
    playerColor: string;
    onCancel: () => void;
    accent: string;
    accentDim: string;

    // Image
    image: HTMLImageElement | null;
    loading: boolean;

    // Tabs
    activeTab: EditorTab;
    setActiveTab: (tab: EditorTab) => void;
    setCropMode: (v: boolean) => void;

    // Filters
    selectedFilter: string;
    setSelectedFilter: (f: string) => void;
    filterIntensity: number;
    setFilterIntensity: (v: number) => void;
    filterCategory: FilterCategory;
    setFilterCategory: (c: FilterCategory) => void;
    filteredList: FilterDefinition[];
    generateThumbnail: (canvas: HTMLCanvasElement, filter: FilterDefinition) => void;

    // Adjustments
    adjustments: AdjustmentValues;
    handleAdjChange: (key: keyof AdjustmentValues, value: number) => void;
    handleAdjChangeEnd: () => void;

    // Transform
    rotation: number;
    setRotation: (v: number) => void;
    flipH: boolean;
    setFlipH: (v: boolean) => void;
    flipV: boolean;
    setFlipV: (v: boolean) => void;
    zoom: number;
    setZoom: (v: number) => void;

    // Crop
    cropMode: boolean;
    cropRect: { x: number; y: number; w: number; h: number } | null;
    setCropRect: (r: { x: number; y: number; w: number; h: number } | null) => void;
    cropAspect: number | null;
    setCropAspect: (v: number | null) => void;
    handleCropMouseDown: (e: React.MouseEvent, handle: string) => void;

    // Compare
    showCompare: boolean;
    setShowCompare: (v: boolean) => void;
    comparePosition: number;
    setCompareDragging: (v: boolean) => void;

    // Overlays
    overlays: Overlay[];
    setOverlays: React.Dispatch<React.SetStateAction<Overlay[]>>;
    selectedOverlayId: string | null;
    setSelectedOverlayId: (id: string | null) => void;
    selectedOverlay: Overlay | null;
    addOverlay: (ov: Overlay) => void;
    updateOverlay: (id: string, patch: Partial<Overlay>) => void;
    deleteOverlay: (id: string) => void;
    moveOverlayForward: (id: string) => void;
    moveOverlayBack: (id: string) => void;

    // Sticker / emoji
    emojiCat: string;
    setEmojiCat: (id: string) => void;

    // Text state
    textDraft: string;
    setTextDraft: (v: string) => void;
    textColor: string;
    setTextColor: (v: string) => void;
    textBold: boolean;
    setTextBold: (v: boolean) => void;
    textItalic: boolean;
    setTextItalic: (v: boolean) => void;
    textOutline: boolean;
    setTextOutline: (v: boolean) => void;
    textFontSize: number;
    setTextFontSize: (v: number) => void;
    textBg: boolean;
    setTextBg: (v: boolean) => void;

    // Shape state
    shapeStroke: string;
    setShapeStroke: (v: string) => void;
    shapeFill: string;
    setShapeFill: (v: string) => void;
    shapeStrokeW: number;
    setShapeStrokeW: (v: number) => void;

    // Frame state
    frameColor: string;
    setFrameColor: (v: string) => void;
    frameThick: number;
    setFrameThick: (v: number) => void;

    // Drawing state
    drawColor: string;
    setDrawColor: (v: string) => void;
    drawWidth: number;
    setDrawWidth: (v: number) => void;
    drawingOverlayRef: React.MutableRefObject<DrawingOverlay | null>;

    // History
    historyIdx: number;
    historyLength: number;
    undo: () => void;
    redo: () => void;
    pushHistory: () => void;

    // Actions
    handleSave: () => Promise<void>;
    handleReset: () => void;
    handleDownload: () => Promise<void>;
    handleCopyToClipboard: () => Promise<void>;
    handleShareNative: () => Promise<void>;

    // Canvas refs
    mainCanvasRef: React.RefObject<HTMLCanvasElement>;
    compareCanvasRef: React.RefObject<HTMLCanvasElement>;
    containerRef: React.RefObject<HTMLDivElement>;

    // Canvas mouse handlers
    handleCanvasMouseDown: (e: React.MouseEvent) => void;
    handleCanvasMouseMove: (e: React.MouseEvent) => void;
    handleCanvasMouseUp: () => void;

    // Overlay helpers for tabs
    createEmojiOverlay: typeof createEmojiOverlay;
    createTextOverlay: typeof createTextOverlay;
    createShapeOverlay: typeof createShapeOverlay;
    createFrameOverlay: typeof createFrameOverlay;
}

// ── Hook ──

export function usePhotoEditor({ src, playerColor = "#00aaff", onSave, onCancel, initialState }: PhotoEditorProps): PhotoEditorAPI {
    const { t } = useTranslation();

    // ── State ──

    // Image
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [loading, setLoading] = useState(true);

    // Tabs
    const [activeTab, setActiveTabRaw] = useState<EditorTab>("filters");
    const [cropMode, setCropMode] = useState(false);

    // Filter
    const [selectedFilter, setSelectedFilter] = useState("none");
    const [filterIntensity, setFilterIntensity] = useState(1);
    const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
    const [filterParams] = useState<FilterParams>({});

    // Adjustments
    const [adjustments, setAdjustments] = useState<AdjustmentValues>({ ...DEFAULT_ADJUSTMENTS });

    // Transform
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);

    // Crop
    const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [cropAspect, setCropAspect] = useState<number | null>(null);
    const [cropDragging, setCropDragging] = useState<string | null>(null);
    const [cropStart, setCropStart] = useState<{ mx: number; my: number; rect: { x: number; y: number; w: number; h: number } } | null>(null);

    // Compare
    const [showCompare, setShowCompare] = useState(false);
    const [comparePosition, setComparePosition] = useState(50);
    const [compareDragging, setCompareDragging] = useState(false);

    // Zoom
    const [zoom, setZoom] = useState(1);

    // Overlays
    const [overlays, setOverlays] = useState<Overlay[]>([]);
    const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
    const [overlayDragging, setOverlayDragging] = useState(false);
    const [overlayDragStart, setOverlayDragStart] = useState<{ mx: number; my: number; ox: number; oy: number } | null>(null);

    // Sticker / emoji
    const [emojiCat, setEmojiCat] = useState(EMOJI_CATALOG[0].id);

    // Text overlay
    const [textDraft, setTextDraft] = useState("Tekst");
    const [textColor, setTextColor] = useState("#ffffff");
    const [textBold, setTextBold] = useState(true);
    const [textItalic, setTextItalic] = useState(false);
    const [textOutline, setTextOutline] = useState(true);
    const [textFontSize, setTextFontSize] = useState(36);
    const [textBg, setTextBg] = useState(false);

    // Shape
    const [shapeStroke, setShapeStroke] = useState("#ffffff");
    const [shapeFill, setShapeFill] = useState("");
    const [shapeStrokeW, setShapeStrokeW] = useState(3);

    // Frame
    const [frameColor, setFrameColor] = useState("#ffffff");
    const [frameThick, setFrameThick] = useState(3);

    // Drawing
    const [drawColor, setDrawColor] = useState("#ff0000");
    const [drawWidth, setDrawWidth] = useState(4);
    const [isDrawing, setIsDrawing] = useState(false);
    const [livePoints, setLivePoints] = useState<[number, number][]>([]);
    const drawingOverlayRef = useRef<DrawingOverlay | null>(null);

    // History
    const [history, setHistory] = useState<EditorState[]>([]);
    const [historyIdx, setHistoryIdx] = useState(-1);
    const suppressHistoryRef = useRef(false);

    // Canvas refs
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const compareCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Derived ──

    const accent = playerColor;
    const accentDim = playerColor + "55";
    const selectedOverlay = useMemo(() => overlays.find(o => o.id === selectedOverlayId) ?? null, [overlays, selectedOverlayId]);

    // Tab setter (auto-toggle cropMode)
    const setActiveTab = useCallback((tab: EditorTab) => {
        setActiveTabRaw(tab);
        setCropMode(tab === "crop");
    }, []);

    // ── History ──

    const pushHistory = useCallback(() => {
        if (suppressHistoryRef.current) return;
        const state: EditorState = {
            selectedFilter,
            filterIntensity,
            adjustments: { ...adjustments },
            rotation,
            flipH,
            flipV,
            cropRect: cropRect ? { ...cropRect } : null,
            overlays: overlays.map(o => ({ ...o })),
        };
        setHistory(prev => [...prev.slice(0, historyIdx + 1), state]);
        setHistoryIdx(prev => prev + 1);
    }, [selectedFilter, filterIntensity, adjustments, rotation, flipH, flipV, cropRect, overlays, historyIdx]);

    const restoreState = useCallback((s: EditorState) => {
        suppressHistoryRef.current = true;
        setSelectedFilter(s.selectedFilter);
        setFilterIntensity(s.filterIntensity);
        setAdjustments({ ...s.adjustments });
        setRotation(s.rotation);
        setFlipH(s.flipH);
        setFlipV(s.flipV);
        setCropRect(s.cropRect ? { ...s.cropRect } : null);
        setOverlays(s.overlays.map(o => ({ ...o })));
        setSelectedOverlayId(null);
        setTimeout(() => { suppressHistoryRef.current = false; }, 50);
    }, []);

    const undo = useCallback(() => {
        if (historyIdx > 0) {
            const newIdx = historyIdx - 1;
            setHistoryIdx(newIdx);
            restoreState(history[newIdx]);
        }
    }, [historyIdx, history, restoreState]);

    const redo = useCallback(() => {
        if (historyIdx < history.length - 1) {
            const newIdx = historyIdx + 1;
            setHistoryIdx(newIdx);
            restoreState(history[newIdx]);
        }
    }, [historyIdx, history, restoreState]);

    // ── Load image ──

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setImage(img);
            setLoading(false);
            setCropRect({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight });
        };
        img.onerror = () => setLoading(false);
        if (src instanceof File || src instanceof Blob) {
            img.src = URL.createObjectURL(src);
        } else {
            img.crossOrigin = "anonymous";
            img.src = src;
        }
        return () => {
            if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
        };
    }, [src]);

    // Push initial history once image loads
    useEffect(() => {
        if (image && history.length === 0) {
            if (initialState) {
                const prev = deserializeEditorState(initialState);
                if (prev) {
                    suppressHistoryRef.current = true;
                    setSelectedFilter(prev.filter);
                    setFilterIntensity(prev.filterIntensity);
                    setAdjustments({ ...prev.adjustments });
                    setRotation(prev.rotation);
                    setFlipH(prev.flipH);
                    setFlipV(prev.flipV);
                    if (prev.cropRect) setCropRect(prev.cropRect);
                    if (prev.overlays) setOverlays(prev.overlays);
                    setTimeout(() => { suppressHistoryRef.current = false; }, 50);
                }
            }
            pushHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image]);

    // ── Render main canvas ──

    const renderMain = useCallback(() => {
        if (!image || !mainCanvasRef.current) return;
        renderToCanvas(
            mainCanvasRef.current,
            image,
            selectedFilter,
            { ...filterParams, intensity: filterIntensity },
            adjustments,
            cropMode ? null : cropRect,
            rotation,
            flipH,
            flipV,
        );
        if (overlays.length > 0 || livePoints.length > 1) {
            const ctx = mainCanvasRef.current.getContext("2d");
            if (ctx) {
                const cw = mainCanvasRef.current.width;
                const ch = mainCanvasRef.current.height;
                if (overlays.length > 0) renderAllOverlays(ctx, overlays, cw, ch);
                if (livePoints.length > 1) renderLiveStroke(ctx, livePoints, drawColor, drawWidth, cw, ch);
            }
        }
    }, [image, selectedFilter, filterParams, filterIntensity, adjustments, cropRect, cropMode, rotation, flipH, flipV, overlays, livePoints, drawColor, drawWidth]);

    useEffect(() => { renderMain(); }, [renderMain]);

    // Render compare canvas (original)
    useEffect(() => {
        if (!image || !compareCanvasRef.current || !showCompare) return;
        const canvas = compareCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const crop = cropRect ?? { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };
        canvas.width = crop.w;
        canvas.height = crop.h;
        ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
    }, [image, showCompare, cropRect]);

    // ── Filter thumbnails ──

    const filteredList = useMemo<FilterDefinition[]>(() => {
        if (filterCategory === "all") return PHOTO_FILTERS;
        return PHOTO_FILTERS.filter(f => f.category === filterCategory || f.id === "none");
    }, [filterCategory]);

    const generateThumbnail = useCallback((canvas: HTMLCanvasElement, filter: FilterDefinition) => {
        if (!image) return;
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        const s = Math.min(image.naturalWidth, image.naturalHeight);
        const sx = (image.naturalWidth - s) / 2;
        const sy = (image.naturalHeight - s) / 2;
        ctx.drawImage(image, sx, sy, s, s, 0, 0, size, size);
        if (filter.id !== "none") {
            const imgData = ctx.getImageData(0, 0, size, size);
            const filtered = filter.apply(imgData, { intensity: 1 });
            ctx.putImageData(filtered, 0, 0);
        }
    }, [image]);

    // ── Crop interaction ──

    const getCanvasScale = useCallback(() => {
        if (!mainCanvasRef.current || !containerRef.current || !image) return { sx: 1, sy: 1, ox: 0, oy: 0 };
        const rect = mainCanvasRef.current.getBoundingClientRect();
        const cw = mainCanvasRef.current.width;
        const ch = mainCanvasRef.current.height;
        return { sx: cw / rect.width, sy: ch / rect.height, ox: rect.left, oy: rect.top };
    }, [image]);

    const handleCropMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
        e.preventDefault();
        e.stopPropagation();
        setCropDragging(handle);
        setCropStart({ mx: e.clientX, my: e.clientY, rect: { ...cropRect! } });
    }, [cropRect]);

    useEffect(() => {
        if (!cropDragging || !cropStart || !cropRect || !image) return;
        const handleMove = (e: MouseEvent) => {
            const scale = getCanvasScale();
            const dx = (e.clientX - cropStart.mx) * scale.sx;
            const dy = (e.clientY - cropStart.my) * scale.sy;
            const r = { ...cropStart.rect };
            const minSize = 20;

            if (cropDragging === "move") {
                r.x = Math.max(0, Math.min(image.naturalWidth - r.w, r.x + dx));
                r.y = Math.max(0, Math.min(image.naturalHeight - r.h, r.y + dy));
            } else {
                if (cropDragging.includes("w")) { r.x += dx; r.w -= dx; }
                if (cropDragging.includes("e")) { r.w += dx; }
                if (cropDragging.includes("n")) { r.y += dy; r.h -= dy; }
                if (cropDragging.includes("s")) { r.h += dy; }
                if (r.w < minSize) { r.w = minSize; }
                if (r.h < minSize) { r.h = minSize; }
                if (cropAspect) {
                    if (cropDragging.includes("w") || cropDragging.includes("e")) {
                        r.h = r.w / cropAspect;
                    } else {
                        r.w = r.h * cropAspect;
                    }
                }
                r.x = Math.max(0, r.x);
                r.y = Math.max(0, r.y);
                r.w = Math.min(r.w, image.naturalWidth - r.x);
                r.h = Math.min(r.h, image.naturalHeight - r.y);
            }

            setCropRect(r);
            setCropStart({ mx: e.clientX, my: e.clientY, rect: r });
        };
        const handleUp = () => {
            setCropDragging(null);
            setCropStart(null);
            pushHistory();
        };
        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [cropDragging, cropStart, cropRect, image, cropAspect, getCanvasScale, pushHistory]);

    // Compare slider drag
    useEffect(() => {
        if (!compareDragging) return;
        const handleMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            setComparePosition(pct);
        };
        const handleUp = () => setCompareDragging(false);
        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [compareDragging]);

    // ── Keyboard shortcuts ──

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
            if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [undo, redo]);

    // ── Adjustments ──

    const handleAdjChange = useCallback((key: keyof AdjustmentValues, value: number) => {
        setAdjustments(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleAdjChangeEnd = useCallback(() => pushHistory(), [pushHistory]);

    // ── Overlay helpers ──

    const addOverlay = useCallback((ov: Overlay) => {
        setOverlays(prev => [...prev, ov]);
        setSelectedOverlayId(ov.id);
        setTimeout(() => pushHistory(), 30);
    }, [pushHistory]);

    const updateOverlay = useCallback((id: string, patch: Partial<Overlay>) => {
        setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...patch } as Overlay : o));
    }, []);

    const deleteOverlay = useCallback((id: string) => {
        setOverlays(prev => prev.filter(o => o.id !== id));
        if (selectedOverlayId === id) setSelectedOverlayId(null);
        setTimeout(() => pushHistory(), 30);
    }, [selectedOverlayId, pushHistory]);

    const moveOverlayForward = useCallback((id: string) => {
        setOverlays(prev => {
            const idx = prev.findIndex(o => o.id === id);
            if (idx < 0 || idx >= prev.length - 1) return prev;
            const copy = [...prev];
            [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
            return copy;
        });
    }, []);

    const moveOverlayBack = useCallback((id: string) => {
        setOverlays(prev => {
            const idx = prev.findIndex(o => o.id === id);
            if (idx <= 0) return prev;
            const copy = [...prev];
            [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
            return copy;
        });
    }, []);

    // ── Canvas fraction from mouse event ──

    const getCanvasFraction = useCallback((e: React.MouseEvent) => {
        if (!mainCanvasRef.current) return { fx: 0.5, fy: 0.5 };
        const rect = mainCanvasRef.current.getBoundingClientRect();
        return {
            fx: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
            fy: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
        };
    }, []);

    // ── Canvas mouse handlers ──

    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
        if (cropMode) return;
        const { fx, fy } = getCanvasFraction(e);

        if (activeTab === "draw") {
            e.preventDefault();
            setIsDrawing(true);
            setLivePoints([[fx, fy]]);
            return;
        }

        for (let i = overlays.length - 1; i >= 0; i--) {
            const cw = mainCanvasRef.current?.width ?? 1;
            const ch = mainCanvasRef.current?.height ?? 1;
            if (hitTestOverlay(overlays[i], fx, fy, cw, ch)) {
                setSelectedOverlayId(overlays[i].id);
                setOverlayDragging(true);
                setOverlayDragStart({ mx: fx, my: fy, ox: overlays[i].x, oy: overlays[i].y });
                e.preventDefault();
                return;
            }
        }
        setSelectedOverlayId(null);
    }, [cropMode, activeTab, getCanvasFraction, overlays]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
        const { fx, fy } = getCanvasFraction(e);
        if (isDrawing) {
            setLivePoints(prev => [...prev, [fx, fy]]);
            return;
        }
        if (overlayDragging && overlayDragStart && selectedOverlayId) {
            const dx = fx - overlayDragStart.mx;
            const dy = fy - overlayDragStart.my;
            updateOverlay(selectedOverlayId, {
                x: Math.max(0, Math.min(1, overlayDragStart.ox + dx)),
                y: Math.max(0, Math.min(1, overlayDragStart.oy + dy)),
            });
        }
    }, [getCanvasFraction, isDrawing, overlayDragging, overlayDragStart, selectedOverlayId, updateOverlay]);

    const handleCanvasMouseUp = useCallback(() => {
        if (isDrawing && livePoints.length > 1) {
            const stroke: DrawingStroke = { points: [...livePoints], color: drawColor, width: drawWidth, opacity: 1 };
            if (!drawingOverlayRef.current) {
                const dOv = createDrawingOverlay();
                dOv.strokes.push(stroke);
                drawingOverlayRef.current = dOv;
                setOverlays(prev => [...prev, dOv]);
            } else {
                const id = drawingOverlayRef.current.id;
                setOverlays(prev => prev.map(o =>
                    o.id === id && o.type === "drawing"
                        ? { ...o, strokes: [...(o as DrawingOverlay).strokes, stroke] }
                        : o,
                ));
            }
            setLivePoints([]);
            setIsDrawing(false);
            pushHistory();
            return;
        }
        setIsDrawing(false);
        setLivePoints([]);
        if (overlayDragging) {
            setOverlayDragging(false);
            setOverlayDragStart(null);
            pushHistory();
        }
    }, [isDrawing, livePoints, drawColor, drawWidth, overlayDragging, pushHistory]);

    // ── Actions ──

    const buildExportParams = useCallback((): ExportParams | null => {
        if (!image) return null;
        return { image, selectedFilter, filterParams, filterIntensity, adjustments, cropRect, rotation, flipH, flipV, overlays };
    }, [image, selectedFilter, filterParams, filterIntensity, adjustments, cropRect, rotation, flipH, flipV, overlays]);

    const handleSave = useCallback(async () => {
        if (!image || !mainCanvasRef.current) return;
        const exportCanvas = document.createElement("canvas");
        renderToCanvas(
            exportCanvas,
            image,
            selectedFilter,
            { ...filterParams, intensity: filterIntensity },
            adjustments,
            cropRect,
            rotation,
            flipH,
            flipV,
        );
        if (overlays.length > 0) {
            const ctx = exportCanvas.getContext("2d");
            if (ctx) renderAllOverlays(ctx, overlays, exportCanvas.width, exportCanvas.height);
        }
        const file = await canvasToFile(exportCanvas, "player-photo.jpg", 0.92);
        const editorState = serializeEditorState({
            filter: selectedFilter,
            filterIntensity,
            adjustments: { ...adjustments },
            rotation,
            flipH,
            flipV,
            cropRect: cropRect ? { ...cropRect } : null,
            overlays,
        });
        onSave(file, editorState);
    }, [image, selectedFilter, filterParams, filterIntensity, adjustments, cropRect, rotation, flipH, flipV, overlays, onSave]);

    const handleReset = useCallback(() => {
        setSelectedFilter("none");
        setFilterIntensity(1);
        setAdjustments({ ...DEFAULT_ADJUSTMENTS });
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setOverlays([]);
        setSelectedOverlayId(null);
        if (image) {
            setCropRect({ x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight });
        }
        setCropMode(false);
        setZoom(1);
        pushHistory();
    }, [image, pushHistory]);

    const handleDownload = useCallback(async () => {
        const p = buildExportParams();
        if (!p) return;
        const blob = await getExportBlob(p);
        if (blob) handleDownloadBlob(blob);
    }, [buildExportParams]);

    const handleCopyToClipboard = useCallback(async () => {
        const p = buildExportParams();
        if (!p) return;
        await handleCopyImageToClipboard(p);
    }, [buildExportParams]);

    const handleShareNative = useCallback(async () => {
        const p = buildExportParams();
        if (!p) return;
        const blob = await getExportBlob(p);
        if (blob) await handleNativeShare(blob);
    }, [buildExportParams]);

    // ── Return ──

    return {
        t,
        playerColor,
        onCancel,
        accent,
        accentDim,

        image,
        loading,

        activeTab,
        setActiveTab,
        setCropMode,

        selectedFilter,
        setSelectedFilter,
        filterIntensity,
        setFilterIntensity,
        filterCategory,
        setFilterCategory,
        filteredList,
        generateThumbnail,

        adjustments,
        handleAdjChange,
        handleAdjChangeEnd,

        rotation,
        setRotation,
        flipH,
        setFlipH,
        flipV,
        setFlipV,
        zoom,
        setZoom,

        cropMode,
        cropRect,
        setCropRect,
        cropAspect,
        setCropAspect,
        handleCropMouseDown,

        showCompare,
        setShowCompare,
        comparePosition,
        setCompareDragging,

        overlays,
        setOverlays,
        selectedOverlayId,
        setSelectedOverlayId,
        selectedOverlay,
        addOverlay,
        updateOverlay,
        deleteOverlay,
        moveOverlayForward,
        moveOverlayBack,

        emojiCat,
        setEmojiCat,

        textDraft,
        setTextDraft,
        textColor,
        setTextColor,
        textBold,
        setTextBold,
        textItalic,
        setTextItalic,
        textOutline,
        setTextOutline,
        textFontSize,
        setTextFontSize,
        textBg,
        setTextBg,

        shapeStroke,
        setShapeStroke,
        shapeFill,
        setShapeFill,
        shapeStrokeW,
        setShapeStrokeW,

        frameColor,
        setFrameColor,
        frameThick,
        setFrameThick,

        drawColor,
        setDrawColor,
        drawWidth,
        setDrawWidth,
        drawingOverlayRef,

        historyIdx,
        historyLength: history.length,
        undo,
        redo,
        pushHistory,

        handleSave,
        handleReset,
        handleDownload,
        handleCopyToClipboard,
        handleShareNative,

        mainCanvasRef,
        compareCanvasRef,
        containerRef,

        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp,

        createEmojiOverlay,
        createTextOverlay,
        createShapeOverlay,
        createFrameOverlay,
    };
}
