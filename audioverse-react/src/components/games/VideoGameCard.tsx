// VideoGameCard.tsx — Reusable card for displaying a video game
import React from "react";
import type { VideoGame } from "../../models/modelsKaraoke";
import { GamePlatform } from "../../models/modelsKaraoke";
import { useTranslation } from "react-i18next";

interface VideoGameCardProps {
    game: VideoGame;
    onDelete?: (id: number) => void;
    onEdit?: (id: number) => void;
    compact?: boolean;
}

const getPlatformIcon = (p: GamePlatform) => {
    switch (p) {
        case GamePlatform.PC: return "💻";
        case GamePlatform.PlayStation: return "🎮";
        case GamePlatform.Xbox: return "❎";
        case GamePlatform.NintendoSwitch: return "🕹️";
        case GamePlatform.Mobile: return "📱";
        case GamePlatform.Web: return "🌐";
        default: return "🎮";
    }
};

const VideoGameCard: React.FC<VideoGameCardProps> = ({ game, onDelete, compact = false }) => {
    const { t } = useTranslation();

    const imageUrl = game.steamHeaderImageUrl || game.imageKey;

    return (
        <div
            className="rounded-xl border shadow-sm overflow-hidden flex flex-col"
            style={{
                background: "var(--card-bg, #fff)",
                borderColor: "var(--border-secondary, #e5e7eb)",
                color: "var(--text-primary, #1f2937)",
                minWidth: compact ? 180 : 240,
                maxWidth: compact ? 220 : 320,
            }}
        >
            {imageUrl && (
                <div className="w-full overflow-hidden relative" style={{ height: compact ? 100 : 140 }}>
                    <img
                        src={imageUrl}
                        alt={game.name ?? "Video game"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                        {getPlatformIcon(game.platform)}
                    </div>
                </div>
            )}
            {!imageUrl && (
                <div
                    className="w-full flex items-center justify-center text-4xl relative"
                    style={{ height: compact ? 100 : 140, background: "var(--bg-tertiary, #f3f4f6)" }}
                >
                    🎮
                    <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded text-xs border">
                        {getPlatformIcon(game.platform)}
                    </div>
                </div>
            )}

            <div className="p-3 flex flex-col gap-1 flex-1">
                <h3
                    className="font-semibold leading-tight truncate"
                    style={{ fontSize: compact ? "0.85rem" : "1rem" }}
                    title={game.name ?? undefined}
                >
                    {game.name ?? t("boardGames.untitled")}
                </h3>

                {!compact && (
                    <>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {game.isLocal && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 border border-green-200">
                                    🏠 {t("videoGames.local")}
                                </span>
                            )}
                            {game.isOnline && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                    🌐 {t("videoGames.online")}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                            <span>👥 {game.minPlayers}–{game.maxPlayers}</span>
                            {game.genre && (
                                <span className="truncate max-w-[120px]">• {game.genre}</span>
                            )}
                        </div>
                    </>
                )}

                <div className="flex gap-2 mt-auto pt-2 justify-between items-center">
                    {game.steamAppId && (
                        <a
                            href={`https://store.steampowered.com/app/${game.steamAppId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs opacity-60 hover:opacity-100 underline decoration-dotted"
                            title={t("videoGames.viewStore")}
                        >
                            Steam ↗
                        </a>
                    )}

                    {onDelete && (
                        <button
                            onClick={() => onDelete(game.id)}
                            className="text-xs px-2 py-1 rounded border hover:opacity-80 ml-auto"
                            style={{
                                borderColor: "var(--error, #f87171)",
                                color: "var(--error, #ef4444)",
                            }}
                            title={t("videoGames.confirmDelete")}
                        >
                            🗑
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoGameCard;
