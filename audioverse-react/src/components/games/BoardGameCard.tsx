// BoardGameCard.tsx — Reusable card for displaying a board game
import React from "react";
import type { BoardGame } from "../../models/modelsKaraoke";
import { useTranslation } from "react-i18next";

interface BoardGameCardProps {
    game: BoardGame;
    onDelete?: (id: number) => void;
    onRefresh?: (id: number) => void;
    compact?: boolean;
}

const BoardGameCard: React.FC<BoardGameCardProps> = ({ game, onDelete, onRefresh, compact = false }) => {
    const { t } = useTranslation();

    const imageUrl = game.bggImageUrl || game.imageKey;

    return (
        <div
            className="rounded-xl border shadow-sm overflow-hidden flex flex-col"
            style={{
                background: "var(--card-bg, #fff)",
                borderColor: "var(--border-color, #e5e7eb)",
                color: "var(--text-primary, #1f2937)",
                minWidth: compact ? 180 : 240,
                maxWidth: compact ? 220 : 320,
            }}
        >
            {/* Image */}
            {imageUrl && (
                <div className="w-full overflow-hidden" style={{ height: compact ? 140 : 200 }}>
                    <img
                        src={imageUrl}
                        alt={game.name ?? "Board game"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>
            )}
            {!imageUrl && (
                <div
                    className="w-full flex items-center justify-center text-4xl"
                    style={{ height: compact ? 140 : 200, background: "var(--surface-bg, #f3f4f6)" }}
                >
                    🎲
                </div>
            )}

            {/* Body */}
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
                        {game.bggYearPublished && (
                            <span className="text-xs opacity-60">{game.bggYearPublished}</span>
                        )}
                        <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                            <span>👥 {game.minPlayers}–{game.maxPlayers}</span>
                            {game.estimatedDurationMinutes && (
                                <span>⏱ {game.estimatedDurationMinutes} min</span>
                            )}
                        </div>
                        {game.bggRating != null && game.bggRating > 0 && (
                            <div className="flex items-center gap-1 text-xs mt-1">
                                <span>⭐</span>
                                <span className="font-medium">{game.bggRating.toFixed(1)}</span>
                            </div>
                        )}
                        {game.genre && (
                            <span className="text-xs opacity-50 truncate">{game.genre}</span>
                        )}
                    </>
                )}

                {/* Actions */}
                {(onDelete || onRefresh) && (
                    <div className="flex gap-2 mt-auto pt-2">
                        {onRefresh && game.bggId && (
                            <button
                                onClick={() => onRefresh(game.id)}
                                className="text-xs px-2 py-1 rounded border hover:opacity-80"
                                style={{
                                    borderColor: "var(--border-color, #d1d5db)",
                                    color: "var(--text-secondary, #6b7280)",
                                }}
                                title={t("boardGames.refreshBgg")}
                            >
                                🔄
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(game.id)}
                                className="text-xs px-2 py-1 rounded border hover:opacity-80"
                                style={{
                                    borderColor: "var(--error, #f87171)",
                                    color: "var(--error, #ef4444)",
                                }}
                                title={t("common.delete")}
                            >
                                🗑
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BoardGameCard;
