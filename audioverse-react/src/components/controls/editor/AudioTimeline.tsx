import React, { useState, useRef, useEffect } from "react";
import { resumeAudioContext } from "../../../scripts/audioContext.ts";
import { drawTimelineWithRuler, drawCursorEnhanced, snapToGrid, TimelineConfig, drawWaveform, WaveformData } from "../../../scripts/audioTimeline.ts";

interface AudioTimelineProps {
    zoom: number;
    duration: number;
    isPlaying: boolean;
    isRecording: boolean;
    currentTime: number;
    bpm?: number;
    snapEnabled?: boolean;
    snapMode?: 'beat' | 'bar' | 'second' | 'sub-beat';
    waveform?: WaveformData;
    waveformColor?: string;
    onCurrentTimeChange: (value: number) => void;
    onZoomChange?: (value: number) => void;
}

export interface AudioTimelineRef {
    addSoundToLayer: (audioBuffer: AudioBuffer) => void;
}


const AudioTimeline: React.FC<AudioTimelineProps> = ({
                                                         zoom = 1,
                                                         duration = 4,
                                                         isPlaying,
                                                         isRecording,
                                                         currentTime,
                                                         bpm = 120,
                                                         snapEnabled = false,
                                                         snapMode = 'beat',
                                                         waveform,
                                                         waveformColor,
                                                         onCurrentTimeChange,
                                                         onZoomChange,
                                                     }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const lastUpdateTime = useRef<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const config: TimelineConfig = {
        zoom,
        duration,
        bpm,
        snapEnabled,
        snapMode,
    };

    useEffect(() => {
        resumeAudioContext();
        renderFrame();
    }, [zoom, duration, currentTime, isRecording, bpm, snapEnabled, snapMode, waveform]);

    useEffect(() => {
        if (isPlaying) {
            lastUpdateTime.current = performance.now();
            animateCursor();
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }
    }, [isPlaying]);

    const renderFrame = () => {
        if (!canvasRef.current) return;
        drawTimelineWithRuler(canvasRef.current, config);
        if (waveform?.length) {
            drawWaveform(canvasRef.current, config, waveform, waveformColor);
        }
        drawCursorEnhanced(canvasRef.current, config, currentTime, isRecording);
    };

    const animateCursor = () => {
        if (!isPlaying) return;

        const update = (timestamp: number) => {
            if (lastUpdateTime.current !== null) {
                const deltaTime = (timestamp - lastUpdateTime.current) / 1000;
                lastUpdateTime.current = timestamp;

                const newTime = Math.min(currentTime + deltaTime, duration);
                onCurrentTimeChange(newTime);
            }

            if (currentTime < duration) {
                animationRef.current = requestAnimationFrame(update);
            }
        };

        animationRef.current = requestAnimationFrame(update);
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        updateCursorPosition(event);
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;
        updateCursorPosition(event);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const updateCursorPosition = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        let newTime = (clickX / rect.width) * duration;
        
        // Apply snap
        newTime = snapToGrid(newTime, config);

        onCurrentTimeChange(Math.min(Math.max(newTime, 0), duration));
    };
    
    const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
        if (!onZoomChange) return;
        
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.5, Math.min(5, zoom + delta));
        onZoomChange(newZoom);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <canvas
                ref={canvasRef}
                style={{
                    border: "1px solid black",
                    backgroundColor: "white",
                    width: `${30 * zoom * duration}px`,
                    height: `${Math.max(80, 30 * zoom)}px`,
                    cursor: isDragging ? "grabbing" : "pointer",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                role="img"
                aria-label="Audio timeline canvas"
            />
        </div>
    );
};

export default AudioTimeline;
