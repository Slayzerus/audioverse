// LeaguesPage.tsx — League management with standings, schedule generation & participants
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    useLeaguesQuery,
    useLeagueQuery,
    useLeagueStandingsQuery,
    useCreateLeagueMutation,
    useUpdateLeagueMutation,
    useDeleteLeagueMutation,
    useGenerateScheduleMutation,
    useAddParticipantMutation,
} from "../../scripts/api/apiLeagues";
import { useFantasyTeamsQuery, useFantasyLeaderboardQuery, useCreateFantasyTeamMutation } from "../../scripts/api/apiFantasy";
import {
    EventList,
    useLeagueEventListsQuery,
} from "../../scripts/api/apiEventLists";
import type { League, LeagueType } from "../../models/modelsKaraoke";
import css from './LeaguesPage.module.css';

const LEAGUE_TYPE_LABELS: Record<number, string> = { 0: "Round Robin", 1: "Single Elim.", 2: "Double Elim.", 3: "Swiss", 4: "Ladder", 5: "Custom" };
const LEAGUE_STATUS_LABELS: Record<number, string> = { 0: "Draft", 1: "Registration", 2: "In Progress", 3: "Completed", 4: "Cancelled" };
const STATUS_COLORS: Record<number, string> = { 0: "#9e9e9e", 1: "#42a5f5", 2: "#66bb6a", 3: "#ffa726", 4: "#e53935" };

const LeaguesPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: leagues = [], isLoading } = useLeaguesQuery();
    const createMut = useCreateLeagueMutation();
    const updateMut = useUpdateLeagueMutation();
    const deleteMut = useDeleteLeagueMutation();
    const genSchedule = useGenerateScheduleMutation();
    const addPart = useAddParticipantMutation();

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: "", description: "", type: 0 as number, maxParticipants: 16 });
    const [partName, setPartName] = useState("");
    const [tab, setTab] = useState<"standings" | "fantasy" | "event-lists">("standings");

    const { data: detail } = useLeagueQuery(selectedId ?? NaN);
    const { data: standings = [] } = useLeagueStandingsQuery(selectedId ?? NaN);
    const { data: fantasyTeams = [] } = useFantasyTeamsQuery(selectedId ?? NaN);
    const { data: fantasyLB = [] } = useFantasyLeaderboardQuery(selectedId ?? NaN);
    const { data: leagueEventLists = [] } = useLeagueEventListsQuery(selectedId ?? NaN);
    const createFTeam = useCreateFantasyTeamMutation();

    const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = () => {
        if (!form.name.trim()) return;
        const payload: Partial<League> = { name: form.name, description: form.description, type: form.type as LeagueType, maxParticipants: form.maxParticipants };
        if (editId != null) {
            updateMut.mutate({ id: editId, payload }, { onSuccess: () => { setEditId(null); setShowForm(false); } });
        } else {
            createMut.mutate(payload, { onSuccess: () => setShowForm(false) });
        }
    };

    const handleEdit = (l: League) => {
        setForm({ name: l.name ?? "", description: l.description ?? "", type: l.type, maxParticipants: l.maxParticipants ?? 16 });
        setEditId(l.id);
        setShowForm(true);
    };

    return (
        <div className={css.pageContainer} style={{ gridTemplateColumns: selectedId ? "340px 1fr" : "1fr" }}>
            {/* ── Left: League list ── */}
            <div>
                <div className={css.headerRow}>
                    <h2 className={css.pageTitle}>🏆 {t("leagues.title", "Leagues")}</h2>
                    <button className={css.btnPrimary} onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: "", description: "", type: 0, maxParticipants: 16 }); }}>
                        {showForm ? t("common.cancel", "Cancel") : "+ League"}
                    </button>
                </div>

                {showForm && (
                    <div className={css.formCard}>
                        <div className={css.formGrid}>
                            <input className={css.input} placeholder={t("leagues.name", "League name") + " *"} value={form.name} onChange={(e) => set("name", e.target.value)} aria-label={t("leagues.name", "League name")} />
                            <textarea className={css.textArea} placeholder={t("leagues.description", "Description")} value={form.description} onChange={(e) => set("description", e.target.value)} aria-label={t("leagues.description", "Description")} />
                            <div className={css.formFlexRow}>
                                <select className={css.selectFlex} value={form.type} onChange={(e) => set("type", Number(e.target.value))} aria-label={t("leagues.type", "League type")}>
                                    {Object.entries(LEAGUE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                                <input className={css.inputNarrow} type="number" min={2} value={form.maxParticipants} onChange={(e) => set("maxParticipants", Number(e.target.value))} title="Max participants" aria-label={t("leagues.maxParticipants", "Max participants")} />
                            </div>
                        </div>
                        <button className={css.btnPrimary} onClick={handleSubmit}>{editId ? t("common.save", "Save") : t("common.create", "Create")}</button>
                    </div>
                )}

                {isLoading ? (
                    <p className={css.loadingText}>Loading…</p>
                ) : leagues.length === 0 ? (
                    <div className={css.emptyCard}><p className={css.textSecondary}>{t("leagues.empty", "No leagues yet.")}</p></div>
                ) : (
                    <div className={css.gridList}>
                        {leagues.map((l) => (
                            <div
                                key={l.id}
                                onClick={() => setSelectedId(l.id)}
                                className={`${css.leagueCard}${selectedId === l.id ? ` ${css.leagueCardSelected}` : ''}`}
                            >
                                <div>
                                    <div className={css.leagueName}>{l.name}</div>
                                    <div className={css.leagueMeta}>
                                        {LEAGUE_TYPE_LABELS[l.type] ?? "?"} · <span style={{ color: STATUS_COLORS[l.status] ?? "#999" }}>{LEAGUE_STATUS_LABELS[l.status] ?? "?"}</span>
                                    </div>
                                </div>
                                <div className={css.cardActions}>
                                    <button className={css.btnSecondary} onClick={(e) => { e.stopPropagation(); handleEdit(l); }} aria-label={t("common.edit", "Edit")}>✏️</button>
                                    <button className={css.btnDanger} onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) deleteMut.mutate(l.id); }} aria-label={t("common.delete", "Delete")}><i className="fa-solid fa-trash" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Right: Detail panel ── */}
            {selectedId && detail && (
                <div>
                    <div className={css.detailCard}>
                        <div className={css.detailHeader}>
                            <h3 className={css.detailTitle}>{detail.name}</h3>
                            <div className={css.detailActions}>
                                <button className={css.btnSecondary} onClick={() => genSchedule.mutate(selectedId)} title="Generate schedule">
                                    <i className="fa-solid fa-calendar" />{" "}{t("leagues.generateSchedule", "Schedule")}
                                </button>
                                <button className={css.btnSecondary} onClick={() => setSelectedId(null)} aria-label={t("common.close", "Close")}>✕</button>
                            </div>
                        </div>
                        {detail.description && <p className={css.detailDescription}>{detail.description}</p>}
                        <div className={css.detailMeta}>
                            <span className={css.textSecondary}>{LEAGUE_TYPE_LABELS[detail.type]}</span>
                            <span style={{ color: STATUS_COLORS[detail.status] }}>{LEAGUE_STATUS_LABELS[detail.status]}</span>
                            {detail.maxParticipants && <span className={css.textSecondary}>Max: {detail.maxParticipants}</span>}
                        </div>
                    </div>

                    {/* Add participant */}
                    <div className={css.participantCard}>
                        <input className={css.inputFlex} placeholder={t("leagues.participantName", "Participant name")} value={partName} onChange={(e) => setPartName(e.target.value)} aria-label={t("leagues.participantName", "Participant name")} />
                        <button className={css.btnPrimary} onClick={() => { if (partName.trim()) { addPart.mutate({ id: selectedId, payload: { name: partName } }); setPartName(""); } }}>
                            {t("leagues.addParticipant", "+ Add")}
                        </button>
                    </div>

                    {/* Tabs: Standings / Fantasy / Event Lists */}
                    <div className={css.tabRow}>
                        {(["standings", "fantasy", "event-lists"] as const).map((t2) => (
                            <button key={t2} className={tab === t2 ? css.btnPrimary : css.btnSecondary} onClick={() => setTab(t2)}>
                                {t2 === "standings" ? t("leagues.standings", "Standings") : t2 === "fantasy" ? t("leagues.fantasy", "Fantasy") : t("leagues.eventLists", "Event Lists")}
                            </button>
                        ))}
                    </div>

                    {tab === "standings" && (
                        <div className={css.card}>
                            {standings.length === 0 ? (
                                <p className={css.noDataText}>{t("leagues.noStandings", "No standings data.")}</p>
                            ) : (
                                <table className={css.standingsTable}>
                                    <thead>
                                        <tr className={css.standingsHeadRow}>
                                            <th className={css.thRank}>#</th>
                                            <th className={css.thLeft}>{t("leagues.participant", "Player")}</th>
                                            <th className={css.thCenter}>W</th>
                                            <th className={css.thCenter}>L</th>
                                            <th className={css.thCenter}>D</th>
                                            <th className={css.thRight}>{t("leagues.points", "Pts")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {standings.sort((a, b) => b.points - a.points).map((p, i) => (
                                            <tr key={p.id} className={p.isEliminated ? css.eliminatedRow : css.activeRow}>
                                                <td className={css.tdRank}>{i + 1}</td>
                                                <td>{p.name ?? `Player ${p.userId ?? p.id}`}</td>
                                                <td className={css.tdCenter}>{p.wins}</td>
                                                <td className={css.tdCenter}>{p.losses}</td>
                                                <td className={css.tdCenter}>{p.draws}</td>
                                                <td className={css.tdPoints}>{p.points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {tab === "fantasy" && (
                        <div className={css.card}>
                            <div className={css.fantasyHeader}>
                                <h4 className={css.fantasyTitle}>{t("fantasy.teams", "Fantasy Teams")}</h4>
                                <button className={css.btnPrimary} onClick={() => {
                                    const name = prompt(t("fantasy.teamName", "Team name"));
                                    if (name?.trim()) createFTeam.mutate({ leagueId: selectedId, payload: { name } });
                                }}>+ Team</button>
                            </div>
                            {fantasyTeams.length === 0 ? (
                                <p className={css.textSecondary}>{t("fantasy.noTeams", "No fantasy teams.")}</p>
                            ) : (
                                <div className={css.gridList}>
                                    {fantasyTeams.map((ft) => (
                                        <div key={ft.id} className={css.fantasyTeamCard}>
                                            <span className={css.teamName}>{ft.name}</span>
                                            <span className={css.teamPoints}>{ft.totalPoints.toLocaleString()} pts</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Leaderboard */}
                            {fantasyLB.length > 0 && (
                                <div className={css.leaderboardSection}>
                                    <h5 className={css.leaderboardTitle}>{t("fantasy.leaderboard", "Fantasy Leaderboard")}</h5>
                                    {fantasyLB.sort((a, b) => b.totalPoints - a.totalPoints).map((ft, i) => (
                                        <div key={ft.id} className={css.leaderboardRow}>
                                            <span className={css.leaderboardRank}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                                            <span className={css.leaderboardName}>{ft.name}</span>
                                            <span className={css.leaderboardPoints}>{ft.totalPoints.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "event-lists" && (
                        <div className={css.card}>
                            <h4 className={css.eventListTitle}>
                                <i className="fa-solid fa-list" />{" "}
                                {t("leagues.eventListsTitle", "League Event Lists")} ({leagueEventLists.length})
                            </h4>
                            {leagueEventLists.length === 0 ? (
                                <p className={css.noEventLists}>
                                    {t("leagues.noEventLists", "No event lists for this league.")}
                                </p>
                            ) : (
                                <div className={css.eventListGrid}>
                                    {leagueEventLists.map((list: EventList) => {
                                        const typeLbl = ["Custom", "Favorites", "Watched", "ByLocation", "ByCategory", "Archive"][list.type] ?? "Custom";
                                        const bg = ["#5865F2", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#7f8c8d"][list.type] ?? "#5865F2";
                                        return (
                                            <div key={list.id} className={css.eventListItem}>
                                                {list.iconKey && (
                                                    <i className={`fa-solid fa-${list.iconKey} ${css.eventListIcon}`}
                                                        style={{ color: list.color || "#5865F2" }} />
                                                )}
                                                <span className={css.eventListName}>{list.name}</span>
                                                <span className={css.eventListBadge} style={{ backgroundColor: bg }}>
                                                    {typeLbl}
                                                </span>
                                                <span className={css.eventListItemCount}>
                                                    {list.itemCount ?? list.items?.length ?? 0} items
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LeaguesPage;
