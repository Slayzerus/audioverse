// KaraokeSongPicksPanel.tsx — Karaoke Song Picks signup panel for karaoke sessions
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    useKaraokeSongPicksQuery,
    useKaraokeSongPicksRankedQuery,
    useCreateKaraokeSongPickMutation,
    useImportKaraokeSongPicksMutation,
    useDeleteKaraokeSongPickMutation,
    useKaraokeSongPickSignupMutation,
    useDeleteKaraokeSongPickSignupMutation,
} from "../../../scripts/api/apiKaraoke";
import type { KaraokeSessionSongPick, SongPickRankedResult } from "../../../models/modelsKaraoke";

interface Props {
    sessionId: number;
    playerId: number;
}

const KaraokeSongPicksPanel: React.FC<Props> = ({ sessionId, playerId }) => {
    const { t } = useTranslation();
    const { data: picks = [], isLoading } = useKaraokeSongPicksQuery(sessionId);
    const { data: ranked = [] } = useKaraokeSongPicksRankedQuery(sessionId);
    const createMut = useCreateKaraokeSongPickMutation();
    const importMut = useImportKaraokeSongPicksMutation();
    const deleteMut = useDeleteKaraokeSongPickMutation();
    const signupMut = useKaraokeSongPickSignupMutation();
    const deleteSignupMut = useDeleteKaraokeSongPickSignupMutation();

    const [showForm, setShowForm] = useState(false);
    const [songTitle, setSongTitle] = useState("");
    const [songId, setSongId] = useState<string>("");
    const [importPlaylistId, setImportPlaylistId] = useState<string>("");
    const [showRanked, setShowRanked] = useState(false);

    const handleCreate = useCallback(() => {
        if (!songTitle) return;
        createMut.mutate(
            { sessionId, body: { songTitle, songId: songId ? Number(songId) : undefined } },
            {
                onSuccess: () => {
                    setSongTitle("");
                    setSongId("");
                    setShowForm(false);
                },
            },
        );
    }, [createMut, sessionId, songTitle, songId]);

    const handleImport = useCallback(() => {
        if (!importPlaylistId) return;
        importMut.mutate({ sessionId, sourcePlaylistId: Number(importPlaylistId) }, {
            onSuccess: () => setImportPlaylistId(""),
        });
    }, [importMut, sessionId, importPlaylistId]);

    const handleSignup = useCallback(
        (pickId: number) => {
            signupMut.mutate({ sessionId, pickId, playerId });
        },
        [signupMut, sessionId, playerId],
    );

    if (isLoading) return <div className="text-center p-3"><i className="fa fa-spinner fa-spin" /></div>;

    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                    <i className="fa fa-microphone me-2" />
                    {t("karaoke.songPicks", "Song Picks")}
                </h5>
                <div>
                    <button className="btn btn-sm btn-outline-info me-2" onClick={() => setShowRanked(!showRanked)}>
                        <i className="fa fa-chart-bar me-1" />
                        {showRanked ? t("common.hideRanking", "Hide Ranking") : t("common.showRanking", "Show Ranking")}
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowForm(!showForm)}>
                        <i className="fa fa-plus me-1" />
                        {t("common.add", "Add")}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="card card-body mb-3">
                    <div className="row g-2">
                        <div className="col-md-6">
                            <label className="form-label">{t("karaoke.songTitle", "Song Title")}</label>
                            <input type="text" className="form-control form-control-sm" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">{t("karaoke.songId", "Song ID")}</label>
                            <input type="number" className="form-control form-control-sm" value={songId} onChange={(e) => setSongId(e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-2 d-flex gap-2">
                        <button className="btn btn-sm btn-success" onClick={handleCreate} disabled={createMut.isPending}>
                            {t("common.save", "Save")}
                        </button>
                    </div>
                    <hr />
                    <div className="row g-2 align-items-end">
                        <div className="col-md-6">
                            <label className="form-label">{t("karaoke.importFromPlaylist", "Import from Playlist ID")}</label>
                            <input type="number" className="form-control form-control-sm" value={importPlaylistId} onChange={(e) => setImportPlaylistId(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <button className="btn btn-sm btn-outline-primary" onClick={handleImport} disabled={importMut.isPending}>
                                <i className="fa fa-download me-1" />
                                {t("common.import", "Import")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRanked && ranked.length > 0 && (
                <div className="alert alert-info mb-3">
                    <strong>{t("karaoke.rankedSongs", "Ranked Songs")}:</strong>
                    <ol className="mb-0 mt-1">
                        {ranked.map((r: SongPickRankedResult) => (
                            <li key={r.pickId}>
                                #{r.rank} — <strong>{r.songTitle}</strong> ({r.signupCount} {t("common.signups", "signup(s)")})
                                {r.makesTheCut && <span className="badge bg-success ms-2">✓</span>}
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {picks.length === 0 ? (
                <p className="text-muted">{t("karaoke.noSongPicks", "No song picks yet.")}</p>
            ) : (
                <div className="list-group">
                    {picks.map((p: KaraokeSessionSongPick) => (
                        <div key={p.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{p.songTitle}</strong>
                                    {p.songId && <span className="badge bg-secondary ms-2">#{p.songId}</span>}
                                    {p.signups && <small className="text-muted ms-2">({p.signups.length} {t("common.signups", "signup(s)")})</small>}
                                </div>
                                <div className="d-flex gap-1">
                                    <button className="btn btn-sm btn-outline-success" onClick={() => handleSignup(p.id)} title={t("karaoke.signup", "Sign Up")}>
                                        <i className="fa fa-hand-paper me-1" />
                                        {t("karaoke.signup", "Sign Up")}
                                    </button>
                                    <button className="btn btn-sm btn-outline-warning" onClick={() => deleteSignupMut.mutate({ sessionId, pickId: p.id })} title={t("karaoke.removeSignup", "Remove Signup")}>
                                        <i className="fa fa-undo" />
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteMut.mutate({ sessionId, pickId: p.id })} title={t("common.delete", "Delete")}>
                                        <i className="fa fa-trash" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(KaraokeSongPicksPanel);
