import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Focusable } from "../../components/common/Focusable";
import {
    useVoiceStatusQuery,
    useScheduleQuery,
    useChatMessagesQuery,
    useReactionSummaryQuery,
    useCommentsQuery,
    useFollowStatusQuery,
    useFollowMutation,
    useUnfollowMutation,
    useSendChatMutation,
    useSendReactionMutation,
    usePostCommentMutation,
} from "../../scripts/api/apiRadio";
import { radioHub } from "../../services/radioHubService";
import type { ReactionType } from "../../models/modelsRadio";
import type { ChatMessageData } from "../../services/radioHubService";

const REACTION_EMOJIS: Record<ReactionType, string> = {
    like: "👍",
    love: "❤️",
    fire: "🔥",
    sad: "😢",
    laugh: "😂",
    clap: "👏",
    dislike: "👎",
};

const RadioPage: React.FC = () => {
    const { radioId: radioIdParam } = useParams<{ radioId: string }>();
    const radioId = Number(radioIdParam) || 0;
    const { t } = useTranslation();

    // ── State ──────────────────────────────────────────────────────
    const [chatInput, setChatInput] = useState("");
    const [commentInput, setCommentInput] = useState("");
    const [commentRating, setCommentRating] = useState<number>(0);
    const [commentPage, setCommentPage] = useState(1);
    const [liveChatMessages, setLiveChatMessages] = useState<ChatMessageData[]>([]);
    const [isVoiceLive, setIsVoiceLive] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // ── Queries ────────────────────────────────────────────────────
    const { data: voiceStatus } = useVoiceStatusQuery(radioId);
    const { data: schedule } = useScheduleQuery(radioId);
    const { data: chatMessages } = useChatMessagesQuery(radioId);
    const { data: reactionSummary } = useReactionSummaryQuery(radioId);
    const { data: commentsData } = useCommentsQuery(radioId, commentPage);
    const { data: followStatus } = useFollowStatusQuery(radioId);

    // ── Mutations ──────────────────────────────────────────────────
    const followMut = useFollowMutation(radioId);
    const unfollowMut = useUnfollowMutation(radioId);
    const chatMut = useSendChatMutation(radioId);
    const reactionMut = useSendReactionMutation(radioId);
    const commentMut = usePostCommentMutation(radioId);

    // ── SignalR ────────────────────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem("audioverse_access_token") ?? undefined;
        radioHub.connect(token);

        const unsub1 = radioHub.onVoiceLiveStarted(() => setIsVoiceLive(true));
        const unsub2 = radioHub.onVoiceLiveStopped(() => setIsVoiceLive(false));
        const unsub3 = radioHub.onChatMessageReceived((msg) => {
            setLiveChatMessages((prev) => [...prev, msg]);
        });

        return () => {
            unsub1();
            unsub2();
            unsub3();
            radioHub.disconnect();
        };
    }, [radioId]);

    useEffect(() => {
        if (voiceStatus) setIsVoiceLive(voiceStatus.isLive);
    }, [voiceStatus]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [liveChatMessages, chatMessages]);

    const handleSendChat = useCallback(() => {
        if (!chatInput.trim()) return;
        radioHub.sendChatMessage(radioId, chatInput.trim());
        chatMut.mutate({ content: chatInput.trim() });
        setChatInput("");
    }, [chatInput, radioId, chatMut]);

    const handleReaction = useCallback(
        (type: ReactionType) => {
            radioHub.sendReaction(radioId, type);
            reactionMut.mutate({ reactionType: type });
        },
        [radioId, reactionMut],
    );

    const handlePostComment = useCallback(() => {
        if (!commentInput.trim()) return;
        commentMut.mutate({
            content: commentInput.trim(),
            rating: commentRating > 0 ? commentRating : undefined,
        });
        setCommentInput("");
        setCommentRating(0);
    }, [commentInput, commentRating, commentMut]);

    if (!radioId) {
        return (
            <div className="container py-4">
                <h2>{t("radio.title", "Radio Station")}</h2>
                <p className="text-muted">{t("radio.noStation", "No radio station selected.")}</p>
            </div>
        );
    }

    const allChat = [
        ...(chatMessages ?? []).map((m) => ({
            id: m.id,
            displayName: m.displayName,
            content: m.content,
            sentAtUtc: m.sentAtUtc,
        })),
        ...liveChatMessages.map((m) => ({
            id: m.id,
            displayName: m.displayName,
            content: m.content,
            sentAtUtc: m.sentAtUtc,
        })),
    ];

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h2>📻 {t("radio.title", "Radio Station")}</h2>
                <div className="d-flex align-items-center gap-3">
                    {isVoiceLive && (
                        <span className="badge bg-danger">
                            🎙️ {t("radio.voiceLive", "LIVE")}
                        </span>
                    )}
                    <span className="text-muted">
                        {followStatus?.followersCount ?? 0} {t("radio.followers", "followers")}
                    </span>
                    <Focusable id="radio-follow-btn">
                        <button
                            className={`btn btn-sm ${followStatus?.isFollowing ? "btn-outline-secondary" : "btn-primary"}`}
                            onClick={() =>
                                followStatus?.isFollowing
                                    ? unfollowMut.mutate()
                                    : followMut.mutate()
                            }
                        >
                            {followStatus?.isFollowing
                                ? t("radio.unfollow", "Unfollow")
                                : t("radio.follow", "Follow")}
                        </button>
                    </Focusable>
                </div>
            </div>

            <div className="row g-4">
                {/* Schedule */}
                <div className="col-12 col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">📅 {t("radio.schedule", "Schedule")}</h5>
                        </div>
                        <div className="card-body p-0">
                            {(schedule ?? []).length === 0 ? (
                                <p className="text-muted p-3 mb-0">
                                    {t("radio.noSchedule", "No schedule available.")}
                                </p>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {schedule!.map((slot) => (
                                        <li key={slot.id} className="list-group-item">
                                            <div className="d-flex justify-content-between">
                                                <strong>{slot.title}</strong>
                                                <small className="text-muted">
                                                    {slot.startTime} – {slot.endTime}
                                                </small>
                                            </div>
                                            {slot.djName && (
                                                <small className="text-muted">🎧 {slot.djName}</small>
                                            )}
                                            {slot.description && (
                                                <small className="d-block text-muted">{slot.description}</small>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat */}
                <div className="col-12 col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">💬 {t("radio.chat", "Chat")}</h5>
                        </div>
                        <div
                            className="card-body"
                            style={{ height: 300, overflowY: "auto" }}
                        >
                            {allChat.map((m) => (
                                <div key={`${m.id}-${m.sentAtUtc}`} className="mb-2">
                                    <strong>{m.displayName}</strong>:{" "}
                                    <span>{m.content}</span>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="card-footer">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder={t("radio.chatPlaceholder", "Type a message...")}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                                />
                                <Focusable id="radio-chat-send-btn">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleSendChat}
                                    >
                                        {t("radio.send", "Send")}
                                    </button>
                                </Focusable>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reactions */}
                <div className="col-12 col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                🎵 {t("radio.reactions", "Song Reactions")}
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex flex-wrap gap-2 mb-3">
                                {(Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(
                                    ([type, emoji]) => (
                                        <Focusable key={type} id={`radio-reaction-${type}`}>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => handleReaction(type)}
                                                title={type}
                                            >
                                                {emoji}{" "}
                                                {reactionSummary?.[type as keyof typeof reactionSummary] ?? 0}
                                            </button>
                                        </Focusable>
                                    ),
                                )}
                            </div>
                            {reactionSummary && (
                                <small className="text-muted">
                                    {t("radio.totalReactions", "Total")}: {reactionSummary.total}
                                </small>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments & Ratings */}
            <div className="card mt-4">
                <div className="card-header">
                    <h5 className="mb-0">
                        ⭐ {t("radio.comments", "Comments & Ratings")}
                        {commentsData?.averageRating != null && (
                            <span className="ms-2 badge bg-warning text-dark">
                                {commentsData.averageRating.toFixed(1)} / 5
                            </span>
                        )}
                    </h5>
                </div>
                <div className="card-body">
                    {/* Post comment form */}
                    <div className="mb-3">
                        <div className="d-flex gap-2 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Focusable key={star} id={`radio-star-${star}`}>
                                    <button
                                        className={`btn btn-sm ${commentRating >= star ? "btn-warning" : "btn-outline-secondary"}`}
                                        onClick={() => setCommentRating(star)}
                                    >
                                        ⭐
                                    </button>
                                </Focusable>
                            ))}
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder={t("radio.commentPlaceholder", "Write a comment...")}
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                            />
                            <Focusable id="radio-post-comment-btn">
                                <button className="btn btn-primary" onClick={handlePostComment}>
                                    {t("radio.postComment", "Post")}
                                </button>
                            </Focusable>
                        </div>
                    </div>

                    {/* Comments list */}
                    {(commentsData?.items ?? []).map((c) => (
                        <div key={c.id} className="border-bottom py-2">
                            <div className="d-flex justify-content-between">
                                <strong>{c.displayName}</strong>
                                <small className="text-muted">
                                    {c.rating ? `${"⭐".repeat(c.rating)}` : ""}
                                    {" "}
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </small>
                            </div>
                            <p className="mb-0">{c.content}</p>
                        </div>
                    ))}

                    {/* Pagination */}
                    {commentsData && commentsData.totalPages > 1 && (
                        <div className="d-flex justify-content-center gap-2 mt-3">
                            <Focusable id="radio-comments-prev">
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    disabled={commentPage <= 1}
                                    onClick={() => setCommentPage((p) => p - 1)}
                                >
                                    ‹
                                </button>
                            </Focusable>
                            <span className="align-self-center">
                                {commentPage} / {commentsData.totalPages}
                            </span>
                            <Focusable id="radio-comments-next">
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    disabled={commentPage >= commentsData.totalPages}
                                    onClick={() => setCommentPage((p) => p + 1)}
                                >
                                    ›
                                </button>
                            </Focusable>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RadioPage;
