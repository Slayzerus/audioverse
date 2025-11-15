import React, { useState } from "react";
import AudioPitchLevel from "../source/AudioPitchLevel.tsx";
import AudioVolumeLevel from "../source/AudioVolumeLevel.tsx";

interface AudioInputDeviceProps {
    device: MediaDeviceInfo;
}

const AudioInputDevice: React.FC<AudioInputDeviceProps> = ({ device }) => {
    const [customName, setCustomName] = useState<string>(shortenDeviceName(device.label || "Mikrofon"));

    function shortenDeviceName(name: string): string {
        return name.replace(/\(.*?\)/g, "").trim();
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "40px", border: "1px solid #ccc", padding: "10px" }}>
            <div>
                <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{ fontSize: "14px", width: "200px", marginBottom: "5px" }}
                />
                <p>ID: {device.deviceId}</p>
            </div>
            <AudioPitchLevel deviceId={device.deviceId} />
            <AudioVolumeLevel deviceId={device.deviceId} />
        </div>
    );
};

export default AudioInputDevice;
