import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../common/Focusable";
import { useToast } from "../../ui/ToastProvider";
import {
    useGamesQuery,
    useCreateGameMutation,
    useUpdateGameMutation,
    useDeleteGameMutation,
    type CreateGameRequest,
} from "../../../scripts/api/apiKaraoke";
import type {
    KaraokeGame,
    KaraokeGameMode,
    KaraokeGameTheme,
} from "../../../models/modelsKaraoke";

/* ── constants ──────────────────────────────────────────────────── */

const GAME_MODES: KaraokeGameMode[] = [
    "classic",
    "blind",
    "elimination",
    "relay",
    "freestyle",
];

const MODE_ICONS: Record<KaraokeGameMode, string> = {
    classic: "fa-microphone",
    blind: "fa-eye-slash",
    elimination: "fa-bolt",
    relay: "fa-exchange",
    freestyle: "fa-magic",
};

import { KARAOKE_FONT_OPTIONS } from "../../../scripts/karaoke/karaokeDisplaySettings";

const FONT_OPTIONS = ["inherit", ...KARAOKE_FONT_OPTIONS.map(f => f.value)];

/* ── component ──────────────────────────────────────────────────── */

interface Props {
    partyId: number;
    isOrganizer: boolean;
}

const GameSettingsPanel: React.FC<Props> = ({ partyId, isOrganizer }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();

    /* ─ queries & mutations ─ */
    const gamesQuery = useGamesQuery(partyId);
    const createMutation = useCreateGameMutation(partyId);
    const updateMutation = useUpdateGameMutation(partyId);
    const deleteMutation = useDeleteGameMutation(partyId);

    /* ─ new‑game form state ─ */
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [name, setName] = useState("");
    const [mode, setMode] = useState<KaraokeGameMode>("classic");
    const [maxRounds, setMaxRounds] = useState(5);
    const [timeLimit, setTimeLimit] = useState(180);
    const [primaryColor, setPrimaryColor] = useState("#3b82f6");
    const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
    const [fontFamily, setFontFamily] = useState("inherit");
    const [backgroundUrl, setBackgroundUrl] = useState("");

    /* ─ edit state ─ */
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editPatch, setEditPatch] = useState<Partial<CreateGameRequest>>({});

    const resetForm = () => {
        setName("");
        setMode("classic");
        setMaxRounds(5);
        setTimeLimit(180);
        setPrimaryColor("#3b82f6");
        setSecondaryColor("#8b5cf6");
        setFontFamily("inherit");
        setBackgroundUrl("");
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const theme: KaraokeGameTheme = {
            primaryColor,
            secondaryColor,
            fontFamily: fontFamily !== "inherit" ? fontFamily : undefined,
            backgroundUrl: backgroundUrl.trim() || undefined,
        };

        createMutation.mutate(
            { name: name.trim(), mode, maxRounds, timeLimitPerRound: timeLimit, theme },
            {
                onSuccess: () => {
                    showToast(t("gameSettings.created", "Game created!"), "success");
                    resetForm();
                    setShowCreateForm(false);
                },
                onError: () => showToast(t("gameSettings.createError", "Failed to create game"), "error"),
            }
        );
    };

    const handleUpdate = (gameId: number) => {
        updateMutation.mutate(
            { gameId, patch: editPatch },
            {
                onSuccess: () => {
                    showToast(t("gameSettings.updated", "Game updated!"), "success");
                    setEditingId(null);
                    setEditPatch({});
                },
                onError: () => showToast(t("gameSettings.updateError", "Failed to update game"), "error"),
            }
        );
    };

    const handleDelete = (gameId: number) => {
        deleteMutation.mutate(gameId, {
            onSuccess: () => showToast(t("gameSettings.deleted", "Game deleted"), "success"),
            onError: () => showToast(t("gameSettings.deleteError", "Failed to delete game"), "error"),
        });
    };

    /* ─ helpers ─ */
    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            draft: "bg-secondary",
            active: "bg-success",
            finished: "bg-primary",
            cancelled: "bg-danger",
        };
        return <span className={`badge ${map[status] ?? "bg-secondary"} ms-2`}>{status}</span>;
    };

    const games = gamesQuery.data ?? [];

    /* ── render ──────────────────────────────────────────────────── */
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">
                    <i className="fa fa-gamepad me-2" aria-hidden="true" />
                    {t("gameSettings.title", "Karaoke Games")}
                </h5>
                {isOrganizer && (
                    <Focusable id="toggle-create-game">
                        <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setShowCreateForm((v) => !v)}
                        >
                            <i className={`fa ${showCreateForm ? "fa-times" : "fa-plus"} me-1`} aria-hidden="true" />
                            {showCreateForm
                                ? t("common.cancel", "Cancel")
                                : t("gameSettings.newGame", "New Game")}
                        </button>
                    </Focusable>
                )}
            </div>

            {/* ── Create form ── */}
            {showCreateForm && isOrganizer && (
                <form onSubmit={handleCreate} className="card card-body mb-3 bg-body-secondary">
                    <div className="row g-3">
                        {/* Name */}
                        <div className="col-md-6">
                            <label className="form-label">{t("gameSettings.name", "Game name")}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t("gameSettings.namePlaceholder", "e.g. Saturday Night Karaoke")}
                                required
                            />
                        </div>

                        {/* Mode */}
                        <div className="col-md-6">
                            <label className="form-label">{t("gameSettings.mode", "Mode")}</label>
                            <div className="d-flex flex-wrap gap-2">
                                {GAME_MODES.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        className={`btn btn-sm ${mode === m ? "btn-primary" : "btn-outline-secondary"}`}
                                        onClick={() => setMode(m)}
                                        title={t(`gameSettings.modes.${m}`, m)}
                                    >
                                        <i className={`fa ${MODE_ICONS[m]} me-1`} aria-hidden="true" />
                                        {t(`gameSettings.modes.${m}`, m)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Max rounds */}
                        <div className="col-md-3">
                            <label className="form-label">{t("gameSettings.maxRounds", "Rounds")}</label>
                            <input
                                type="number"
                                className="form-control"
                                min={1}
                                max={99}
                                value={maxRounds}
                                onChange={(e) => setMaxRounds(Number(e.target.value))}
                            />
                        </div>

                        {/* Time limit */}
                        <div className="col-md-3">
                            <label className="form-label">
                                {t("gameSettings.timeLimit", "Time / round")}
                                <small className="text-muted ms-1">({t("common.seconds", "sec")})</small>
                            </label>
                            <input
                                type="number"
                                className="form-control"
                                min={30}
                                max={600}
                                step={10}
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                            />
                        </div>

                        {/* Theme colors */}
                        <div className="col-md-3">
                            <label className="form-label">{t("gameSettings.primaryColor", "Primary color")}</label>
                            <div className="d-flex align-items-center gap-2">
                                <input
                                    type="color"
                                    className="form-control form-control-color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    aria-label={t("gameSettings.primaryColor", "Primary color")}
                                />
                                <code className="small">{primaryColor}</code>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">{t("gameSettings.secondaryColor", "Secondary")}</label>
                            <div className="d-flex align-items-center gap-2">
                                <input
                                    type="color"
                                    className="form-control form-control-color"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    aria-label={t("gameSettings.secondaryColor", "Secondary color")}
                                />
                                <code className="small">{secondaryColor}</code>
                            </div>
                        </div>

                        {/* Font */}
                        <div className="col-md-6">
                            <label className="form-label">{t("gameSettings.font", "Font")}</label>
                            <select
                                className="form-select"
                                value={fontFamily}
                                onChange={(e) => setFontFamily(e.target.value)}
                            >
                                {FONT_OPTIONS.map((f) => (
                                    <option key={f} value={f} style={{ fontFamily: f }}>
                                        {f === "inherit" ? t("gameSettings.fontDefault", "Default (system)") : f.replace(/'/g, "")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Background URL */}
                        <div className="col-md-6">
                            <label className="form-label">{t("gameSettings.bgUrl", "Background image URL")}</label>
                            <input
                                type="url"
                                className="form-control"
                                value={backgroundUrl}
                                onChange={(e) => setBackgroundUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div
                        className="mt-3 p-3 rounded text-center"
                        style={{
                            background: `linear-gradient(135deg, ${primaryColor}33, ${secondaryColor}33)`,
                            border: `2px solid ${primaryColor}88`,
                            fontFamily: fontFamily !== "inherit" ? fontFamily : undefined,
                            backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
                            backgroundSize: "cover",
                        }}
                    >
                        <span style={{ color: primaryColor, fontWeight: 700, fontSize: 18 }}>
                            {name || t("gameSettings.previewTitle", "Game Preview")}
                        </span>
                        <div className="text-muted small mt-1">
                            {t(`gameSettings.modes.${mode}`, mode)} · {maxRounds} {t("gameSettings.roundsLabel", "rounds")} · {timeLimit}s
                        </div>
                    </div>

                    <div className="mt-3 d-flex gap-2">
                        <Focusable id="create-game-submit">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={createMutation.isPending || !name.trim()}
                            >
                                {createMutation.isPending
                                    ? t("common.saving", "Saving...")
                                    : t("gameSettings.create", "Create Game")}
                            </button>
                        </Focusable>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => { resetForm(); setShowCreateForm(false); }}
                        >
                            {t("common.cancel", "Cancel")}
                        </button>
                    </div>
                </form>
            )}

            {/* ── Games list ── */}
            {gamesQuery.isLoading && (
                <p className="text-muted">{t("common.loading", "Loading...")}</p>
            )}

            {games.length === 0 && !gamesQuery.isLoading && (
                <p className="text-muted fst-italic">
                    {t("gameSettings.noGames", "No games yet. Create one to get started!")}
                </p>
            )}

            {games.map((game: KaraokeGame) => (
                <div key={game.id} className="card mb-2">
                    <div className="card-body py-2 px-3">
                        {editingId === game.id ? (
                            /* ── inline edit ── */
                            <div className="row g-2 align-items-end">
                                <div className="col-md-3">
                                    <label className="form-label small mb-0">{t("gameSettings.name", "Name")}</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        defaultValue={game.name}
                                        onChange={(e) =>
                                            setEditPatch((p) => ({ ...p, name: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small mb-0">{t("gameSettings.mode", "Mode")}</label>
                                    <select
                                        className="form-select form-select-sm"
                                        defaultValue={game.mode}
                                        onChange={(e) =>
                                            setEditPatch((p) => ({
                                                ...p,
                                                mode: e.target.value as KaraokeGameMode,
                                            }))
                                        }
                                    >
                                        {GAME_MODES.map((m) => (
                                            <option key={m} value={m}>
                                                {t(`gameSettings.modes.${m}`, m)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small mb-0">{t("gameSettings.maxRounds", "Rounds")}</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        min={1}
                                        max={99}
                                        defaultValue={game.maxRounds}
                                        onChange={(e) =>
                                            setEditPatch((p) => ({ ...p, maxRounds: Number(e.target.value) }))
                                        }
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small mb-0">{t("gameSettings.timeLimit", "Time")}</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        min={30}
                                        max={600}
                                        step={10}
                                        defaultValue={game.timeLimitPerRound}
                                        onChange={(e) =>
                                            setEditPatch((p) => ({
                                                ...p,
                                                timeLimitPerRound: Number(e.target.value),
                                            }))
                                        }
                                    />
                                </div>
                                <div className="col-md-3 d-flex gap-1">
                                    <button
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleUpdate(game.id)}
                                        disabled={updateMutation.isPending}
                                        aria-label={t("common.save", "Save")}
                                    >
                                        <i className="fa fa-check" aria-hidden="true" />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => { setEditingId(null); setEditPatch({}); }}
                                        aria-label={t("common.cancel", "Cancel")}
                                    >
                                        <i className="fa fa-times" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── display row ── */
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                    {game.theme?.primaryColor && (
                                        <div
                                            style={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: "50%",
                                                background: `linear-gradient(135deg, ${game.theme.primaryColor}, ${game.theme.secondaryColor ?? game.theme.primaryColor})`,
                                                border: "1px solid var(--bs-border-color)",
                                            }}
                                        />
                                    )}
                                    <i className={`fa ${MODE_ICONS[game.mode]} text-muted`} aria-hidden="true" />
                                    <strong>{game.name}</strong>
                                    {statusBadge(game.status)}
                                </div>
                                <div className="d-flex align-items-center gap-2 text-muted small">
                                    <span>
                                        {game.maxRounds} {t("gameSettings.roundsLabel", "rounds")}
                                    </span>
                                    <span>·</span>
                                    <span>{game.timeLimitPerRound}s</span>
                                    {isOrganizer && game.status === "draft" && (
                                        <>
                                            <button
                                                className="btn btn-sm btn-outline-secondary py-0 px-1"
                                                title={t("common.edit", "Edit")}
                                                aria-label={t("common.edit", "Edit")}
                                                onClick={() => setEditingId(game.id)}
                                            >
                                                <i className="fa fa-pencil" aria-hidden="true" />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger py-0 px-1"
                                                title={t("common.delete", "Delete")}
                                                aria-label={t("common.delete", "Delete")}
                                                onClick={() => handleDelete(game.id)}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <i className="fa fa-trash" aria-hidden="true" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default React.memo(GameSettingsPanel);
