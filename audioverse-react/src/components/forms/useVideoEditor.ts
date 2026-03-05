/**
 * useVideoEditor — custom hook extracting all state + logic from VideoEditor.
 *
 * Contains: ~22 useState, 6 useRef, render loop, keyboard shortcuts,
 * playback controls, trim dragging, text overlays, save/reset/share.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    VIDEO_FILTERS,
    DEFAULT_VIDEO_ADJUSTMENTS,
    serializeVideoState,
    deserializeVideoState,
    renderVideoFrame,
    renderVideoTextOverlay,
    type VideoAdjustments,
    type VideoFilterCategory,
    type VideoClipState,
    type VideoTextOverlay,
    type TextAnimation,
    type TransitionKind,
    type VideoFilterDef,
} from "../../scripts/videoEffects";

/* ─── options ─── */

export interface UseVideoEditorOptions {
    src: File | Blob | string;
    playerColor?: string;
    onSave: (file: File, editorStateJson?: string) => void;
    onCancel: () => void;
    initialState?: string | null;
}

export type EditorTab = "filters" | "adjust" | "trim" | "speed" | "text" | "transitions" | "transform" | "share";

/* ─── return type ─── */

export interface VideoEditorAPI {
    /* refs */
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    containerRef: React.RefObject<HTMLDivElement>;
    timelineRef: React.RefObject<HTMLDivElement>;

    /* core state */
    loading: boolean;
    duration: number;
    currentTime: number;
    isPlaying: boolean;
    activeTab: EditorTab;
    setActiveTab: React.Dispatch<React.SetStateAction<EditorTab>>;
    videoReady: boolean;

    /* clip state */
    filterId: string;
    setFilterId: React.Dispatch<React.SetStateAction<string>>;
    filterIntensity: number;
    setFilterIntensity: React.Dispatch<React.SetStateAction<number>>;
    filterCategory: VideoFilterCategory;
    setFilterCategory: React.Dispatch<React.SetStateAction<VideoFilterCategory>>;
    adjustments: VideoAdjustments;
    handleAdjChange: (key: keyof VideoAdjustments, value: number) => void;
    resetAdjustments: () => void;
    speed: number;
    setSpeed: React.Dispatch<React.SetStateAction<number>>;
    trimStart: number;
    setTrimStart: React.Dispatch<React.SetStateAction<number>>;
    trimEnd: number;
    setTrimEnd: React.Dispatch<React.SetStateAction<number>>;
    rotation: number;
    setRotation: React.Dispatch<React.SetStateAction<number>>;
    flipH: boolean;
    setFlipH: React.Dispatch<React.SetStateAction<boolean>>;
    flipV: boolean;
    setFlipV: React.Dispatch<React.SetStateAction<boolean>>;
    volume: number;
    setVolume: React.Dispatch<React.SetStateAction<number>>;
    transitionIn: TransitionKind;
    setTransitionIn: React.Dispatch<React.SetStateAction<TransitionKind>>;
    transitionOut: TransitionKind;
    setTransitionOut: React.Dispatch<React.SetStateAction<TransitionKind>>;
    transitionDuration: number;
    setTransitionDuration: React.Dispatch<React.SetStateAction<number>>;

    /* text overlay state */
    textOverlays: VideoTextOverlay[];
    selectedTextId: string | null;
    setSelectedTextId: React.Dispatch<React.SetStateAction<string | null>>;
    textDraft: string;
    setTextDraft: React.Dispatch<React.SetStateAction<string>>;
    textColor: string;
    setTextColor: React.Dispatch<React.SetStateAction<string>>;
    textBold: boolean;
    setTextBold: React.Dispatch<React.SetStateAction<boolean>>;
    textItalic: boolean;
    setTextItalic: React.Dispatch<React.SetStateAction<boolean>>;
    textOutline: boolean;
    setTextOutline: React.Dispatch<React.SetStateAction<boolean>>;
    textBg: boolean;
    setTextBg: React.Dispatch<React.SetStateAction<boolean>>;
    textFontSize: number;
    setTextFontSize: React.Dispatch<React.SetStateAction<number>>;
    textAnimation: TextAnimation;
    setTextAnimation: React.Dispatch<React.SetStateAction<TextAnimation>>;

    /* memos */
    activeFilter: VideoFilterDef | null;
    selectedText: VideoTextOverlay | null;
    filteredFilters: VideoFilterDef[];
    effectiveTrimEnd: number;

    /* actions */
    togglePlay: () => void;
    seek: (time: number) => void;
    skipForward: () => void;
    skipBack: () => void;
    handleSave: () => Promise<void>;
    handleReset: () => void;
    handleDownload: () => Promise<void>;
    handleShareNative: () => Promise<void>;
    addTextOverlay: () => void;
    updateTextOverlay: (id: string, patch: Partial<VideoTextOverlay>) => void;
    deleteTextOverlay: (id: string) => void;
    handleTimelineMouseDown: (e: React.MouseEvent, kind: "start" | "end" | "seek") => void;

    /* props pass-through */
    accent: string;
    onCancel: () => void;
}

/* ─── hook ─── */

export function useVideoEditor(options: UseVideoEditorOptions): VideoEditorAPI {
    const { src, playerColor = "#00aaff", onSave, onCancel, initialState } = options;
    const accent = playerColor;

    // ── Refs ──
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animFrameRef = useRef<number>(0);
    const videoUrlRef = useRef<string>("");
    const timelineRef = useRef<HTMLDivElement>(null);

    // ── Core state ──
    const [loading] = useState(true);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState<EditorTab>("filters");
    const [videoReady, setVideoReady] = useState(false);

    // ── Clip state ──
    const [filterId, setFilterId] = useState("none");
    const [filterIntensity, setFilterIntensity] = useState(1);
    const [filterCategory, setFilterCategory] = useState<VideoFilterCategory>("all");
    const [adjustments, setAdjustments] = useState<VideoAdjustments>({ ...DEFAULT_VIDEO_ADJUSTMENTS });
    const [speed, setSpeed] = useState(1);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [volume, setVolume] = useState(1);
    const [transitionIn, setTransitionIn] = useState<TransitionKind>("none");
    const [transitionOut, setTransitionOut] = useState<TransitionKind>("none");
    const [transitionDuration, setTransitionDuration] = useState(0.5);

    // ── Text overlays ──
    const [textOverlays, setTextOverlays] = useState<VideoTextOverlay[]>([]);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [textDraft, setTextDraft] = useState("Text");
    const [textColor, setTextColor] = useState("#ffffff");
    const [textBold, setTextBold] = useState(true);
    const [textItalic, setTextItalic] = useState(false);
    const [textOutline, setTextOutline] = useState(true);
    const [textBg, setTextBg] = useState(false);
    const [textFontSize, setTextFontSize] = useState(48);
    const [textAnimation, setTextAnimation] = useState<TextAnimation>("fade_in");

    // ── Trim dragging ──
    const [trimDragging, setTrimDragging] = useState<"start" | "end" | null>(null);

    // ── Memos ──
    const activeFilter = useMemo(
        () => VIDEO_FILTERS.find((f) => f.id === filterId) ?? null,
        [filterId],
    );
    const selectedText = useMemo(
        () => textOverlays.find((t) => t.id === selectedTextId) ?? null,
        [textOverlays, selectedTextId],
    );
    const filteredFilters = useMemo(
        () => (filterCategory === "all" ? VIDEO_FILTERS : VIDEO_FILTERS.filter((f) => f.category === filterCategory || f.id === "none")),
        [filterCategory],
    );
    const effectiveTrimEnd = useMemo(() => (trimEnd > 0 ? trimEnd : duration), [trimEnd, duration]);

    // ── Load video ──
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let url: string;
        if (src instanceof File || src instanceof Blob) {
            url = URL.createObjectURL(src);
            videoUrlRef.current = url;
        } else {
            url = src;
            videoUrlRef.current = "";
        }

        video.src = url;
        video.load();

        const onMeta = () => {
            setDuration(video.duration);
            setVideoReady(true);
            if (initialState) {
                const s = deserializeVideoState(initialState);
                if (s) {
                    setFilterId(s.filterId);
                    setFilterIntensity(s.filterIntensity);
                    setAdjustments({ ...s.adjustments });
                    setSpeed(s.speed);
                    setTrimStart(s.trimStart);
                    setTrimEnd(s.trimEnd);
                    setRotation(s.rotation);
                    setFlipH(s.flipH);
                    setFlipV(s.flipV);
                    setVolume(s.volume);
                    setTextOverlays(s.textOverlays);
                    setTransitionIn(s.transitionIn);
                    setTransitionOut(s.transitionOut);
                    setTransitionDuration(s.transitionDuration);
                }
            }
        };

        video.addEventListener("loadedmetadata", onMeta);
        return () => {
            video.removeEventListener("loadedmetadata", onMeta);
            if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
        };
    }, [src, initialState]);

    // ── Sync volume + speed ──
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.playbackRate = speed;
        }
    }, [volume, speed]);

    // ── Render loop ──
    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !videoReady) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 360;
        canvas.width = vw;
        canvas.height = vh;

        let running = true;
        const render = () => {
            if (!running) return;
            renderVideoFrame(ctx, video, vw, vh, adjustments, activeFilter, filterIntensity, rotation, flipH, flipV);
            for (const ov of textOverlays) {
                renderVideoTextOverlay(ctx, ov, vw, vh, video.currentTime);
            }
            setCurrentTime(video.currentTime);
            if (video.currentTime < trimStart) {
                video.currentTime = trimStart;
            }
            if (effectiveTrimEnd > 0 && video.currentTime >= effectiveTrimEnd) {
                video.pause();
                video.currentTime = trimStart;
                setIsPlaying(false);
            }
            animFrameRef.current = requestAnimationFrame(render);
        };

        render();
        return () => {
            running = false;
            cancelAnimationFrame(animFrameRef.current);
        };
    }, [videoReady, adjustments, activeFilter, filterIntensity, rotation, flipH, flipV, textOverlays, trimStart, effectiveTrimEnd]);

    // ── Playback controls ──
    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            if (video.currentTime >= effectiveTrimEnd && effectiveTrimEnd > 0) {
                video.currentTime = trimStart;
            }
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }, [trimStart, effectiveTrimEnd]);

    const seek = useCallback(
        (time: number) => {
            if (videoRef.current) {
                videoRef.current.currentTime = Math.max(trimStart, Math.min(time, effectiveTrimEnd || duration));
            }
        },
        [trimStart, effectiveTrimEnd, duration],
    );

    const skipForward = useCallback(() => seek(currentTime + 5), [seek, currentTime]);
    const skipBack = useCallback(() => seek(currentTime - 5), [seek, currentTime]);

    // ── Keyboard shortcuts ──
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.code === "Space") { e.preventDefault(); togglePlay(); }
            if (e.code === "ArrowRight") { e.preventDefault(); skipForward(); }
            if (e.code === "ArrowLeft") { e.preventDefault(); skipBack(); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [togglePlay, skipForward, skipBack]);

    // ── Save ──
    const handleSave = useCallback(async () => {
        let file: File;
        if (src instanceof File) {
            file = src;
        } else if (src instanceof Blob) {
            file = new File([src], "video.mp4", { type: src.type || "video/mp4" });
        } else {
            const resp = await fetch(src);
            const blob = await resp.blob();
            file = new File([blob], "video.mp4", { type: blob.type || "video/mp4" });
        }
        const state: VideoClipState = {
            filterId, filterIntensity,
            adjustments: { ...adjustments },
            speed, trimStart, trimEnd,
            rotation, flipH, flipV, volume,
            textOverlays,
            transitionIn, transitionOut, transitionDuration,
        };
        onSave(file, serializeVideoState(state));
    }, [src, filterId, filterIntensity, adjustments, speed, trimStart, trimEnd, rotation, flipH, flipV, volume, textOverlays, transitionIn, transitionOut, transitionDuration, onSave]);

    // ── Reset ──
    const handleReset = useCallback(() => {
        setFilterId("none");
        setFilterIntensity(1);
        setAdjustments({ ...DEFAULT_VIDEO_ADJUSTMENTS });
        setSpeed(1);
        setTrimStart(0);
        setTrimEnd(0);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setVolume(1);
        setTextOverlays([]);
        setSelectedTextId(null);
        setTransitionIn("none");
        setTransitionOut("none");
        setTransitionDuration(0.5);
    }, []);

    // ── Share helpers ──
    const getOriginalBlob = useCallback(async (): Promise<Blob> => {
        if (src instanceof File || src instanceof Blob) return src;
        const resp = await fetch(src);
        return resp.blob();
    }, [src]);

    const handleDownload = useCallback(async () => {
        const blob = await getOriginalBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "video-edited.mp4";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
    }, [getOriginalBlob]);

    const handleShareNative = useCallback(async () => {
        const blob = await getOriginalBlob();
        const file = new File([blob], "video-edited.mp4", { type: "video/mp4" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            try { await navigator.share({ files: [file], title: "AudioVerse Video" }); } catch { /* user may cancel */ }
        } else {
            await handleDownload();
        }
    }, [getOriginalBlob, handleDownload]);

    // ── Text overlay helpers ──
    const addTextOverlay = useCallback(() => {
        const ov: VideoTextOverlay = {
            id: crypto.randomUUID(),
            text: textDraft || "Text",
            x: 0.5,
            y: 0.5,
            fontSize: textFontSize,
            color: textColor,
            bold: textBold,
            italic: textItalic,
            outline: textOutline,
            outlineColor: "#000000",
            bg: textBg,
            bgColor: "rgba(0,0,0,0.6)",
            startTime: currentTime,
            endTime: Math.min(currentTime + 3, effectiveTrimEnd || duration),
            animation: textAnimation,
        };
        setTextOverlays((prev) => [...prev, ov]);
        setSelectedTextId(ov.id);
    }, [textDraft, textFontSize, textColor, textBold, textItalic, textOutline, textBg, textAnimation, currentTime, effectiveTrimEnd, duration]);

    const updateTextOverlay = useCallback((id: string, patch: Partial<VideoTextOverlay>) => {
        setTextOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    }, []);

    const deleteTextOverlay = useCallback(
        (id: string) => {
            setTextOverlays((prev) => prev.filter((o) => o.id !== id));
            if (selectedTextId === id) setSelectedTextId(null);
        },
        [selectedTextId],
    );

    // ── Adj change ──
    const handleAdjChange = useCallback((key: keyof VideoAdjustments, value: number) => {
        setAdjustments((prev) => ({ ...prev, [key]: value }));
    }, []);

    const resetAdjustments = useCallback(() => {
        setAdjustments({ ...DEFAULT_VIDEO_ADJUSTMENTS });
    }, []);

    // ── Timeline trim drag ──
    const handleTimelineMouseDown = useCallback(
        (e: React.MouseEvent, kind: "start" | "end" | "seek") => {
            e.preventDefault();
            if (kind === "start" || kind === "end") {
                setTrimDragging(kind);
            } else {
                if (timelineRef.current) {
                    const rect = timelineRef.current.getBoundingClientRect();
                    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    seek(frac * duration);
                }
            }
        },
        [seek, duration],
    );

    useEffect(() => {
        if (!trimDragging) return;
        const onMove = (e: MouseEvent) => {
            if (!timelineRef.current) return;
            const rect = timelineRef.current.getBoundingClientRect();
            const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const time = frac * duration;
            if (trimDragging === "start") setTrimStart(Math.min(time, (trimEnd || duration) - 0.1));
            else setTrimEnd(Math.max(time, trimStart + 0.1));
        };
        const onUp = () => setTrimDragging(null);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [trimDragging, duration, trimStart, trimEnd]);

    return {
        videoRef, canvasRef, containerRef, timelineRef,
        loading, duration, currentTime, isPlaying, activeTab, setActiveTab, videoReady,
        filterId, setFilterId, filterIntensity, setFilterIntensity,
        filterCategory, setFilterCategory,
        adjustments, handleAdjChange, resetAdjustments,
        speed, setSpeed,
        trimStart, setTrimStart, trimEnd, setTrimEnd,
        rotation, setRotation,
        flipH, setFlipH, flipV, setFlipV,
        volume, setVolume,
        transitionIn, setTransitionIn, transitionOut, setTransitionOut,
        transitionDuration, setTransitionDuration,
        textOverlays, selectedTextId, setSelectedTextId,
        textDraft, setTextDraft,
        textColor, setTextColor,
        textBold, setTextBold, textItalic, setTextItalic,
        textOutline, setTextOutline,
        textBg, setTextBg,
        textFontSize, setTextFontSize,
        textAnimation, setTextAnimation,
        activeFilter, selectedText, filteredFilters, effectiveTrimEnd,
        togglePlay, seek, skipForward, skipBack,
        handleSave, handleReset, handleDownload, handleShareNative,
        addTextOverlay, updateTextOverlay, deleteTextOverlay,
        handleTimelineMouseDown,
        accent, onCancel,
    };
}
