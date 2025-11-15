import React, { useEffect, useRef, useState } from "react";
import { KaraokeSongFile } from "../../../models/modelsKaraoke";
import { parseNotes, drawTimeline } from "../../../scripts/karaoke/karaokeTimeline";

interface KaraokeTimelineProps {
    song: KaraokeSongFile;
    currentTime: number;
    playerName?: string;
    score?: number;
    playerBgColor?: string;
    playerRef: React.RefObject<HTMLDivElement>; // 📌 Otrzymuje referencję do YouTubePlayera
}

const KaraokeTimeline: React.FC<KaraokeTimelineProps> = ({
                                                             song,
                                                             currentTime,
                                                             playerName = "Ziom",
                                                             score = 10000,
                                                             playerBgColor = "rgba(0, 0, 0, 0.7)",
                                                             playerRef
                                                         }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 600, height: 150, top: 250 });

    // 📌 Dynamiczne dostosowanie do YouTubePlayera
    useEffect(() => {
        const updateSize = () => {
            if (!playerRef.current) return;

            const playerRect = playerRef.current.getBoundingClientRect();
            const width = playerRect.width;
            const height = width * (150 / 600);

            // 🟢 Automatycznie dostosowuje wysokość, aby dopasować do YouTubePlayera
            const youtubeTopOffset = playerRect.top + window.scrollY;
            const navHeaderOffset = 60; // 🔹 Margines nawigacji/headera
            const correctedTop = youtubeTopOffset - navHeaderOffset;

            setCanvasSize({ width, height, top: correctedTop });
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, [playerRef]);

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        const noteLines = parseNotes(song.notes.map(note => note.noteLine));

        drawTimeline(ctx, canvasSize.width, canvasSize.height, noteLines, currentTime, playerName, score, playerBgColor);
    }, [currentTime, song, canvasSize]);

    return (
        <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{
                position: "absolute",
                left: "50%",
                top: `${canvasSize.top}px`, // 🔥 Teraz idealnie nad playerem!
                transform: "translateX(-50%)",
                zIndex: 10,
                pointerEvents: "none",
                background: "transparent"
            }}
        />
    );
};

export default KaraokeTimeline;
