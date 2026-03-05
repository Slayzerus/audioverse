// EventCommentsPanel.tsx — Comment wall for an event with threading & reactions
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    useEventCommentsQuery,
    usePostEventCommentMutation,
    useDeleteEventCommentMutation,
    useToggleCommentReactionMutation,
} from "../../../scripts/api/apiEventComments";
import type { EventComment } from "../../../models/modelsKaraoke";

interface Props {
    eventId: number;
}

const EventCommentsPanel: React.FC<Props> = ({ eventId }) => {
    const { t } = useTranslation();
    const { data: commentsResponse, isLoading } = useEventCommentsQuery(eventId);
    const comments = commentsResponse?.items ?? [];
    const postMutation = usePostEventCommentMutation(eventId);
    const deleteMutation = useDeleteEventCommentMutation(eventId);
    const reactMutation = useToggleCommentReactionMutation(eventId);

    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState<number | null>(null);

    const handlePost = useCallback(() => {
        const text = newComment.trim();
        if (!text) return;
        postMutation.mutate(
            { text, parentCommentId: replyTo ?? undefined },
            {
                onSuccess: () => {
                    setNewComment("");
                    setReplyTo(null);
                },
            },
        );
    }, [newComment, replyTo, postMutation]);

    const handleDelete = useCallback(
        (commentId: number) => {
            if (window.confirm(t("eventComments.confirmDelete", "Delete this comment?"))) {
                deleteMutation.mutate(commentId);
            }
        },
        [deleteMutation, t],
    );

    const handleReact = useCallback(
        (commentId: number, emoji: string) => {
            reactMutation.mutate({ commentId, emoji });
        },
        [reactMutation],
    );

    const formatDate = (iso?: string) => {
        if (!iso) return "";
        return new Date(iso).toLocaleString();
    };

    // Separate root comments and replies
    const rootComments = comments.filter((c) => !c.parentId);

    const getReplies = (parentId: number) =>
        comments.filter((c) => c.parentId === parentId);

    const commentStyle: React.CSSProperties = {
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: "var(--bs-body-bg, #f8f9fa)",
        border: "1px solid var(--bs-border-color, #dee2e6)",
        marginBottom: "8px",
    };

    const replyStyle: React.CSSProperties = {
        ...commentStyle,
        marginLeft: "24px",
        backgroundColor: "var(--bs-tertiary-bg, #f0f0f0)",
    };

    const renderComment = (comment: EventComment, isReply = false) => (
        <div key={comment.id} style={isReply ? replyStyle : commentStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <strong style={{ fontSize: "0.9rem" }}>
                    {comment.userId ? `User #${comment.userId}` : t("eventComments.anonymous", "Anonymous")}
                </strong>
                <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                    {formatDate(comment.createdAt)}
                </span>
            </div>
            <p style={{ margin: "4px 0 8px" }}>{comment.text}</p>
            <div style={{ display: "flex", gap: "8px", fontSize: "0.85rem" }}>
                <button
                    onClick={() => handleReact(comment.id, "👍")}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                    👍
                </button>
                <button
                    onClick={() => handleReact(comment.id, "❤️")}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                    ❤️
                </button>
                {!isReply && (
                    <button
                        onClick={() => setReplyTo(comment.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                        {t("eventComments.reply", "Reply")}
                    </button>
                )}
                <button
                    onClick={() => handleDelete(comment.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", color: "#dc3545" }}
                >
                    {t("eventComments.delete", "Delete")}
                </button>
            </div>
            {/* Nested replies */}
            {!isReply && getReplies(comment.id).map((reply) => renderComment(reply, true))}
        </div>
    );

    return (
        <div style={{ padding: "16px" }}>
            <h5>💬 {t("eventComments.title", "Comments")}</h5>

            {/* Post area */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                    {replyTo && (
                        <div style={{ fontSize: "0.85rem", marginBottom: "4px", opacity: 0.7 }}>
                            {t("eventComments.replyingTo", "Replying to comment")} #{replyTo}{" "}
                            <button
                                onClick={() => setReplyTo(null)}
                                style={{ background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                            >
                                {t("eventComments.cancel", "Cancel")}
                            </button>
                        </div>
                    )}
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t("eventComments.placeholder", "Write a comment...")}
                        rows={2}
                        style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            resize: "vertical",
                        }}
                    />
                </div>
                <button
                    onClick={handlePost}
                    disabled={postMutation.isPending || !newComment.trim()}
                    style={{
                        padding: "8px 20px",
                        borderRadius: "6px",
                        backgroundColor: "#0d6efd",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        alignSelf: "flex-end",
                    }}
                >
                    {postMutation.isPending
                        ? t("eventComments.posting", "Posting...")
                        : t("eventComments.post", "Post")}
                </button>
            </div>

            {/* Comments list */}
            {isLoading ? (
                <p>{t("common.loading", "Loading...")}</p>
            ) : rootComments.length === 0 ? (
                <p style={{ opacity: 0.6 }}>
                    {t("eventComments.empty", "No comments yet. Start the conversation!")}
                </p>
            ) : (
                rootComments.map((c) => renderComment(c))
            )}
        </div>
    );
};

export default React.memo(EventCommentsPanel);
