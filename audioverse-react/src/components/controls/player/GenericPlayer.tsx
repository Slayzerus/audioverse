import React, { useCallback, useEffect, useMemo, useRef, useState, useImperativeHandle } from "react";
import YouTube, { YouTubeEvent, YouTubePlayer as YTPlayer } from "react-youtube";


export type SourceKind = "youtube" | "hls" | "audio";

export interface GenericPlayerExternal {
    play: () => void;
    pause: () => void;
    toggle: () => void;
    seekTo: (sec: number) => void;
    setVolume: (v: number) => void;
}

export interface PlayerSource {
    kind: SourceKind;
    url?: string;
    videoId?: string;
    headers?: Record<string, string>;
    withCredentials?: boolean;
    proxyUrl?: string;
    quality?: string;
    codec?: string;
    label?: string;
}

export interface PlayerTrack {
    id: string;
    title: string;
    artist: string;
    coverUrl?: string;
    sources: PlayerSource[];
}

export type PlayerUIMode = "progressOnly" | "minimal" | "compact" | "full";

export interface GenericPlayerProps {
    tracks?: PlayerTrack[];
    initialIndex?: number;
    autoPlay?: boolean;
    height?: number;
    onIndexChange?: (index: number) => void;
    onPlayingChange?: (playing: boolean) => void;
    onTimeUpdate?: (time: number) => void;
    externalRef?: React.Ref<GenericPlayerExternal>;

    progressBarPosition?: "inline" | "fixedBottom";
    /** NOWE: wariant UI */
    uiMode?: PlayerUIMode;
    /** Ile elementów pokazać w „compact” (domyślnie 3) */
    compactNextCount?: number;
}

/* ===== Utils ===== */

const isYouTubeUrl = (u: string) => /youtu(\.be|be\.com)/i.test(u);
const isM3U8 = (u: string | undefined) => !!u && /\.m3u8(\?.*)?$/i.test(u);
const isAudioFile = (u: string | undefined) =>
    !!u && /\.(mp3|aac|m4a|flac|wav|ogg)(\?.*)?$/i.test(u);

const pickBestSource = (t?: PlayerTrack): PlayerSource | null => {
    if (!t) return null;
    const byKind = (k: SourceKind) => t.sources.find((s) => s.kind === k);
    const yt =
        t.sources.find(
            (s) => s.kind === "youtube" && (s.videoId || (s.url && isYouTubeUrl(s.url)))
        ) ?? null;
    if (yt) return yt;
    const hls = byKind("hls") || t.sources.find((s) => s.url && isM3U8(s.url)) || null;
    if (hls) return hls;
    const audio =
        byKind("audio") || t.sources.find((s) => s.url && isAudioFile(s.url)) || null;
    if (audio) return audio;
    return t.sources[0] ?? null;
};

const formatTime = (sec: number) => {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

type HlsLike = { destroy(): void } | null;

/* ===== Komponent ===== */

export const GenericPlayer: React.FC<GenericPlayerProps> = ({
                                                                tracks = [],
                                                                initialIndex = 0,
                                                                autoPlay = true,
                                                                height = 360,
                                                                onIndexChange,
                                                                onPlayingChange,
                                                                onTimeUpdate,
                                                                externalRef,
                                                                uiMode = "full",
                                                                compactNextCount = 3,
                                                                progressBarPosition = "inline",
                                                            }) => {
    // indeks / utwór / źródło
    const [index, setIndex] = useState(
        Math.min(Math.max(0, initialIndex), Math.max(0, tracks.length - 1))
    );
    const current = tracks[index];
    const source = useMemo(() => pickBestSource(current), [current]);

    // status
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.9);

    // refs do playerów
    const ytRef = useRef<YTPlayer | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hlsRef = useRef<HlsLike>(null);

    // Zmiana indeksu
    const safeSetIndex = useCallback(
        (i: number) => {
            const clamped = Math.min(Math.max(0, i), Math.max(0, tracks.length - 1));
            setIndex(clamped);
            onIndexChange?.(clamped);
        },
        [tracks.length, onIndexChange]
    );

    const next = useCallback(() => safeSetIndex(index + 1), [index, safeSetIndex]);
    const prev = useCallback(() => safeSetIndex(index - 1), [index, safeSetIndex]);

    // Sterowanie
    const play = useCallback(() => {
        if (source?.kind === "youtube") ytRef.current?.playVideo();
        else audioRef.current?.play();
        setIsPlaying(true);
        onPlayingChange?.(true);
    }, [source, onPlayingChange]);

    const pause = useCallback(() => {
        if (source?.kind === "youtube") ytRef.current?.pauseVideo();
        else audioRef.current?.pause();
        setIsPlaying(false);
        onPlayingChange?.(false);
    }, [source, onPlayingChange]);

    const toggle = useCallback(() => (isPlaying ? pause() : play()), [isPlaying, play, pause]);

    const seekTo = useCallback(
        (sec: number) => {
            if (source?.kind === "youtube") ytRef.current?.seekTo(sec, true);
            else if (audioRef.current) audioRef.current.currentTime = sec;
            setCurrentTime(sec);
            onTimeUpdate?.(sec);
        },
        [source, onTimeUpdate]
    );

    const setVol = useCallback(
        (v: number) => {
            setVolume(v);
            if (source?.kind === "youtube") ytRef.current?.setVolume?.(Math.round(v * 100));
            else if (audioRef.current) audioRef.current.volume = v;
        },
        [source]
    );

    useImperativeHandle(
        externalRef,
        () => ({
            play,
            pause,
            toggle,
            seekTo,
            setVolume: setVol,
        }),
        [play, pause, toggle, seekTo, setVol]
    );


    // Aktualizacja czasu
    useEffect(() => {
        const id = window.setInterval(() => {
            let ct = 0, dur = 0;
            if (source?.kind === "youtube" && ytRef.current) {
                ct = ytRef.current.getCurrentTime() || 0;
                dur = ytRef.current.getDuration() || 0;
            } else if (audioRef.current) {
                ct = audioRef.current.currentTime || 0;
                dur = audioRef.current.duration || 0;
            }
            setCurrentTime(ct);
            setDuration(dur);
            onTimeUpdate?.(ct);
        }, 250);
        return () => window.clearInterval(id);
    }, [source?.kind, onTimeUpdate]);

    // HLS/Audio ładowanie
    useEffect(() => {
        // cleanup poprzedniego HLS
        if (hlsRef.current) {
            try {
                hlsRef.current.destroy();
            } catch { /* no-op */ }
            hlsRef.current = null;
        }

        // ustaw głośność + CORS
        if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.crossOrigin = source?.withCredentials ? "use-credentials" : "anonymous";
        }

        if (source?.kind === "hls" && isM3U8(source.url)) {
            const audio = audioRef.current;
            if (!audio) return;

            const attachNative = () => {
                audio.src = source.url!;
                audio.load();
                if (autoPlay) audio.play().catch(() => void 0);
            };

            if (audio.canPlayType("application/vnd.apple.mpegurl")) {
                attachNative();
            } else {
                (async () => {
                    try {
                        const mod = await import("hls.js");
                        const Hls = (mod as unknown as { default: any }).default;
                        if (Hls?.isSupported?.()) {
                            const hls = new Hls({
                                xhrSetup: (xhr: XMLHttpRequest) => {
                                    if (source?.withCredentials) xhr.withCredentials = true;
                                    if (source?.headers) {
                                        for (const [k, v] of Object.entries(source.headers)) {
                                            try {
                                                xhr.setRequestHeader(k, v);
                                            } catch{
                                                /* ignore single bad header */
                                            }
                                        }
                                    }
                                },
                            });
                            hlsRef.current = hls;
                            hls.loadSource(source.url!);
                            hls.attachMedia(audio);
                            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                                if (autoPlay) audio.play().catch(() => void 0);
                            });
                        } else {
                            attachNative();
                        }
                    } catch {
                        attachNative();
                    }
                })();
            }
        } else if (source?.kind === "audio" && source.url && audioRef.current) {
            const a = audioRef.current;
            a.src = source.url;
            a.load();
            if (autoPlay) a.play().catch(() => void 0);
        }

        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(!!autoPlay);
    }, [source?.url, source?.kind, source?.withCredentials, JSON.stringify(source?.headers), autoPlay, volume]);

    // zakończenie — kolejny
    const handleEnded = useCallback(() => {
        if (index < tracks.length - 1) next();
        else {
            setIsPlaying(false);
            onPlayingChange?.(false);
            seekTo(0);
        }
    }, [index, tracks.length, next, onPlayingChange, seekTo]);

    /* === Warianty UI === */

    // scena (YT zawsze widoczny; plik/stream tylko gdy full)
    const stageVisible = source?.kind === "youtube" || uiMode === "full";

    // lista do "compact"
    const nextPeek =
        compactNextCount > 0 ? tracks.slice(index + 1, index + 1 + compactNextCount) : [];

    return (
        <div className="gp-player" style={{ display: "grid", gap: 12 }}>
            {/* SCENA */}
            {stageVisible && (
                <div
                    className="gp-stage"
                    style={{
                        width: "100%",
                        height,
                        background: source?.kind === "youtube" ? "transparent" : "#0f172a",
                        borderRadius: 8,
                        overflow: "hidden",
                        position: "relative",
                        display: "grid",
                        placeItems: "center",
                    }}
                >
                    {source?.kind === "youtube" && (
                        <YouTube
                            videoId={source.videoId ?? extractVideoId(source.url)}
                            onReady={(ev: YouTubeEvent) => {
                                ytRef.current = ev.target;
                                setVol(volume);
                                if (autoPlay) ev.target.playVideo();
                            }}
                            onEnd={handleEnded}
                            opts={{
                                width: "100%",
                                height: "100%",
                                playerVars: {
                                    autoplay: autoPlay ? 1 : 0,
                                    controls: 0,
                                    modestbranding: 1,
                                    rel: 0,
                                    showinfo: 0,
                                    fs: 0,
                                    disablekb: 1,
                                    iv_load_policy: 3,
                                },
                            }}
                            style={{ width: "100%", height: "100%" }}
                        />
                    )}

                    {(source?.kind === "audio" || source?.kind === "hls") && (
                        <>
                            {/* okładka / placeholder (tylko dla full, bo w innych i tak ukrywamy scenę dla audio/hls) */}
                            {uiMode === "full" && (
                                <div style={{ textAlign: "center", color: "#e2e8f0" }}>
                                    {current?.coverUrl ? (
                                        <img
                                            alt="cover"
                                            src={current.coverUrl}
                                            style={{ height: height - 24, objectFit: "contain" }}
                                        />
                                    ) : (
                                        <div style={{ opacity: 0.8 }}>
                                            <div style={{ fontSize: 18, fontWeight: 600 }}>
                                                {current?.artist} — {current?.title}
                                            </div>
                                            <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
                                                {source?.label ?? `${source?.codec ?? ""} ${source?.quality ?? ""}`.trim()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <audio
                                ref={audioRef}
                                onEnded={handleEnded}
                                onLoadedMetadata={() => {
                                    const a = audioRef.current;
                                    if (!a) return;
                                    setDuration(a.duration || 0);
                                }}
                                crossOrigin={source?.withCredentials ? "use-credentials" : "anonymous"}
                                style={{ display: "none" }}
                            />
                        </>
                    )}
                </div>
            )}

            {/* Tytuł / artysta (dla minimal/compact pokażmy nagłówek nad kontrolkami) */}
            {(uiMode === "minimal" || uiMode === "compact") && (
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "space-between" }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>{current?.title ?? "—"}</div>
                        <div style={{ color: "#64748b", fontSize: 13 }}>{current?.artist ?? "—"}</div>
                    </div>
                </div>
            )}

            {/* KONTROLKI / PROGRES wg wariantu */}
            {uiMode === "full" && (
                <>
                    <HeaderTime currentTime={currentTime} duration={duration} />
                    <ControlsRow
                        isPlaying={isPlaying}
                        index={index}
                        count={tracks.length}
                        currentTime={currentTime}
                        duration={duration}
                        volume={volume}
                        onPrev={prev}
                        onNext={next}
                        onToggle={toggle}
                        onSeek={seekTo}
                        onVolume={setVol}
                    />
                </>
            )}

            {uiMode === "progressOnly" && (
                <div
                    style={
                        progressBarPosition === "fixedBottom"
                            ? {
                                position: "fixed",
                                left: 0,
                                right: 0,
                                bottom: 0,
                                padding: "8px 12px",
                                background: "rgba(15, 23, 42, 0.9)", // półprzezroczyste tło
                                backdropFilter: "blur(2px)",
                                zIndex: 1000,
                            }
                            : {}
                    }
                >
                    <OnlyProgress
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={seekTo}
                    />
                </div>
            )}


            {(uiMode === "minimal" || uiMode === "compact") && (
                <MinimalRow
                    isPlaying={isPlaying}
                    canPrev={index > 0}
                    canNext={index < tracks.length - 1}
                    onPrev={prev}
                    onNext={next}
                    onToggle={toggle}
                />
            )}

            {uiMode === "compact" && nextPeek.length > 0 && (
                <CompactNext
                    items={nextPeek}
                    onPick={(rel) => safeSetIndex(index + 1 + rel)}
                />
            )}

            {/* LISTA (pełna tylko w full) */}
            {uiMode === "full" && tracks.length > 0 && (
                <div className="gp-list" style={{ display: "grid", gap: 4 }}>
                    {tracks.map((t, i) => (
                        <button
                            key={t.id}
                            onClick={() => safeSetIndex(i)}
                            style={{
                                textAlign: "left",
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                padding: "8px 10px",
                                background: i === index ? "#eef2ff" : "#fff",
                                cursor: "pointer",
                            }}
                            title={t.sources.map((s) => s.kind).join(", ")}
                        >
                            <div style={{ fontWeight: 600 }}>{t.title}</div>
                            <div style={{ color: "#64748b", fontSize: 12 }}>{t.artist}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ===== Małe, samodzielne fragmenty UI ===== */

const btnStyle: React.CSSProperties = {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "6px 10px",
    background: "#fff",
    cursor: "pointer",
};

const HeaderTime: React.FC<{ currentTime: number; duration: number }> = ({ currentTime, duration }) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "space-between" }}>
        <div />
        <div style={{ fontSize: 12, color: "#64748b" }}>
            {formatTime(currentTime)} / {formatTime(duration)}
        </div>
    </div>
);

const ControlsRow: React.FC<{
    isPlaying: boolean;
    index: number;
    count: number;
    currentTime: number;
    duration: number;
    volume: number;
    onPrev: () => void;
    onNext: () => void;
    onToggle: () => void;
    onSeek: (sec: number) => void;
    onVolume: (v: number) => void;
}> = ({ isPlaying, index, count, currentTime, duration, volume, onPrev, onNext, onToggle, onSeek, onVolume }) => (
    <div className="gp-controls" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onPrev} disabled={index <= 0} title="Poprzedni" style={btnStyle}>⏮</button>
            <button onClick={onToggle} title={isPlaying ? "Pauza" : "Odtwarzaj"} style={btnStyle}>{isPlaying ? "⏸" : "▶"}</button>
            <button onClick={onNext} disabled={index >= count - 1} title="Następny" style={btnStyle}>⏭</button>
        </div>

        <input type="range" min={0} max={Math.max(1, duration)} step={0.1} value={currentTime} onChange={(e) => onSeek(parseFloat(e.target.value))} />

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>🔊</span>
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => onVolume(parseFloat(e.target.value))} />
        </div>
    </div>
);

const OnlyProgress: React.FC<{
    currentTime: number;
    duration: number;
    onSeek: (sec: number) => void;
}> = ({ currentTime, duration, onSeek }) => (
    <>
        <HeaderTime currentTime={currentTime} duration={duration} />
        <input
            type="range"
            min={0}
            max={Math.max(1, duration)}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
        />
    </>
);

const MinimalRow: React.FC<{
    isPlaying: boolean;
    canPrev: boolean;
    canNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onToggle: () => void;
}> = ({ isPlaying, canPrev, canNext, onPrev, onNext, onToggle }) => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={onPrev} disabled={!canPrev} title="Poprzedni" style={btnStyle}>⏮</button>
        <button onClick={onToggle} title={isPlaying ? "Pauza" : "Odtwarzaj"} style={btnStyle}>{isPlaying ? "⏸" : "▶"}</button>
        <button onClick={onNext} disabled={!canNext} title="Następny" style={btnStyle}>⏭</button>
    </div>
);

const CompactNext: React.FC<{ items: PlayerTrack[]; onPick: (relativeIndex: number) => void }> = ({
                                                                                                      items,
                                                                                                      onPick,
                                                                                                  }) => (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, background: "#fff" }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Następne:</div>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
            {items.map((t, i) => (
                <li key={t.id} style={{ marginBottom: 4 }}>
                    <button
                        type="button"
                        onClick={() => onPick(i)}
                        style={{ border: "none", padding: 0, background: "transparent", cursor: "pointer", color: "#111827" }}
                        title={t.sources.map((s) => s.kind).join(", ")}
                    >
                        <span style={{ fontWeight: 600 }}>{t.artist}</span> — {t.title}
                    </button>
                </li>
            ))}
        </ol>
    </div>
);

/* ===== Helpers ===== */

function extractVideoId(url?: string): string | undefined {
    if (!url) return undefined;
    const m1 = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
    if (m1) return m1[1];
    const m2 = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
    if (m2) return m2[1];
    return undefined;
}

export default GenericPlayer;
