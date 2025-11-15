import React, { useEffect, useState } from "react";
import { KaraokeSongFile } from "../../../models/modelsKaraoke";
import { parseLyrics, getActiveLyrics } from "../../../scripts/karaoke/karaokeLyrics";

interface KaraokeLyricsProps {
    song: KaraokeSongFile;
    currentTime: number;
}

const KaraokeLyrics: React.FC<KaraokeLyricsProps> = ({ song, currentTime }) => {
    const [activeLines, setActiveLines] = useState<string[]>([]);

    useEffect(() => {
        console.log("🔄 useEffect odpalił się! ⏳ Czas:", currentTime);

        if (!song || !song.notes.length) {
            console.log("❌ Brak nut w song.notes!");
            return;
        }

        console.log("✅ Nuty wczytane:", song.notes.length);

        const lyrics = parseLyrics(song.notes.map(note => note.noteLine));
        console.log("✅ Przetworzone wersy:", lyrics);

        console.log("🔥 Wywołuję `getActiveLyrics()`!");
        const active = getActiveLyrics(lyrics, currentTime);

        if (JSON.stringify(active) !== JSON.stringify(activeLines)) {
            setActiveLines(active);
        }
    }, [currentTime, song]);

    return (
        <div className="karaoke-lyrics" style={{ textAlign: "center", fontSize: "24px", marginTop: "20px", minHeight: "80px" }}>
            {activeLines.length > 0 ? (
                activeLines.map((line, index) => (
                    <p key={index} style={{ color: index === 0 ? "#fff" : index === 1 ? "#bbb" : "#777", margin: "5px 0" }}>
                        {line}
                    </p>
                ))
            ) : (
                <p style={{ color: "#999" }}>🎤 Waiting for lyrics...</p>
            )}
        </div>
    );
};

export default KaraokeLyrics;
