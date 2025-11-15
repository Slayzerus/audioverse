import React, { useEffect, useRef } from "react";

interface WaveformProps {
    audioBlob: Blob | null;
    currentTime: number;
    duration: number;
}

const Waveform: React.FC<WaveformProps> = ({ audioBlob, currentTime, duration }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!audioBlob || !canvasRef.current || !duration || duration === Infinity) {
            console.warn("⚠️ Nie można narysować wykresu – niepoprawny czas trwania:", duration);
            return;
        }

        const drawWaveform = async () => {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioContext = new AudioContext();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const rawData = audioBuffer.getChannelData(0);
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Normalizacja danych
            const sampleRate = Math.floor(rawData.length / canvas.width);
            const waveform = new Float32Array(canvas.width);

            for (let i = 0; i < canvas.width; i++) {
                const sampleStart = i * sampleRate;
                const slice = rawData.slice(sampleStart, sampleStart + sampleRate);
                waveform[i] = slice.reduce((a, b) => Math.abs(a) + Math.abs(b), 0) / slice.length;
            }

            // Rysowanie wykresu fali dźwiękowej
            ctx.beginPath();
            ctx.strokeStyle = "#007bff";
            ctx.lineWidth = 2;

            for (let i = 0; i < canvas.width; i++) {
                const x = i;
                const y = (1 - waveform[i]) * canvas.height;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();

            // Rysowanie linii postępu (czerwonej)
            if (duration > 0) {
                const progressX = Math.max(0, Math.min((currentTime / duration) * canvas.width, canvas.width));
                console.log("🎚 Rysowanie linii postępu, X:", progressX, "duration:", duration, "currentTime:", currentTime);

                ctx.beginPath();
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;
                ctx.moveTo(progressX, 0);
                ctx.lineTo(progressX, canvas.height);
                ctx.stroke();
            }
        };

        drawWaveform();
    }, [audioBlob, currentTime, duration]);

    return <canvas ref={canvasRef} width={600} height={200} style={{ border: "1px solid black" }} />;
};

export default Waveform;
