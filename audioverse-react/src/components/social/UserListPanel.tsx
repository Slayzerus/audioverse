// UserListPanel.tsx — Add to list buttons (favorites, watchlist, etc.)
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../../contexts/UserContext";
import {
    useUserListQuery,
    useAddToListMutation,
    useRemoveFromListMutation,
} from "../../scripts/api/apiSocial";
import type { EntityTypeString, ListName } from "../../models/modelsSocial";
import { ALL_LIST_NAMES, LIST_LABELS, LIST_ICONS } from "../../models/modelsSocial";

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

// ══════════════════════════════════════════════════════════════════
//  USER LIST PANEL
// ══════════════════════════════════════════════════════════════════

export interface UserListPanelProps {
    entityType: EntityTypeString;
    entityId: number;
}

const UserListPanel: React.FC<UserListPanelProps> = ({ entityType, entityId }) => {
    const { t } = useTranslation();
    const { currentUser, isAuthenticated } = useUser();
    const playerId = detectPlayerId(currentUser);

    // Fetch ALL user lists so we can highlight which ones contain this entity
    const listsQ = useUserListQuery(playerId ?? 0, undefined, entityType);
    const addMut = useAddToListMutation(playerId ?? 0);
    const removeMut = useRemoveFromListMutation(playerId ?? 0);

    const [noteFor, setNoteFor] = useState<ListName | null>(null);
    const [noteText, setNoteText] = useState("");

    /** Map of listName → entry id (if this entity is already in that list) */
    const inList = useMemo(() => {
        const map: Partial<Record<ListName, number>> = {};
        if (!listsQ.data) return map;
        for (const entry of listsQ.data) {
            if (entry.entityId === entityId && entry.entityType === entityType) {
                map[entry.listName as ListName] = entry.id;
            }
        }
        return map;
    }, [listsQ.data, entityId, entityType]);

    const toggle = (name: ListName) => {
        if (!playerId) return;
        const existingId = inList[name];
        if (existingId != null) {
            removeMut.mutate({ id: existingId });
        } else {
            addMut.mutate({ entityType, entityId, playerId, listName: name });
        }
    };

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerId || !noteFor) return;
        addMut.mutate(
            { entityType, entityId, playerId, listName: noteFor, note: noteText || undefined },
            { onSuccess: () => { setNoteFor(null); setNoteText(""); } },
        );
    };

    if (!isAuthenticated || !playerId) return null;

    return (
        <div className="mb-3">
            <h6 className="fw-bold">{t("social.lists", "My Lists")}</h6>

            <div className="d-flex flex-wrap gap-1">
                {ALL_LIST_NAMES.map((name) => {
                    const active = inList[name] != null;
                    return (
                        <button
                            key={name}
                            className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => toggle(name)}
                            disabled={addMut.isPending || removeMut.isPending}
                            title={LIST_LABELS[name]}
                        >
                            {LIST_ICONS[name]} {LIST_LABELS[name]}
                        </button>
                    );
                })}
            </div>

            {/* Optional note attachment */}
            {noteFor && (
                <form onSubmit={handleAddNote} className="mt-2 d-flex gap-1" style={{ maxWidth: 400 }}>
                    <input
                        className="form-control form-control-sm"
                        placeholder={t("social.notePlaceholder", "Add a note (optional)…")}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                    />
                    <button type="submit" className="btn btn-sm btn-success">
                        {t("common.save", "Save")}
                    </button>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setNoteFor(null)}>
                        ✕
                    </button>
                </form>
            )}

            {listsQ.isLoading && <div className="text-muted small">{t("common.loading", "Loading…")}</div>}
        </div>
    );
};

export default UserListPanel;
