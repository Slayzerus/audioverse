import React, { useState, useRef, useEffect } from "react";
import { resumeAudioContext } from "../../../scripts/audioContext.ts";
import { drawTimeline, drawCursor } from "../../../scripts/audioTimeline.ts";

interface AudioTimelineProps {
    zoom: number;
    duration: number;
    isPlaying: boolean;
    isRecording: boolean;
    currentTime: number;
/*    onZoomChange: (value: number) => void;
    onDurationChange: (value: number) => void;*/
    onCurrentTimeChange: (value: number) => void;
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
                           /*                              onZoomChange,
                                                         onDurationChange,*/
                                                         onCurrentTimeChange,
                                                     }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const lastUpdateTime = useRef<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        resumeAudioContext(); // Naprawia błędy związane z "suspended AudioContext"
        if (canvasRef.current) {
            drawTimeline(canvasRef.current, zoom, duration);
            drawCursor(canvasRef.current, zoom, duration, currentTime, isRecording);
        }
    }, [zoom, duration, currentTime, isRecording]);

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
        const newTime = (clickX / rect.width) * duration;

        onCurrentTimeChange(Math.min(Math.max(newTime, 0), duration));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <canvas
                ref={canvasRef}
                style={{
                    border: "   1px solid black",
                    backgroundColor: "white",
                    width: `${30 * zoom * duration}px`,
                    height: `${30 * zoom}px`,
                    cursor: isDragging ? "grabbing" : "pointer",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
};

export default AudioTimeline;
