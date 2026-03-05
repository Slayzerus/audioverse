// GameSessionScoringPanel.tsx — Manage rounds, parts, players & scores for a game session
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    useBoardGameSessionRoundsQuery,
    useAddBoardGameRoundMutation,
    useDeleteBoardGameRoundMutation,
    useAddBoardGameRoundPartMutation,
    useDeleteBoardGamePartMutation,
    useAddBoardGamePartPlayerMutation,
    usePatchBoardGamePartPlayerScoreMutation,
    useDeleteBoardGamePartPlayerMutation,
    useVideoGameSessionRoundsQuery,
    useAddVideoGameRoundMutation,
    useDeleteVideoGameRoundMutation,
    useAddVideoGameRoundPartMutation,
    useDeleteVideoGamePartMutation,
    useAddVideoGamePartPlayerMutation,
    usePatchVideoGamePartPlayerScoreMutation,
    useDeleteVideoGamePartPlayerMutation,
    type CreateBoardGameRoundDto,
    type CreateVideoGameRoundDto,
    type CreateRoundPartDto,
    type CreatePartPlayerDto,
} from "../../../scripts/api/apiGameSessions";

// ── Type-agnostic wrapper ──
type GameKind = "board" | "video";

interface Props {
    kind: GameKind;
    sessionId: number;
    eventId: number;
    /** Available player IDs (e.g. event participant ids) with display names */
    availablePlayers?: { id: number; name: string }[];
}

/** Extended player type — backend may include navigation properties not in the base model. */
type PartPlayerDisplay = { id: number; partId: number; playerId: number; score?: number | null; playerName?: string; player?: { displayName?: string } };

const cellStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderBottom: "1px solid var(--bs-border-color, #dee2e6)",
    verticalAlign: "middle",
};

const btnSmall: React.CSSProperties = {
    padding: "2px 8px",
    fontSize: "0.8rem",
    cursor: "pointer",
    border: "1px solid var(--bs-border-color, #dee2e6)",
    borderRadius: "4px",
    background: "none",
};

const GameSessionScoringPanel: React.FC<Props> = ({ kind, sessionId, eventId: _eventId, availablePlayers = [] }) => {
    const { t } = useTranslation();

    // ── Board hooks ──
    const boardRoundsQ = useBoardGameSessionRoundsQuery(kind === "board" ? sessionId : 0, { enabled: kind === "board" });
    const addBoardRound = useAddBoardGameRoundMutation();
    const delBoardRound = useDeleteBoardGameRoundMutation();
    const addBoardPart = useAddBoardGameRoundPartMutation();
    const delBoardPart = useDeleteBoardGamePartMutation();
    const addBoardPartPlayer = useAddBoardGamePartPlayerMutation();
    const patchBoardScore = usePatchBoardGamePartPlayerScoreMutation();
    const delBoardPartPlayer = useDeleteBoardGamePartPlayerMutation();

    // ── Video hooks ──
    const videoRoundsQ = useVideoGameSessionRoundsQuery(kind === "video" ? sessionId : 0, { enabled: kind === "video" });
    const addVideoRound = useAddVideoGameRoundMutation();
    const delVideoRound = useDeleteVideoGameRoundMutation();
    const addVideoPart = useAddVideoGameRoundPartMutation();
    const delVideoPart = useDeleteVideoGamePartMutation();
    const addVideoPartPlayer = useAddVideoGamePartPlayerMutation();
    const patchVideoScore = usePatchVideoGamePartPlayerScoreMutation();
    const delVideoPartPlayer = useDeleteVideoGamePartPlayerMutation();

    // Editing state
    const [editingScoreId, setEditingScoreId] = useState<number | null>(null);
    const [scoreValue, setScoreValue] = useState<string>("");
    const [addPlayerPartId, setAddPlayerPartId] = useState<number | null>(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState<number>(0);

    // ── Generic wrappers ──
    const rounds = (kind === "board" ? boardRoundsQ.data : videoRoundsQ.data) ?? [];
    const isLoading = kind === "board" ? boardRoundsQ.isLoading : videoRoundsQ.isLoading;

    const handleAddRound = useCallback(() => {
        if (kind === "board") {
            addBoardRound.mutate({ sessionId, roundNumber: rounds.length + 1 } as CreateBoardGameRoundDto);
        } else {
            addVideoRound.mutate({ sessionId, roundNumber: rounds.length + 1 } as CreateVideoGameRoundDto);
        }
    }, [kind, sessionId, rounds.length, addBoardRound, addVideoRound]);

    const handleDeleteRound = useCallback(
        (roundId: number) => {
            if (!confirm(t("gameSessions.confirmDeleteRound", "Delete this round?"))) return;
            if (kind === "board") delBoardRound.mutate({ roundId, sessionId });
            else delVideoRound.mutate({ roundId, sessionId });
        },
        [kind, sessionId, delBoardRound, delVideoRound, t],
    );

    const handleAddPart = useCallback(
        (roundId: number) => {
            const dto: CreateRoundPartDto = { name: `Part ${Date.now() % 1000}` };
            if (kind === "board") addBoardPart.mutate({ roundId, sessionId, dto });
            else addVideoPart.mutate({ roundId, sessionId, dto });
        },
        [kind, sessionId, addBoardPart, addVideoPart],
    );

    const handleDeletePart = useCallback(
        (partId: number) => {
            if (kind === "board") delBoardPart.mutate({ partId, sessionId });
            else delVideoPart.mutate({ partId, sessionId });
        },
        [kind, sessionId, delBoardPart, delVideoPart],
    );

    const handleAddPartPlayer = useCallback(
        (partId: number, playerId: number) => {
            const dto: CreatePartPlayerDto = { playerId };
            if (kind === "board") addBoardPartPlayer.mutate({ partId, sessionId, dto });
            else addVideoPartPlayer.mutate({ partId, sessionId, dto });
            setAddPlayerPartId(null);
            setSelectedPlayerId(0);
        },
        [kind, sessionId, addBoardPartPlayer, addVideoPartPlayer],
    );

    const handleSaveScore = useCallback(
        (partPlayerId: number) => {
            const num = Number(scoreValue);
            if (isNaN(num)) return;
            if (kind === "board") patchBoardScore.mutate({ id: partPlayerId, score: num, sessionId });
            else patchVideoScore.mutate({ id: partPlayerId, score: num, sessionId });
            setEditingScoreId(null);
            setScoreValue("");
        },
        [kind, sessionId, scoreValue, patchBoardScore, patchVideoScore],
    );

    const handleDeletePartPlayer = useCallback(
        (id: number) => {
            if (kind === "board") delBoardPartPlayer.mutate({ id, sessionId });
            else delVideoPartPlayer.mutate({ id, sessionId });
        },
        [kind, sessionId, delBoardPartPlayer, delVideoPartPlayer],
    );

    if (sessionId <= 0) {
        return <div style={{ opacity: 0.6 }}>{t("gameSessions.selectSession", "Select a session to score")}</div>;
    }

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h5 style={{ margin: 0 }}>
                    {kind === "board"
                        ? t("gameSessions.boardScoring", "Board Game Scoring")
                        : t("gameSessions.videoScoring", "Video Game Scoring")}
                </h5>
                <button onClick={handleAddRound} style={{ ...btnSmall, color: "#198754", borderColor: "#198754" }}>
                    + {t("gameSessions.addRound", "Add Round")}
                </button>
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: 20, opacity: 0.6 }}>
                    {t("common.loading", "Loading...")}
                </div>
            ) : rounds.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, opacity: 0.6 }}>
                    {t("gameSessions.noRounds", "No rounds yet")}
                </div>
            ) : (
                rounds.map((round, ri) => (
                    <div
                        key={round.id}
                        style={{
                            marginBottom: 16,
                            border: "1px solid var(--bs-border-color, #dee2e6)",
                            borderRadius: 8,
                            overflow: "hidden",
                        }}
                    >
                        {/* Round header */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 14px",
                                backgroundColor: "var(--bs-secondary-bg, #f8f9fa)",
                                fontWeight: 600,
                            }}
                        >
                            <span>
                                {t("gameSessions.round", "Round")} #{round.number ?? ri + 1}
                            </span>
                            <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => handleAddPart(round.id)} style={btnSmall} title={t("gameSessions.addPart", "Add part")}>
                                    + Part
                                </button>
                                <button onClick={() => handleDeleteRound(round.id)} style={{ ...btnSmall, color: "#dc3545" }} title={t("common.delete", "Delete")}>
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Parts */}
                        {(round.parts ?? []).length === 0 ? (
                            <div style={{ padding: "10px 14px", opacity: 0.5, fontSize: "0.85rem" }}>
                                {t("gameSessions.noParts", "No parts yet")}
                            </div>
                        ) : (
                            (round.parts ?? []).map((part) => (
                                <div key={part.id} style={{ borderTop: "1px solid var(--bs-border-color, #eee)" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "6px 14px",
                                            backgroundColor: "var(--bs-tertiary-bg, #f0f0f0)",
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        <span>{part.name || `Part ${part.id}`}</span>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button
                                                onClick={() => {
                                                    setAddPlayerPartId(part.id);
                                                    setSelectedPlayerId(availablePlayers[0]?.id ?? 0);
                                                }}
                                                style={btnSmall}
                                                title={t("gameSessions.addPlayer", "Add player")}
                                            >
                                                + Player
                                            </button>
                                            <button onClick={() => handleDeletePart(part.id)} style={{ ...btnSmall, color: "#dc3545" }}>
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    {/* Add player popover */}
                                    {addPlayerPartId === part.id && (
                                        <div style={{ padding: "6px 14px", display: "flex", gap: 6, alignItems: "center" }}>
                                            <select
                                                value={selectedPlayerId}
                                                onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
                                                style={{ flex: 1, padding: "4px" }}
                                            >
                                                <option value={0}>-- {t("common.select", "Select")} --</option>
                                                {availablePlayers.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                disabled={selectedPlayerId === 0}
                                                onClick={() => handleAddPartPlayer(part.id, selectedPlayerId)}
                                                style={{ ...btnSmall, color: "#198754" }}
                                            >
                                                {t("common.add", "Add")}
                                            </button>
                                            <button onClick={() => setAddPlayerPartId(null)} style={btnSmall}>
                                                {t("common.cancel", "Cancel")}
                                            </button>
                                        </div>
                                    )}

                                    {/* Players + scores table */}
                                    {(part.players ?? []).length > 0 && (
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                                                    <th style={cellStyle}>{t("gameSessions.player", "Player")}</th>
                                                    <th style={{ ...cellStyle, textAlign: "center" }}>{t("gameSessions.score", "Score")}</th>
                                                    <th style={{ ...cellStyle, width: 60 }} />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(part.players ?? []).map((pp: PartPlayerDisplay) => (
                                                    <tr key={pp.id}>
                                                        <td style={cellStyle}>
                                                            {pp.playerName ?? pp.player?.displayName ?? `#${pp.playerId}`}
                                                        </td>
                                                        <td style={{ ...cellStyle, textAlign: "center" }}>
                                                            {editingScoreId === pp.id ? (
                                                                <span style={{ display: "inline-flex", gap: 4 }}>
                                                                    <input
                                                                        type="number"
                                                                        value={scoreValue}
                                                                        onChange={(e) => setScoreValue(e.target.value)}
                                                                        style={{ width: 70, textAlign: "center" }}
                                                                        autoFocus
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") handleSaveScore(pp.id);
                                                                            if (e.key === "Escape") setEditingScoreId(null);
                                                                        }}
                                                                    />
                                                                    <button onClick={() => handleSaveScore(pp.id)} style={btnSmall}>
                                                                        ✓
                                                                    </button>
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{ cursor: "pointer", textDecoration: "underline dotted" }}
                                                                    onClick={() => {
                                                                        setEditingScoreId(pp.id);
                                                                        setScoreValue(String(pp.score ?? 0));
                                                                    }}
                                                                    title={t("gameSessions.clickToEdit", "Click to edit score")}
                                                                >
                                                                    {pp.score ?? 0}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ ...cellStyle, textAlign: "center" }}>
                                                            <button
                                                                onClick={() => handleDeletePartPlayer(pp.id)}
                                                                style={{ ...btnSmall, color: "#dc3545" }}
                                                                title={t("common.remove", "Remove")}
                                                            >
                                                                ✕
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default React.memo(GameSessionScoringPanel);
