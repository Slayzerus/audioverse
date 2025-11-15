import React, { useEffect, useState } from "react";
import AudioPitchLevel from "../source/AudioPitchLevel.tsx";
import AudioVolumeLevel from "../source/AudioVolumeLevel.tsx";

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
                console.error("Brak dostępu do mikrofonu!", error);
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
                style={{ fontSize: "11px", width: "320px", marginRight:"10px" }}
            >
                {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Mikrofon ${device.deviceId}`}
                    </option>
                ))}
            </select>

            {selectedDevice && (
                <div>
                    <AudioPitchLevel deviceId={selectedDevice} />
                    <AudioVolumeLevel deviceId={selectedDevice} />
                </div>
            )}
        </div>
    );
};

export default AudioInputSelect;
