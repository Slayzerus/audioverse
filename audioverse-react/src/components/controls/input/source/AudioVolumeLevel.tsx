import React, { useEffect, useState } from "react";

interface AudioVolumeLevelProps {
    deviceId: string;
}

const AudioVolumeLevel: React.FC<AudioVolumeLevelProps> = ({ deviceId }) => {
    const [volume, setVolume] = useState<number>(0);

    useEffect(() => {
        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let source: MediaStreamAudioSourceNode | null = null;
        let animationFrameId: number;

        async function setupVolumeDetection() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId } });
                analyser = audioContext.createAnalyser();
                source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                function updateVolume() {
                    analyser?.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    setVolume(average);
                    animationFrameId = requestAnimationFrame(updateVolume);
                }

                updateVolume();
            } catch (error) {
                console.error("Błąd w AudioVolumeLevel", error);
            }
        }

        setupVolumeDetection();

        return () => {
            if (audioContext) audioContext.close();
            if (analyser) analyser.disconnect();
            if (source) source.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, [deviceId]);

    return (
        <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
            <div style={{
                width: "100px",
                height: "10px",
                backgroundColor: "#ddd",
                borderRadius: "5px",
                overflow: "hidden"
            }}>
                <div
                    style={{
                        width: `${Math.min(volume, 100)}%`,
                        height: "100%",
                        backgroundColor: "#ff9800",
                    }}
                />
            </div>
            <span style={{fontSize: "9px", fontWeight: "bold", minWidth: "30px", height:"13.5px"}}>
                {volume.toFixed(1)} dB
            </span>
        </div>
    );
};

export default AudioVolumeLevel;
