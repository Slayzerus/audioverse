// GamePicksPanel.tsx — Game Picks voting panel for events
import React, { useState, useCallback } from "react";
import { useUser } from "../../../contexts/UserContext";
import { useTranslation } from "react-i18next";
import {
    useGamePicksQuery,
    useGamePicksRankedQuery,
    useCreateGamePickMutation,
    useImportGamePicksMutation,
    useDeleteGamePickMutation,
    useGamePickVoteMutation,
    useDeleteGamePickVoteMutation,
} from "../../../scripts/api/apiEvents";
import type { EventSessionGamePick, GamePickRankedResult } from "../../../models/modelsKaraoke";

interface Props {
    eventId: number;
}

const GamePicksPanel: React.FC<Props> = ({ eventId }) => {
    const { t } = useTranslation();
    const { userId } = useUser();
    const { data: picks = [], isLoading } = useGamePicksQuery(eventId);
    const { data: ranked = [] } = useGamePicksRankedQuery(eventId);
    const createMut = useCreateGamePickMutation();
    const importMut = useImportGamePicksMutation();
    const deleteMut = useDeleteGamePickMutation();
    const voteMut = useGamePickVoteMutation();
    const deleteVoteMut = useDeleteGamePickVoteMutation();

    const [showForm, setShowForm] = useState(false);
    const [gameName, setGameName] = useState("");
    const [boardGameId, setBoardGameId] = useState<string>("");
    const [videoGameId, setVideoGameId] = useState<string>("");
    const [importCollectionId, setImportCollectionId] = useState<string>("");
    const [showRanked, setShowRanked] = useState(false);

    const handleCreate = useCallback(() => {
        if (!gameName) return;
        createMut.mutate(
            {
                eventId,
                body: {
                    gameName,
                    boardGameId: boardGameId ? Number(boardGameId) : undefined,
                    videoGameId: videoGameId ? Number(videoGameId) : undefined,
                },
            },
            {
                onSuccess: () => {
                    setGameName("");
                    setBoardGameId("");
                    setVideoGameId("");
                    setShowForm(false);
                },
            },
        );
    }, [createMut, eventId, gameName, boardGameId, videoGameId]);

    const handleImport = useCallback(() => {
        if (!importCollectionId) return;
        importMut.mutate({ eventId, sourceCollectionId: Number(importCollectionId) }, {
            onSuccess: () => setImportCollectionId(""),
        });
    }, [importMut, eventId, importCollectionId]);

    const handleVote = useCallback(
        (pickId: number, priority: number) => {
            voteMut.mutate({ eventId, pickId, priority });
        },
        [voteMut, eventId],
    );

    if (isLoading) return <div className="text-center p-3"><i className="fa fa-spinner fa-spin" /></div>;

    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                    <i className="fa fa-dice me-2" />
                    {t("party.gamePicks", "Game Picks")}
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
                        <div className="col-md-4">
                            <label className="form-label">{t("common.name", "Name")}</label>
                            <input type="text" className="form-control form-control-sm" value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder={t("party.gameName", "Game name")} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">{t("party.boardGameId", "Board Game ID")}</label>
                            <input type="number" className="form-control form-control-sm" value={boardGameId} onChange={(e) => setBoardGameId(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">{t("party.videoGameId", "Video Game ID")}</label>
                            <input type="number" className="form-control form-control-sm" value={videoGameId} onChange={(e) => setVideoGameId(e.target.value)} />
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
                            <label className="form-label">{t("party.importFromCollection", "Import from Collection ID")}</label>
                            <input type="number" className="form-control form-control-sm" value={importCollectionId} onChange={(e) => setImportCollectionId(e.target.value)} />
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
                    <strong>{t("party.rankedGames", "Ranked Games")}:</strong>
                    <ol className="mb-0 mt-1">
                        {ranked.map((r: GamePickRankedResult) => (
                            <li key={r.pickId}>
                                #{r.rank} — <strong>{r.gameName}</strong> ({r.voteCount} {t("common.votes", "vote(s)")})
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {picks.length === 0 ? (
                <p className="text-muted">{t("party.noGamePicks", "No game picks yet.")}</p>
            ) : (
                <div className="list-group">
                    {picks.map((p: EventSessionGamePick) => (
                        <div key={p.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{p.gameName}</strong>
                                    {p.boardGameId && <span className="badge bg-primary ms-2">Board #{p.boardGameId}</span>}
                                    {p.videoGameId && <span className="badge bg-info ms-2">Video #{p.videoGameId}</span>}
                                    {p.votes && <small className="text-muted ms-2">({p.votes.length} {t("common.votes", "vote(s)")})</small>}
                                </div>
                                <div className="d-flex gap-1">
                                    {[1, 2, 3].map((priority) => (
                                        <button key={priority} className="btn btn-sm btn-outline-success" onClick={() => handleVote(p.id, priority)} title={`Priority ${priority}`}>
                                            {priority}⭐
                                        </button>
                                    ))}
                                    <button className="btn btn-sm btn-outline-warning" onClick={() => deleteVoteMut.mutate({ eventId, pickId: p.id, userId: userId! })} title={t("common.removeVote", "Remove vote")}>
                                        <i className="fa fa-undo" />
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteMut.mutate({ eventId, pickId: p.id })} title={t("common.delete", "Delete")}>
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

export default React.memo(GamePicksPanel);
