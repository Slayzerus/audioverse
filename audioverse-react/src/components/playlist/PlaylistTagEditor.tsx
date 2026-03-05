// PlaylistTagEditor.tsx — Tag CRUD, color picker, bulk tag assignment
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { PlaylistTag, PlaylistTrack } from "../../models/modelsPlaylistManager";

// ══════════════════════════════════════════════════════════════
// Props
// ══════════════════════════════════════════════════════════════

export interface PlaylistTagEditorProps {
    tags: PlaylistTag[];
    onCreateTag: (name: string, color: string, icon?: string) => void;
    onUpdateTag: (id: string, name: string, color: string, icon?: string) => void;
    onDeleteTag: (id: string) => void;
    /** Selected tracks to bulk-assign tags */
    selectedTracks?: PlaylistTrack[];
    onAssignTag?: (trackIds: string[], tagId: string) => void;
    onUnassignTag?: (trackIds: string[], tagId: string) => void;
}

// ══════════════════════════════════════════════════════════════
// Preset palette
// ══════════════════════════════════════════════════════════════

const PALETTE = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
    "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
    "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
    "#78716c", "#64748b", "#000000",
];

const ICONS = ["🎵", "🎸", "🎹", "🎤", "🎧", "🥁", "🎷", "🎺", "❤️", "⭐", "🔥", "💎", "🌙", "☀️", "🌊", "🎯"];

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════

const PlaylistTagEditor: React.FC<PlaylistTagEditorProps> = ({
    tags,
    onCreateTag,
    onUpdateTag,
    onDeleteTag,
    selectedTracks,
    onAssignTag,
    onUnassignTag,
}) => {
    const { t } = useTranslation();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState(PALETTE[8]);
    const [newIcon, setNewIcon] = useState(ICONS[0]);
    const [showCreate, setShowCreate] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Edit state
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("");
    const [editIcon, setEditIcon] = useState("");

    const startEdit = useCallback((tag: PlaylistTag) => {
        setEditingId(tag.id);
        setEditName(tag.name);
        setEditColor(tag.color);
        setEditIcon(tag.icon || ICONS[0]);
    }, []);

    const saveEdit = useCallback(() => {
        if (editingId && editName.trim()) {
            onUpdateTag(editingId, editName.trim(), editColor, editIcon);
            setEditingId(null);
        }
    }, [editingId, editName, editColor, editIcon, onUpdateTag]);

    const handleCreate = useCallback(() => {
        if (newName.trim()) {
            onCreateTag(newName.trim(), newColor, newIcon);
            setNewName("");
            setShowCreate(false);
        }
    }, [newName, newColor, newIcon, onCreateTag]);

    const handleDelete = useCallback(
        (id: string) => {
            if (confirmDeleteId === id) {
                onDeleteTag(id);
                setConfirmDeleteId(null);
            } else {
                setConfirmDeleteId(id);
                setTimeout(() => setConfirmDeleteId(null), 3000);
            }
        },
        [confirmDeleteId, onDeleteTag],
    );

    const hasSelectedTracks = selectedTracks && selectedTracks.length > 0;

    const isTagAppliedToAll = (tagId: string) => {
        if (!selectedTracks || selectedTracks.length === 0) return false;
        return selectedTracks.every((tr) => tr.tags.includes(tagId));
    };

    const isTagAppliedToSome = (tagId: string) => {
        if (!selectedTracks || selectedTracks.length === 0) return false;
        return selectedTracks.some((tr) => tr.tags.includes(tagId)) && !isTagAppliedToAll(tagId);
    };

    return (
        <div
            style={{
                border: "1px solid var(--border-color, #e5e7eb)",
                borderRadius: 10,
                background: "var(--card-bg, #fff)",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border-color, #e5e7eb)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--surface-bg, #f9fafb)",
                }}
            >
                <span style={{ fontSize: "1rem" }}>🏷️</span>
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{t("playlistManager.tagManager")}</span>
                <div style={{ flex: 1 }} />
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    style={{
                        background: "var(--accent, #3b82f6)",
                        color: "var(--btn-text, #fff)",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                    }}
                >
                    + {t("playlistManager.newTag")}
                </button>
            </div>

            <div style={{ padding: 12 }}>
                {/* Create form */}
                {showCreate && (
                    <div
                        style={{
                            border: "1px solid var(--border-color, #d1d5db)",
                            borderRadius: 8,
                            padding: 10,
                            marginBottom: 12,
                            background: "var(--surface-bg, #f9fafb)",
                        }}
                    >
                        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t("playlistManager.tagName")}
                                style={{
                                    flex: 1,
                                    padding: "5px 10px",
                                    borderRadius: 6,
                                    border: "1px solid var(--border-color, #d1d5db)",
                                    fontSize: "0.8rem",
                                    background: "var(--input-bg, #fff)",
                                    color: "var(--text-primary, #1f2937)",
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            />
                            <button
                                onClick={handleCreate}
                                disabled={!newName.trim()}
                                style={{
                                    background: "var(--accent, #3b82f6)",
                                                color: "var(--btn-text, #fff)",
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "5px 12px",
                                    fontSize: "0.78rem",
                                    cursor: "pointer",
                                    opacity: newName.trim() ? 1 : 0.5,
                                }}
                            >
                                ✓
                            </button>
                        </div>

                        {/* Color picker */}
                        <div style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: "0.68rem", opacity: 0.6, marginBottom: 4 }}>{t("playlistManager.color")}</div>
                            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                {PALETTE.map((c) => (
                                    <div
                                        key={c}
                                        onClick={() => setNewColor(c)}
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: "50%",
                                            background: c,
                                            cursor: "pointer",
                                            border: newColor === c ? "3px solid var(--accent, #3b82f6)" : "2px solid transparent",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Icon picker */}
                        <div>
                            <div style={{ fontSize: "0.68rem", opacity: 0.6, marginBottom: 4 }}>{t("playlistManager.icon")}</div>
                            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                {ICONS.map((icon) => (
                                    <div
                                        key={icon}
                                        onClick={() => setNewIcon(icon)}
                                        style={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: 4,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                            background: newIcon === icon ? "var(--accent-bg, #eff6ff)" : "transparent",
                                            border: newIcon === icon ? "1px solid var(--accent, #3b82f6)" : "1px solid transparent",
                                        }}
                                    >
                                        {icon}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk assign hint */}
                {hasSelectedTracks && (
                    <div
                        style={{
                            padding: "6px 10px",
                            background: "var(--accent-bg, #eff6ff)",
                            borderRadius: 6,
                            marginBottom: 8,
                            fontSize: "0.72rem",
                            color: "var(--accent, #3b82f6)",
                        }}
                    >
                        {t("playlistManager.bulkTagHint", { count: selectedTracks.length })}
                    </div>
                )}

                {/* Tag list */}
                {tags.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 20, opacity: 0.3, fontSize: "0.82rem" }}>{t("playlistManager.noTags")}</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {tags.map((tag) => (
                            <div
                                key={tag.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "6px 10px",
                                    borderRadius: 8,
                                    border: "1px solid var(--border-color, #e5e7eb)",
                                    background: editingId === tag.id ? "var(--surface-bg, #f9fafb)" : "transparent",
                                }}
                            >
                                {editingId === tag.id ? (
                                    <>
                                        <select
                                            value={editIcon}
                                            onChange={(e) => setEditIcon(e.target.value)}
                                            style={{ border: "none", background: "transparent", fontSize: "0.9rem", cursor: "pointer" }}
                                        >
                                            {ICONS.map((i) => (
                                                <option key={i} value={i}>
                                                    {i}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="color"
                                            value={editColor}
                                            onChange={(e) => setEditColor(e.target.value)}
                                            style={{ width: 24, height: 24, border: "none", cursor: "pointer", padding: 0 }}
                                        />
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: "3px 8px",
                                                borderRadius: 4,
                                                border: "1px solid var(--border-color, #d1d5db)",
                                                fontSize: "0.78rem",
                                                background: "var(--input-bg, #fff)",
                                                color: "var(--text-primary, #1f2937)",
                                            }}
                                            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                                        />
                                        <button onClick={saveEdit} style={tinyBtn("var(--accent, #3b82f6)")}>
                                            ✓
                                        </button>
                                        <button onClick={() => setEditingId(null)} style={tinyBtn("var(--text-secondary, #9ca3af)")}>
                                            ✕
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {/* Tag pill */}
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                                padding: "2px 10px",
                                                borderRadius: 20,
                                                background: `${tag.color}18`,
                                                color: tag.color,
                                                fontWeight: 600,
                                                fontSize: "0.78rem",
                                            }}
                                        >
                                            {tag.icon && <span>{tag.icon}</span>}
                                            {tag.name}
                                        </span>

                                        {/* Bulk assign checkbox */}
                                        {hasSelectedTracks && onAssignTag && onUnassignTag && (
                                            <input
                                                type="checkbox"
                                                checked={isTagAppliedToAll(tag.id)}
                                                ref={(el) => {
                                                    if (el) el.indeterminate = isTagAppliedToSome(tag.id);
                                                }}
                                                onChange={() => {
                                                    const trackIds = selectedTracks.map((t) => t.id);
                                                    if (isTagAppliedToAll(tag.id)) {
                                                        onUnassignTag(trackIds, tag.id);
                                                    } else {
                                                        onAssignTag(trackIds, tag.id);
                                                    }
                                                }}
                                                style={{ cursor: "pointer" }}
                                            />
                                        )}

                                        <div style={{ flex: 1 }} />
                                        <button onClick={() => startEdit(tag)} style={tinyBtn("var(--text-secondary, #9ca3af)")} title={t("playlistManager.editTag")}>
                                            ✏
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tag.id)}
                                            style={tinyBtn(confirmDeleteId === tag.id ? "var(--error, #ef4444)" : "var(--text-secondary, #9ca3af)")}
                                            title={confirmDeleteId === tag.id ? t("playlistManager.confirmDelete") : t("playlistManager.deleteTag")}
                                        >
                                            {confirmDeleteId === tag.id ? "⚠" : "🗑"}
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const tinyBtn = (color: string): React.CSSProperties => ({
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.82rem",
    color,
    padding: "2px 4px",
});

export default PlaylistTagEditor;
