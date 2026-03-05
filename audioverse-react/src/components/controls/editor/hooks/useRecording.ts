import { useState, useRef, useCallback } from "react";
import { AudioRecorder } from "../../../../scripts/recording";
import type { ClipRegion, LayerSettings, ClipId } from "../../../../models/editor/audioTypes";
import type { WaveformData } from "../../../../models/editor/timelineTypes";
import type { AudioLayer } from "../../../../models/modelsEditor";

export interface RecordingDeps {
    activeLayer: AudioLayer | null;
    currentTime: number;
    isPlaying: boolean;
    bpm: number;
    punchIn: number | null;
    overdubEnabled: boolean;
    countInBars: number;
    layerSettings: Record<number, LayerSettings>;
    setLayerClips: React.Dispatch<React.SetStateAction<Record<number, ClipRegion[]>>>;
    setWaveforms: React.Dispatch<React.SetStateAction<Record<number, WaveformData>>>;
    setSelectedClip: React.Dispatch<React.SetStateAction<{ layerId: number; clipId: ClipId } | null>>;
    upsertEngineClip: (layerId: number, clip: ClipRegion) => void;
    blobToWaveform: (blob: Blob) => Promise<{ waveform: WaveformData; duration: number; buffer: AudioBuffer }>;
    playEngine: () => void;
    showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

/**
 * Hook encapsulating recording flow: count-in, punch-in/out, waveform capture.
 */
export function useRecording(deps: RecordingDeps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isCountIn, setIsCountIn] = useState(false);
    const [monitorLevel, setMonitorLevel] = useState(0);
    const [countInRemaining, setCountInRemaining] = useState(0);
    const [punchOut, setPunchOut] = useState<number | null>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const armedPunchInRef = useRef<number | null>(null);
    const recordStartTimeRef = useRef<number>(0);
    const countInIntervalRef = useRef<number | null>(null);
    const countInTimeoutRef = useRef<number | null>(null);

    const clearCountInTimers = useCallback(() => {
        if (countInIntervalRef.current) {
            clearInterval(countInIntervalRef.current);
            countInIntervalRef.current = null;
        }
        if (countInTimeoutRef.current) {
            clearTimeout(countInTimeoutRef.current);
            countInTimeoutRef.current = null;
        }
    }, []);

    const startRecordingNow = useCallback(async () => {
        if (!deps.activeLayer) {
            deps.showToast("Select a layer to record.", "error");
            return;
        }
        if (isRecording) return;
        if (!recorderRef.current) {
            recorderRef.current = new AudioRecorder();
        }
        recordStartTimeRef.current = armedPunchInRef.current ?? deps.currentTime;
        setIsRecording(true);
        setMonitorLevel(0);
        await recorderRef.current.startRecording({ onLevel: setMonitorLevel });
    }, [deps, isRecording]);

    const stopRecordingFlow = useCallback(async () => {
        clearCountInTimers();
        setIsCountIn(false);
        setCountInRemaining(0);
        armedPunchInRef.current = null;
        if (!recorderRef.current) {
            setIsRecording(false);
            setMonitorLevel(0);
            return;
        }
        const blob = await recorderRef.current.stopRecording();
        setIsRecording(false);
        setMonitorLevel(0);
        if (!blob || !deps.activeLayer) return;
        const { waveform, duration: clipDuration, buffer } = await deps.blobToWaveform(blob);
        const layerId = deps.activeLayer.id;
        deps.setWaveforms((prev) => ({ ...prev, [layerId]: waveform }));
        const start = Math.max(0, recordStartTimeRef.current || 0);
        const newClip: ClipRegion = {
            id: Date.now(),
            label: "Recording",
            start,
            duration: clipDuration,
            fadeIn: 0,
            fadeOut: 0,
            reverse: false,
            stretchFactor: 1.0,
            color: deps.layerSettings[layerId]?.color,
            blob,
            blobUrl: URL.createObjectURL(blob),
            audioBuffer: buffer,
        };
        deps.setLayerClips((prev) => ({
            ...prev,
            [layerId]: [...(prev[layerId] || []), newClip],
        }));
        deps.upsertEngineClip(layerId, newClip);
        deps.setSelectedClip({ layerId, clipId: newClip.id });
    }, [deps, clearCountInTimers]);

    const beginCountIn = useCallback(
        (seconds: number) => {
            if (seconds <= 0) {
                void startRecordingNow();
                return;
            }
            setIsCountIn(true);
            setCountInRemaining(seconds);
            const startedAt = performance.now();
            countInIntervalRef.current = window.setInterval(() => {
                const elapsed = (performance.now() - startedAt) / 1000;
                setCountInRemaining(Math.max(0, seconds - elapsed));
            }, 100);
            countInTimeoutRef.current = window.setTimeout(() => {
                clearCountInTimers();
                setIsCountIn(false);
                setCountInRemaining(0);
                if (!armedPunchInRef.current) {
                    void startRecordingNow();
                }
            }, seconds * 1000);
        },
        [startRecordingNow, clearCountInTimers],
    );

    const handleRecord = useCallback(async () => {
        if (isRecording || isCountIn) {
            await stopRecordingFlow();
            return;
        }
        if (!deps.activeLayer) {
            deps.showToast("Select a layer before recording", "error");
            return;
        }
        const countInSeconds = Math.max(0, deps.countInBars) * 4 * (60 / deps.bpm);
        const futurePunch =
            deps.punchIn != null && deps.punchIn > deps.currentTime ? deps.punchIn : null;
        if (futurePunch) {
            armedPunchInRef.current = futurePunch;
        }
        if (deps.overdubEnabled && !deps.isPlaying) {
            deps.playEngine();
        }
        if (!futurePunch) {
            beginCountIn(countInSeconds);
        } else if (countInSeconds > 0) {
            beginCountIn(countInSeconds);
        }
    }, [isRecording, isCountIn, deps, stopRecordingFlow, beginCountIn]);

    return {
        isRecording,
        isCountIn,
        monitorLevel,
        countInRemaining,
        punchOut,
        setPunchOut,
        armedPunchInRef,
        recorderRef,
        clearCountInTimers,
        startRecordingNow,
        stopRecordingFlow,
        handleRecord,
    };
}
