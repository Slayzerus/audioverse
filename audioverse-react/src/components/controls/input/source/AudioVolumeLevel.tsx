import React, { useEffect, useState, useId, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { logger } from "../../../../utils/logger";
const log = logger.scoped('AudioVolumeLevel');

interface AudioVolumeLevelProps {
    deviceId: string;
    size?: number; // px, default 40
    initialSettings?: { micGain?: number };
    showWaveform?: boolean; // show real-time waveform canvas
    waveformWidth?: number; // canvas width in px, default 160
    waveformHeight?: number; // canvas height in px, default 40
    direction?: 'horizontal' | 'vertical'; // layout direction, default 'horizontal'
}

const AudioVolumeLevel: React.FC<AudioVolumeLevelProps> = ({ deviceId, size = 40, initialSettings, showWaveform = true, waveformWidth = 160, waveformHeight = 40, direction = 'horizontal' }) => {
    const [volume, setVolume] = useState<number>(0);
    const [micGain, setMicGain] = useState<number>(() => {
        // initialise from prop so the first render already has the right gain
        if (initialSettings && typeof initialSettings.micGain === 'number') return initialSettings.micGain;
        try {
            const raw = localStorage.getItem(`mic_settings_${deviceId}`);
            if (raw) { const j = JSON.parse(raw); if (typeof j.micGain === 'number') return j.micGain; }
        } catch (_e) { /* ignore */ }
        return 0;
    });
    const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    useEffect(() => {
        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let source: MediaStreamAudioSourceNode | null = null;
        let gainNode: GainNode | null = null;
        let animationFrameId: number;

        let cancelled = false;

        async function setupVolumeDetection() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId } });
                if (cancelled || !audioContext || audioContext.state === 'closed') {
                    if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                source = audioContext.createMediaStreamSource(stream);
                // apply mic gain if available
                gainNode = audioContext.createGain();
                gainNode.gain.value = Math.pow(10, (micGain || 0) / 20);
                source.connect(gainNode);
                gainNode.connect(analyser);
                analyserNodeRef.current = analyser;
                gainNodeRef.current = gainNode;

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const timeDomainData = new Float32Array(analyser.fftSize);

                function updateVolume() {
                    analyser?.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    setVolume(average);
                    // draw waveform
                    if (waveformCanvasRef.current && analyser) {
                        analyser.getFloatTimeDomainData(timeDomainData);
                        const canvas = waveformCanvasRef.current;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            const root = document.documentElement;
                            const cs = getComputedStyle(root);
                            const bgColor = cs.getPropertyValue('--surface-dark').trim() || '#1a1a2e';
                            const waveColor = cs.getPropertyValue('--accent-success').trim() || '#4CAF50';
                            const mutedColor = cs.getPropertyValue('--text-muted').trim() || 'rgba(255,255,255,0.3)';
                            const w = canvas.width;
                            const h = canvas.height;
                            ctx.clearRect(0, 0, w, h);
                            ctx.fillStyle = bgColor;
                            ctx.fillRect(0, 0, w, h);
                            ctx.strokeStyle = waveColor;
                            ctx.lineWidth = 1.5;
                            ctx.beginPath();
                            const step = Math.max(1, Math.floor(timeDomainData.length / w));
                            for (let i = 0; i < w; i++) {
                                const idx = i * step;
                                const v = timeDomainData[idx] ?? 0;
                                const y = (0.5 - v * 0.5) * h;
                                if (i === 0) ctx.moveTo(i, y);
                                else ctx.lineTo(i, y);
                            }
                            ctx.stroke();
                            // center line
                            ctx.strokeStyle = mutedColor;
                            ctx.lineWidth = 0.5;
                            ctx.beginPath();
                            ctx.moveTo(0, h / 2);
                            ctx.lineTo(w, h / 2);
                            ctx.stroke();
                        }
                    }
                    animationFrameId = requestAnimationFrame(updateVolume);
                }

                updateVolume();
            } catch (error) {
                log.error("Error in AudioVolumeLevel", error);
            }
        }

        setupVolumeDetection();

        // Listen for mic setting changes from AudioPitchLevel
        const handler = (ev: Event) => {
            try {
                const d = (ev as CustomEvent<{ deviceId: string; settings?: { micGain?: number } }>).detail;
                if (!d || d.deviceId !== deviceId) return;
                const mg = (d.settings && typeof d.settings.micGain === 'number') ? d.settings.micGain : 0;
                setMicGain(mg);
            } catch (_e) { /* Intentionally swallowed — non-critical operation */ }
        };
        window.addEventListener('mic-settings-changed', handler as EventListener);

        return () => {
            cancelled = true;
            analyserNodeRef.current = null;
            if (audioContext && audioContext.state !== 'closed') try { audioContext.close(); } catch (_e) { /* cleanup */ }
            if (analyser) try { analyser.disconnect(); } catch (_e) { /* Silent catch — error is expected during cleanup/teardown */ }
            if (source) try { source.disconnect(); } catch (_e) { /* Silent catch — error is expected during cleanup/teardown */ }
            gainNodeRef.current = null;
            if (gainNode) try { gainNode.disconnect(); } catch (_e) { /* Silent catch — error is expected during cleanup/teardown */ }
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mic-settings-changed', handler as EventListener);
        };
    }, [deviceId]);  // intentionally excludes micGain — gain is applied via gainNodeRef below

    // Watch for mic gain updates stored in localStorage (initial load and external updates)
    useEffect(() => {
        // prefer initialSettings prop if provided
        try {
            if (initialSettings && typeof initialSettings === 'object') {
                const json = initialSettings;
                if (typeof json.micGain === 'number') { setMicGain(json.micGain); return; }
            }
        } catch (_e) { /* Intentionally swallowed — non-critical operation */ }
        try {
            const raw = localStorage.getItem(`mic_settings_${deviceId}`);
            if (raw) {
                const json = JSON.parse(raw);
                if (typeof json.micGain === 'number') setMicGain(json.micGain);
            }
        } catch (_e) { /* Parse error expected for invalid input */ }
    }, [deviceId, initialSettings]);

    // Apply gain change to the live GainNode without restarting the pipeline
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = Math.pow(10, (micGain || 0) / 20);
        }
    }, [micGain]);

    // Volume as percent (0-1)
    const percent = Math.min(volume / 100, 1);
    const fillHeight = percent * size;
    const maskId = `volmask-${useId().replace(/:/g, '')}`;
    return (
        <div style={{ display: 'flex', flexDirection: direction === 'vertical' ? 'column' : 'row', alignItems: 'center', gap: direction === 'vertical' ? 4 : 8 }}>
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size }}>
                <svg width={size} height={size} style={{ display: "block", position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
                    {/* Background circle */}
                    <circle cx={size/2} cy={size/2} r={size/2} fill="var(--surface-dark, #333)" />
                    {/* Volume fill as a masked circle (vertical fill) */}
                    <mask id={maskId}> 
                        <rect x={0} y={0} width={size} height={size} fill="var(--surface-bg, #fff)" />
                        <rect x={0} y={0} width={size} height={size - fillHeight} fill="var(--surface-mask, #000)" />
                    </mask>
                    <circle cx={size/2} cy={size/2} r={size/2} fill="var(--accent-warning, #ff9800)" mask={`url(#${maskId})`} />
                </svg>
                <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size }}>
                    <FontAwesomeIcon icon={faMicrophone} style={{ fontSize: size * 0.6, color: "var(--icon-accent, #bfaaff)" }} />
                </span>
            </div>
            {showWaveform && (
                <canvas
                    ref={waveformCanvasRef}
                    width={waveformWidth}
                    height={waveformHeight}
                    style={{ background: 'var(--surface-dark, #1a1a2e)', borderRadius: 4, border: '1px solid var(--border-subtle, #333)', maxWidth: '100%' }}
                    role="img"
                    aria-label="Real-time waveform"
                />
            )}
        </div>
    );
};

export default AudioVolumeLevel;
