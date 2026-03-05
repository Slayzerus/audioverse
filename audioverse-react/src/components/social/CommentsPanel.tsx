// CommentsPanel.tsx — Threaded comments with reactions
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../../contexts/UserContext";
import {
    useCommentsQuery,
    useAddCommentMutation,
    useUpdateCommentMutation,
    useDeleteCommentMutation,
    useToggleReactionMutation,
} from "../../scripts/api/apiSocial";
import type { EntityTypeString, CommentDto } from "../../models/modelsSocial";
import { ALL_REACTIONS, REACTION_EMOJI } from "../../models/modelsSocial";
import PaginationControls from "../ui/PaginationControls";

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

const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
};

// ══════════════════════════════════════════════════════════════════
//  Single Comment (recursive for threading)
// ══════════════════════════════════════════════════════════════════

interface CommentNodeProps {
    c: CommentDto;
    entityType: EntityTypeString;
    entityId: number;
    playerId?: number;
    depth?: number;
}

const CommentNode: React.FC<CommentNodeProps> = ({
    c,
    entityType,
    entityId,
    playerId,
    depth = 0,
}) => {
    const { t } = useTranslation();
    const { isAuthenticated } = useUser();
    const [replying, setReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(c.content);
    const [spoilerOpen, setSpoilerOpen] = useState(false);

    const addMut = useAddCommentMutation(entityType, entityId);
    const updateMut = useUpdateCommentMutation(entityType, entityId);
    const deleteMut = useDeleteCommentMutation(entityType, entityId);
    const reactionMut = useToggleReactionMutation(entityType, entityId);

    const isOwn = playerId != null && c.playerId === playerId;
    const maxDepth = 4;

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerId || !replyText.trim()) return;
        addMut.mutate(
            { entityType, entityId, playerId, content: replyText.trim(), parentCommentId: c.id },
            {
                onSuccess: () => {
                    setReplyText("");
                    setReplying(false);
                },
            },
        );
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerId || !editText.trim()) return;
        updateMut.mutate(
            { id: c.id, playerId, content: editText.trim() },
            { onSuccess: () => setEditing(false) },
        );
    };

    const handleDelete = () => {
        if (!playerId) return;
        deleteMut.mutate({ id: c.id, playerId });
    };

    const handleReaction = (reaction: string) => {
        if (!playerId) return;
        reactionMut.mutate({ commentId: c.id, playerId, reaction });
    };

    return (
        <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
            <div
                className="border-start ps-2 mb-2"
                style={{ borderColor: "var(--accent-primary, #6c757d) !important" }}
            >
                {/* Header */}
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold small">{c.playerName ?? `Player ${c.playerId}`}</span>
                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {timeAgo(c.createdAtUtc)}
                    </span>
                    {c.isEdited && (
                        <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                            ({t("social.edited", "edited")})
                        </span>
                    )}
                </div>

                {/* Body */}
                {editing ? (
                    <form onSubmit={handleEdit} className="mt-1">
                        <textarea
                            className="form-control form-control-sm"
                            rows={2}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className="d-flex gap-1 mt-1">
                            <button type="submit" className="btn btn-sm btn-success py-0 px-2" disabled={updateMut.isPending}>
                                {t("common.save", "Save")}
                            </button>
                            <button type="button" className="btn btn-sm btn-secondary py-0 px-2" onClick={() => setEditing(false)}>
                                {t("common.cancel", "Cancel")}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="small mt-1">
                        {c.containsSpoilers && !spoilerOpen ? (
                            <button className="btn btn-sm btn-outline-warning py-0" onClick={() => setSpoilerOpen(true)}>
                                {t("social.showSpoiler", "Show spoiler")}
                            </button>
                        ) : (
                            <span style={{ whiteSpace: "pre-wrap" }}>{c.content}</span>
                        )}
                    </div>
                )}

                {/* Reactions */}
                <div className="d-flex align-items-center gap-1 mt-1 flex-wrap">
                    {c.reactions
                        .filter((r) => r.count > 0)
                        .map((r) => (
                            <button
                                key={r.type}
                                className="btn btn-sm btn-outline-secondary py-0 px-1"
                                style={{ fontSize: "0.8rem" }}
                                onClick={() => handleReaction(r.type)}
                                disabled={!isAuthenticated}
                            >
                                {REACTION_EMOJI[r.type as keyof typeof REACTION_EMOJI] ?? r.type} {r.count}
                            </button>
                        ))}

                    {/* Add reaction picker */}
                    {isAuthenticated && playerId && (
                        <div className="dropdown">
                            <button
                                className="btn btn-sm btn-outline-secondary py-0 px-1 dropdown-toggle"
                                style={{ fontSize: "0.8rem" }}
                                data-bs-toggle="dropdown"
                                aria-label="Add reaction"
                            >
                                +
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: "auto" }}>
                                {ALL_REACTIONS.map((r) => (
                                    <li key={r}>
                                        <button className="dropdown-item py-0" onClick={() => handleReaction(r)}>
                                            {REACTION_EMOJI[r]} {r}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!editing && (
                    <div className="d-flex gap-2 mt-1">
                        {isAuthenticated && playerId && depth < maxDepth && (
                            <button
                                className="btn btn-sm btn-link text-muted p-0"
                                style={{ fontSize: "0.75rem" }}
                                onClick={() => setReplying(!replying)}
                            >
                                {t("social.reply", "Reply")}
                            </button>
                        )}
                        {isOwn && (
                            <>
                                <button
                                    className="btn btn-sm btn-link text-muted p-0"
                                    style={{ fontSize: "0.75rem" }}
                                    onClick={() => {
                                        setEditText(c.content);
                                        setEditing(true);
                                    }}
                                >
                                    {t("common.edit", "Edit")}
                                </button>
                                <button
                                    className="btn btn-sm btn-link text-danger p-0"
                                    style={{ fontSize: "0.75rem" }}
                                    onClick={handleDelete}
                                >
                                    {t("common.delete", "Delete")}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Reply form */}
                {replying && (
                    <form onSubmit={handleReply} className="mt-1">
                        <textarea
                            className="form-control form-control-sm"
                            rows={2}
                            placeholder={t("social.replyPlaceholder", "Write a reply…")}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="d-flex gap-1 mt-1">
                            <button type="submit" className="btn btn-sm btn-primary py-0 px-2" disabled={addMut.isPending}>
                                {t("social.postReply", "Post reply")}
                            </button>
                            <button type="button" className="btn btn-sm btn-secondary py-0 px-2" onClick={() => setReplying(false)}>
                                {t("common.cancel", "Cancel")}
                            </button>
                        </div>
                    </form>
                )}

                {/* Children */}
                {c.replies && c.replies.length > 0 && (
                    <div className="mt-1">
                        {c.replies.map((child) => (
                            <CommentNode
                                key={child.id}
                                c={child}
                                entityType={entityType}
                                entityId={entityId}
                                playerId={playerId}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════
//  COMMENTS PANEL (main)
// ══════════════════════════════════════════════════════════════════

export interface CommentsPanelProps {
    entityType: EntityTypeString;
    entityId: number;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ entityType, entityId }) => {
    const { t } = useTranslation();
    const { currentUser, isAuthenticated } = useUser();
    const playerId = detectPlayerId(currentUser);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const commentsQ = useCommentsQuery(entityType, entityId, page, pageSize);
    const addMut = useAddCommentMutation(entityType, entityId);

    const [newComment, setNewComment] = useState("");
    const [spoiler, setSpoiler] = useState(false);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerId || !newComment.trim()) return;
        addMut.mutate(
            {
                entityType,
                entityId,
                playerId,
                content: newComment.trim(),
                containsSpoilers: spoiler,
            },
            {
                onSuccess: () => {
                    setNewComment("");
                    setSpoiler(false);
                },
            },
        );
    };

    return (
        <div className="mb-3">
            <h6 className="fw-bold">{t("social.comments", "Comments")}</h6>

            {/* New comment form */}
            {isAuthenticated && playerId && (
                <form onSubmit={handleAdd} className="mb-3">
                    <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        placeholder={t("social.commentPlaceholder", "Add a comment…")}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="d-flex align-items-center gap-2 mt-1">
                        <div className="form-check mb-0">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="comment-spoiler"
                                checked={spoiler}
                                onChange={(e) => setSpoiler(e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor="comment-spoiler">
                                {t("social.containsSpoilers", "Contains spoilers")}
                            </label>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-sm btn-primary ms-auto"
                            disabled={!newComment.trim() || addMut.isPending}
                        >
                            {t("social.postComment", "Post")}
                        </button>
                    </div>
                </form>
            )}

            {/* Comment list */}
            {commentsQ.data && commentsQ.data.items.length > 0 && (
                <>
                    {commentsQ.data.items.map((c) => (
                        <CommentNode
                            key={c.id}
                            c={c}
                            entityType={entityType}
                            entityId={entityId}
                            playerId={playerId}
                        />
                    ))}
                    <PaginationControls
                        page={page}
                        pageSize={pageSize}
                        total={commentsQ.data.totalCount}
                        onPageChange={setPage}
                        onPageSizeChange={(s) => {
                            setPageSize(s);
                            setPage(1);
                        }}
                    />
                </>
            )}

            {commentsQ.data && commentsQ.data.items.length === 0 && (
                <p className="text-muted small">{t("social.noComments", "No comments yet.")}</p>
            )}

            {commentsQ.isLoading && <div className="text-muted small">{t("common.loading", "Loading…")}</div>}
        </div>
    );
};

export default CommentsPanel;
