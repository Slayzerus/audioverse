import { useState, useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TFunction } from 'i18next';
import type { ClipRegion, LayerSettings, ClipId } from "../../../models/editor/audioTypes";
import type { WaveformData } from "../../../models/editor/timelineTypes";
import type { AudioLayer, AudioProject } from "../../../models/modelsEditor";
import { AudioRecorder } from "../../../scripts/recording";
import type { AudioPlaybackEngine } from "../../../services/audioPlaybackEngine";
import { logger } from '../../../utils/logger';

const log = logger.scoped('useEditorRecording');

export interface UseEditorRecordingParams {
    activeLayer: AudioLayer | null;
    currentTime: number;
    isPlaying: boolean;
    playbackEngine: MutableRefObject<AudioPlaybackEngine | null>;
    layerClips: Record<number, ClipRegion[]>;
    layerSettings: Record<number, LayerSettings>;
    project: AudioProject | null;
    duration: number;
    showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
    t: TFunction;
    bpm: number;
    upsertEngineClip: (layerId: number, clip: ClipRegion) => void;
    setLayerClips: Dispatch<SetStateAction<Record<number, ClipRegion[]>>>;
    setSelectedClip: Dispatch<SetStateAction<{ layerId: number; clipId: ClipId } | null>>;
    setWaveforms: Dispatch<SetStateAction<Record<number, WaveformData>>>;
    setStatusMessage: Dispatch<SetStateAction<string>>;
    setStatusType: Dispatch<SetStateAction<"success" | "error" | "">>;
}

export function useEditorRecording(params: UseEditorRecordingParams) {
    const {
        activeLayer, currentTime, isPlaying, playbackEngine,
        layerClips, layerSettings, project, duration,
        showToast, t, bpm, upsertEngineClip,
        setLayerClips, setSelectedClip, setWaveforms,
        setStatusMessage, setStatusType,
    } = params;

    // ── Recording state ──
    const [monitorLevel, setMonitorLevel] = useState(0);
    const [countInRemaining, setCountInRemaining] = useState(0);
    const [countInBars, setCountInBars] = useState(1);
    const [punchIn, setPunchIn] = useState<number | null>(null);
    const [overdubEnabled, setOverdubEnabled] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [isCountIn, setIsCountIn] = useState(false);
    const [punchOut, setPunchOut] = useState<number | null>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const armedPunchInRef = useRef<number | null>(null);
    const recordStartTimeRef = useRef<number>(0);
    const countInIntervalRef = useRef<number | null>(null);
    const countInTimeoutRef = useRef<number | null>(null);

    // ── Helpers ──
    const blobToWaveform = async (blob: Blob, sampleCount: number = 1024): Promise<{ waveform: WaveformData; duration: number; buffer: AudioBuffer }> => {
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
    };

    // ═══════════════════════════════════════════════════════════════
    //  Recording
    // ═══════════════════════════════════════════════════════════════
    const clearCountInTimers = () => {
        if (countInIntervalRef.current) { clearInterval(countInIntervalRef.current); countInIntervalRef.current = null; }
        if (countInTimeoutRef.current) { clearTimeout(countInTimeoutRef.current); countInTimeoutRef.current = null; }
    };

    const startRecordingNow = async () => {
        if (!activeLayer) { showToast(t('editor.selectLayerToRecord'), 'error'); return; }
        if (isRecording) return;
        if (!recorderRef.current) recorderRef.current = new AudioRecorder();
        recordStartTimeRef.current = armedPunchInRef.current ?? currentTime;
        setIsRecording(true); setMonitorLevel(0);
        await recorderRef.current.startRecording({ onLevel: setMonitorLevel });
    };

    const stopRecordingFlow = async () => {
        clearCountInTimers(); setIsCountIn(false); setCountInRemaining(0); armedPunchInRef.current = null;
        if (!recorderRef.current) { setIsRecording(false); setMonitorLevel(0); return; }
        const blob = await recorderRef.current.stopRecording();
        setIsRecording(false); setMonitorLevel(0);
        if (!blob || !activeLayer) return;
        const { waveform, duration: clipDuration, buffer } = await blobToWaveform(blob);
        setWaveforms((prev) => ({ ...prev, [activeLayer.id]: waveform }));
        const start = Math.max(0, recordStartTimeRef.current || 0);
        const newClip: ClipRegion = {
            id: Date.now(), label: t('editor.recording'), start, duration: clipDuration,
            fadeIn: 0, fadeOut: 0, reverse: false, stretchFactor: 1.0,
            color: layerSettings[activeLayer.id]?.color, blob, blobUrl: URL.createObjectURL(blob), audioBuffer: buffer,
        };
        setLayerClips((prev) => ({ ...prev, [activeLayer.id]: [...(prev[activeLayer.id] || []), newClip] }));
        upsertEngineClip(activeLayer.id, newClip);
        setSelectedClip({ layerId: activeLayer.id, clipId: newClip.id });
    };

    const beginCountIn = (seconds: number) => {
        if (seconds <= 0) { void startRecordingNow(); return; }
        setIsCountIn(true); setCountInRemaining(seconds);
        const startedAt = performance.now();
        countInIntervalRef.current = window.setInterval(() => {
            const elapsed = (performance.now() - startedAt) / 1000;
            setCountInRemaining(Math.max(0, seconds - elapsed));
        }, 100);
        countInTimeoutRef.current = window.setTimeout(() => {
            clearCountInTimers(); setIsCountIn(false); setCountInRemaining(0);
            if (!armedPunchInRef.current) void startRecordingNow();
        }, seconds * 1000);
    };

    const handleRecord = async () => {
        if (isRecording || isCountIn) { await stopRecordingFlow(); return; }
        if (!activeLayer) { showToast(t('editor.selectLayerBeforeRecording'), 'error'); return; }
        const countInSeconds = Math.max(0, countInBars) * 4 * (60 / bpm);
        const futurePunch = punchIn != null && punchIn > currentTime ? punchIn : null;
        if (futurePunch) armedPunchInRef.current = futurePunch;
        if (overdubEnabled && playbackEngine.current && !isPlaying) playbackEngine.current.play();
        if (!futurePunch) beginCountIn(countInSeconds);
        else if (countInSeconds > 0) beginCountIn(countInSeconds);
    };

    // ═══════════════════════════════════════════════════════════════
    //  Bounce
    // ═══════════════════════════════════════════════════════════════
    const bounceProject = async () => {
        if (!project || !playbackEngine.current) { showToast(t('editor.bounceNoProject'), 'error'); return; }
        try {
            setStatusMessage(t('editor.bouncing')); setStatusType('success');
            const sampleRate = 44100;
            const totalDuration = duration || 10;
            const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);
            for (const [layerIdStr, clips] of Object.entries(layerClips)) {
                const layerId = Number(layerIdStr);
                const settings = layerSettings[layerId];
                if (settings?.mute) continue;
                const layerGain = offlineCtx.createGain();
                layerGain.gain.value = settings?.volume ?? 1;
                const layerPan = offlineCtx.createStereoPanner();
                layerPan.pan.value = settings?.pan ?? 0;
                layerGain.connect(layerPan).connect(offlineCtx.destination);
                for (const clip of (clips || [])) {
                    if (clip.audioBuffer) {
                        const source = offlineCtx.createBufferSource();
                        source.buffer = clip.audioBuffer;
                        source.playbackRate.value = clip.stretchFactor || 1;
                        source.connect(layerGain);
                        source.start(clip.start, 0, clip.duration);
                    }
                }
            }
            const renderedBuffer = await offlineCtx.startRendering();
            const numChannels = renderedBuffer.numberOfChannels;
            const length = renderedBuffer.length;
            const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
            const view = new DataView(wavBuffer);
            const writeStr = (off: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
            writeStr(0, 'RIFF'); view.setUint32(4, 36 + length * numChannels * 2, true); writeStr(8, 'WAVE');
            writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
            view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * numChannels * 2, true); view.setUint16(32, numChannels * 2, true);
            view.setUint16(34, 16, true); writeStr(36, 'data'); view.setUint32(40, length * numChannels * 2, true);
            let offset = 44;
            const channels = Array.from({ length: numChannels }, (_, i) => renderedBuffer.getChannelData(i));
            for (let i = 0; i < length; i++) {
                for (let ch = 0; ch < numChannels; ch++) {
                    const sample = Math.max(-1, Math.min(1, channels[ch][i]));
                    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                    offset += 2;
                }
            }
            const blob = new Blob([wavBuffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${project.name || 'project'}-bounce.wav`; a.click();
            URL.revokeObjectURL(url);
            setStatusMessage(t('editor.bounceSuccess')); setStatusType('success');
            setTimeout(() => setStatusMessage(''), 3000);
        } catch (err) {
            log.error('Bounce failed:', err);
            setStatusMessage(t('editor.bounceFailed')); setStatusType('error');
            setTimeout(() => setStatusMessage(''), 3000);
        }
    };

    // ── Recording-related effects ──
    useEffect(() => {
        if (armedPunchInRef.current === null) return;
        if (isRecording || isCountIn) return;
        if (currentTime >= armedPunchInRef.current) { void startRecordingNow(); armedPunchInRef.current = null; }
    }, [currentTime, isRecording, isCountIn]);

    useEffect(() => {
        if (!isRecording) return;
        if (punchOut != null && currentTime >= punchOut) void stopRecordingFlow();
    }, [currentTime, isRecording, punchOut]);

    useEffect(() => {
        return () => { clearCountInTimers(); if (recorderRef.current) void recorderRef.current.stopRecording(); };
    }, []);

    return {
        isRecording, isCountIn, countInBars, setCountInBars, countInRemaining,
        overdubEnabled, setOverdubEnabled, punchIn, setPunchIn, punchOut, setPunchOut,
        monitorLevel, handleRecord, bounceProject,
    };
}
