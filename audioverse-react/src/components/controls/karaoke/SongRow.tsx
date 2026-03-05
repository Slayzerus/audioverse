/**
 * SongRow — single row in KaraokeSongBrowser, wrapped in React.memo
 * to prevent re-renders when other rows' covers/scores change.
 */
import React from "react";
import type { KaraokeSong } from "../../../models/modelsKaraoke";
import type { TopSinging } from "../../../scripts/api/apiKaraoke";
import type { KaraokePlaylist } from "../../../models/modelsKaraoke";
import type { BrowserNode } from "./SongBrowserSidebar";
import { Focusable } from "../../common/Focusable";
import { useTranslation } from "react-i18next";

const NO_COVER_SVG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23999' font-size='12'%3ENo Cover%3C/text%3E%3C/svg%3E";

/** Format seconds to m:ss */
function formatDuration(sec: number | null | undefined): string {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface SongRowProps {
    song: KaraokeSong;
    index: number;
    coverUrl: string;
    topScore: TopSinging | null | undefined;
    isSelected: boolean;
    multiSelect: boolean;
    disabled: boolean;
    loadingPlayId: number | null;
    isViewingMyPlaylist: boolean;
    myPlaylists: KaraokePlaylist[];
    addMenuSongId: number | null;
    addMenuRef: React.RefObject<HTMLDivElement | null>;
    activeNode: BrowserNode;
    totalSongs?: number;
    onPlay?: (songId: number) => void;
    onToggleSelect: (songId: number) => void;
    onPlayClick: (songId: number) => void;
    onRowKeyDown: (e: React.KeyboardEvent, songId: number) => void;
    onRemoveFromPlaylist: (plId: number, songId: number) => void;
    onAddToPlaylist: (plId: number, songId: number) => void;
    onToggleAddMenu: (songId: number | null) => void;
    onMoveUp?: (songId: number) => void;
    onMoveDown?: (songId: number) => void;
}

const SongRow: React.FC<SongRowProps> = ({
    song,
    index,
    coverUrl,
    topScore,
    isSelected,
    multiSelect,
    disabled,
    loadingPlayId,
    isViewingMyPlaylist,
    myPlaylists,
    addMenuSongId,
    addMenuRef,
    activeNode,
    totalSongs,
    onPlay,
    onToggleSelect,
    onPlayClick,
    onRowKeyDown,
    onRemoveFromPlaylist,
    onAddToPlaylist,
    onToggleAddMenu,
    onMoveUp,
    onMoveDown,
}) => {
    const { t } = useTranslation();

    return (
        <Focusable id={`song-${song.id}`}>
            <div
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onKeyDown={(e) => onRowKeyDown(e, song.id)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: isSelected
                        ? "rgba(255,215,0,0.12)"
                        : "transparent",
                    borderLeft: isSelected
                        ? "3px solid goldenrod"
                        : "3px solid transparent",
                    transition: "background 0.15s, border-color 0.15s",
                }}
                onClick={() => {
                    if (multiSelect) {
                        onToggleSelect(song.id);
                    } else {
                        onPlayClick(song.id);
                    }
                }}
            >
                {/* Multiselect checkbox */}
                {multiSelect && (
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(song.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 18,
                            height: 18,
                            accentColor: "goldenrod",
                            flexShrink: 0,
                        }}
                        tabIndex={-1}
                    />
                )}

                {/* Index */}
                <span
                    style={{
                        width: 32,
                        textAlign: "right",
                        fontSize: 12,
                        opacity: 0.4,
                        flexShrink: 0,
                    }}
                >
                    {index + 1}
                </span>

                {/* Cover */}
                <img
                    src={coverUrl}
                    alt={song.title || t('karaoke.songCover', 'Song cover art')}
                    style={{
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        borderRadius: 6,
                        flexShrink: 0,
                    }}
                    onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (!img.dataset.fallback) {
                            img.dataset.fallback = "1";
                            img.src = NO_COVER_SVG;
                        }
                    }}
                />

                {/* Song info */}
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <span
                        style={{
                            fontWeight: 600,
                            fontSize: 15,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {song.artist} — {song.title}
                    </span>
                    <span
                        style={{
                            fontSize: 12,
                            opacity: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            flexWrap: 'wrap',
                        }}
                    >
                        {[song.genre, song.language, song.year]
                            .filter(Boolean)
                            .join(" · ")}
                        {song.linkedSong?.durationSeconds && (
                            <span style={{ marginLeft: 4 }}>⏱ {formatDuration(song.linkedSong.durationSeconds)}</span>
                        )}
                        {song.externalSource && (
                            <span
                                style={{
                                    marginLeft: 4,
                                    fontSize: 10,
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    background: song.externalSource === 'Spotify' ? '#1DB954' : '#FF0000',
                                    color: '#fff',
                                    fontWeight: 600,
                                }}
                            >
                                {song.externalSource === 'Spotify' ? '🎵' : '▶️'} {song.externalSource}
                            </span>
                        )}
                    </span>
                    {song.linkedSong && (
                        <span style={{ fontSize: 11, opacity: 0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {[
                                song.linkedSong.albumTitle && `💿 ${song.linkedSong.albumTitle}`,
                                song.linkedSong.albumReleaseYear && `(${song.linkedSong.albumReleaseYear})`,
                                song.linkedSong.artistCountry && `🌍 ${song.linkedSong.artistCountry}`,
                            ].filter(Boolean).join(' ')}
                            {song.linkedSong.streamingLinks.length > 0 && (
                                <>
                                    {' '}
                                    {song.linkedSong.streamingLinks.map(link => (
                                        <a
                                            key={link}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            style={{ marginLeft: 4, fontSize: 10 }}
                                        >
                                            {link.includes('spotify') ? '🎵' : link.includes('youtube') ? '▶️' : '🔗'}
                                        </a>
                                    ))}
                                </>
                            )}
                        </span>
                    )}
                </div>

                {/* Top score */}
                {topScore && (
                    <div
                        style={{
                            textAlign: "right",
                            flexShrink: 0,
                            lineHeight: 1.3,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                            }}
                        >
                            🏆 {topScore.score.toLocaleString()}
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                opacity: 0.5,
                            }}
                        >
                            {topScore.playerName}
                        </div>
                    </div>
                )}

                {/* Reorder buttons (only in my playlist) */}
                {isViewingMyPlaylist && onMoveUp && onMoveDown && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: '0 5px', fontSize: 11, lineHeight: 1.2 }}
                            title={t('karaoke.moveUp', 'Move up')}
                            disabled={index === 0}
                            onClick={(e) => { e.stopPropagation(); onMoveUp(song.id); }}
                        >▲</button>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            style={{ padding: '0 5px', fontSize: 11, lineHeight: 1.2 }}
                            title={t('karaoke.moveDown', 'Move down')}
                            disabled={index >= (totalSongs ?? 1) - 1}
                            onClick={(e) => { e.stopPropagation(); onMoveDown(song.id); }}
                        >▼</button>
                    </div>
                )}

                {/* Playlist actions */}
                {isViewingMyPlaylist ? (
                    <button
                        className="btn btn-sm btn-outline-danger"
                        style={{
                            flexShrink: 0,
                            padding: "2px 6px",
                            fontSize: 14,
                            lineHeight: 1,
                        }}
                        title={t('karaoke.removeFromPlaylist')}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFromPlaylist(
                                (activeNode as Extract<BrowserNode, { type: "myPlaylist" }>).id,
                                song.id,
                            );
                        }}
                    >
                        ✕
                    </button>
                ) : myPlaylists.length > 0 ? (
                    <div
                        style={{ position: "relative", flexShrink: 0 }}
                        ref={
                            addMenuSongId === song.id
                                ? (addMenuRef as React.RefObject<HTMLDivElement>)
                                : undefined
                        }
                    >
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            style={{
                                padding: "2px 6px",
                                fontSize: 14,
                                lineHeight: 1,
                            }}
                            title={t('karaoke.addToPlaylist')}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleAddMenu(
                                    addMenuSongId === song.id ? null : song.id,
                                );
                            }}
                        >
                            +
                        </button>
                        {addMenuSongId === song.id && (
                            <div
                                style={{
                                    position: "absolute",
                                    right: 0,
                                    top: "100%",
                                    zIndex: 200,
                                    background: "var(--bg-primary, #222)",
                                    border: "1px solid #555",
                                    borderRadius: 8,
                                    padding: 4,
                                    minWidth: 180,
                                    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                                }}
                            >
                                {myPlaylists.map((pl) => (
                                    <button
                                        key={pl.id}
                                        className="btn btn-sm w-100 text-start"
                                        style={{
                                            fontSize: 13,
                                            padding: "4px 8px",
                                            color: "var(--text-primary, #eee)",
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddToPlaylist(pl.id, song.id);
                                            onToggleAddMenu(null);
                                        }}
                                    >
                                        📋 {pl.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Play icon (single-select mode) */}
                {!multiSelect && onPlay && (
                    <button
                        className="btn btn-sm btn-outline-success"
                        style={{
                            flexShrink: 0,
                            padding: "4px 10px",
                            fontSize: 16,
                            lineHeight: 1,
                        }}
                        disabled={disabled || loadingPlayId === song.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlayClick(song.id);
                        }}
                        title={t('karaoke.playButton')}
                    >
                        {loadingPlayId === song.id ? "⏳" : "▶"}
                    </button>
                )}
            </div>
        </Focusable>
    );
};

export default React.memo(SongRow);
