import React, {useEffect, useMemo, useRef, useState} from "react";
import type HlsJs from "hls.js";
import { getAudioContext, resumeAudioContext } from "../../../scripts/audioContext";

export type VisualizerMode = "video" | "cover" | "spectrum" | "bars" | "waveform" | "palette";

type Props = {
    // playback environment
    kind: "youtube" | "audio" | "hls";
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    hlsRef?: React.MutableRefObject<HlsJs | null>;

    // UI / rozmiary
    width?: number | string;
    height?: number;
    coverUrl?: string;
    title?: string;
    subtitle?: string;
    label?: string;

    // mode configuration
    defaultMode?: VisualizerMode;                 // default starting (saved in localStorage)
    storageKey?: string;                          // np. "gp-stage:mode"
    allowedModes?: VisualizerMode[];              // filtering (e.g. YT: ["video","cover"])

    // when for YT you want to keep video underneath – render only overlay (e.g. VU)
    overlayOnly?: boolean;
};

// small localStorage helper without SSR screams
function useLocalStorageState<T>(key: string, initial: T) {
    const [state, setState] = useState<T>(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : initial;
        } catch {
            return initial;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch { /* Best-effort — no action needed on failure */ }
    }, [key, state]);
    return [state, setState] as const;
}

const textDim = "var(--text-dim, #94a3b8)";

/// Small button used to switch visualizer modes.
const ModeButton: React.FC<{
    active: boolean;
    onClick: () => void;
    title: string;
    children?: React.ReactNode;
}> = ({ active, onClick, title, children }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        style={{
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 12,
            border: `1px solid ${active ? "var(--accent, #6366f1)" : "var(--border-muted, #334155)"}`,
            background: active ? "var(--accent-muted, rgba(99,102,241,.12))" : "var(--surface-overlay, rgba(15,23,42,.6))",
            color: active ? "var(--text-on-accent, #e2e8f0)" : "var(--text, #cbd5e1)",
            cursor: "pointer",
        }}
    >
        {children}
    </button>
);

/** Wizualizator sceny:
 *  - pamięta wybrany tryb w localStorage
 *  - tryby: video | cover | spectrum | bars | waveform | palette
 *  - VU meter zawsze dostępny jako overlay (dla audio/hls)
 */

/**
 * Wizualizator sceny:
 *  - pamięta wybrany tryb w localStorage
 *  - tryby: video | cover | spectrum | bars | waveform | palette
 *  - VU meter zawsze dostępny jako overlay (dla audio/hls)
 */
const GenericPlayerStageVisualizer: React.FC<Props> = ({
                                                           kind,
                                                           audioRef,
                                                           width = "100%",
                                                           height = 360,
                                                           coverUrl,
                                                           title,
                                                           subtitle,
                                                           label,
                                                           defaultMode = "cover",
                                                           storageKey = "gp-stage:mode",
                                                           allowedModes,
                                                           overlayOnly: _overlayOnly = false,
                                                       }) => {

    // available modes depending on source
    const modes = useMemo<VisualizerMode[]>(() => {
        if (allowedModes?.length) return allowedModes;
        if (kind === "youtube") return ["video", "cover"]; // on YT we don't try WebAudio
        return ["cover", "spectrum", "bars", "waveform", "palette"];
    }, [kind, allowedModes]);

    // startowy tryb (z localStorage)
    const firstMode = useMemo<VisualizerMode>(() => {
        const d = modes.includes(defaultMode) ? defaultMode : modes[0];
        try {
            const saved = localStorage.getItem(storageKey);
            if (!saved) return d;
            const parsed = JSON.parse(saved) as VisualizerMode;
            return modes.includes(parsed) ? parsed : d;
        } catch {
            return d;
        }
    }, [modes, defaultMode, storageKey]);

    const [mode, setMode] = useLocalStorageState<VisualizerMode>(storageKey, firstMode);

    // ANALYSER for audio/hls
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [vu, setVu] = useState(0); // 0..1
    const rafRef = useRef<number | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const binsRef = useRef<Uint8Array | null>(null);
    const timeRef = useRef<Uint8Array | null>(null);
    const hueShiftRef = useRef(0);

    const visualActive = mode === "spectrum" || mode === "bars" || mode === "waveform" || mode === "palette";

    useEffect(() => {
        if (kind === "youtube") return;          // omijamy YT (CORS)
        if (!visualActive) {
            // clean up animation, but leave source under audioRef
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            return;
        }

        resumeAudioContext();
        const ctx = getAudioContext();
        const audio = audioRef.current;
        if (!audio) return;

        // connecting once (per audioRef instance)
        if (!sourceNodeRef.current) {
            try {
                sourceNodeRef.current = ctx.createMediaElementSource(audio);
            } catch {
                // if already connected (e.g. second mount of same element) – ignore
            }
        }

        if (!analyserRef.current) {
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;            // 1024 binów (timeDomain 2048)
            analyser.smoothingTimeConstant = 0.85;
            analyserRef.current = analyser;

            // connecting – plugging into output so sound plays
            try {
                sourceNodeRef.current?.connect(analyser);
            } catch { /* Best-effort — no action needed on failure */ }
            try {
                analyser.connect(ctx.destination);
            } catch { /* Best-effort — no action needed on failure */ }
        }

        const analyser = analyserRef.current!;
        binsRef.current = new Uint8Array(analyser.frequencyBinCount);
        timeRef.current = new Uint8Array(analyser.fftSize);

        const draw = () => {
            if (!canvasRef.current) return;
            const c = canvasRef.current;
            const g = c.getContext("2d");
            if (!g) return;

            const w = c.width;
            const h = c.height;

            g.clearRect(0, 0, w, h);

            // fetching data
            if (mode === "waveform") {
                analyser.getByteTimeDomainData(timeRef.current!);
            } else {
                analyser.getByteFrequencyData(binsRef.current!);
            }

            // RMS / VU
            let energy = 0;
            const data = mode === "waveform" ? timeRef.current! : binsRef.current!;
            for (let i = 0; i < data.length; i++) {
                const v = mode === "waveform" ? (data[i] - 128) / 128 : data[i] / 255;
                energy += v * v;
            }
            energy = Math.sqrt(energy / data.length);
            setVu(Math.min(1, energy));

            // drawing
            if (mode === "spectrum" || mode === "bars") {
                const arr = binsRef.current!;
                const bars = mode === "bars" ? 48 : Math.min(arr.length, 256);
                const step = Math.floor(arr.length / bars);
                const barW = w / bars;

                for (let i = 0; i < bars; i++) {
                    const v = arr[i * step] / 255;
                    const barH = v * (h - 6);
                    const x = i * barW;
                    const y = h - barH;
                    const hue = (i / bars) * 240 + hueShiftRef.current;
                    g.fillStyle = `hsl(${hue % 360}, 80%, ${Math.max(30, 40 + v * 30)}%)`;
                    g.fillRect(x + 1, y, barW - 2, barH);
                }
            } else if (mode === "waveform") {
                const t = timeRef.current!;
                g.lineWidth = 2;
                g.strokeStyle = "#c7d2fe";
                g.beginPath();
                const slice = w / t.length;
                for (let i = 0; i < t.length; i++) {
                    const v = (t[i] - 128) / 128;
                    const x = i * slice;
                    const y = h / 2 + v * (h * 0.45);
                    i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
                }
                g.stroke();
            } else if (mode === "palette") {
                // animated palette: tiles row x col, color depending on energy and H offset
                const cols = 12;
                const rows = 6;
                const tileW = w / cols;
                const tileH = h / rows;
                const baseHue = (hueShiftRef.current + energy * 120) % 360;

                for (let r = 0; r < rows; r++) {
                    for (let cIdx = 0; cIdx < cols; cIdx++) {
                        const idx = (r * cols + cIdx) % (binsRef.current!.length);
                        const v = binsRef.current![idx] / 255;
                        const hue = (baseHue + (cIdx / cols) * 180 + (r / rows) * 90) % 360;
                        const sat = 70 + v * 25;
                        const lum = 25 + v * 35;
                        g.fillStyle = `hsl(${hue}, ${sat}%, ${lum}%)`;
                        g.fillRect(cIdx * tileW, r * tileH, Math.ceil(tileW), Math.ceil(tileH));
                    }
                }
            }

                    g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--waveform-stroke') || '#c7d2fe';
            rafRef.current = requestAnimationFrame(draw);
        };

        // DPI canvas
        const setupCanvas = () => {
            const c = canvasRef.current!;
            const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
            c.width = Math.floor(c.clientWidth * ratio);
            c.height = Math.floor(c.clientHeight * ratio);
            c.getContext("2d")?.scale(ratio, ratio);
        };

        setupCanvas();
        window.addEventListener("resize", setupCanvas);
        rafRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", setupCanvas);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [visualActive, kind, audioRef, mode]);

    // simple VU meter (overlay) – only for audio/hls
    const VuOverlay = () => {
        if (kind === "youtube") return null;
        const segments = 12;
        const active = Math.round(vu * segments);
        return (
            <div style={{
                position: "absolute",
                right: 10, bottom: 10,
                display: "flex", gap: 2,
                background: "rgba(2,6,23,.5)",
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid #334155",
                backdropFilter: "blur(2px)"
            }}>
                {Array.from({ length: segments }).map((_, i) => {
                    const hue = 120 * (i / segments); // green->yellow->red
                    return (
                        <div key={i} style={{
                            width: 6, height: 18,
                            borderRadius: 2,
                            background: i < active ? `hsl(${hue}, 80%, 50%)` : "#1f2937"
                        }} />
                    );
                })}
            </div>
        );
    };


    // CONTENT
    const renderCover = () => (
        <div style={{textAlign: "center", color: "#e2e8f0"}}>
            {coverUrl ? (
                <img alt="cover" src={coverUrl} style={{height: height - 24, objectFit: "contain"}}/>
            ) : (
                <div style={{opacity: 0.8}}>
                    <div style={{fontSize: 18, fontWeight: 600}}>{title ?? "—"}</div>
                    <div style={{marginTop: 8, fontSize: 12, color: textDim}}>
                        {label ?? subtitle ?? "—"}
                    </div>
                </div>
            )}
        </div>
    );

    // REPLACE entire return with the following
    return (
        <>
            {/* LAYER 1: tylko wizualizacja (nie-klikalna) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",      // <-- blocks clicks ONLY here
                }}
            >
                {mode === "cover" ? (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                            background: "transparent",
                        }}
                    >
                        {renderCover()}
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        style={{
                            width: typeof width === "number" ? `${width}px` : width,
                            height,
                            borderRadius: 8,
                            // pointerEvents: "none" - domyślnie dziedziczy z rodzica
                        }}
                        role="img"
                        aria-label="Stage visualizer canvas"
                    />
                )}
            </div>

            {/* LAYER 2: UI (klikalny) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",      // first we disable for the entire layer…
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        display: "flex",
                        gap: 6,
                        background: "rgba(2,6,23,.5)",
                        padding: "6px",
                        borderRadius: 10,
                        border: "1px solid #334155",
                        backdropFilter: "blur(2px)",
                        pointerEvents: "auto",    // …and ENABLE only for the switcher
                        zIndex: 9999,             // ponad iframe YT
                    }}
                >
                    {modes.map(m => (
                        <ModeButton
                            key={m}
                            active={mode === m}
                            onClick={() => setMode(m)}
                            title={`Tryb: ${m}`}
                        >
                            {m}
                        </ModeButton>
                    ))}
                </div>

                {/* VU can remain non-clickable */}
                <div style={{ position: "absolute", right: 10, bottom: 10, pointerEvents: "none", zIndex: 9998 }}>
                    <VuOverlay />
                </div>
            </div>
        </>
    );

};

export default GenericPlayerStageVisualizer;
