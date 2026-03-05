import { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const [searchArtist, setSearchArtist] = useState<string>(artist || "");
    const [searchTitle, setSearchTitle] = useState<string>(title || "");
    const [videoId, setVideoId] = useState<string | null>(null);
    const [player, setPlayer] = useState<YTPlayer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [videoSize, setVideoSize] = useState({ width: Math.min(560, window.innerWidth - 32), height: Math.min(315, (window.innerWidth - 32) * 9 / 16) });

    // 📌 Auto search if artist and title were passed
    useEffect(() => {
        if (artist && title) {
            searchYouTubeByArtistTitle(artist, title).then(setVideoId);
        }
    }, [artist, title]);

    // 📌 Auto play/pause handling from parent component
    useEffect(() => {
        if (player) {
            if (isPlaying) {
                player.playVideo();
            } else {
                player.pauseVideo();
            }
        }
    }, [isPlaying, player]);

    // 📌 Playback time update every second
    useEffect(() => {
        if (player && onTimeUpdate) {
            const interval = setInterval(() => {
                const currentTime = player.getCurrentTime();
                onTimeUpdate(currentTime);
            }, 100); // poll every 100ms for smoother time updates
            return () => clearInterval(interval);
        }
    }, [player, onTimeUpdate]);

    // 📌 Automatyczne dopasowanie rozmiaru wideo
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                const height = Math.round(width * (9 / 16)); // Maintaining 16:9 aspect ratio
                setVideoSize({ width, height });
            }
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    // 📌 Manual song search by user
    const handleSearch = async () => {
        const foundVideoId = await searchYouTubeByArtistTitle(searchArtist, searchTitle);
        setVideoId(foundVideoId);
    };

    return (
        <div ref={containerRef} style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
            {/* 📌 Inputs appear when no artist/title or not found */}
            {(!artist || !title || !videoId) && (
                <div>
                    <input value={searchArtist} onChange={(e) => setSearchArtist(e.target.value)} placeholder={t('youtubePlayer.artist', 'Artist')} aria-label={t('youtubePlayer.artist', 'Artist')} />
                    <input value={searchTitle} onChange={(e) => setSearchTitle(e.target.value)} placeholder={t('youtubePlayer.title', 'Title')} aria-label={t('youtubePlayer.title', 'Title')} />
                    <button onClick={handleSearch}>{t('youtubePlayer.search', 'Search')}</button>
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

                    {/* 📌 Ability to hide controls */}
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
