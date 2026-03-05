// src/scripts/musicPlayer/musicPlayerHooks.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { extractVideoId, isAudioFile, isM3U8, isYouTubeUrl } from "./musicPlayerUtils";
import type { PlayerSource, PlayerTrack } from "../../models/modelsAudio";
import { logger } from "../../utils/logger";

const log = logger.scoped('musicPlayerHooks');

/// <summary>
/// Minimal shape of a YouTube IFrame API player used by this hook.
/// Kept inline to avoid external type dependencies.
/// </summary>
export interface YTPlayerLike {
    /// <summary>Starts or resumes playback.</summary>
    playVideo: () => void;
    /// <summary>Pauses playback.</summary>
    pauseVideo: () => void;
    /// <summary>Seeks to a given second.</summary>
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
    /// <summary>Returns total duration (seconds).</summary>
    getDuration: () => number;
    /// <summary>Returns current time (seconds).</summary>
    getCurrentTime: () => number;
    /// <summary>Returns player state (-1..5 from IFrame API).</summary>
    getPlayerState: () => number;
    /// <summary>Sets volume 0..100.</summary>
    setVolume: (v: number) => void;
    /// <summary>Gets volume 0..100.</summary>
    getVolume: () => number;
    /// <summary>Mutes audio.</summary>
    mute?: () => void;
    /// <summary>Unmutes audio.</summary>
    unMute?: () => void;
}

/// <summary>
/// Minimal HLS-like shape (only what we reference).
/// </summary>
export interface HlsLike {
    /// <summary>Attaches to a media element.</summary>
    attachMedia: (media: HTMLMediaElement) => void;
    /// <summary>Detaches from a media element.</summary>
    detachMedia: () => void;
    /// <summary>Loads a source URL.</summary>
    loadSource: (url: string) => void;
    /// <summary>Destroys the instance.</summary>
    destroy: () => void;
}

/// <summary>
/// Picks the best playable source for a given track.
/// </summary>
const pickBestSource = (t?: PlayerTrack): PlayerSource | null => {
    if (!t) return null;
    const byKind = (k: PlayerSource["kind"]) => t.sources.find((s) => s.kind === k);
    const yt = t.sources.find(
        (s) => s.kind === "youtube" && (s.videoId || (s.url && isYouTubeUrl(s.url)))
    );
    if (yt) return yt;
    const hls = byKind("hls") || t.sources.find((s) => s.url && isM3U8(s.url));
    if (hls) return hls;
    const audio = byKind("audio") || t.sources.find((s) => s.url && isAudioFile(s.url));
    return audio ?? t.sources[0] ?? null;
};

/// <summary>
/// Generic music player hook orchestrating YouTube, HLS and native audio.
/// No external type packages required.
/// </summary>
/// <param name="tracks">Playlist to play.</param>
/// <param name="initialIndex">Initial 0-based index.</param>
/// <param name="autoPlay">Whether to auto start after source changes.</param>
export function useGenericPlayer(tracks: PlayerTrack[], initialIndex = 0, autoPlay = true) {
    // index / current / source
    const [index, setIndex] = useState<number>(() =>
        Math.min(Math.max(0, initialIndex), Math.max(0, tracks.length - 1))
    );
    const current = tracks[index];
    const source = useMemo<PlayerSource | null>(() => pickBestSource(current), [current]);

    // state
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [volume, setVolume] = useState<number>(0.9);

    // refs
    const ytRef = useRef<YTPlayerLike | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hlsRef = useRef<HlsLike | null>(null);
    const rafRef = useRef<number | null>(null);

    /// <summary>
    /// Clamps and sets the current index.
    /// </summary>
    const safeSetIndex = useCallback(
        (i: number) => {
            const clamped = Math.min(Math.max(0, i), Math.max(0, tracks.length - 1));
            setIndex(clamped);
        },
        [tracks.length]
    );

    /// <summary>Moves to the next track.</summary>
    const next = useCallback(() => safeSetIndex(index + 1), [index, safeSetIndex]);
    /// <summary>Moves to the previous track.</summary>
    const prev = useCallback(() => safeSetIndex(index - 1), [index, safeSetIndex]);

    /// <summary>
    /// Starts playback depending on active source kind.
    /// </summary>
    const play = useCallback(() => {
        if (!source) return;
        if (source.kind === "youtube") {
            ytRef.current?.playVideo();
            setIsPlaying(true);
        } else {
            const a = audioRef.current;
            if (a) {
                a.play().then(() => setIsPlaying(true)).catch((e) => log.debug('Audio play() rejected', e));
            }
        }
    }, [source]);

    /// <summary>
    /// Pauses playback.
    /// </summary>
    const pause = useCallback(() => {
        if (!source) return;
        if (source.kind === "youtube") {
            ytRef.current?.pauseVideo();
            setIsPlaying(false);
        } else {
            const a = audioRef.current;
            if (a) {
                a.pause();
                setIsPlaying(false);
            }
        }
    }, [source]);

    /// <summary>Play/pause toggle.</summary>
    const toggle = useCallback(() => (isPlaying ? pause() : play()), [isPlaying, play, pause]);

    /// <summary>Seeks to a specific time (seconds).</summary>
    const seekTo = useCallback(
        (sec: number) => {
            const s = Math.max(0, sec);
            if (source?.kind === "youtube") {
                ytRef.current?.seekTo(s, true);
            } else {
                const a = audioRef.current;
                if (a) a.currentTime = s;
            }
        },
        [source]
    );

    /// <summary>Sets volume (0..1).</summary>
    const setVol = useCallback(
        (v: number) => {
            const clamped = Math.min(1, Math.max(0, v));
            setVolume(clamped);
            const a = audioRef.current;
            if (a) a.volume = clamped;
            if (ytRef.current) ytRef.current.setVolume?.(Math.round(clamped * 100));
        },
        []
    );

    // update duration and schedule currentTime updates
    useEffect(() => {
        if (!source) return;

        // reset
        setDuration(0);
        setCurrentTime(0);
        setIsPlaying(false);

        // YouTube – duration via API, tick via rAF
        if (source.kind === "youtube") {
            const tick = () => {
                const t = ytRef.current?.getCurrentTime?.() ?? 0;
                const d = ytRef.current?.getDuration?.() ?? 0;
                if (d > 0 && d !== duration) setDuration(d);
                setCurrentTime(t);
                rafRef.current = window.requestAnimationFrame(tick);
            };
            rafRef.current = window.requestAnimationFrame(tick);
            if (autoPlay) {
                try { ytRef.current?.playVideo(); setIsPlaying(true); } catch (e) { log.debug('YouTube playVideo() failed (player not ready or autoplay blocked)', e); }
            }
            return () => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
            };
        }

        // AUDIO/HLS – rely on media events
        const a = audioRef.current;
        if (!a) return;

        const onLoaded = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
        const onTime = () => setCurrentTime(a.currentTime);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => {
            setIsPlaying(false);
            if (autoPlay) next();
        };

        a.addEventListener("loadedmetadata", onLoaded);
        a.addEventListener("timeupdate", onTime);
        a.addEventListener("play", onPlay);
        a.addEventListener("pause", onPause);
        a.addEventListener("ended", onEnded);

        if (autoPlay) {
            a.play().then(() => setIsPlaying(true)).catch(() => void 0);
        }

        return () => {
            a.removeEventListener("loadedmetadata", onLoaded);
            a.removeEventListener("timeupdate", onTime);
            a.removeEventListener("play", onPlay);
            a.removeEventListener("pause", onPause);
            a.removeEventListener("ended", onEnded);
        };
    }, [source, autoPlay, next, duration]);

    /// <summary>
    /// Applies volume to active backend whenever it changes.
    /// </summary>
    useEffect(() => {
        const a = audioRef.current;
        if (a) a.volume = volume;
        if (ytRef.current) ytRef.current.setVolume?.(Math.round(volume * 100));
    }, [volume]);

    // Public API dla Stage
    return {
        // state
        index,
        current,
        source,
        isPlaying,
        duration,
        currentTime,
        volume,
        // refs
        ytRef,
        audioRef,
        hlsRef,
        // controls
        play,
        pause,
        toggle,
        seekTo,
        setVol,
        // navigation
        safeSetIndex,
        next,
        prev,
        autoPlay,
        extractVideoId,
    };
}
