// DateProposalsPanel.tsx — Doodle-like date scheduling for events
import React, { useState, useCallback } from "react";
import { useUser } from "../../../contexts/UserContext";
import { useTranslation } from "react-i18next";
import {
    useDateProposalsQuery,
    useDateBestQuery,
    useCreateDateProposalMutation,
    useDeleteDateProposalMutation,
    useDateVoteMutation,
    useDeleteDateVoteMutation,
} from "../../../scripts/api/apiEvents";
import { DateVoteStatus } from "../../../models/modelsKaraoke";
import type { EventDateProposal, DateBestResult } from "../../../models/modelsKaraoke";

interface Props {
    eventId: number;
}

const STATUS_LABELS: Record<DateVoteStatus, string> = {
    [DateVoteStatus.Available]: "✅",
    [DateVoteStatus.Maybe]: "🤔",
    [DateVoteStatus.Unavailable]: "❌",
};

const DateProposalsPanel: React.FC<Props> = ({ eventId }) => {
    const { t } = useTranslation();
    const { data: proposals = [], isLoading } = useDateProposalsQuery(eventId);
    const { data: bestResults = [] } = useDateBestQuery(eventId);
    const createMut = useCreateDateProposalMutation();
    const deleteMut = useDeleteDateProposalMutation();
    const voteMut = useDateVoteMutation();
    const deleteVoteMut = useDeleteDateVoteMutation();

    const [showForm, setShowForm] = useState(false);
    const [proposedStart, setProposedStart] = useState("");
    const [proposedEnd, setProposedEnd] = useState("");
    const [note, setNote] = useState("");
    const [showBest, setShowBest] = useState(false);

    const handleCreate = useCallback(() => {
        if (!proposedStart) return;
        createMut.mutate(
            { eventId, body: { proposedStart, proposedEnd: proposedEnd || undefined, note: note || undefined } },
            {
                onSuccess: () => {
                    setProposedStart("");
                    setProposedEnd("");
                    setNote("");
                    setShowForm(false);
                },
            },
        );
    }, [createMut, eventId, proposedStart, proposedEnd, note]);

    const handleVote = useCallback(
        (proposalId: number, status: DateVoteStatus) => {
            voteMut.mutate({ eventId, proposalId, body: { status } });
        },
        [voteMut, eventId],
    );

    const { userId } = useUser();

    const handleDeleteVote = useCallback(
        (proposalId: number) => {
            deleteVoteMut.mutate({ eventId, proposalId, userId: userId! });
        },
        [deleteVoteMut, eventId, userId],
    );

    if (isLoading) return <div className="text-center p-3"><i className="fa fa-spinner fa-spin" /></div>;

    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                    <i className="fa fa-calendar-check me-2" />
                    {t("party.dateProposals", "Date Proposals")}
                </h5>
                <div>
                    <button className="btn btn-sm btn-outline-info me-2" onClick={() => setShowBest(!showBest)}>
                        <i className="fa fa-chart-bar me-1" />
                        {showBest ? t("common.hideResults", "Hide Results") : t("common.showResults", "Show Results")}
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
                            <label className="form-label">{t("common.start", "Start")}</label>
                            <input type="datetime-local" className="form-control form-control-sm" value={proposedStart} onChange={(e) => setProposedStart(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">{t("common.end", "End")}</label>
                            <input type="datetime-local" className="form-control form-control-sm" value={proposedEnd} onChange={(e) => setProposedEnd(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">{t("common.note", "Note")}</label>
                            <input type="text" className="form-control form-control-sm" value={note} onChange={(e) => setNote(e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-2">
                        <button className="btn btn-sm btn-success" onClick={handleCreate} disabled={createMut.isPending}>
                            {t("common.save", "Save")}
                        </button>
                    </div>
                </div>
            )}

            {showBest && bestResults.length > 0 && (
                <div className="alert alert-info mb-3">
                    <strong>{t("party.bestDates", "Best Dates")}:</strong>
                    <ol className="mb-0 mt-1">
                        {bestResults.map((r: DateBestResult) => (
                            <li key={r.proposalId}>
                                {new Date(r.proposedStart).toLocaleString()}
                                {r.proposedEnd && ` – ${new Date(r.proposedEnd).toLocaleString()}`}
                                {r.note && ` (${r.note})`}
                                {" — "}
                                <span className="text-success">✅{r.availableCount}</span>{" "}
                                <span className="text-warning">🤔{r.maybeCount}</span>{" "}
                                <span className="text-danger">❌{r.unavailableCount}</span>{" "}
                                <small className="text-muted">(Score: {r.score})</small>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {proposals.length === 0 ? (
                <p className="text-muted">{t("party.noDateProposals", "No date proposals yet.")}</p>
            ) : (
                <div className="list-group">
                    {proposals.map((p: EventDateProposal) => (
                        <div key={p.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <strong>{new Date(p.proposedStart).toLocaleString()}</strong>
                                    {p.proposedEnd && <span> – {new Date(p.proposedEnd).toLocaleString()}</span>}
                                    {p.note && <div className="text-muted small">{p.note}</div>}
                                </div>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteMut.mutate({ eventId, proposalId: p.id })} title={t("common.delete", "Delete")}>
                                    <i className="fa fa-trash" />
                                </button>
                            </div>
                            <div className="mt-2 d-flex gap-2 align-items-center">
                                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                                    <button key={status} className="btn btn-sm btn-outline-secondary" onClick={() => handleVote(p.id, Number(status) as DateVoteStatus)}>
                                        {label}
                                    </button>
                                ))}
                                <button className="btn btn-sm btn-outline-warning" onClick={() => handleDeleteVote(p.id)} title={t("common.removeVote", "Remove vote")}>
                                    <i className="fa fa-undo" />
                                </button>
                                {p.votes && p.votes.length > 0 && (
                                    <small className="text-muted ms-2">
                                        {p.votes.length} {t("common.votes", "vote(s)")}
                                    </small>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(DateProposalsPanel);
