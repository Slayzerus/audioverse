import { useState, useEffect, useRef } from "react";
import YouTube, { YouTubePlayer as YTPlayer, YouTubeEvent } from "react-youtube";
import { searchYouTubeByArtistTitle } from "../../../scripts/api/apiLibrary";

interface YouTubePlayerProps {
    artist?: string;
    title?: string;
    hideControls?: boolean;
    isPlaying?: boolean;
    onTimeUpdate?: (time: number) => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ artist, title, hideControls = true, isPlaying, onTimeUpdate }) => {
    const [searchArtist, setSearchArtist] = useState<string>(artist || "");
    const [searchTitle, setSearchTitle] = useState<string>(title || "");
    const [videoId, setVideoId] = useState<string | null>(null);
    const [player, setPlayer] = useState<YTPlayer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [videoSize, setVideoSize] = useState({ width: 560, height: 315 });

    // 📌 Automatyczne wyszukiwanie, jeśli przekazano `artist` i `title`
    useEffect(() => {
        if (artist && title) {
            searchYouTubeByArtistTitle(artist, title).then(setVideoId);
        }
    }, [artist, title]);

    // 📌 Automatyczna obsługa play/pause z komponentu nadrzędnego
    useEffect(() => {
        if (player) {
            if (isPlaying) {
                player.playVideo();
            } else {
                player.pauseVideo();
            }
        }
    }, [isPlaying, player]);

    // 📌 Aktualizacja czasu odtwarzania co sekundę
    useEffect(() => {
        if (player && onTimeUpdate) {
            const interval = setInterval(() => {
                const currentTime = player.getCurrentTime();
                onTimeUpdate(currentTime);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [player, onTimeUpdate]);

    // 📌 Automatyczne dopasowanie rozmiaru wideo
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                const height = Math.round(width * (9 / 16)); // Zachowanie proporcji 16:9
                setVideoSize({ width, height });
            }
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    // 📌 Wyszukiwanie utworu ręcznie przez użytkownika
    const handleSearch = async () => {
        const foundVideoId = await searchYouTubeByArtistTitle(searchArtist, searchTitle);
        setVideoId(foundVideoId);
    };

    return (
        <div ref={containerRef} style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
            {/* 📌 Inputy pojawiają się, gdy brak artysty/tytułu lub nie znaleziono */}
            {(!artist || !title || !videoId) && (
                <div>
                    <input value={searchArtist} onChange={(e) => setSearchArtist(e.target.value)} placeholder="Artysta" />
                    <input value={searchTitle} onChange={(e) => setSearchTitle(e.target.value)} placeholder="Tytuł" />
                    <button onClick={handleSearch}>Szukaj</button>
                </div>
            )}

            {videoId && (
                <div>
                    <YouTube
                        videoId={videoId}
                        opts={{
                            width: videoSize.width.toString(),
                            height: videoSize.height.toString(),
                            playerVars: {
                                autoplay: 1,
                                controls: 0,
                                modestbranding: 1,
                                rel: 0,
                                showinfo: 0,
                                fs: 0,
                                disablekb: 1,
                                iv_load_policy: 3,
                                annotations: 0,
                            },
                        }}
                        onReady={(event: YouTubeEvent) => setPlayer(event.target)}
                    />

                    {/* 📌 Możliwość ukrycia kontrolek */}
                    {!hideControls && (
                        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                            <button onClick={() => player?.playVideo()}>▶ Play</button>
                            <button onClick={() => player?.pauseVideo()}>⏸ Pause</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default YouTubePlayer;
