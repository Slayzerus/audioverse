// EventPollsPanel.tsx — Polls management panel for PartyPage
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    usePollsQuery,
    useCreatePollMutation,
    useDeletePollMutation,
    usePollResultsQuery,
    useSendPollEmailsMutation,
} from "../../../scripts/api/apiEventPolls";
import type { EventPoll } from "../../../models/modelsKaraoke";
import { PollType, PollOptionSource } from "../../../models/modelsKaraoke";

interface Props {
    eventId: number;
    isOrganizer?: boolean;
}

const cardStyle: React.CSSProperties = {
    background: "var(--card-bg, #23272f)",
    border: "1px solid var(--border-color, #333)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
};

const EventPollsPanel: React.FC<Props> = ({ eventId, isOrganizer = false }) => {
    const { t } = useTranslation();
    const [showCreate, setShowCreate] = useState(false);
    const [newPoll, setNewPoll] = useState<Partial<EventPoll>>({ type: PollType.SingleChoice, optionSource: PollOptionSource.Manual, isActive: true, trackCosts: false });
    const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
    const [emailsInput, setEmailsInput] = useState("");

    const pollsQ = usePollsQuery(eventId);
    const createPoll = useCreatePollMutation();
    const deletePoll = useDeletePollMutation();
    const resultsQ = usePollResultsQuery(eventId, selectedPollId ?? 0);
    const sendEmails = useSendPollEmailsMutation();

    const handleCreate = async () => {
        if (!newPoll.title?.trim()) return;
        await createPoll.mutateAsync({ eventId, poll: newPoll });
        setNewPoll({ type: PollType.SingleChoice, optionSource: PollOptionSource.Manual, isActive: true, trackCosts: false });
        setShowCreate(false);
    };

    const handleSendEmails = async (pollId: number) => {
        const emails = emailsInput.split(/[,;\s]+/).filter(e => e.includes("@"));
        if (emails.length === 0) return;
        await sendEmails.mutateAsync({ eventId, pollId, body: { emails } });
        setEmailsInput("");
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">{t("polls.title", "Polls")}</h5>
                {isOrganizer && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(s => !s)}>
                        <i className="fa fa-plus me-1" />{t("common.add", "Add")}
                    </button>
                )}
            </div>

            {/* Create form */}
            {showCreate && (
                <div style={cardStyle}>
                    <h6>{t("polls.createTitle", "Create Poll")}</h6>
                    <div className="row g-2">
                        <div className="col-md-5">
                            <input className="form-control form-control-sm" placeholder={t("polls.pollTitle", "Title")}
                                value={newPoll.title ?? ""} onChange={e => setNewPoll(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div className="col-md-4">
                            <input className="form-control form-control-sm" placeholder={t("polls.description", "Description")}
                                value={newPoll.description ?? ""} onChange={e => setNewPoll(p => ({ ...p, description: e.target.value }))} />
                        </div>
                        <div className="col-md-3">
                            <select className="form-select form-select-sm" value={newPoll.type ?? PollType.SingleChoice}
                                onChange={e => setNewPoll(p => ({ ...p, type: Number(e.target.value) as PollType }))}>
                                <option value={PollType.SingleChoice}>{t("polls.typeSingle", "Single choice")}</option>
                                <option value={PollType.MultiChoice}>{t("polls.typeMultiple", "Multiple choice")}</option>
                                <option value={PollType.YesNo}>{t("polls.typeQuantity", "Quantity")}</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-check mt-2">
                        <input className="form-check-input" type="checkbox" id="trackCosts" checked={newPoll.trackCosts ?? false}
                            onChange={e => setNewPoll(p => ({ ...p, trackCosts: e.target.checked }))} />
                        <label className="form-check-label small" htmlFor="trackCosts">{t("polls.trackCosts", "Track costs per option")}</label>
                    </div>
                    <button className="btn btn-success btn-sm mt-2" onClick={handleCreate} disabled={createPoll.isPending}>
                        {t("common.save", "Save")}
                    </button>
                </div>
            )}

            {/* Polls list */}
            {pollsQ.isLoading && <p className="text-muted">{t("common.loading", "Loading...")}</p>}
            {(pollsQ.data ?? []).map(poll => (
                <div key={poll.id} style={cardStyle}>
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <strong>{poll.title}</strong>
                            <span className={`badge ms-2 ${poll.isActive ? "bg-success" : "bg-secondary"}`}>{poll.isActive ? t("polls.active", "Active") : t("polls.closed", "Closed")}</span>
                            <span className="badge bg-info ms-1">{poll.type}</span>
                            {poll.trackCosts && <span className="badge bg-warning ms-1">{t("polls.costsTracked", "💰")}</span>}
                            {poll.description && <div className="text-muted small mt-1">{poll.description}</div>}
                        </div>
                        <div className="d-flex gap-1">
                            <button className="btn btn-outline-info btn-sm" onClick={() => setSelectedPollId(selectedPollId === poll.id ? null : poll.id)}>
                                <i className="fa fa-chart-bar" />
                            </button>
                            {isOrganizer && (
                                <button className="btn btn-outline-danger btn-sm" onClick={() => deletePoll.mutate({ eventId, pollId: poll.id })}>
                                    <i className="fa fa-trash" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options */}
                    {poll.options && poll.options.length > 0 && (
                        <div className="mt-2">
                            {poll.options.map(opt => (
                                <div key={opt.id} className="d-flex align-items-center gap-2 py-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <span style={{ fontSize: 13, flex: 1 }}>{opt.text}</span>
                                    {opt.unitCost != null && <span className="text-muted small">{opt.unitCost.toFixed(2)} PLN</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results */}
                    {selectedPollId === poll.id && resultsQ.data && (
                        <div className="mt-2 p-2" style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 13 }}>
                            <strong>{t("polls.results", "Results")}:</strong>
                            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(resultsQ.data, null, 2)}</pre>
                        </div>
                    )}

                    {/* Send poll by email */}
                    {isOrganizer && selectedPollId === poll.id && (
                        <div className="d-flex gap-2 mt-2">
                            <input className="form-control form-control-sm" style={{ flex: 1 }} placeholder={t("polls.emailsPlaceholder", "Emails (comma separated)")}
                                value={emailsInput} onChange={e => setEmailsInput(e.target.value)} />
                            <button className="btn btn-outline-primary btn-sm" onClick={() => handleSendEmails(poll.id)} disabled={sendEmails.isPending}>
                                <i className="fa fa-envelope me-1" />{t("polls.sendEmails", "Send")}
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {!pollsQ.isLoading && (pollsQ.data ?? []).length === 0 && (
                <p className="text-muted text-center py-3">{t("polls.empty", "No polls yet. Create one to gather votes from participants.")}</p>
            )}
        </div>
    );
};

export default React.memo(EventPollsPanel);
