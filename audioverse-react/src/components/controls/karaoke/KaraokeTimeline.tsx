import React, { useEffect, useRef, useState } from "react";
import { KaraokeSongFile } from "../../../models/modelsKaraoke";
import { parseNotes, drawTimeline } from "../../../scripts/karaoke/karaokeTimeline";
import { dkLog } from "../../../constants/debugKaraoke";
import type {
    KaraokeSegmentScore,
    KaraokeGoldBurst,
    KaraokeComboInfo,
    KaraokeVerseRating,
    KaraokeTimelineConfig,
} from "./karaokeTimelineTypes";

interface KaraokeTimelineProps {
    song: KaraokeSongFile;
    currentTime: number;
    playerRef: React.RefObject<HTMLDivElement>;
    /** Optional config grouping display/layout/visual settings (reduces props drilling). */
    config?: KaraokeTimelineConfig;
    userPitch?: { t: number; hz: number }[];
    segmentScores?: KaraokeSegmentScore[];
    goldBursts?: KaraokeGoldBurst[];
    combo?: KaraokeComboInfo;
    verseRatings?: KaraokeVerseRating[];
}

const KaraokeTimeline: React.FC<KaraokeTimelineProps> = ({
    song,
    currentTime,
    playerRef,
    config = {},
    userPitch,
    segmentScores,
    goldBursts,
    combo,
    verseRatings,
}) => {
    const {
        isPlaying = false,
        playerName = "Ziom",
        score = 10000,
        playerBgColor = "var(--karaoke-player-bg, #2196f3)",
        playerCount = 2,
        gapDesaturation,
        goldSettings,
        difficultyLevel,
        algorithmLabel,
        algorithmColor,
        latencyMs = null,
        top,
        animationMode,
        karaokeSettings = null,
    } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 600, height: 150, top: 250, visibleWidth: 600 });
    const [panOffset, setPanOffset] = useState(0);
    const targetPanRef = useRef<number>(0);
    const panRafRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const renderRafRef = useRef<number | null>(null);
    const currentTimeRef = useRef<number>(currentTime);
    const lastTimeUpdateMs = useRef<number>(performance.now());
    const songRef = useRef<KaraokeSongFile | null>(song);
    const canvasSizeRef = useRef(canvasSize);
    const userPitchRef = useRef(userPitch);
    const isPlayingRef = useRef<boolean>(isPlaying);
    const panOffsetRef = useRef<number>(0);
    const rafLoggedRef = useRef<boolean>(false);

    // Memoize parsed note lines per song change (avoid re-parsing every frame)
    const noteLinesRef = useRef<ReturnType<typeof parseNotes> | null>(null);
    const noteSongIdRef = useRef<string | number | null>(null);
    const getNoteLines = () => {
        const id = song?.id ?? null;
        if (id !== noteSongIdRef.current || !noteLinesRef.current) {
            noteSongIdRef.current = id;
            const rawLines = song.notes.map(note => note.noteLine);
            noteLinesRef.current = parseNotes(rawLines, song.bpm ?? undefined);
            const totalNotes = noteLinesRef.current.reduce((sum, line) => sum + line.length, 0);
            const goldCount = noteLinesRef.current.reduce((sum, line) => sum + line.filter(n => n.isGold).length, 0);
            const pitches = noteLinesRef.current.flat().map(n => n.pitch);
            const minPitch = pitches.length ? Math.min(...pitches) : 0;
            const maxPitch = pitches.length ? Math.max(...pitches) : 0;
            dkLog('BARS', `🎼 Sparsowano nuty dla "${song.title}" — ${noteLinesRef.current.length} wersów, ${totalNotes} nut (w tym ${goldCount} złotych), zakres pitch: ${minPitch}–${maxPitch}, BPM: ${song.bpm ?? '?'}, GAP: ${song.gap ?? 0}ms`, { rawLinesCount: rawLines.length, verseCount: noteLinesRef.current.length, totalNotes, goldCount, minPitch, maxPitch });
        }
        return noteLinesRef.current;
    };

    // Smooth pan RAF loop (time-adaptive exponential smoothing)
    useEffect(() => {
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const panSpeed = 12; // higher = faster follow (per second)
        const step = (now: number) => {
            if (lastTimeRef.current === null) lastTimeRef.current = now;
            const dt = Math.min(0.1, (now - (lastTimeRef.current || now)) / 1000); // clamp dt
            lastTimeRef.current = now;

            const current = panOffsetRef.current;
            const target = targetPanRef.current;
            // alpha from continuous-time exponential smoothing: 1 - exp(-k*dt)
            const alpha = 1 - Math.exp(-panSpeed * dt);
            const next = Math.abs(target - current) < 0.25 ? target : lerp(current, target, alpha);
            if (Math.abs(next - current) > 0.0001) {
                setPanOffset(next);
                panOffsetRef.current = next;
                if (canvasRef.current) canvasRef.current.style.transform = `translateX(${next}px)`;
            }
            panRafRef.current = requestAnimationFrame(step);
        };
        panRafRef.current = requestAnimationFrame(step);
        return () => {
            if (panRafRef.current) cancelAnimationFrame(panRafRef.current);
            panRafRef.current = null;
            lastTimeRef.current = null;
        };
    // intentionally no deps so loop runs once; uses refs only
    }, []);

    // 📌 Dynamiczne dostosowanie do YouTubePlayera
    useEffect(() => {
        const updateSize = () => {
                if (!playerRef.current) return;

                const playerRect = playerRef.current.getBoundingClientRect();
                // Szerokość skalowana wg liczby graczy: 1 gracz = 2x, 2 = 1x, 4 = 0.5x
                const widthMultiplier = 2 / Math.max(1, playerCount);
                const fullWidth = Math.round(playerRect.width * widthMultiplier);
                const visibleWidth = Math.round(playerRect.width);
                const height = fullWidth * (150 / 600);

                setCanvasSize({ width: fullWidth, height, top: 30, visibleWidth });
            };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, [playerRef, playerCount]);

    // draw-on-prop-change when NOT playing
    useEffect(() => {
        if (isPlaying) return; // while playing, RAF loop will handle rendering
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        const noteLines = getNoteLines();
        const adjustedTime = currentTime - (song.gap ?? 0) / 1000;

        const res = drawTimeline(
            ctx,
            canvasSize.width,
            canvasSize.height,
            noteLines,
            adjustedTime,
            playerName,
            score,
            playerBgColor,
            userPitch,
            song.id,
            gapDesaturation ?? undefined,
            segmentScores,
            difficultyLevel ?? undefined,
            isPlaying,
            goldSettings ?? undefined,
            goldBursts,
            algorithmLabel,
            algorithmColor,
            panOffsetRef.current,
            canvasSize.visibleWidth,
            combo,
            verseRatings,
            animationMode,
            karaokeSettings
        ) as { ballX: number; ballY: number; ballIsGold?: boolean } | undefined;

        if (res && canvasRef.current) {
            const visible = canvasSize.visibleWidth || (containerRef.current?.getBoundingClientRect().width ?? canvasSize.width);
            const full = canvasSize.width;
            let desired = Math.round(visible / 2 - res.ballX);
            const min = visible - full;
            const max = 0;
            desired = Math.max(min, Math.min(max, desired));
            targetPanRef.current = desired;
        }
    }, [currentTime, song, canvasSize, userPitch, isPlaying, segmentScores, goldBursts, animationMode, karaokeSettings]);

    // keep refs up to date for RAF render loop
    useEffect(() => { currentTimeRef.current = currentTime; lastTimeUpdateMs.current = performance.now(); }, [currentTime]);
    useEffect(() => { songRef.current = song; }, [song]);
    useEffect(() => { canvasSizeRef.current = canvasSize; }, [canvasSize]);
    useEffect(() => { userPitchRef.current = userPitch; }, [userPitch]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    // Internal RAF loop: render at display refresh while playing for smooth 60fps
    // Uses linear extrapolation of currentTime between the ~4Hz polls for smooth ball motion
    useEffect(() => {
        const renderFrame = () => {
            const canvas = canvasRef.current;
            const songLocal = songRef.current;
            const cs = canvasSizeRef.current;
            if (!canvas || !songLocal || !cs) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const noteLines = getNoteLines();
            // Extrapolate time: base + elapsed since last poll (clamped to 500ms to avoid overshoot)
            const elapsed = Math.min(0.5, (performance.now() - lastTimeUpdateMs.current) / 1000);
            const smoothTime = isPlayingRef.current
                ? currentTimeRef.current + elapsed
                : currentTimeRef.current;
            const adjustedTime = smoothTime - (songLocal.gap ?? 0) / 1000;
            const res = drawTimeline(
                ctx, cs.width, cs.height, noteLines, adjustedTime, playerName, score, playerBgColor,
                userPitchRef.current, songLocal.id, gapDesaturation ?? undefined, segmentScores,
                difficultyLevel ?? undefined, isPlayingRef.current, goldSettings ?? undefined, goldBursts,
                algorithmLabel, algorithmColor, panOffsetRef.current, cs.visibleWidth, combo, verseRatings,
                animationMode, karaokeSettings
            ) as { ballX: number; ballY: number; ballIsGold?: boolean } | undefined;
            if (res) {
                const visible = cs.visibleWidth || (containerRef.current?.getBoundingClientRect().width ?? cs.width);
                const full = cs.width;
                let desired = Math.round(visible / 2 - res.ballX);
                const min = visible - full;
                const max = 0;
                desired = Math.max(min, Math.min(max, desired));
                targetPanRef.current = desired;
            }
        };

        if (isPlaying) {
            if (!rafLoggedRef.current) {
                rafLoggedRef.current = true;
                dkLog('BARS', `▶ Rysowanie barów w pętli RAF — canvas: ${canvasSizeRef.current.width}×${canvasSizeRef.current.height}px, gracz: ${playerName}`, { canvasSize: canvasSizeRef.current });
            }
            const loop = () => {
                renderFrame();
                renderRafRef.current = requestAnimationFrame(loop);
            };
            renderRafRef.current = requestAnimationFrame(loop);
            return () => {
                if (renderRafRef.current) cancelAnimationFrame(renderRafRef.current);
                renderRafRef.current = null;
            };
        }
        rafLoggedRef.current = false;
        return;
    }, [isPlaying, playerName, score, playerBgColor, gapDesaturation, segmentScores, difficultyLevel, goldSettings, goldBursts, animationMode, karaokeSettings]);

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                left: "50%",
                top: `${top ?? canvasSize.top}px`,
                transform: "translateX(-50%)",
                zIndex: 10,
                pointerEvents: "none",
                background: "transparent",
                width: canvasSize.visibleWidth,
                height: canvasSize.height,
                overflow: 'hidden'
            }}
        >
            {/* Latency badge (top-right) */}
            <style>{`@keyframes av-latency-pulse {0% { transform: scale(1); box-shadow: 0 4px 10px rgba(0,0,0,0.2);} 50% { transform: scale(1.08); box-shadow: 0 8px 18px rgba(0,0,0,0.32);} 100% { transform: scale(1); box-shadow: 0 4px 10px rgba(0,0,0,0.2);} } .av-latency-pulse { animation: av-latency-pulse 1s ease-in-out infinite; }`}</style>
            <div style={{
                position: 'absolute',
                right: 8,
                top: 6,
                zIndex: 40,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: 'var(--text-on-dark, #fff)'
            }}>
                {typeof latencyMs !== 'undefined' && latencyMs !== null ? (
                    (() => {
                        const v = latencyMs as number;
                        const color = v <= 120 ? 'var(--latency-good, #10b981)' : v <= 250 ? 'var(--latency-warn, #f59e0b)' : 'var(--latency-bad, #ef4444)';
                        const label = `${v}ms`;
                        return (
                            <div className={v > 250 ? 'av-latency-pulse' : ''} style={{
                                background: color,
                                padding: '6px 10px',
                                borderRadius: 12,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
                                fontWeight: 700,
                                minWidth: 56,
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <span style={{ display: 'inline-block', transform: 'translateY(-1px)' }}>📶</span>
                                <span>{label}</span>
                            </div>
                        );
                    })()
                ) : (
                    <div style={{
                        background: 'var(--latency-none-bg, rgba(75,85,99,0.9))',
                        padding: '6px 8px',
                        borderRadius: 12,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
                        minWidth: 44,
                        textAlign: 'center'
                    }}>—</div>
                )}
            </div>
            <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                role="img"
                aria-label={`Pitch timeline for ${playerName ?? 'player'}. Score: ${score ?? 0}`}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform: `translateX(${panOffset}px)`,
                    willChange: 'transform'
                }}
            />
        </div>
    );
};

export default KaraokeTimeline;
