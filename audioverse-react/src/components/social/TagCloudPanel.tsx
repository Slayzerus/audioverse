// TagCloudPanel.tsx — Tag cloud display + add tag input
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../../contexts/UserContext";
import {
    useTagCloudQuery,
    useAddTagMutation,
} from "../../scripts/api/apiSocial";
import type { EntityTypeString } from "../../models/modelsSocial";

// ── helpers ────────────────────────────────────────────────────────

const detectPlayerId = (user: unknown): number | undefined => {
    if (!user) return undefined;
    const u = user as Record<string, unknown>;
    const pid =
        (u.userProfileId as number) ??
        (u.profileId as number) ??
        ((u.userProfile as { id?: number })?.id) ??
        ((u.profile as { id?: number })?.id) ??
        (u.userId as number);
    return typeof pid === "number" ? pid : undefined;
};

/** Scale font size from 0.75rem to 1.6rem based on count relative to max */
const tagFontSize = (count: number, maxCount: number): string => {
    const min = 0.75;
    const max = 1.6;
    if (maxCount <= 1) return `${max}rem`;
    const ratio = (count - 1) / (maxCount - 1);
    return `${(min + ratio * (max - min)).toFixed(2)}rem`;
};

// ══════════════════════════════════════════════════════════════════
//  TAG CLOUD PANEL
// ══════════════════════════════════════════════════════════════════

export interface TagCloudPanelProps {
    entityType: EntityTypeString;
    entityId: number;
}

const TagCloudPanel: React.FC<TagCloudPanelProps> = ({ entityType, entityId }) => {
    const { t } = useTranslation();
    const { currentUser, isAuthenticated } = useUser();
    const playerId = detectPlayerId(currentUser);

    const cloudQ = useTagCloudQuery(entityType, entityId);
    const addMut = useAddTagMutation(entityType, entityId);

    const [input, setInput] = useState("");

    const maxCount = cloudQ.data
        ? Math.max(...cloudQ.data.map((e) => e.count), 1)
        : 1;

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const tag = input.trim().toLowerCase();
        if (!playerId || !tag) return;
        addMut.mutate(
            { entityType, entityId, playerId, tag },
            { onSuccess: () => setInput("") },
        );
    };

    return (
        <div className="mb-3">
            <h6 className="fw-bold">{t("social.tags", "Tags")}</h6>

            {/* Cloud */}
            {cloudQ.data && cloudQ.data.length > 0 ? (
                <div className="d-flex flex-wrap gap-2 mb-2">
                    {cloudQ.data.map((entry) => (
                        <span
                            key={entry.tag}
                            className="badge"
                            style={{
                                fontSize: tagFontSize(entry.count, maxCount),
                                background: "var(--bg-secondary, #2a2a2a)",
                                color: "var(--text-primary, #fff)",
                                border: "1px solid var(--accent-primary, #6c757d)",
                                cursor: "default",
                                fontWeight: 400,
                            }}
                            title={`${entry.count}×`}
                        >
                            {entry.tag}
                            <span className="ms-1 text-muted" style={{ fontSize: "0.7rem" }}>
                                {entry.count}
                            </span>
                        </span>
                    ))}
                </div>
            ) : (
                !cloudQ.isLoading && (
                    <p className="text-muted small">{t("social.noTags", "No tags yet.")}</p>
                )
            )}

            {/* Add tag input */}
            {isAuthenticated && playerId && (
                <form onSubmit={handleAdd} className="d-flex gap-1" style={{ maxWidth: 320 }}>
                    <input
                        className="form-control form-control-sm"
                        type="text"
                        maxLength={50}
                        placeholder={t("social.addTag", "Add a tag…")}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="btn btn-sm btn-outline-primary"
                        disabled={!input.trim() || addMut.isPending}
                        aria-label="Add tag"
                    >
                        +
                    </button>
                </form>
            )}

            {cloudQ.isLoading && <div className="text-muted small">{t("common.loading", "Loading…")}</div>}
        </div>
    );
};

export default TagCloudPanel;
