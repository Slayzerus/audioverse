import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import AudioPitchLevel from "../source/AudioPitchLevel.tsx";
import AudioVolumeLevel from "../source/AudioVolumeLevel.tsx";
import AudioPitchAnalyzer from "../../karaoke/AudioPitchAnalyzer";
import { useUser } from "../../../../contexts/UserContext";
import { DeviceType, MicrophoneDto } from "../../../../scripts/api/apiUser";
import { logger } from "../../../../utils/logger";
const log = logger.scoped('AudioInputDevice');

interface AudioInputDeviceProps {
    device: MediaDeviceInfo;
}

const AudioInputDevice: React.FC<AudioInputDeviceProps> = ({ device }) => {
    const { t } = useTranslation();
    const { userDevices, syncUserDevices: _syncUserDevices } = useUser();
    const [customName, setCustomName] = useState<string>(device.label || t('audioInputDevice.defaultName', 'Microphone'));
    const [userDeviceName, setUserDeviceName] = useState<string>("");
    const [_saving, _setSaving] = useState(false);
    const [showPitchAnalyzer, setShowPitchAnalyzer] = useState(false);
    const [recording, setRecording] = useState(false);
    const [recordedFile, setRecordedFile] = useState<File | null>(null);

    useEffect(() => {
        const physicalLabel = device.label || t('audioInputDevice.defaultName', 'Microphone');
        setCustomName(physicalLabel);
        const found = userDevices?.find((d) => (d.deviceId || "").trim().toLowerCase() === (device.deviceId || "").trim().toLowerCase() && d.deviceType === DeviceType.Microphone);
        if (found) {
            setUserDeviceName(found.userDeviceName || physicalLabel);
        } else {
            setUserDeviceName(physicalLabel);
        }
    }, [userDevices, device.deviceId, device.label]);

    // load locally saved mic settings to pass into preview components
    const [initialSettings, setInitialSettings] = useState<Record<string, unknown> | null>(null);
    useEffect(() => {
        try {
            const raw = localStorage.getItem(`mic_settings_${device.deviceId}`);
            if (raw) setInitialSettings(JSON.parse(raw));
        } catch (_e) { setInitialSettings(null); }
    }, [device.deviceId]);

    // Persist userDeviceName locally so the small Save button (in AudioPitchLevel) can include it
    useEffect(() => {
        try {
            localStorage.setItem(`user_device_name_${device.deviceId}`, userDeviceName || "");
        } catch (_e) { /* Best-effort — no action needed on failure */ }
    }, [userDeviceName, device.deviceId]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", border: "1px solid var(--border-subtle, #ccc)", borderRadius: 8, padding: "16px", marginBottom: 12 }}>
            {/* Row 1: Device info + volume indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: 'wrap' }}>
                <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text-muted, #888)", marginBottom: 4 }}>{t('audioInputDevice.physicalName', 'Physical device')}</label>
                    <input
                        type="text"
                        value={customName}
                        readOnly
                        style={{ fontSize: "14px", width: "220px", marginBottom: 8, background: "var(--input-bg, #1a1a1a)", color: "var(--input-text, #e0e0e0)", border: "1px solid var(--border-subtle, #444)", padding: "8px", opacity: 0.75 }}
                    />
                    <label style={{ display: "block", fontSize: 12, color: "var(--text-muted, #888)", marginBottom: 4 }}>{t('audioInputDevice.customName', 'Custom name')}:</label>
                    <input
                        type="text"
                        value={userDeviceName}
                        onChange={(e) => setUserDeviceName(e.target.value)}
                        placeholder={t('audioInputDevice.customNamePlaceholder', 'Enter custom device name')}
                        style={{ fontSize: "14px", width: "220px", marginBottom: 8 }}
                    />
                    <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted, #999)' }}>ID: {device.deviceId.substring(0, 12)}...</p>
                </div>

                <AudioVolumeLevel deviceId={device.deviceId} initialSettings={initialSettings as { micGain?: number } | undefined} showWaveform={true} />
            </div>

            {/* Row 2: Pitch analysis settings + FFT + pitch display */}
            <AudioPitchLevel
                deviceId={device.deviceId}
                smoothingWindow={5}
                hysteresisFrames={5}
                rmsThreshold={0.02}
                useHanning={false}
                initialSettings={initialSettings as Partial<MicrophoneDto> | undefined}
            />

            {/* Pitch Analyzer button */}
            <div>
                <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowPitchAnalyzer(true)}
                >
                    <i className="fa-solid fa-chart-line me-1" />
                    Pitch Analyzer
                </button>
            </div>

            {showPitchAnalyzer && (
                <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: '#fff', padding: 16, borderRadius: 8, width: '80%', maxWidth: 900, maxHeight: '90%', overflow: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <h4 style={{ margin: 0 }}>Pitch Analyzer — {userDeviceName || customName}</h4>
                                    <div>
                                        <button className="btn btn-sm btn-secondary" onClick={() => setShowPitchAnalyzer(false)} style={{ marginRight: 8 }}>Close</button>
                                    </div>
                                </div>
                                <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <button className="btn btn-sm btn-outline-primary" disabled={recording} onClick={async () => {
                                        setRecording(true);
                                        try {
                                            const s = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: device.deviceId } } });
                                            const audioCtx = new (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)();
                                            const source = audioCtx.createMediaStreamSource(s);
                                            const bufferSize = 4096;
                                            const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
                                            const chunksFloat: Float32Array[] = [];
                                            processor.onaudioprocess = (ev: AudioProcessingEvent) => {
                                                try {
                                                    const input = ev.inputBuffer.getChannelData(0);
                                                    chunksFloat.push(new Float32Array(input));
                                                } catch (_err) { /* Expected: input buffer may be unavailable during processing */ }
                                            };
                                            source.connect(processor);
                                            processor.connect(audioCtx.destination);
                                            // record duration
                                            await new Promise(res => setTimeout(res, 3000));
                                            // stop
                                            processor.disconnect();
                                            source.disconnect();
                                            s.getTracks().forEach((t: MediaStreamTrack) => t.stop());
                                            // concatenate
                                            const totalLen = chunksFloat.reduce((acc, c) => acc + c.length, 0);
                                            const samples = new Float32Array(totalLen);
                                            let offset = 0;
                                            for (const c of chunksFloat) { samples.set(c, offset); offset += c.length; }
                                            const sampleRate = audioCtx.sampleRate;
                                            // encode WAV 16-bit PCM
                                            function encodeWAV(samples: Float32Array, sampleRate: number) {
                                                const buffer = new ArrayBuffer(44 + samples.length * 2);
                                                const view = new DataView(buffer);
                                                /* RIFF identifier */ writeString(view, 0, 'RIFF');
                                                /* file length */ view.setUint32(4, 36 + samples.length * 2, true);
                                                /* RIFF type */ writeString(view, 8, 'WAVE');
                                                /* format chunk identifier */ writeString(view, 12, 'fmt ');
                                                /* format chunk length */ view.setUint32(16, 16, true);
                                                /* sample format (raw) */ view.setUint16(20, 1, true);
                                                /* channel count */ view.setUint16(22, 1, true);
                                                /* sample rate */ view.setUint32(24, sampleRate, true);
                                                /* byte rate (sampleRate * blockAlign) */ view.setUint32(28, sampleRate * 2, true);
                                                /* block align (channel count * bytesPerSample) */ view.setUint16(32, 2, true);
                                                /* bits per sample */ view.setUint16(34, 16, true);
                                                /* data chunk identifier */ writeString(view, 36, 'data');
                                                /* data chunk length */ view.setUint32(40, samples.length * 2, true);
                                                // write samples
                                                floatTo16BitPCM(view, 44, samples);
                                                return new Blob([view], { type: 'audio/wav' });
                                                function writeString(view: DataView, offset: number, str: string) {
                                                    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
                                                }
                                                function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
                                                    let pos = offset;
                                                    for (let i = 0; i < input.length; i++, pos += 2) {
                                                        let s = Math.max(-1, Math.min(1, input[i]));
                                                        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
                                                        output.setInt16(pos, s, true);
                                                    }
                                                }
                                            }
                                            const wavBlob = encodeWAV(samples, sampleRate);
                                            const file = new File([wavBlob], `recording-${device.deviceId}.wav`, { type: 'audio/wav' });
                                            setRecordedFile(file);
                                            audioCtx.close();
                                        } catch (e) {
                                            log.warn('Recording failed', e);
                                        } finally {
                                            setRecording(false);
                                        }
                                    }}>Record 3s from this mic</button>
                                    {recordedFile && <span style={{ fontSize: 12 }}>{recordedFile.name}</span>}
                                </div>
                                <AudioPitchAnalyzer externalFile={recordedFile} defaultCompareAll={true} onSegments={() => { }} />
                    </div>
                </div>
            )}

        </div>
    );
};

export default AudioInputDevice;
