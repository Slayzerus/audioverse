import { useState, useRef, useEffect, useCallback } from "react";
import { AudioPlaybackEngine } from "../../../../services/audioPlaybackEngine";
import type { ClipRegion, LayerSettings, ClipId } from "../../../../models/editor/audioTypes";
import type { MidiCCEvent } from "../../../../models/editor/midiTypes";
import type { WaveformData } from "../../../../models/editor/timelineTypes";

/**
 * Hook encapsulating playback engine lifecycle, transport controls,
 * clip↔engine sync and waveform conversion.
 */
export function usePlaybackEngine(
    layerSettings: Record<number, LayerSettings>,
    layerClips: Record<number, ClipRegion[]>,
    layerMidiCC: Record<number, MidiCCEvent[]>,
) {
    const engine = useRef<AudioPlaybackEngine | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(10);
    const [isLooping, setIsLooping] = useState(false);
    const [bpm, setBpm] = useState(120);

    // ---------- Engine clip helpers ----------

    const makeEngineClipId = useCallback(
        (layerId: number, clipId: ClipId) => `L${layerId}-C${clipId}`,
        [],
    );

    const upsertEngineClip = useCallback(
        (layerId: number, clip: ClipRegion) => {
            if (!engine.current || !clip.audioBuffer) return;
            const id = makeEngineClipId(layerId, clip.id);
            const settings = layerSettings[layerId];
            engine.current.addClip({
                id,
                buffer: clip.audioBuffer,
                startTime: clip.start,
                offset: 0,
                duration: clip.duration,
                layerId,
                volume: settings?.volume ?? 1,
                pan: settings?.pan ?? 0,
                stretchFactor: clip.stretchFactor || 1.0,
                effectChain: settings?.effectChain || [],
            });
        },
        [layerSettings, makeEngineClipId],
    );

    const removeEngineClip = useCallback(
        (layerId: number, clipId: ClipId) => {
            engine.current?.removeClip(makeEngineClipId(layerId, clipId));
        },
        [makeEngineClipId],
    );

    // ---------- Sync clips & CC to engine ----------

    useEffect(() => {
        Object.entries(layerClips).forEach(([layerIdStr, clips]) => {
            const layerId = Number(layerIdStr);
            clips?.forEach((clip) => upsertEngineClip(layerId, clip));
        });
    }, [layerClips, layerSettings, upsertEngineClip]);

    useEffect(() => {
        if (!engine.current) return;
        Object.entries(layerMidiCC).forEach(([layerIdStr, ccEvents]) => {
            const layerId = Number(layerIdStr);
            engine.current!.setMidiCCEvents(layerId, ccEvents);
        });
    }, [layerMidiCC]);

    // ---------- Transport controls ----------

    const handlePlayPause = useCallback(() => {
        if (!engine.current) return;
        if (isPlaying) engine.current.pause();
        else engine.current.play();
    }, [isPlaying]);

    const handleStop = useCallback(() => {
        engine.current?.stop();
    }, []);

    const handleSeek = useCallback((time: number) => {
        engine.current?.seek(time);
    }, []);

    const handleToggleLoop = useCallback(() => {
        if (!engine.current) return;
        const next = !isLooping;
        setIsLooping(next);
        engine.current.setLoopRegion(0, duration, next);
    }, [isLooping, duration]);

    const handleAdjustDuration = useCallback(
        (amount: number) => {
            const next = Math.max(1, duration + amount);
            setDuration(next);
            engine.current?.setLoopRegion(0, next, isLooping);
        },
        [duration, isLooping],
    );

    // ---------- Waveform conversion ----------

    const blobToWaveform = useCallback(
        async (
            blob: Blob,
            sampleCount = 1024,
        ): Promise<{ waveform: WaveformData; duration: number; buffer: AudioBuffer }> => {
            const arrayBuffer = await blob.arrayBuffer();
            const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
            const channel = buffer.getChannelData(0);
            const len = channel.length;
            const step = Math.max(1, Math.floor(len / sampleCount));
            const samples: number[] = [];
            for (let i = 0; i < sampleCount; i++) {
                const idx = i * step;
                if (idx >= len) break;
                samples.push(channel[idx]);
            }
            ctx.close();
            return {
                waveform: samples.map((v) => Math.max(-1, Math.min(1, v))),
                duration: buffer.duration,
                buffer,
            };
        },
        [],
    );

    return {
        engineRef: engine,
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        duration,
        setDuration,
        isLooping,
        setIsLooping,
        bpm,
        setBpm,
        handlePlayPause,
        handleStop,
        handleSeek,
        handleToggleLoop,
        handleAdjustDuration,
        upsertEngineClip,
        removeEngineClip,
        makeEngineClipId,
        blobToWaveform,
    };
}
