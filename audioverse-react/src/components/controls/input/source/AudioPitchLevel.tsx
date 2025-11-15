import React, { useEffect, useRef, useState } from "react";

interface AudioPitchLevelProps {
    deviceId: string;
}

const AudioPitchLevel: React.FC<AudioPitchLevelProps> = ({ deviceId }) => {
    const [pitch, setPitch] = useState<number | null>(null);
    const [note, setNote] = useState<string>("-");
    const [barWidth, setBarWidth] = useState<number>(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        async function setupPitchAnalysis() {
            try {
                audioContextRef.current = new AudioContext();
                if (audioContextRef.current.state === "suspended") {
                    await audioContextRef.current.resume();
                }

                const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId } });
                const source = audioContextRef.current.createMediaStreamSource(stream);

                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 1024;
                source.connect(analyserRef.current);

                const buffer = new Float32Array(analyserRef.current.fftSize);

                const detectPitch = () => {
                    if (!analyserRef.current || !audioContextRef.current) return;

                    analyserRef.current.getFloatTimeDomainData(buffer);
                    const detectedPitch = autoCorrelate(buffer, audioContextRef.current.sampleRate);

                    if (detectedPitch > 50 && detectedPitch < 3000) {
                        setPitch(detectedPitch);
                        const detectedNote = getNoteFromFrequency(detectedPitch);
                        setNote(detectedNote);
                        setBarWidth((detectedPitch - 50) / 10);
                    } else {
                        setPitch(null);
                        setNote("-");
                        setBarWidth(0);
                    }
                    console.log(pitch);

                    requestAnimationFrame(detectPitch);
                };

                detectPitch();
            } catch (error) {
                console.error("Błąd podczas analizy pitchu:", error);
            }
        }

        document.addEventListener("click", setupPitchAnalysis, { once: true });

        return () => {
            audioContextRef.current?.close();
        };
    }, [deviceId]);

    const autoCorrelate = (buffer: Float32Array, sampleRate: number) => {
        let bestOffset = -1;
        let bestCorrelation = 0;
        let rms = 0;

        for (let i = 0; i < buffer.length; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / buffer.length);
        if (rms < 0.02) return 0;

        for (let offset = 0; offset < buffer.length / 2; offset++) {
            let correlation = 0;
            for (let i = 0; i < buffer.length / 2; i++) {
                correlation += buffer[i] * buffer[i + offset];
            }
            correlation /= buffer.length / 2;
            if (correlation > bestCorrelation) {
                bestCorrelation = correlation;
                bestOffset = offset;
            }
        }

        return bestOffset > 0 ? sampleRate / bestOffset : 0;
    };

    const getNoteFromFrequency = (frequency: number) => {
        const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const A4 = 440;
        let noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69;
        let noteIndex = (noteNumber % 12 + 12) % 12;
        return notes[noteIndex];
    };

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
                        width: `${Math.min(barWidth, 100)}%`,
                        height: "100%",
                        backgroundColor: "#4CAF50",
                    }}
                />
            </div>
            <span style={{fontSize: "9px", fontWeight: "bold", minWidth: "20px", height:"13.5px"}}>
                {note !== "-" ? "🎵" : "-"}
            </span>
        </div>
    );
};

export default AudioPitchLevel;
