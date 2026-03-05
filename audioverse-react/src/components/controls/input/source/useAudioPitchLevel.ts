/**
 * useAudioPitchLevel — custom hook extracting all state, effects and handlers
 * from the AudioPitchLevel component so it remains a thin rendering wrapper.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "../../../ui/ToastProvider";
import {
    updateMicrophone, createMicrophone, getUserMicrophones,
    getUserDevices, updateDevice, createDevice,
    DeviceType, PitchDetectionMethod, MicrophoneDto, DeviceDto,
} from "../../../../scripts/api/apiUser";
import { PitchDetector } from "pitchy";
import { useTranslation } from 'react-i18next';
import { LibrosaStreamClient } from "../../../../utils/librosaStreaming";
import type { LibrosaMessage } from "../../../../utils/librosaStreaming";
import { CrepeStreamClient } from "../../../../utils/crepeStreaming";
import { logger } from '../../../../utils/logger';

const log = logger.scoped('AudioPitchLevel');

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AudioPitchLevelProps {
    deviceId: string;
    smoothingWindow?: number;
    hysteresisFrames?: number;
    rmsThreshold?: number;
    useHanning?: boolean;
    initialSettings?: Partial<MicrophoneDto>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAudioPitchLevel({
    deviceId,
    smoothingWindow: propSmoothingWindow = 5,
    hysteresisFrames: propHysteresisFrames = 5,
    rmsThreshold: propRmsThreshold = 0.02,
    useHanning: propUseHanning = false,
    initialSettings,
}: AudioPitchLevelProps) {
    const { t } = useTranslation();
    const { showToast } = useToast();

    /* ---------- refs ---------- */
    const importInputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const monitorNodeRef = useRef<GainNode | null>(null);
    const pitchyDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
    const librosaClientRef = useRef<LibrosaStreamClient | null>(null);
    const crepeClientRef = useRef<CrepeStreamClient | null>(null);
    const monitorLevelIntervalRef = useRef<number | null>(null);
    // Incremented every time setupPitchAnalysis starts; captured as a local ID so
    // concurrent/stale calls can detect they've been superseded and bail out early.
    const setupAbortRef = useRef(0);
    // Persists across re-renders; reset when user changes pitch method
    const backendUnavailableRef = useRef<boolean>(false);
    // Refs for threshold values so WS callbacks always see the latest values without stale closures
    const pitchThresholdRef = useRef(0.5);
    const rmsThresholdRef = useRef(propRmsThreshold);
    // Updated every animation frame so WS message handlers can gate on current mic volume
    const currentRmsRef = useRef(0);
    // Timestamp of the last received Librosa/Crepe WS pitch — used to suppress hysteresis between responses
    const lastStreamPitchTimeRef = useRef(0);
    // Last valid pitch/note from a streaming WS callback — used by RAF loop to fill history at 60fps
    const lastStreamHzRef = useRef<number>(0);
    const lastStreamNoteRef = useRef<string>("-");

    /* ---------- state ---------- */
    const [analysisActive, setAnalysisActive] = useState(false);
    const [microphoneRecordId, setMicrophoneRecordId] = useState<number | null>(null);
    const [smoothingWindow, setSmoothingWindow] = useState(propSmoothingWindow);
    const [hysteresisFrames, setHysteresisFrames] = useState(propHysteresisFrames);
    const [rmsThreshold, setRmsThreshold] = useState(propRmsThreshold);
    const [useHanning, setUseHanning] = useState(propUseHanning);
    const [micGain, setMicGain] = useState(0);
    const [monitorEnabled, setMonitorEnabled] = useState(false);
    const [monitorVolume, setMonitorVolume] = useState(100);
    const [showCalib, setShowCalib] = useState(false);
    const [pitchThreshold, setPitchThreshold] = useState(0.5);
    // Keep refs in sync with state so WS message closures always read the latest threshold
    pitchThresholdRef.current = pitchThreshold;
    rmsThresholdRef.current = rmsThreshold;
    const [fftData, setFftData] = useState<Uint8Array | null>(null);
    const [noteHistory, setNoteHistory] = useState<{ note: string; time: number; hz: number }[]>([]);
    const [pitchDetectionMethod, setPitchDetectionMethod] = useState<PitchDetectionMethod>(PitchDetectionMethod.UltrastarWP);
    const [pitch, setPitch] = useState<number | null>(null);
    const [note, setNote] = useState<string>("-");
    const [barWidth, setBarWidth] = useState<number>(0);
    const [backendUnavailable, setBackendUnavailable] = useState(false);

    // Reset backend availability when user explicitly changes pitch detection method
    const prevPitchMethodRef = useRef<PitchDetectionMethod>(pitchDetectionMethod);
    if (prevPitchMethodRef.current !== pitchDetectionMethod) {
        prevPitchMethodRef.current = pitchDetectionMethod;
        backendUnavailableRef.current = false;
        setBackendUnavailable(false);
    }

    const MONITOR_BOOST = 4;

    /* ================================================================
       HELPERS
       ================================================================ */

    const computeMonitorGain = (vol: number) => {
        const g = (vol / 100) * MONITOR_BOOST;
        return Math.min(Math.max(g, 0), 20);
    };

    const autoCorrelate = (buffer: Float32Array, sampleRate: number, rmsThres: number) => {
        let bestOffset = -1;
        let bestCorrelation = 0;
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
        rms = Math.sqrt(rms / buffer.length);
        if (rms < rmsThres) return 0;
        for (let offset = 0; offset < buffer.length / 2; offset++) {
            let correlation = 0;
            for (let i = 0; i < buffer.length / 2; i++) correlation += buffer[i] * buffer[i + offset];
            correlation /= buffer.length / 2;
            if (correlation > bestCorrelation) { bestCorrelation = correlation; bestOffset = offset; }
        }
        return bestOffset > 0 ? sampleRate / bestOffset : 0;
    };

    const applyHanningWindow = (buffer: Float32Array) => {
        for (let i = 0; i < buffer.length; i++) {
            buffer[i] *= 0.5 * (1 - Math.cos((2 * Math.PI * i) / (buffer.length - 1)));
        }
    };

    const getNoteFromFrequency = (frequency: number) => {
        const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const A4 = 440;
        const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69;
        const noteIndex = (noteNumber % 12 + 12) % 12;
        return notes[noteIndex];
    };

    /* ================================================================
       EFFECT — Load settings from initialSettings / backend / localStorage
       ================================================================ */

    useEffect(() => {
        if (initialSettings) {
            try {
                const json = initialSettings;
                if (typeof json.micGain === 'number') setMicGain(json.micGain);
                if (typeof json.monitorEnabled === 'boolean') setMonitorEnabled(json.monitorEnabled);
                if (typeof json.monitorVolume === 'number') setMonitorVolume(json.monitorVolume);
                if (typeof json.pitchThreshold === 'number') setPitchThreshold(json.pitchThreshold);
                if (typeof json.smoothingWindow === 'number') setSmoothingWindow(json.smoothingWindow);
                if (typeof json.hysteresisFrames === 'number') setHysteresisFrames(json.hysteresisFrames);
                if (typeof json.rmsThreshold === 'number') setRmsThreshold(json.rmsThreshold);
                if (typeof json.useHanning === 'boolean') setUseHanning(json.useHanning);
                if (typeof json.pitchDetectionMethod === 'number') setPitchDetectionMethod(json.pitchDetectionMethod);
            } catch { /* Parse error expected for invalid input */ }
            return;
        }

        const load = async () => {
            try {
                const pre = (window as unknown as { userMicrophones?: MicrophoneDto[] }).userMicrophones;
                let mics: MicrophoneDto[] = [];
                if (Array.isArray(pre) && pre.length) mics = pre;
                else {
                    try {
                        const resp = await getUserMicrophones();
                        mics = resp?.microphones ?? resp ?? [];
                    } catch (e) {
                        log.debug('getUserMicrophones failed, using empty list', e);
                        mics = [];
                    }
                }
                const found = Array.isArray(mics) ? mics.find((m) => m.deviceId === deviceId) : undefined;
                if (found && found.id) {
                    setMicrophoneRecordId(found.id);
                    if (typeof found.pitchDetectionMethod === 'number') setPitchDetectionMethod(found.pitchDetectionMethod);
                    if (typeof found.micGain === 'number') setMicGain(found.micGain);
                    else if (typeof found.volume === 'number') setMicGain(found.volume);
                    if (typeof found.monitorEnabled === 'boolean') setMonitorEnabled(found.monitorEnabled);
                    if (typeof found.monitorVolume === 'number') setMonitorVolume(found.monitorVolume ?? 100);
                    if (typeof found.pitchThreshold === 'number') setPitchThreshold(found.pitchThreshold);
                    else if (typeof found.threshold === 'number') setPitchThreshold(found.threshold / 1000);
                    if (typeof found.smoothingWindow === 'number') setSmoothingWindow(found.smoothingWindow ?? propSmoothingWindow);
                    if (typeof found.hysteresisFrames === 'number') setHysteresisFrames(found.hysteresisFrames ?? propHysteresisFrames);
                    if (typeof found.rmsThreshold === 'number') setRmsThreshold(found.rmsThreshold ?? propRmsThreshold);
                    if (typeof found.useHanning === 'boolean') setUseHanning(found.useHanning);
                    try {
                        const raw = localStorage.getItem(`mic_settings_${deviceId}`);
                        if (raw) {
                            const json = JSON.parse(raw);
                            if (typeof json.micGain === 'number') setMicGain(json.micGain);
                            if (typeof json.monitorEnabled === 'boolean') setMonitorEnabled(json.monitorEnabled);
                            if (typeof json.monitorVolume === 'number') setMonitorVolume(json.monitorVolume);
                            if (typeof json.pitchThreshold === 'number') setPitchThreshold(json.pitchThreshold);
                            if (typeof json.smoothingWindow === 'number') setSmoothingWindow(json.smoothingWindow);
                            if (typeof json.hysteresisFrames === 'number') setHysteresisFrames(json.hysteresisFrames);
                            if (typeof json.rmsThreshold === 'number') setRmsThreshold(json.rmsThreshold);
                            if (typeof json.useHanning === 'boolean') setUseHanning(json.useHanning);
                        }
                    } catch { /* Parse error expected for invalid input */ }
                } else {
                    try {
                        const raw = localStorage.getItem(`mic_settings_${deviceId}`);
                        if (raw) {
                            const json = JSON.parse(raw);
                            if (typeof json.micGain === 'number') setMicGain(json.micGain);
                            if (typeof json.monitorEnabled === 'boolean') setMonitorEnabled(json.monitorEnabled);
                            if (typeof json.monitorVolume === 'number') setMonitorVolume(json.monitorVolume);
                            if (typeof json.pitchThreshold === 'number') setPitchThreshold(json.pitchThreshold);
                            if (typeof json.smoothingWindow === 'number') setSmoothingWindow(json.smoothingWindow);
                            if (typeof json.hysteresisFrames === 'number') setHysteresisFrames(json.hysteresisFrames);
                            if (typeof json.rmsThreshold === 'number') setRmsThreshold(json.rmsThreshold);
                            if (typeof json.useHanning === 'boolean') setUseHanning(json.useHanning);
                        }
                    } catch { /* Parse error expected for invalid input */ }
                }
            } catch (err) {
                log.warn('loadMicSettings', 'Failed to load microphone settings from backend', err);
            }
        };
        load();
    }, [deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ================================================================
       EFFECT — Listen for reset events
       ================================================================ */

    useEffect(() => {
        const handler = (ev: Event) => {
            try {
                const detail = (ev as CustomEvent<{ deviceId?: string }>).detail;
                if (!detail || detail.deviceId !== deviceId) return;
                setMicGain(0);
                setMonitorEnabled(false);
                setMonitorVolume(100);
                setPitchThreshold(0.5);
                setSmoothingWindow(propSmoothingWindow);
                setHysteresisFrames(propHysteresisFrames);
                setRmsThreshold(propRmsThreshold);
                setUseHanning(propUseHanning);
                try { localStorage.removeItem(`mic_settings_${deviceId}`); } catch { /* Best-effort */ }
            } catch { /* Intentionally swallowed */ }
        };
        window.addEventListener('mic-reset', handler as EventListener);
        return () => window.removeEventListener('mic-reset', handler as EventListener);
    }, [deviceId, propSmoothingWindow, propHysteresisFrames, propRmsThreshold, propUseHanning]);

    /* ================================================================
       EFFECT — Main pitch analysis pipeline
       ================================================================ */

    useEffect(() => {
        const pitchBuffer: number[] = [];
        let noPitchCount = 0;
        let lastValidPitch: number | null = null;
        let lastValidNote: string = "-";
        const analysisStartedRef = { current: false } as { current: boolean };

        async function setupPitchAnalysis() {
            log.debug(`[PitchLevel][${deviceId}] setupPitchAnalysis() called`);
            if (analysisStartedRef.current) {
                log.debug(`[PitchLevel][${deviceId}] analysis already started, skipping`);
                return;
            }
            // Give each setup invocation a unique ID.  If the effect re-runs before this
            // async function completes (React StrictMode, rapid prop changes, etc.) the
            // newer invocation will bump setupAbortRef, causing this one to bail out
            // before it creates any AudioContext / stream clients.
            const mySetupId = ++setupAbortRef.current;
            try {
                if (audioContextRef.current && analyserRef.current && gainNodeRef.current && sourceRef.current) {
                    if (setupAbortRef.current !== mySetupId) return;
                    analysisStartedRef.current = true;
                    startDetectLoop();
                    return;
                }

                audioContextRef.current = new AudioContext();
                if (audioContextRef.current.state === "suspended") {
                    await audioContextRef.current.resume();
                }
                // Bail out if superseded while waiting for AudioContext to resume.
                if (setupAbortRef.current !== mySetupId) {
                    audioContextRef.current.close().catch(() => { /* cleanup */ });
                    audioContextRef.current = null;
                    return;
                }

                const constraints: MediaStreamConstraints = { audio: { deviceId, echoCancellation: false, noiseSuppression: false, autoGainControl: false, sampleRate: 48000 } };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                // Bail out if superseded while waiting for getUserMedia.
                if (setupAbortRef.current !== mySetupId) {
                    stream.getTracks().forEach(t => t.stop());
                    audioContextRef.current?.close().catch(() => { /* cleanup */ });
                    audioContextRef.current = null;
                    return;
                }
                log.debug(`[PitchLevel][${deviceId}] getUserMedia succeeded, stream tracks:`, stream.getAudioTracks().map(t => ({ label: t.label, id: t.id })));
                streamRef.current = stream;
                try {
                    const t = stream.getAudioTracks()[0];
                    if (t && t.applyConstraints) {
                        try { await t.applyConstraints({ echoCancellation: false, noiseSuppression: false, autoGainControl: false }); } catch { /* Best-effort */ }
                    }
                } catch { /* Best-effort */ }
                const source = audioContextRef.current.createMediaStreamSource(stream);
                const gainNode = audioContextRef.current.createGain();
                gainNode.gain.value = Math.pow(10, micGain / 20);

                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 2048;
                source.connect(gainNode);
                gainNode.connect(analyserRef.current);

                if (pitchDetectionMethod === PitchDetectionMethod.Pitchy) {
                    try { pitchyDetectorRef.current = PitchDetector.forFloat32Array(analyserRef.current.fftSize); } catch (e) { log.warn('Pitchy detector init failed', e); pitchyDetectorRef.current = null; }
                }

                const streamPitchOnMessage = (msg: LibrosaMessage) => {
                    try {
                        if (typeof msg.hz !== 'number' || msg.hz <= 0) return;
                        const conf = typeof msg.confidence === 'number' ? msg.confidence : 1;
                        if (conf < pitchThresholdRef.current) return;
                        // Only update refs — RAF loop reads them at 60fps and calls setState
                        lastStreamPitchTimeRef.current = Date.now();
                        lastStreamHzRef.current = msg.hz;
                        lastStreamNoteRef.current = getNoteFromFrequency(msg.hz) ?? "-";
                    } catch { /* Intentionally swallowed */ }
                };

                if (pitchDetectionMethod === PitchDetectionMethod.Librosa && !backendUnavailableRef.current) {
                    try {
                        const loc = window.location;
                        const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
                        const wsUrl = `${proto}//${loc.host}/api/librosa/ws/pyin`;
                        const client = new LibrosaStreamClient({
                            wsUrl,
                            onMaxReconnect: () => { backendUnavailableRef.current = true; setBackendUnavailable(true); },
                            onMessage: streamPitchOnMessage,
                        });
                        librosaClientRef.current = client;
                        void client.startWithMediaStream(stream).catch((e: unknown) => { log.warn('[PitchLevel] Librosa client start failed', e); librosaClientRef.current = null; });
                    } catch (e) { log.warn('[PitchLevel] Failed to start Librosa client', e); librosaClientRef.current = null; }
                }

                if (pitchDetectionMethod === PitchDetectionMethod.Crepe && !backendUnavailableRef.current) {
                    try {
                        const loc = window.location;
                        const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
                        const wsUrl = `${proto}//${loc.host}/api/ai/audio/pitch/ws/pitch_server`;
                        const client = new CrepeStreamClient({
                            wsUrl,
                            onMaxReconnect: () => { backendUnavailableRef.current = true; setBackendUnavailable(true); },
                            onMessage: streamPitchOnMessage,
                        });
                        crepeClientRef.current = client;
                        void client.startWithMediaStream(stream).catch((e: unknown) => { log.warn('[PitchLevel] Crepe client start failed', e); crepeClientRef.current = null; });
                    } catch (e) { log.warn('[PitchLevel] Failed to start Crepe client', e); crepeClientRef.current = null; }
                }

                log.debug(`[PitchLevel][${deviceId}] audio nodes created, starting detect loop`);
                sourceRef.current = source;
                gainNodeRef.current = gainNode;
                analysisStartedRef.current = true;
                startDetectLoop();
            } catch (error) {
                log.error(`[PitchLevel][${deviceId}] setupPitchAnalysis ERROR:`, error);
            }
        }

        function startDetectLoop() {
            const a = analyserRef.current!;
            const audioCtx = audioContextRef.current!;
            const fftBuffer = new Uint8Array(a.frequencyBinCount);
            const buffer = new Float32Array(a.fftSize);

            const detectPitch = () => {
                if (!analyserRef.current || !audioContextRef.current) return;
                analyserRef.current.getFloatTimeDomainData(buffer);
                analyserRef.current.getByteFrequencyData(fftBuffer);
                setFftData(new Uint8Array(fftBuffer));

                const now = Date.now();

                if (pitchDetectionMethod === PitchDetectionMethod.Pitchy && pitchyDetectorRef.current) {
                    const slice = buffer.slice();
                    if (useHanning) applyHanningWindow(slice);
                    try {
                        const [hz, clarity] = pitchyDetectorRef.current.findPitch(slice, audioCtx.sampleRate);
                        let rmsVal = 0;
                        for (let i = 0; i < slice.length; i++) rmsVal += slice[i] * slice[i];
                        rmsVal = Math.sqrt(rmsVal / slice.length);
                        if (hz > 50 && hz < 3000 && (pitchThreshold === 0 || hz > pitchThreshold) && clarity > 0.6 && rmsVal > rmsThreshold) {
                            pitchBuffer.push(hz);
                            if (pitchBuffer.length > smoothingWindow) pitchBuffer.shift();
                            const avgPitch = pitchBuffer.reduce((a, b) => a + b, 0) / pitchBuffer.length;
                            lastValidPitch = avgPitch;
                            const detectedNote = getNoteFromFrequency(avgPitch);
                            lastValidNote = detectedNote;
                            setPitch(avgPitch);
                            setNote(detectedNote);
                            setBarWidth((avgPitch - 50) / 10);
                            setNoteHistory((prev) => {
                                const newHistory = [...prev, { note: detectedNote!, time: now, hz: avgPitch }];
                                return newHistory.filter(n => now - n.time < 5000);
                            });
                            noPitchCount = 0;
                        } else {
                            noPitchCount++;
                        }
                    } catch {
                        noPitchCount++;
                    }
                } else if (pitchDetectionMethod === PitchDetectionMethod.Librosa
                    || pitchDetectionMethod === PitchDetectionMethod.Crepe) {
                    // Keep currentRmsRef updated so the WS onMessage handler can gate on silence
                    let rmsVal = 0;
                    for (let i = 0; i < buffer.length; i++) rmsVal += buffer[i] * buffer[i];
                    currentRmsRef.current = Math.sqrt(rmsVal / buffer.length);
                    // Only count as "no pitch" if no WS response arrived in the last 600ms
                    if (Date.now() - lastStreamPitchTimeRef.current < 600) {
                        noPitchCount = 0;
                        // Feed last streaming pitch into lastValidPitch so the RAF display logic
                        // fills noteHistory at 60fps — same density as Pitchy
                        if (lastStreamHzRef.current > 0) {
                            lastValidPitch = lastStreamHzRef.current;
                            lastValidNote = lastStreamNoteRef.current;
                        }
                    } else {
                        noPitchCount++;
                    }
                } else {
                    if (useHanning) applyHanningWindow(buffer);
                    const detectedPitch = autoCorrelate(buffer, audioCtx.sampleRate, rmsThreshold);
                    if (detectedPitch > 50 && detectedPitch < 3000 && (pitchThreshold === 0 || detectedPitch > pitchThreshold)) {
                        pitchBuffer.push(detectedPitch);
                        if (pitchBuffer.length > smoothingWindow) pitchBuffer.shift();
                        const avgPitch = pitchBuffer.reduce((a, b) => a + b, 0) / pitchBuffer.length;
                        lastValidPitch = avgPitch;
                        const detectedNote = getNoteFromFrequency(avgPitch);
                        lastValidNote = detectedNote;
                        setPitch(avgPitch);
                        setNote(detectedNote);
                        setBarWidth((avgPitch - 50) / 10);
                        setNoteHistory((prev) => {
                            const newHistory = [...prev, { note: detectedNote!, time: now, hz: avgPitch }];
                            return newHistory.filter(n => now - n.time < 5000);
                        });
                        noPitchCount = 0;
                    } else {
                        noPitchCount++;
                    }
                }

                // For streaming methods, noteHistory is now filled at 60fps by the RAF loop
                // using lastValidPitch set from the WS ref — no special case needed.

                if (noPitchCount >= hysteresisFrames) {
                    setPitch(null);
                    setNote("-");
                    setNoteHistory((prev) => {
                        const newHistory = [...prev, { note: "-", time: now, hz: 0 }];
                        return newHistory.filter(n => now - n.time < 5000);
                    });
                    setBarWidth(0);
                    lastValidPitch = null;
                    lastValidNote = "-";
                    // Reset stream refs so stale pitch doesn't linger
                    lastStreamHzRef.current = 0;
                    lastStreamNoteRef.current = "-";
                } else if (lastValidPitch) {
                    setPitch(lastValidPitch);
                    setNote(lastValidNote);
                    setNoteHistory((prev) => {
                        const newHistory = [...prev, { note: lastValidNote, time: now, hz: lastValidPitch! }];
                        return newHistory.filter(n => now - n.time < 5000);
                    });
                    setBarWidth((lastValidPitch - 50) / 10);
                }

                requestAnimationFrame(detectPitch);
            };

            detectPitch();
        }

        // When analysisActive is true (user clicked Start Analysis), launch the detect loop.
        // startAnalysis callback creates audio nodes; this effect wires up the detection loop.
        if (analysisActive) {
            if (analyserRef.current && audioContextRef.current && sourceRef.current && gainNodeRef.current) {
                // Nodes already created by startAnalysis — just start detection
                analysisStartedRef.current = true;
                startDetectLoop();
            } else {
                // No nodes yet — full setup (creates nodes + starts loop)
                setupPitchAnalysis();
            }
        } else {
            log.debug(`[PitchLevel][${deviceId}] waiting for startAnalysis call`);
        }

        return () => {
            // Signal any in-flight setupPitchAnalysis call to abort before it creates clients.
            setupAbortRef.current++;
            try {
                monitorNodeRef.current?.disconnect();
                sourceRef.current?.disconnect();
                gainNodeRef.current?.disconnect();
            } catch { /* Silent catch — cleanup */ }
            try { librosaClientRef.current?.stop?.(); } catch { /* cleanup */ }
            try { crepeClientRef.current?.stop?.(); } catch { /* cleanup */ }
            pitchyDetectorRef.current = null;
            if (monitorLevelIntervalRef.current) {
                window.clearInterval(monitorLevelIntervalRef.current);
                monitorLevelIntervalRef.current = null;
            }
            try {
                if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                    audioContextRef.current.close();
                }
            } catch { /* Expected: context may already be closed */ }
            audioContextRef.current = null;
            analyserRef.current = null;
            sourceRef.current = null;
            gainNodeRef.current = null;
            monitorNodeRef.current = null;
        };
    }, [deviceId, analysisActive, smoothingWindow, hysteresisFrames, rmsThreshold, useHanning, pitchThreshold, pitchDetectionMethod]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ================================================================
       startAnalysis — triggered by button click
       ================================================================ */

    const startAnalysis = useCallback(async () => {
        if (analysisActive) return;
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }
            const constraints: MediaStreamConstraints = { audio: { deviceId, echoCancellation: false, noiseSuppression: false, autoGainControl: false, sampleRate: 48000 } };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.value = Math.pow(10, micGain / 20);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(gainNode);
            gainNode.connect(analyser);
            sourceRef.current = source;
            gainNodeRef.current = gainNode;
            analyserRef.current = analyser;
            if (pitchDetectionMethod === PitchDetectionMethod.Pitchy) {
                try { pitchyDetectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize); } catch (e) { log.warn('Pitchy init failed', e); }
            }

            const streamPitchOnMessage = (msg: LibrosaMessage) => {
                try {
                    if (typeof msg.hz !== 'number' || msg.hz <= 0) return;
                    const conf = typeof msg.confidence === 'number' ? msg.confidence : 1;
                    if (conf < pitchThresholdRef.current) return;
                    // Only update refs — RAF loop reads them at 60fps and calls setState
                    lastStreamPitchTimeRef.current = Date.now();
                    lastStreamHzRef.current = msg.hz;
                    lastStreamNoteRef.current = getNoteFromFrequency(msg.hz) ?? "-";
                } catch { /* Intentionally swallowed */ }
            };

            if (pitchDetectionMethod === PitchDetectionMethod.Librosa && !backendUnavailableRef.current) {
                try {
                    const loc = window.location;
                    const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
                    const wsUrl = `${proto}//${loc.host}/api/librosa/ws/pyin`;
                    const client = new LibrosaStreamClient({
                        wsUrl,
                        onMaxReconnect: () => { backendUnavailableRef.current = true; setBackendUnavailable(true); },
                        onMessage: streamPitchOnMessage,
                    });
                    librosaClientRef.current = client;
                    void client.startWithMediaStream(stream).catch((e: unknown) => { log.warn('[PitchLevel] Librosa client start failed (startAnalysis)', e); librosaClientRef.current = null; });
                } catch (e) { log.warn('[PitchLevel] Failed to start Librosa client (startAnalysis)', e); librosaClientRef.current = null; }
            }

            if (pitchDetectionMethod === PitchDetectionMethod.Crepe && !backendUnavailableRef.current) {
                try {
                    const loc = window.location;
                    const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
                    const wsUrl = `${proto}//${loc.host}/api/ai/audio/pitch/ws/pitch_server`;
                    const client = new CrepeStreamClient({
                        wsUrl,
                        onMaxReconnect: () => { backendUnavailableRef.current = true; setBackendUnavailable(true); },
                        onMessage: streamPitchOnMessage,
                    });
                    crepeClientRef.current = client;
                    void client.startWithMediaStream(stream).catch((e: unknown) => { log.warn('[PitchLevel] Crepe client start failed (startAnalysis)', e); crepeClientRef.current = null; });
                } catch (e) { log.warn('[PitchLevel] Failed to start Crepe client (startAnalysis)', e); crepeClientRef.current = null; }
            }

            setAnalysisActive(true);
            log.debug(`[PitchLevel][${deviceId}] analysis started via button`);
        } catch (err) {
            log.error('[PitchLevel] startAnalysis failed', err);
            showToast(t('pitch.startError', 'Failed to start microphone analysis'), 'error');
        }
    }, [analysisActive, deviceId, micGain, pitchDetectionMethod, showToast, t]);

    /* ================================================================
       EFFECT — Update mic gain dynamically
       ================================================================ */

    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = Math.pow(10, micGain / 20);
        }
    }, [micGain]);

    /* ================================================================
       EFFECT — Monitor connect / disconnect
       ================================================================ */

    useEffect(() => {
        const ctx = audioContextRef.current;
        if (!ctx || !gainNodeRef.current) return;
        if (monitorEnabled) {
            if (!monitorNodeRef.current) {
                monitorNodeRef.current = ctx.createGain();
                monitorNodeRef.current.gain.value = monitorVolume / 100;
                try {
                    gainNodeRef.current.connect(monitorNodeRef.current);
                    monitorNodeRef.current.connect(ctx.destination);
                } catch (e) {
                    log.warn("Monitor connect failed", e);
                }
            } else {
                monitorNodeRef.current.gain.value = monitorVolume / 100;
            }
        } else {
            if (monitorNodeRef.current) {
                try { monitorNodeRef.current.disconnect(); } catch { /* cleanup */ }
                monitorNodeRef.current = null;
            }
        }
    }, [monitorEnabled, monitorVolume]);

    /* ================================================================
       EFFECT — Ensure audio init when monitor toggled before analysis
       ================================================================ */

    useEffect(() => {
        if (monitorEnabled && !audioContextRef.current) {
            ensureAudioInitialized();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monitorEnabled]);

    /* ================================================================
       ensureAudioInitialized — lazy AudioContext bootstrap
       ================================================================ */

    const ensureAudioInitialized = async () => {
        if (audioContextRef.current && gainNodeRef.current && analyserRef.current && sourceRef.current) return;
        try {
            audioContextRef.current = new AudioContext();
            if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
            const constraints: MediaStreamConstraints = { audio: { deviceId, echoCancellation: false, noiseSuppression: false, autoGainControl: false, sampleRate: 48000 } };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            try {
                const t = stream.getAudioTracks()[0];
                if (t && t.applyConstraints) {
                    try { await t.applyConstraints({ echoCancellation: false, noiseSuppression: false, autoGainControl: false }); } catch { /* Best-effort */ }
                }
            } catch { /* Best-effort */ }
            const src = audioContextRef.current.createMediaStreamSource(stream);
            const g = audioContextRef.current.createGain();
            g.gain.value = Math.pow(10, micGain / 20);
            const a = audioContextRef.current.createAnalyser();
            a.fftSize = 1024;
            src.connect(g);
            g.connect(a);
            sourceRef.current = src;
            gainNodeRef.current = g;
            analyserRef.current = a;
            log.debug('[PitchLevel] Audio initialized for monitoring', deviceId);
        } catch (err) {
            log.error('[PitchLevel] Failed to init audio for monitoring', err);
        }
    };

    /* ================================================================
       handleToggleMonitor — user gesture handler
       ================================================================ */

    const handleToggleMonitor = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setMonitorEnabled(checked);
        try {
            if (!audioContextRef.current) {
                await ensureAudioInitialized();
            } else if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const ctx = audioContextRef.current;
            log.debug('[PitchLevel] Monitor toggle', checked, 'AudioContext state', ctx?.state);

            if (checked && ctx && gainNodeRef.current) {
                if (!monitorNodeRef.current) {
                    monitorNodeRef.current = ctx.createGain();
                    monitorNodeRef.current.gain.value = computeMonitorGain(monitorVolume);
                    try {
                        gainNodeRef.current.connect(monitorNodeRef.current);
                        monitorNodeRef.current.connect(ctx.destination);
                        log.debug('[PitchLevel] Monitor connected');
                        try {
                            const stream = streamRef.current;
                            if (stream) {
                                const t = stream.getAudioTracks()[0];
                                const settings = t.getSettings ? t.getSettings() : {};
                                const caps = ('getCapabilities' in t && typeof t.getCapabilities === 'function') ? t.getCapabilities() : {};
                                log.debug('[PitchLevel] Track label', t.label || 'unknown', 'enabled', t.enabled, 'muted', t.muted, 'state', t.readyState);
                                log.debug('[PitchLevel] Track settings', settings);
                                log.debug('[PitchLevel] Track capabilities', caps);
                            }
                            log.debug('[PitchLevel] AudioContext sampleRate', ctx.sampleRate);
                        } catch { /* Optional diagnostics */ }
                        try {
                            if (monitorLevelIntervalRef.current) window.clearInterval(monitorLevelIntervalRef.current);
                            monitorLevelIntervalRef.current = window.setInterval(() => {
                                const a = analyserRef.current!;
                                if (!a) return;
                                const buffer = new Float32Array(a.fftSize);
                                a.getFloatTimeDomainData(buffer);
                                let s = 0;
                                for (let i = 0; i < buffer.length; i++) s += buffer[i] * buffer[i];
                                const rmsVal = Math.sqrt(s / buffer.length);
                                log.debug('[PitchLevel] Monitor level', rmsVal.toFixed(5));
                            }, 500) as unknown as number;
                        } catch { /* Optional diagnostics */ }
                    } catch (err) {
                        log.warn('[PitchLevel] Monitor connect failed', err);
                    }
                } else {
                    monitorNodeRef.current.gain.value = computeMonitorGain(monitorVolume);
                    try { monitorNodeRef.current.connect(ctx.destination); } catch { /* Best-effort */ }
                }
            } else {
                if (monitorNodeRef.current) {
                    try { monitorNodeRef.current.disconnect(); } catch { /* cleanup */ }
                    monitorNodeRef.current = null;
                    log.debug('[PitchLevel] Monitor disconnected');
                    if (monitorLevelIntervalRef.current) {
                        window.clearInterval(monitorLevelIntervalRef.current);
                        monitorLevelIntervalRef.current = null;
                    }
                }
            }
        } catch (err) {
            log.error('[PitchLevel] Error handling monitor toggle', err);
        }
    };

    /* ================================================================
       handleSave — persist to backend + localStorage
       ================================================================ */

    const handleSave = async () => {
        const computedThreshold = Math.round(pitchThreshold * 1000);
        const computedVolume = Math.round(micGain);

        const settings = {
            deviceId,
            micGain,
            monitorEnabled,
            monitorVolume,
            pitchThreshold,
            smoothingWindow,
            hysteresisFrames,
            rmsThreshold,
            useHanning,
            pitchDetectionMethod,
        };
        try {
            localStorage.setItem(`mic_settings_${deviceId}`, JSON.stringify(settings));
        } catch { /* Best-effort */ }

        try {
            let id = microphoneRecordId;
            if (!id) {
                try {
                    const resp = await getUserMicrophones();
                    const mics = resp?.microphones ?? resp ?? [];
                    const found = Array.isArray(mics) ? mics.find((m) => m.deviceId === deviceId) : undefined;
                    if (found && found.id) id = found.id;
                } catch (e) {
                    log.warn('fetchMicrophones', 'Failed to fetch existing microphones for dedup', e);
                }
            }

            if (!id) {
                const created = await createMicrophone({
                    deviceId,
                    volume: computedVolume,
                    threshold: computedThreshold,
                    visible: true,
                    micGain: Math.round(micGain),
                    monitorEnabled: !!monitorEnabled,
                    monitorVolume: Math.round(monitorVolume),
                    pitchThreshold,
                    smoothingWindow: Math.round(smoothingWindow),
                    hysteresisFrames: Math.round(hysteresisFrames),
                    rmsThreshold,
                    useHanning: !!useHanning,
                    pitchDetectionMethod,
                } as Parameters<typeof createMicrophone>[0]);
                if (created && created.microphone && created.microphone.id) id = created.microphone.id;
                else if (created && created.id) id = created.id;
            }

            if (!id) {
                showToast(t('pitch.createRecordError'), 'error');
                return;
            }

            setMicrophoneRecordId(id as number);

            await updateMicrophone(id as number, {
                deviceId,
                volume: computedVolume,
                threshold: computedThreshold,
                visible: true,
                micGain: Math.round(micGain),
                monitorEnabled: !!monitorEnabled,
                monitorVolume: Math.round(monitorVolume),
                pitchThreshold,
                smoothingWindow: Math.round(smoothingWindow),
                hysteresisFrames: Math.round(hysteresisFrames),
                rmsThreshold,
                useHanning: !!useHanning,
                pitchDetectionMethod,
            } as Partial<MicrophoneDto>);

            try {
                let physicalLabel: string | undefined = undefined;
                try {
                    const devs = await navigator.mediaDevices.enumerateDevices();
                    const foundPhys = devs.find(d => d.deviceId === deviceId && d.kind === 'audioinput');
                    if (foundPhys && foundPhys.label) physicalLabel = foundPhys.label;
                } catch (e) {
                    log.debug('Device enumeration unavailable', e);
                }

                const devicesResp = await getUserDevices();
                const devicesList: DeviceDto[] = Array.isArray(devicesResp?.devices) ? devicesResp.devices : devicesResp ?? [];
                const devRec = devicesList.find(d => d.deviceId === deviceId);
                const finalLabel = physicalLabel || (devRec && devRec.deviceName) || deviceId;
                const storedUserName = (() => {
                    try { return localStorage.getItem(`user_device_name_${deviceId}`) || undefined; } catch { return undefined; }
                })();
                const userNameToSend = storedUserName && storedUserName.trim().length > 0 ? storedUserName : (devRec && devRec.userDeviceName) || finalLabel;
                if (!devRec) {
                    await createDevice({ deviceId, deviceType: DeviceType.Microphone, visible: true, deviceName: finalLabel, userDeviceName: userNameToSend });
                } else {
                    const payload: Partial<DeviceDto> = { ...devRec, deviceName: finalLabel, userDeviceName: userNameToSend };
                    delete payload.id;
                    delete payload.userId;
                    delete payload.createdAt;
                    delete payload.updatedAt;
                    await updateDevice(devRec.id, payload);
                }
            } catch (e) {
                log.warn('[PitchLevel] device update failed', e);
            }

            showToast(t('pitch.settingsSaved'), 'success');
            try {
                const ev = new CustomEvent('mic-settings-changed', { detail: { deviceId, settings } });
                window.dispatchEvent(ev);
            } catch { /* Best-effort */ }
        } catch (err) {
            log.error('[PitchLevel] save error', err);
            showToast(t('pitch.saveError', { error: (err as Error).message }), 'error');
        }
    };

    /* ================================================================
       handleExport / handleImport
       ================================================================ */

    const handleExport = () => {
        const data = {
            micGain, monitorEnabled, monitorVolume, pitchThreshold,
            smoothingWindow, hysteresisFrames, rmsThreshold, useHanning, pitchDetectionMethod,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mic_settings_${deviceId}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            try {
                const json = JSON.parse(evt.target?.result as string);
                if (typeof json.micGain === "number") setMicGain(json.micGain);
                if (typeof json.monitorEnabled === "boolean") setMonitorEnabled(json.monitorEnabled);
                if (typeof json.monitorVolume === "number") setMonitorVolume(json.monitorVolume);
                if (typeof json.pitchThreshold === "number") setPitchThreshold(json.pitchThreshold);
                if (typeof json.smoothingWindow === "number") setSmoothingWindow(json.smoothingWindow);
                if (typeof json.hysteresisFrames === "number") setHysteresisFrames(json.hysteresisFrames);
                if (typeof json.rmsThreshold === "number") setRmsThreshold(json.rmsThreshold);
                if (typeof json.useHanning === "boolean") setUseHanning(json.useHanning);
                if (typeof json.pitchDetectionMethod === "number") setPitchDetectionMethod(json.pitchDetectionMethod);
                showToast(t('pitch.importedSettings'), 'success');
            } catch (err) {
                showToast(t('pitch.importError', { error: (err as Error).message }), 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    /* ================================================================
       handleReset
       ================================================================ */

    const handleReset = async () => {
        setMicGain(0);
        setMonitorEnabled(false);
        setMonitorVolume(100);
        setPitchThreshold(0.5);
        setSmoothingWindow(propSmoothingWindow);
        setHysteresisFrames(propHysteresisFrames);
        setRmsThreshold(propRmsThreshold);
        setUseHanning(propUseHanning);
        try { localStorage.removeItem(`mic_settings_${deviceId}`); } catch { /* Best-effort */ }
        setTimeout(() => { handleSave(); }, 50);
    };

    /* ================================================================
       Return
       ================================================================ */

    return {
        // translation function
        t,
        // analysis state
        analysisActive, pitch, note, barWidth, fftData, noteHistory, backendUnavailable,
        // settings state + setters
        micGain, setMicGain,
        monitorEnabled, monitorVolume, setMonitorVolume,
        pitchThreshold, setPitchThreshold,
        smoothingWindow, setSmoothingWindow,
        hysteresisFrames, setHysteresisFrames,
        rmsThreshold, setRmsThreshold,
        useHanning, setUseHanning,
        pitchDetectionMethod, setPitchDetectionMethod,
        showCalib, setShowCalib,
        // actions
        startAnalysis, handleSave, handleExport, handleImport, handleReset, handleToggleMonitor,
        // refs
        importInputRef,
        // prop defaults (for conditional rendering)
        propSmoothingWindow, propHysteresisFrames, propRmsThreshold, propUseHanning,
    };
}
