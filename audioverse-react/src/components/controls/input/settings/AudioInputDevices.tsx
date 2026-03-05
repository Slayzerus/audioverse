

import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import AudioInputDevice from "./AudioInputDevice.tsx";
import { useUser } from "../../../../contexts/UserContext";
import { logger } from "../../../../utils/logger";
const log = logger.scoped('AudioInputDevices');


const AudioInputDevices: React.FC = () => {
    const { t } = useTranslation();
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const { userId: _userId, syncUserDevices, systemConfig: _systemConfig, userDevices: _userDevices } = useUser();
    const [loading, _setLoading] = useState(false);
    const [error, _setError] = useState<string | null>(null);

    // Synchronizuj mikrofony tylko raz na starcie komponentu
    useEffect(() => {
        let initialized = false;
        async function getDevicesAndSync() {
            if (initialized) return;
            initialized = true;
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const mics = devices.filter(
                    (device) =>
                        device.kind === "audioinput" &&
                        device.deviceId !== "default" &&
                        device.deviceId !== "communications"
                );
                const uniqueDevices = Array.from(new Map(mics.map((d) => [d.deviceId, d])).values());
                setAudioDevices(uniqueDevices);
                await syncUserDevices();
            } catch (error) {
                log.error("Microphone access denied", error);
            }
        }
        getDevicesAndSync();
        // Mount-only: enumerate audio devices and sync once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);




    return (
        <div>
            <h2>🎤 {t('audioInputDevices.title', 'Available audio devices')}</h2>
            {audioDevices.map((device) => (
                <AudioInputDevice key={device.deviceId} device={device} />
            ))}
            {error && <div style={{ color: "red" }}>{error}</div>}
            {loading && <div>⏳ {t('audioInputDevices.processing', 'Processing...')}</div>}
        </div>
    );
};

export default AudioInputDevices;
