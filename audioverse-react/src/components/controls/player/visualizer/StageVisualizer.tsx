import React, { useEffect, useMemo, useRef, useState } from "react";
import type HlsJs from "hls.js";
import { getAudioContext, resumeAudioContext } from "../../../../scripts/audioContext";
import { VisualizerMode, VisualizerKind } from "./types";
import { useLocalStorageState } from "./useLocalStorageState";
import { ModeSwitcher } from "./ModeSwitcher";
import { VuOverlay } from "./VuOverlay";
import { CoverMode } from "./modes/CoverMode";
import { drawSpectrum } from "./modes/SpectrumMode";
import { drawBars } from "./modes/BarsMode";
import { drawWaveform } from "./modes/WaveformMode";
import { drawPalette } from "./modes/PaletteMode";
import { drawRadial } from "./modes/RadialMode";
import { drawRays } from "./modes/RaysMode";
import { drawParticles, type Particle } from "./modes/ParticlesMode";
import { drawRings } from "./modes/RingsMode";
import { drawGrid } from "./modes/GridMode";

import { ensureTornadoState, drawImageTornado, type ImageTornadoState } from "./modes/ImageTornadoMode";
import { drawColorRipples, type RipplesState } from "./modes/ColorRipplesMode";
import { ensureStarfield, drawStarfield, type StarfieldState } from "./modes/StarfieldMode";
import { drawOrbitals } from "./modes/OrbitalsMode";
import { drawEqualizerCircle } from "./modes/EqualizerCircleMode";
import { drawNeonTriangles, type TrianglesState } from "./modes/NeonTrianglesMode";
import { drawBlobFlow, type BlobState } from "./modes/BlobFlowMode";

// ⬇⬇⬇ NOWE TRYBY
import { drawPlasmaBall } from "./modes/PlasmaBallMode";
import { drawLavaLamp, type LavaBlobState } from "./modes/LavaLampMode";
import { drawCozyFireplace, type FireplaceState } from "./modes/CozyFireplaceMode";
import { drawRift } from "./modes/RiftMode";

type Props = {
    kind: VisualizerKind;
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    hlsRef?: React.MutableRefObject<HlsJs | null>;
    width?: number | string;
    height?: number;
    coverUrl?: string;
    title?: string;
    subtitle?: string;
    label?: string;
    defaultMode?: VisualizerMode;
    storageKey?: string;
    allowedModes?: VisualizerMode[];
    /** dla ImageTornado */
    imageUrls?: string[];
    imageCount?: number;
};

const barBg = "#0f172a";

const StageVisualizer: React.FC<Props> = ({
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
                                              imageUrls,
                                              imageCount = 14,
                                          }) => {
    const modes = useMemo<VisualizerMode[]>(() => {
        if (allowedModes?.length) return allowedModes;
        if (kind === "youtube") return ["video", "cover"];
        return [
            "cover","spectrum","bars","waveform","palette","radial","rays","particles","rings","grid",
            "imageTornado","colorRipples","starfield","orbitals","eqcircle","triangles","blob",
            // ⬇ nowe pozycje w switcherze
            "plasma","lavaLamp","cozyFire","rift"
        ];
    }, [kind, allowedModes]);

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

    // analyser / canvas
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const binsRef = useRef<Uint8Array | null>(null);
    const timeRef = useRef<Uint8Array | null>(null);
    const hueShiftRef = useRef(0);
    const angleRef = useRef(0);
    const particlesRef = useRef<Particle[]>([]);
    const [vu, setVu] = useState(0);

    // stany trybów
    const tornadoRef = useRef<ImageTornadoState | null>(null);
    const ripplesRef = useRef<RipplesState | null>(null);
    const starfieldRef = useRef<StarfieldState | null>(null);
    const trianglesRef = useRef<TrianglesState | null>(null);
    const blobRef = useRef<BlobState | null>(null);
    const lavaRef = useRef<LavaBlobState | null>(null);      // ⬅ lavaLamp
    const fireRef = useRef<FireplaceState | null>(null);     // ⬅ cozyFire

    const visualActive = mode !== "cover" && mode !== "video";

    useEffect(() => {
        if (kind === "youtube") return;

        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        if (!visualActive) return;

        resumeAudioContext();
        const ctx = getAudioContext();
        const audio = audioRef.current;
        if (!audio) return;

        if (!sourceNodeRef.current) {
            try { sourceNodeRef.current = ctx.createMediaElementSource(audio); } catch {}
        }

        if (!analyserRef.current) {
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.85;
            analyserRef.current = analyser;
            try { sourceNodeRef.current?.connect(analyser); } catch {}
            try { analyser.connect(ctx.destination); } catch {}
        }

        const analyser = analyserRef.current!;
        binsRef.current = new Uint8Array(analyser.frequencyBinCount);
        timeRef.current = new Uint8Array(analyser.fftSize);

        const setupCanvas = () => {
            const c = canvasRef.current!;
            const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
            c.width = Math.floor(c.clientWidth * ratio);
            c.height = Math.floor(c.clientHeight * ratio);
            const g = c.getContext("2d");
            g?.setTransform(1,0,0,1,0,0);
            g?.scale(ratio, ratio);
        };
        setupCanvas();
        const onResize = () => setupCanvas();
        window.addEventListener("resize", onResize);

        // pre-init niektórych trybów zależnych od rozmiaru
        ensureStarfield(starfieldRef, 220, canvasRef.current!.width, canvasRef.current!.height);

        const draw = async () => {
            const c = canvasRef.current; if (!c) return;
            const g = c.getContext("2d"); if (!g) return;
            const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
            const w = c.width / ratio;
            const h = c.height / ratio;
            const t = performance.now() * 0.001; // sekundy – do animacji trybów

            // Rift też potrzebuje time-domain:
            const isTime = mode === "waveform" || mode === "rift";
            if (isTime) analyser.getByteTimeDomainData(timeRef.current!);
            else analyser.getByteFrequencyData(binsRef.current!);

            // VU (energia)
            let energy = 0;
            const arr = isTime ? timeRef.current! : binsRef.current!;
            for (let i = 0; i < arr.length; i++) {
                const v = isTime ? (arr[i] - 128) / 128 : arr[i] / 255;
                energy += v * v;
            }
            energy = Math.sqrt(energy / arr.length);
            setVu(Math.min(1, energy));

            g.clearRect(0, 0, w, h);

            if (mode === "spectrum") {
                drawSpectrum(g, w, h, binsRef.current!, hueShiftRef.current);
            } else if (mode === "bars") {
                drawBars(g, w, h, binsRef.current!, hueShiftRef.current);
            } else if (mode === "waveform") {
                drawWaveform(g, w, h, timeRef.current!);
            } else if (mode === "palette") {
                const baseHue = (hueShiftRef.current + energy * 120) % 360;
                drawPalette(g, w, h, binsRef.current!, baseHue);
            } else if (mode === "radial") {
                drawRadial(g, w, h, binsRef.current!, hueShiftRef.current);
            } else if (mode === "rays") {
                drawRays(g, w, h, binsRef.current!, hueShiftRef.current, angleRef);
            } else if (mode === "particles") {
                drawParticles(g, w, h, energy, hueShiftRef.current, particlesRef);
            } else if (mode === "rings") {
                drawRings(g, w, h, binsRef.current!, energy, hueShiftRef.current);
            } else if (mode === "grid") {
                const baseHue = (hueShiftRef.current + energy * 160) % 360;
                drawGrid(g, w, h, binsRef.current!, baseHue);
            } else if (mode === "imageTornado") {
                const urls = (imageUrls?.length ? imageUrls : (coverUrl ? [coverUrl] : []));
                await ensureTornadoState(tornadoRef, urls!, imageCount, w, h);
                const baseHue = (hueShiftRef.current + energy * 100) % 360;
                drawImageTornado(g, w, h, energy, baseHue, tornadoRef, urls!, imageCount);
            } else if (mode === "colorRipples") {
                const baseHue = (hueShiftRef.current + energy * 120) % 360;
                drawColorRipples(g, w, h, energy, baseHue, ripplesRef);
            } else if (mode === "starfield") {
                const baseHue = (hueShiftRef.current + 60) % 360;
                drawStarfield(g, w, h, energy, baseHue, starfieldRef);
            } else if (mode === "orbitals") {
                const baseHue = (hueShiftRef.current + energy * 180) % 360;
                drawOrbitals(g, w, h, binsRef.current!, baseHue, angleRef);
            } else if (mode === "eqcircle") {
                const baseHue = (hueShiftRef.current + 120) % 360;
                drawEqualizerCircle(g, w, h, binsRef.current!, baseHue);
            } else if (mode === "triangles") {
                const baseHue = (hueShiftRef.current + 40) % 360;
                drawNeonTriangles(g, w, h, energy, baseHue, trianglesRef);
            } else if (mode === "blob") {
                const baseHue = (hueShiftRef.current + 90) % 360;
                drawBlobFlow(g, w, h, energy, baseHue, blobRef);

                // ⬇⬇⬇ NOWE CASE'Y
            } else if (mode === "plasma") {
                const baseHue = (hueShiftRef.current + energy * 200) % 360;
                drawPlasmaBall(g, w, h, t, energy, baseHue);
            } else if (mode === "rift") {
                drawRift(g, w, h, timeRef.current!, energy, t);
            } else if (mode === "lavaLamp") {
                const baseHue = (hueShiftRef.current + energy * 80) % 360;
                drawLavaLamp(g, w, h, energy, baseHue, lavaRef);
            } else if (mode === "cozyFire") {
                const baseHue = (hueShiftRef.current + energy * 140) % 360;
                drawCozyFireplace(g, w, h, binsRef.current!, energy, baseHue, fireRef);
            }

            hueShiftRef.current = (hueShiftRef.current + 0.4) % 360;
            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", onResize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [visualActive, kind, audioRef, mode, imageUrls, imageCount, coverUrl]);

    return (
        <>
            {/* LAYER 1: wizualizacja (nieklikalna) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: mode === "cover" ? "transparent" : barBg,
                }}
            >
                {mode === "cover" ? (
                    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                        <CoverMode height={height} coverUrl={coverUrl} title={title} subtitle={subtitle} label={label} />
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        style={{
                            width: typeof width === "number" ? `${width}px` : width,
                            height,
                            borderRadius: 8,
                        }}
                    />
                )}
            </div>

            {/* LAYER 2: UI (klikalny tylko switcher) */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <ModeSwitcher modes={modes} active={mode} setActive={setMode} rows={2} />
                <VuOverlay vu={vu} hide={kind === "youtube"} />
            </div>
        </>
    );
};

export default StageVisualizer;
