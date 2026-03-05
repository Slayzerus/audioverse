import React, { useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getPlaylistById } from "../../scripts/api/apiPlaylists";
import type { PlaylistDto } from "../../models/modelsPlaylists";
import { useToast } from "../../components/ui/ToastProvider";
import { KaraokePlaylistSong, type KaraokeSongFile } from "../../models/karaoke";

/** Defensive display type — covers various playlist item shapes from different sources. */
type SongLike = Partial<KaraokeSongFile> & {
    name?: string; trackName?: string; titleRaw?: string;
    artists?: string | string[]; performer?: string;
    duration?: number; length?: number; ms?: number; seconds?: number;
    coverUrl?: string; cover?: string; thumbnail?: string;
    songId?: number;
};

const PlaylistDetailsPage: React.FC = () => {
    const { t } = useTranslation();
    const { playlistId } = useParams<{ playlistId: string }>();

    const idNum = playlistId ? Number(playlistId) : NaN;
    const { data: playlist, isLoading, isError } = useQuery<PlaylistDto>({
        queryKey: ["playlists", idNum],
        queryFn: () => getPlaylistById(idNum),
        enabled: Number.isFinite(idNum),
    });
    const navigate = useNavigate();
    const { showToast } = useToast();
    const importInputRef = useRef<HTMLInputElement | null>(null);

    if (isLoading) return <div className="container mt-4">{t("playlistDetails.loading")}</div>;
    if (isError || !playlist) return <div className="container mt-4">{t("playlistDetails.notFound")}</div>;

    const songs = (playlist.playlistSongs || playlist.items || []) as KaraokePlaylistSong[];

    const handlePlayPlaylist = () => {
        // Navigate to music player with playlist id as query param
        navigate(`/musicPlayer?playlistId=${playlist.id}`);
        showToast(t("playlistDetails.playing", { name: playlist.name ?? playlist.id }), 'info');
    };

    const handleExport = () => {
        try {
            const blob = new Blob([JSON.stringify(playlist, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `playlist-${playlist.id}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast(t("playlistDetails.exported"), 'success');
        } catch (_e) {
            showToast(t("playlistDetails.exportFailed"), 'error');
        }
    };

    const handleImportClick = () => importInputRef.current?.click();

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        try {
            const text = await f.text();
            const parsed = JSON.parse(text);
            const items = parsed.playlistSongs || parsed.items || parsed.songs || [];
            showToast(t("playlistDetails.imported", { count: Array.isArray(items) ? items.length : 0 }), 'success');
        } catch (_err) {
            showToast(t("playlistDetails.importFailed"), 'error');
        } finally {
            // reset input
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="mb-0">{playlist.name ?? t("playlistDetails.playlistFallback", { id: playlistId })}</h1>
                    {playlist.description ? <p className="text-muted">{playlist.description}</p> : null}
                </div>
                <div>
                    <Link to="/playlists" className="btn btn-outline-secondary">{t("playlistDetails.backToPlaylists")}</Link>
                </div>
            </div>

            <div className="mb-3 d-flex gap-2">
                <button className="btn btn-primary" onClick={handlePlayPlaylist}>▶ {t("common.play")}</button>
                <button className="btn btn-outline-secondary" onClick={handleExport}>⬇ {t("common.export")}</button>
                <button className="btn btn-outline-secondary" onClick={handleImportClick}>⬆ {t("common.import")}</button>
                <input ref={importInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportFile} />
            </div>

            <div className="card">
                <div className="card-body">
                    {songs.length === 0 && <p className="text-muted">{t("playlistDetails.empty")}</p>}
                    {songs.length > 0 && (
                        <ul className="list-group">
                            {songs.map((s, idx) => {
                                const song: SongLike = (s.song || s) as SongLike;
                                const title = song.title || song.name || song.trackName || song.titleRaw;
                                const artist = song.artist || song.artists || song.performer;
                                const duration = song.duration || song.length || song.ms || song.seconds;
                                const durationText = typeof duration === 'number' ? `${Math.floor((duration/1000||duration)/60)}:${String(Math.floor((duration/1000||duration)%60)).padStart(2,'0')}` : undefined;
                                return (
                                    <li key={song.id ?? song.songId ?? idx} className="list-group-item d-flex align-items-center justify-content-between">
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            {song.coverUrl || song.cover || song.thumbnail ? (
                                                <img src={song.coverUrl || song.cover || song.thumbnail} alt={title} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                                                ) : (
                                                <div style={{ width: 56, height: 56, background: 'var(--surface-muted, #f3f4f6)', borderRadius: 6 }} />
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{title}</div>
                                                {artist ? <div className="text-muted" style={{ fontSize: 13 }}>{Array.isArray(artist) ? (artist.join(', ')) : artist}</div> : null}
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            {durationText ? <small className="text-muted">{durationText}</small> : null}
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => showToast(t("playlistDetails.playSong", { title }), 'info')}>{t("common.play")}</button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaylistDetailsPage;
