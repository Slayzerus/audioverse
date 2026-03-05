// SongPicksPanel.tsx — Song Picks voting/signup panel for event sessions
import React, { useState, useCallback } from "react";
import { useUser } from "../../../contexts/UserContext";
import { useTranslation } from "react-i18next";
import {
    useSongPicksQuery,
    useSongPicksRankedQuery,
    useCreateSongPickMutation,
    useImportSongPicksMutation,
    useDeleteSongPickMutation,
    useSongPickSignupMutation,
    useDeleteSongPickSignupMutation,
} from "../../../scripts/api/apiEvents";
import type { EventSessionSongPick, SongPickRankedResult } from "../../../models/modelsKaraoke";

interface Props {
    eventId: number;
    sessionId: number;
}

const SongPicksPanel: React.FC<Props> = ({ eventId, sessionId }) => {
    const { t } = useTranslation();
    const { userId } = useUser();
    const { data: picks = [], isLoading } = useSongPicksQuery(eventId, sessionId);
    const { data: ranked = [] } = useSongPicksRankedQuery(eventId, sessionId);
    const createMut = useCreateSongPickMutation();
    const importMut = useImportSongPicksMutation();
    const deleteMut = useDeleteSongPickMutation();
    const signupMut = useSongPickSignupMutation();
    const deleteSignupMut = useDeleteSongPickSignupMutation();

    const [showForm, setShowForm] = useState(false);
    const [songTitle, setSongTitle] = useState("");
    const [songId, setSongId] = useState<string>("");
    const [importPlaylistId, setImportPlaylistId] = useState<string>("");
    const [showRanked, setShowRanked] = useState(false);

    const handleCreate = useCallback(() => {
        if (!songTitle) return;
        createMut.mutate(
            { eventId, sessionId, body: { songTitle, songId: songId ? Number(songId) : undefined } },
            {
                onSuccess: () => {
                    setSongTitle("");
                    setSongId("");
                    setShowForm(false);
                },
            },
        );
    }, [createMut, eventId, sessionId, songTitle, songId]);

    const handleImport = useCallback(() => {
        if (!importPlaylistId) return;
        importMut.mutate({ eventId, sessionId, sourcePlaylistId: Number(importPlaylistId) }, {
            onSuccess: () => setImportPlaylistId(""),
        });
    }, [importMut, eventId, sessionId, importPlaylistId]);

    const handleSignup = useCallback(
        (pickId: number, preferredSlot?: number) => {
            signupMut.mutate({ eventId, sessionId, pickId, preferredSlot });
        },
        [signupMut, eventId, sessionId],
    );

    if (isLoading) return <div className="text-center p-3"><i className="fa fa-spinner fa-spin" /></div>;

    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                    <i className="fa fa-music me-2" />
                    {t("party.songPicks", "Song Picks")}
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
                            <label className="form-label">{t("party.songTitle", "Song Title")}</label>
                            <input type="text" className="form-control form-control-sm" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">{t("party.songId", "Song ID")}</label>
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
                            <label className="form-label">{t("party.importFromPlaylist", "Import from Playlist ID")}</label>
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
                    <strong>{t("party.rankedSongs", "Ranked Songs")}:</strong>
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
                <p className="text-muted">{t("party.noSongPicks", "No song picks yet.")}</p>
            ) : (
                <div className="list-group">
                    {picks.map((p: EventSessionSongPick) => (
                        <div key={p.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{p.songTitle}</strong>
                                    {p.songId && <span className="badge bg-secondary ms-2">#{p.songId}</span>}
                                    {p.signups && <small className="text-muted ms-2">({p.signups.length} {t("common.signups", "signup(s)")})</small>}
                                </div>
                                <div className="d-flex gap-1">
                                    <button className="btn btn-sm btn-outline-success" onClick={() => handleSignup(p.id)} title={t("party.signup", "Sign Up")}>
                                        <i className="fa fa-hand-paper me-1" />
                                        {t("party.signup", "Sign Up")}
                                    </button>
                                    <button className="btn btn-sm btn-outline-warning" onClick={() => deleteSignupMut.mutate({ eventId, sessionId, pickId: p.id, userId: userId! })} title={t("party.removeSignup", "Remove Signup")}>
                                        <i className="fa fa-undo" />
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteMut.mutate({ eventId, sessionId, pickId: p.id })} title={t("common.delete", "Delete")}>
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

export default React.memo(SongPicksPanel);
