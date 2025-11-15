import React, { useRef, useState, useMemo } from "react";
import KaraokeUploader from "./KaraokeUploader";
import GenericPlayer, { PlayerTrack, GenericPlayerExternal } from "../player/GenericPlayer";
import KaraokeLyrics from "./KaraokeLyrics";
import KaraokeTimeline from "./KaraokeTimeline";
import { KaraokeSongFile } from "../../../models/modelsKaraoke";
import Jurors from "../../animations/Jurors";

const PROGRESS_H = 56; // dolna belka postępu
const JURORS_H = 160;  // pas jurorów (widoczna górna połowa)

const KaraokeManager: React.FC = () => {
    const [uploadedSong, setUploadedSong] = useState<KaraokeSongFile | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const gpRef = useRef<GenericPlayerExternal | null>(null);
    const progressHostRef = useRef<HTMLDivElement>(null); // tylko dla belki postępu (fixed bottom)
    const timelineHostRef = useRef<HTMLDivElement>(null); // dedykowany host TIMELINE (na górze)

    const toTrack = (song: KaraokeSongFile): PlayerTrack => ({
        id: String(song.id ?? song.title ?? "song"),
        title: song.title ?? "—",
        artist: song.artist ?? "—",
        coverUrl: song.coverPath ?? undefined,
        // preferuj audio, a dopiero gdy brak — youtube
        sources: [
            ...(song.audioPath ? ([{ kind: "audio", url: song.audioPath }] as const) : []),
            ...(song.videoPath ? ([{ kind: "youtube", url: song.videoPath }] as const) : []),
        ],
    });

    // pokażemy tylko progress (bez sceny), więc tryb stały
    const uiMode = useMemo(() => "progressOnly" as const, []);

    return (
        <div
            className="karaoke-manager"
            style={{
                textAlign: "center",
                padding: "20px",
                // rezerwacja miejsca pod jurorów + progress
                paddingBottom: uploadedSong ? PROGRESS_H + JURORS_H + 24 : 20,
                position: "relative",
                minHeight: "100vh",
            }}
        >
            {uploadedSong && (
                <h3 style={{ marginTop: 4, marginBottom: 14 }}>
                    {uploadedSong.artist} - {uploadedSong.title}{" "}
                    {uploadedSong.year && <span>({uploadedSong.year})</span>}
                </h3>
            )}

            {/* Góra: kontrolki + uploader */}
            <div
                className="karaoke-header"
                style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 10 }}
            >
                {uploadedSong && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={() => (isPlaying ? gpRef.current?.pause() : gpRef.current?.play())}>
                            {isPlaying ? "⏸ Pause" : "▶ Play"}
                        </button>
                        <button onClick={() => gpRef.current?.seekTo(0)}>⏮ Reset</button>
                        <span>⏱️ {currentTime.toFixed(1)} s</span>
                    </div>
                )}
                <KaraokeUploader onSongUpload={(s) => { setUploadedSong(s); setCurrentTime(0); }} />
            </div>

            {/* --- SCENA GÓRNA --- */}
            {uploadedSong && (
                <>
                    {/* 1) DEDYKOWANY HOST TIMELINE */}
                    <div
                        ref={timelineHostRef}
                        style={{
                            width: "100%",
                            maxWidth: 1200,
                            margin: "0 auto",
                            minHeight: 260,         // stała wysokość => nic się nie „chowa”
                            position: "relative",
                        }}
                    >
                        <KaraokeTimeline
                            song={uploadedSong}
                            currentTime={currentTime}
                            playerName="Ziom"
                            score={10000}
                            playerRef={timelineHostRef} // <- timeline mierzy się do tego hosta
                        />
                    </div>

                    {/* 2) TEKST POD LINIAMI */}
                    <div style={{ marginTop: 16 }}>
                        <KaraokeLyrics song={uploadedSong} currentTime={currentTime} />
                    </div>
                </>
            )}

            {/* --- NAKŁADKI DOLNE --- */}
            {uploadedSong && (
                <>
                    {/* Jurorzy – pasek przyklejony nad progress, ucięci od pasa */}
                    <div
                        style={{
                            position: "fixed",
                            left: 0,
                            right: 0,
                            bottom: PROGRESS_H,
                            height: JURORS_H,
                            overflow: "hidden",                    // ucięcie
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            pointerEvents: "none",
                            zIndex: 60,
                            boxShadow: "0 -6px 16px rgba(0,0,0,0.25)",
                        }}
                    >
                        <div style={{ transform: "translateY(42%)" }}>{/* pas w dół -> odcięcie od pasa */}
                            <Jurors />
                        </div>
                    </div>

                    {/* Belka postępu (GenericPlayer) – przyklejona na samym dole */}
                    <div
                        ref={progressHostRef}
                        style={{
                            position: "fixed",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 80,
                            background: "#0b1220",
                            borderTop: "1px solid #334155",
                            padding: "6px 10px",
                        }}
                    >
                        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                            <GenericPlayer
                                tracks={[toTrack(uploadedSong)]}
                                autoPlay={false}
                                uiMode={uiMode}            // tylko pasek postępu
                                onPlayingChange={setIsPlaying}
                                onTimeUpdate={setCurrentTime}
                                externalRef={gpRef}
                                height={0}                 // brak sceny
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default KaraokeManager;
