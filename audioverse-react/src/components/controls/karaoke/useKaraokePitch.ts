import { useRef, useState, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import { AudioRecorder } from '../../../scripts/recording';
import { LibrosaStreamClient } from '../../../utils/librosaStreaming';
import { CrepeStreamClient } from '../../../utils/crepeStreaming';
import { autoCorrelate, downsampleAndQuantizePitchPoints, estimateLatencyMs } from '../../../utils/karaokeHelpers';
import { rtcService } from '../../../services/rtcService';
import { logger } from '../../../utils/logger';
import type { PitchPoint } from './useKaraokeManager';
import { dkLog } from '../../../constants/debugKaraoke';

const log = logger.scoped('KaraokePitch');

// ── Hanning window helpers ──
function createHanningWindow(size: number): Float32Array {
    const w = new Float32Array(size);
    for (let i = 0; i < size; i++) {
        w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return w;
}

function applyHanning(buffer: Float32Array, window: Float32Array): Float32Array {
    const out = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        out[i] = buffer[i] * window[i];
    }
    return out;
}

// ── Props ──
export interface UseKaraokePitchProps {
    isPlaying: boolean;
    gameMode: string;
    players: Array<{ id: number; name: string; micId?: string | null }>;
    playersMicKey: string;
    micAlgorithms: { [playerId: number]: string };
    defaultPitchAlgorithm: string;
    micRmsThresholds: { [micId: string]: number };
    micOffsets: { [micId: string]: number };
    micGains: { [micId: string]: number };
    micPitchThresholds: { [micId: string]: number };
    micSmoothingWindows: { [micId: string]: number };
    micHysteresisFrames: { [micId: string]: number };
    micUseHanning: { [micId: string]: boolean };
    micMonitorEnabled: { [micId: string]: boolean };
    micMonitorVolumes: { [micId: string]: number };
    currentTimeRef: MutableRefObject<number>;
    isPadMode: boolean;
    clockOffsetMsRef: MutableRefObject<number>;
    currentPartyIdRef: MutableRefObject<number | null>;
}

export function useKaraokePitch({
    isPlaying,
    gameMode,
    players,
    playersMicKey,
    micAlgorithms,
    defaultPitchAlgorithm,
    micRmsThresholds,
    micOffsets,
    micGains,
    micPitchThresholds,
    micSmoothingWindows,
    micHysteresisFrames,
    micUseHanning,
    micMonitorEnabled,
    micMonitorVolumes,
    currentTimeRef,
    isPadMode: _isPadMode,
    clockOffsetMsRef,
    currentPartyIdRef,
}: UseKaraokePitchProps) {
    // ── State ──
    const [livePitch, setLivePitch] = useState<{ [playerId: number]: PitchPoint[] }>({});
    const unsentPitchRef = useRef<{ [playerId: number]: PitchPoint[] }>({});
    const recordersRef = useRef<{ [playerId: number]: AudioRecorder }>({});
    const [recordings, setRecordings] = useState<{ [playerId: number]: Blob | null }>({});
    const pitchRafRef = useRef<{ [playerId: number]: number | null }>({});
    const pitchCleanupsRef = useRef<(() => void)[]>([]);
    const librosaClientRef = useRef<LibrosaStreamClient | null>(null);
    const crepeClientRef = useRef<CrepeStreamClient | null>(null);

    // Streaming client status (debug)
    const [, setLibrosaStatus] = useState<{ [playerId: number]: string }>({});
    const [, setCrepeStatus] = useState<{ [playerId: number]: string }>({});
    const [, setCrepeSendCounts] = useState<{ [playerId: number]: number }>({});

    // Remote timeline state
    const [remoteLatencyMs, setRemoteLatencyMs] = useState<{ [playerId: number]: number }>({});
    const [showRemoteTimelines, setShowRemoteTimelines] = useState<boolean>(true);
    const [compactTimelines, setCompactTimelines] = useState<boolean>(false);

    // Stable ref for players (avoid stale closures)
    const statePlayersRef = useRef(players);
    statePlayersRef.current = players;

    // Track when currentTimeRef was last updated (for extrapolation matching KaraokeTimeline ball)
    const lastMediaTimeRef = useRef<number>(0);
    const lastMediaTimePerfRef = useRef<number>(performance.now());

    // ═══════════════════════════════════════════════════════════════
    //  Pitch detection lifecycle
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        log.debug('[KaraokeManager] 🎤 Pitch detection effect triggered:',
            'isPlaying=', isPlaying,
            'gameMode=', gameMode,
            'players=', JSON.stringify(statePlayersRef.current.map(p => ({ id: p.id, name: p.name, micId: p.micId }))),
            'defaultAlg=', defaultPitchAlgorithm,
        );
        pitchCleanupsRef.current.forEach(fn => fn());
        pitchCleanupsRef.current = [];
        const cancelled = { current: false };

        function pushPitch(playerId: number, hz: number, offsetMs: number = 0) {
            // Apply per-mic latency offset only (configured by user in mic settings).
            // offsetMs > 0 means the mic has latency → pitch was produced earlier → shift back.
            // offsetMs < 0 can be used if pitch appears too early → shift forward.
            // Also extrapolate forward to match KaraokeTimeline's ball extrapolation
            // (onTimeUpdate fires at ~4Hz; between updates, the ball is extrapolated
            //  but pitch timestamps used raw currentTime → visual lag ≈ elapsed).
            if (currentTimeRef.current !== lastMediaTimeRef.current) {
                lastMediaTimeRef.current = currentTimeRef.current;
                lastMediaTimePerfRef.current = performance.now();
            }
            const elapsed = Math.min(0.25, (performance.now() - lastMediaTimePerfRef.current) / 1000);
            const t = currentTimeRef.current + elapsed - offsetMs / 1000;
            setLivePitch(prev => {
                const arr = prev[playerId] || [];
                return { ...prev, [playerId]: [...arr, { t, hz }] };
            });
            unsentPitchRef.current[playerId] = (unsentPitchRef.current[playerId] || []).concat({ t, hz });
            const buf = unsentPitchRef.current[playerId];
            if (buf.length > 500) unsentPitchRef.current[playerId] = buf.slice(-500);
        }

        function startLocalPitch(
            playerId: number,
            stream: MediaStream,
            alg: string,
            rmsThreshold: number = 0.02,
            offsetMs: number = 0,
            pitchThreshold: number = 0.6,
            micGain: number = 0,
            smoothingWindowSize: number = 0,
            hysteresisFrameCount: number = 0,
            useHanning: boolean = false,
        ) {
            dkLog('PITCH', `Startuję detekcję dźwięku z mikrofonu (lokalnie) — gracz #${playerId}, algorytm: ${alg}, próg RMS: ${rmsThreshold}, offset: ${offsetMs}ms`);
            let audioCtx: AudioContext | null = null;
            let raf: number | null = null;
            let pitchyDetector: { findPitch(input: Float32Array, sampleRate: number): [number, number] } | null = null;

            const run = async () => {
                try {
                    audioCtx = new AudioContext();
                    const src = audioCtx.createMediaStreamSource(stream);
                    let lastNode: AudioNode = src;

                    // Gain node (wzmocnienie mikrofonu)
                    if (micGain > 0) {
                        const gain = audioCtx.createGain();
                        gain.gain.value = micGain;
                        lastNode.connect(gain);
                        lastNode = gain;
                    }

                    const analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 2048;
                    lastNode.connect(analyser);
                    const buffer = new Float32Array(analyser.fftSize);
                    const hanningWindow = useHanning ? createHanningWindow(analyser.fftSize) : null;

                    // Smoothing buffer (rolling average of last N pitches)
                    const smoothingBuffer: number[] = [];
                    // Hysteresis counter (consecutive silent frames)
                    let silentFrames = 0;

                    if (alg === 'pitchy') {
                        try {
                            const { PitchDetector: PD } = await import('pitchy');
                            pitchyDetector = PD.forFloat32Array(analyser.fftSize);
                        } catch (e) {
                            log.warn('[KaraokeManager] pitchy import failed, falling back to autocorr', e);
                        }
                    }

                    log.debug(`[KaraokeManager] startLocalPitch player=${playerId} alg=${alg} pitchy=${!!pitchyDetector} rmsThreshold=${rmsThreshold}`);

                    const loop = () => {
                        try { analyser.getFloatTimeDomainData(buffer); } catch (_e) { /* Expected: analyser may be disconnected during teardown */ }

                        // Apply Hanning window if enabled
                        const processed = hanningWindow ? applyHanning(buffer, hanningWindow) : buffer;

                        let rms = 0;
                        for (let i = 0; i < processed.length; i++) rms += processed[i] * processed[i];
                        rms = Math.sqrt(rms / processed.length);

                        let hz = 0;
                        if (rms >= rmsThreshold) {
                            if (pitchyDetector) {
                                try {
                                    const [freq, clarity] = pitchyDetector.findPitch(processed, audioCtx!.sampleRate);
                                    if (freq > 50 && freq < 3000 && clarity > pitchThreshold) hz = freq;
                                } catch (_e) { /* Expected: pitchy findPitch may fail on edge-case audio data */ }
                            } else {
                                hz = autoCorrelate(processed, audioCtx!.sampleRate, rmsThreshold);
                                if (hz < 50 || hz > 3000) hz = 0;
                            }
                        }

                        // Smoothing: rolling average of last N detected pitches
                        if (hz > 0 && smoothingWindowSize > 1) {
                            smoothingBuffer.push(hz);
                            if (smoothingBuffer.length > smoothingWindowSize) smoothingBuffer.shift();
                            hz = smoothingBuffer.reduce((a, b) => a + b, 0) / smoothingBuffer.length;
                        }

                        // Hysteresis: require N consecutive silent frames before zeroing pitch
                        if (hz > 0) {
                            silentFrames = 0;
                            pushPitch(playerId, hz, offsetMs);
                        } else {
                            silentFrames++;
                            if (hysteresisFrameCount > 0 && silentFrames <= hysteresisFrameCount && smoothingBuffer.length > 0) {
                                // Still within hysteresis window — emit last known pitch
                                const lastPitch = smoothingBuffer[smoothingBuffer.length - 1];
                                if (lastPitch > 0) pushPitch(playerId, lastPitch, offsetMs);
                            }
                        }

                        raf = requestAnimationFrame(loop);
                        pitchRafRef.current[playerId] = raf;
                    };
                    loop();
                } catch (e) {
                    log.warn('[KaraokeManager] startLocalPitch error', e);
                }
            };
            run();

            return () => {
                if (raf) cancelAnimationFrame(raf);
                if (audioCtx) audioCtx.close().catch(() => { /* Expected: AudioContext may already be closed */ });
            };
        }

        function startStreamingPitch(playerId: number, stream: MediaStream, alg: 'librosa' | 'crepe', offsetMs: number = 0) {
            dkLog('PITCH', `Startuję streaming dźwięku do serwera (AI pitch) — gracz #${playerId}, algorytm: ${alg}, offset: ${offsetMs}ms`);
            if (alg === 'crepe' && crepeClientRef.current) {
                crepeClientRef.current.stop();
                crepeClientRef.current = null;
            } else if (alg === 'librosa' && librosaClientRef.current) {
                librosaClientRef.current.stop();
                librosaClientRef.current = null;
            }

            const loc = window.location;
            const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = alg === 'librosa'
                ? `${proto}//${loc.host}/api/librosa/ws/pyin`
                : `${proto}//${loc.host}/api/ai/audio/pitch/ws/pitch_server`;

            const statusSetter = alg === 'librosa' ? setLibrosaStatus : setCrepeStatus;
            statusSetter(prev => ({ ...prev, [playerId]: 'connecting' }));

            const sentTimestamps: number[] = [];

            const onSend = (bytes: number) => {
                if (bytes > 0) {
                    sentTimestamps.push(currentTimeRef.current);
                    while (sentTimestamps.length > 200) sentTimestamps.shift();
                    if (alg === 'crepe') setCrepeSendCounts(prev => ({ ...prev, [playerId]: (prev[playerId] || 0) + 1 }));
                }
            };

            const onClose = () => {
                statusSetter(prev => ({ ...prev, [playerId]: 'closed' }));
                sentTimestamps.length = 0;
            };

            const onMessage = (msg: { hz?: number }) => {
                if (typeof msg.hz === 'number' && msg.hz > 0) {
                    const hz = msg.hz;
                    const rawT = sentTimestamps.length > 0 ? sentTimestamps.shift()! : currentTimeRef.current;
                    const t = rawT - offsetMs / 1000; // apply mic latency offset
                    setLivePitch(prev => {
                        const arr = prev[playerId] || [];
                        return { ...prev, [playerId]: [...arr, { t, hz }] };
                    });
                } else {
                    if (sentTimestamps.length > 0) sentTimestamps.shift();
                }
            };

            log.debug(`[KaraokeManager] startStreamingPitch player=${playerId} alg=${alg} wsUrl=${wsUrl}`);

            if (alg === 'librosa') {
                const client = new LibrosaStreamClient({
                    wsUrl,
                    onOpen: () => { statusSetter(prev => ({ ...prev, [playerId]: 'connected' })); log.debug(`[KaraokeManager] Librosa WS connected for player ${playerId}`); },
                    onClose,
                    onError: (err) => { statusSetter(prev => ({ ...prev, [playerId]: 'error' })); log.warn('[KaraokeManager] Librosa WS error', err); },
                    onMessage,
                    onSend,
                });
                librosaClientRef.current = client;
                client.startWithMediaStream(stream).catch((e: unknown) => {
                    log.warn('[KaraokeManager] Librosa client start failed', e);
                    statusSetter(prev => ({ ...prev, [playerId]: 'failed' }));
                });
                return () => { client.stop(); librosaClientRef.current = null; statusSetter(prev => ({ ...prev, [playerId]: '' })); };
            } else {
                const client = new CrepeStreamClient({
                    wsUrl,
                    onOpen: () => { statusSetter(prev => ({ ...prev, [playerId]: 'connected' })); log.debug(`[KaraokeManager] Crepe WS connected for player ${playerId}`); },
                    onClose,
                    onError: (err) => { statusSetter(prev => ({ ...prev, [playerId]: 'error' })); log.warn('[KaraokeManager] Crepe WS error', err); },
                    onMessage,
                    onSend,
                    onFallback: () => {
                        log.warn(`[KaraokeManager] Crepe WS exhausted retries for player ${playerId}, falling back to local pitchy`);
                        statusSetter(prev => ({ ...prev, [playerId]: 'fallback-pitchy' }));
                        crepeClientRef.current = null;
                        const cleanup = startLocalPitch(playerId, stream, 'pitchy', 0.02, offsetMs);
                        pitchCleanupsRef.current.push(cleanup);
                    },
                });
                crepeClientRef.current = client;
                client.startWithMediaStream(stream).catch((e: unknown) => {
                    log.warn('[KaraokeManager] Crepe client start failed', e);
                    statusSetter(prev => ({ ...prev, [playerId]: 'failed' }));
                });
                return () => { client.stop(); crepeClientRef.current = null; statusSetter(prev => ({ ...prev, [playerId]: '' })); };
            }
        }

        if (isPlaying) {
            setLivePitch({});

            if (gameMode === 'pad') {
                log.debug('[KaraokeManager] pad mode — skipping mic pitch detection');
            } else {
                log.debug('[KaraokeManager] isPlaying=true, starting pitch detection for players:', statePlayersRef.current.map(p => ({ id: p.id, name: p.name, micId: p.micId })));

                const recorders: { [k: number]: AudioRecorder } = {};
                statePlayersRef.current.forEach(p => {
                    if (!p.micId) {
                        log.debug(`[KaraokeManager] player ${p.id} (${p.name}) has no mic assigned, skipping`);
                        return;
                    }

                    const alg = micAlgorithms[p.id] || defaultPitchAlgorithm;
                    const playerRmsThreshold = (p.micId && micRmsThresholds[p.micId]) || 0.02;
                    const playerOffset = (p.micId && micOffsets[p.micId]) || 0;
                    const playerGain = (p.micId && micGains[p.micId]) || 0;
                    const playerPitchTh = (p.micId && micPitchThresholds[p.micId]) || 0.6;
                    const playerSmoothing = (p.micId && micSmoothingWindows[p.micId]) || 0;
                    const playerHysteresis = (p.micId && micHysteresisFrames[p.micId]) || 0;
                    const playerHanning = (p.micId && micUseHanning[p.micId]) || false;
                    const playerMonitor = (p.micId && micMonitorEnabled[p.micId]) || false;
                    const playerMonVol = (p.micId ? micMonitorVolumes[p.micId] : undefined) ?? 100;
                    log.debug(`[KaraokeManager] player ${p.id} (${p.name}) mic=${p.micId} algorithm=${alg} rmsThreshold=${playerRmsThreshold} offsetMs=${playerOffset} gain=${playerGain} pitchTh=${playerPitchTh} smoothing=${playerSmoothing} hysteresis=${playerHysteresis} hanning=${playerHanning} monitor=${playerMonitor}`);

                    const r = new AudioRecorder();
                    r.startRecording({ deviceId: p.micId, onLevel: () => {}, gain: playerGain, monitorEnabled: playerMonitor, monitorVolume: playerMonVol })
                        .then(() => {
                            if (cancelled.current) { r.stopRecording().catch(() => { /* Expected: recorder may already be stopped */ }); return; }
                            recorders[p.id] = r;
                            const stream = r.getStream();
                            if (!stream) {
                                log.warn(`[KaraokeManager] No stream from recorder for player ${p.id}`);
                                return;
                            }

                            if (alg === 'librosa' || alg === 'crepe') {
                                const cleanup = startStreamingPitch(p.id, stream, alg, playerOffset);
                                pitchCleanupsRef.current.push(cleanup);
                            } else {
                                const cleanup = startLocalPitch(p.id, stream, alg, playerRmsThreshold, playerOffset, playerPitchTh, playerGain, playerSmoothing, playerHysteresis, playerHanning);
                                pitchCleanupsRef.current.push(cleanup);
                            }
                        })
                        .catch((e) => { log.warn(`[KaraokeManager] recorder start failed for player ${p.id}`, e); });
                });
                recordersRef.current = recorders;
            }
        } else {
            const recs = recordersRef.current;
            const playerIds = Object.keys(recs).map(Number);
            Promise.allSettled(
                playerIds.map(async (pid) => {
                    const blob = await recs[pid].stopRecording();
                    return { pid, blob };
                }),
            ).then((results) => {
                const collected: { [pid: number]: Blob | null } = {};
                for (const r of results) {
                    if (r.status === "fulfilled" && r.value.blob) {
                        collected[r.value.pid] = r.value.blob;
                    }
                }
                if (Object.keys(collected).length > 0) {
                    setRecordings((prev) => ({ ...prev, ...collected }));
                }
            });
            recordersRef.current = {};
            Object.values(pitchRafRef.current).forEach(raf => raf && cancelAnimationFrame(raf));
            pitchRafRef.current = {};
        }

        return () => {
            cancelled.current = true;
            pitchCleanupsRef.current.forEach(fn => fn());
            pitchCleanupsRef.current = [];
            Object.values(recordersRef.current).forEach(r => r.stopRecording().catch(() => { /* Expected: recorder may already be stopped */ }));
            recordersRef.current = {};
            Object.values(pitchRafRef.current).forEach(raf => raf && cancelAnimationFrame(raf));
            pitchRafRef.current = {};
        };
    }, [isPlaying, gameMode, playersMicKey, micAlgorithms, defaultPitchAlgorithm, micRmsThresholds, micOffsets, micGains, micPitchThresholds, micSmoothingWindows, micHysteresisFrames, micUseHanning, micMonitorEnabled, micMonitorVolumes]);

    // ═══════════════════════════════════════════════════════════════
    //  RTC: publish accumulated pitch deltas (batched)
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        const sendInterval = 300;
        const tick = async () => {
            try {
                const snapshot = { ...unsentPitchRef.current };
                for (const k of Object.keys(snapshot)) {
                    const pid = Number(k);
                    const points = snapshot[pid] || [];
                    if (!points || points.length === 0) continue;
                    unsentPitchRef.current[pid] = [];
                    const quantized = downsampleAndQuantizePitchPoints(points, 120);

                    const payload: Record<string, unknown> = { playerId: pid, points: quantized, clientNowUtc: new Date().toISOString(), quantized: true };
                    if (currentPartyIdRef.current) payload.EventId = currentPartyIdRef.current;
                    try {
                        if (rtcService.isConnected()) {
                            await rtcService.publishTimelineUpdate(payload);
                        }
                    } catch (e) {
                        log.warn('[KaraokeManager] failed to publish timeline update, will retry', e);
                        unsentPitchRef.current[pid] = (unsentPitchRef.current[pid] || []).concat(points).slice(-1000);
                    }
                }
            } catch (_e) { /* Expected: periodic pitch publish loop may fail transiently */ }
        };

        const iv = window.setInterval(tick, sendInterval) as unknown as number;
        return () => { if (iv) window.clearInterval(iv); };
    }, [isPlaying]);

    // ═══════════════════════════════════════════════════════════════
    //  RTC: subscribe to incoming timeline updates
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        const handler = (payload: unknown) => {
            try {
                const data = payload as { playerId?: number; points?: Array<{ t: number; hz: number }>; serverTimeUtc?: string } | null;
                if (!data || typeof data.playerId === 'undefined' || !Array.isArray(data.points)) return;
                const pid = Number(data.playerId);
                const pts: PitchPoint[] = data.points.map((p) => ({ t: p.t, hz: p.hz }));
                if (!pts.length) return;
                if (data.serverTimeUtc) {
                    const latency = estimateLatencyMs(
                        data.serverTimeUtc,
                        Date.now(),
                        clockOffsetMsRef.current || 0,
                    );
                    setRemoteLatencyMs(prev => ({ ...prev, [pid]: latency }));
                }

                setLivePitch(prev => {
                    const arr = prev[pid] || [];
                    return { ...prev, [pid]: [...arr, ...pts] };
                });
            } catch (_e) { /* Expected: incoming RTC payload may be malformed or out-of-date */ }
        };

        rtcService.onTimelineUpdate(handler);
        return () => { rtcService.offTimelineUpdate(handler); };
    }, []);

    return {
        livePitch,
        setLivePitch,
        recordings,
        recordersRef,
        unsentPitchRef,
        pitchCleanupsRef,
        remoteLatencyMs,
        showRemoteTimelines,
        setShowRemoteTimelines,
        compactTimelines,
        setCompactTimelines,
    };
}
