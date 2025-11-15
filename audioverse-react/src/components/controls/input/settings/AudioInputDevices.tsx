import React, { useEffect, useState } from "react";
import AudioInputDevice from "./AudioInputDevice.tsx";

const AudioInputDevices: React.FC = () => {
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        async function getDevices() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const mics = devices.filter(
                    (device) =>
                        device.kind === "audioinput" &&
                        device.deviceId !== "default" &&
                        device.deviceId !== "communications"
                );

                // Usunięcie duplikatów na podstawie unikalnych ID
                const uniqueDevices = Array.from(new Map(mics.map((d) => [d.deviceId, d])).values());
                setAudioDevices(uniqueDevices);
            } catch (error) {
                console.error("Brak dostępu do mikrofonów!", error);
            }
        }

        getDevices();
    }, []);

    return (
        <div>
            <h2>🎤 Dostępne urządzenia audio</h2>
            {audioDevices.map((device) => (
                <AudioInputDevice key={device.deviceId} device={device} />
            ))}
        </div>
    );
};

export default AudioInputDevices;
