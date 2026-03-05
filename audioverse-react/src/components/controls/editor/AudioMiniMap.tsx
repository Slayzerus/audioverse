import React, { useEffect, useRef } from "react";
import { TimelineConfig, drawMiniMap, WaveformData } from "../../../scripts/audioTimeline.ts";

interface AudioMiniMapProps {
    duration: number;
    currentTime: number;
    bpm: number;
    waveform: WaveformData;
}

const AudioMiniMap: React.FC<AudioMiniMapProps> = ({ duration, currentTime, bpm, waveform }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const config: TimelineConfig = {
            zoom: 1,
            duration,
            bpm,
            snapEnabled: false,
            snapMode: "second",
        };
        drawMiniMap(canvasRef.current, config, waveform, currentTime);
    }, [duration, currentTime, bpm, waveform]);

    return (
        <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 6, background: "#fff" }}>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>Mini-map (overview)</div>
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: 80, display: "block" }}
                role="img"
                aria-label="Audio mini-map overview canvas"
            />
        </div>
    );
};

export default React.memo(AudioMiniMap);
