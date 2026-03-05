import React, { useEffect, useState } from "react";
import AudioPitchLevel from "../source/AudioPitchLevel.tsx";
import AudioVolumeLevel from "../source/AudioVolumeLevel.tsx";
import { logger } from "../../../../utils/logger";
const log = logger.scoped('AudioInputSelect');

interface AudioInputSelectProps {
    selectedDevice: string | null;
    onDeviceChange: (deviceId: string) => void;
    disabled?: boolean;
}

const AudioInputSelect: React.FC<AudioInputSelectProps> = ({ selectedDevice, onDeviceChange, disabled }) => {
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        async function getDevices() {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                const mics = devices.filter(device => device.kind === "audioinput");

                setAudioDevices(mics);
                if (mics.length > 0 && !selectedDevice) {
                    onDeviceChange(mics[0].deviceId);
                }
            } catch (error) {
                log.error("Microphone access denied", error);
            }
        }
        getDevices();
    }, [selectedDevice, onDeviceChange]);

    return (
        <div style={{display:"flex", alignItems:"center"}}>
            <span style={{fontSize:"12px", marginRight:"10px"}}>Input</span>
            <select
                className="form-select form-select-sm"
                value={selectedDevice || ""}
                onChange={(e) => onDeviceChange(e.target.value)}
                disabled={disabled}
                style={{ fontSize: "11px", width: 'min(320px, 100%)', marginRight:"10px" }}
                aria-label="Input device"
            >
                {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId}`}
                    </option>
                ))}
            </select>

            {selectedDevice && (
                <div>
                    <AudioPitchLevel
                        deviceId={selectedDevice}
                        smoothingWindow={5}
                        hysteresisFrames={5}
                        rmsThreshold={0.02}
                        useHanning={false}
                    />
                    <AudioVolumeLevel deviceId={selectedDevice} />
                </div>
            )}
        </div>
    );
};

export default AudioInputSelect;
