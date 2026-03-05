// NotificationBell.tsx — Notification bell icon + dropdown panel (Navbar integration)
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    useNotificationsQuery,
    useUnreadCountQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation,
} from "../../scripts/api/apiNotifications";

const NOTIF_TYPE_LABELS: Record<number, string> = {
    0: "📢", // General
    1: "🎉", // EventInvite
    2: "📅", // EventUpdate
    3: "🎤", // KaraokeScore
    4: "📊", // PollCreated
    5: "💬", // CommentReply
    6: "⚠️", // SystemAlert
};

const NotificationBell: React.FC = React.memo(function NotificationBell() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const { data: unreadCount = 0 } = useUnreadCountQuery();
    const { data: notifications = [], isLoading } = useNotificationsQuery(false, {
        enabled: open,
    });
    const markReadMut = useMarkAsReadMutation();
    const markAllReadMut = useMarkAllAsReadMutation();
    const deleteMut = useDeleteNotificationMutation();

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleMarkRead = useCallback(
        (id: number) => markReadMut.mutate(id),
        [markReadMut],
    );

    const handleMarkAllRead = useCallback(
        () => markAllReadMut.mutate(),
        [markAllReadMut],
    );

    const handleDelete = useCallback(
        (id: number) => deleteMut.mutate(id),
        [deleteMut],
    );

    const formatDate = (iso?: string) => {
        if (!iso) return "";
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60_000);
        if (diffMin < 1) return t("notifications.justNow", "just now");
        if (diffMin < 60) return `${diffMin}m`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH}h`;
        return d.toLocaleDateString();
    };

    return (
        <div ref={panelRef} style={{ position: "relative", display: "inline-block" }}>
            {/* Bell button */}
            <button
                onClick={() => setOpen((v) => !v)}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.3rem",
                    position: "relative",
                    padding: "4px 8px",
                }}
                title={t("notifications.title", "Notifications")}
            >
                <i className="fa-solid fa-bell" />
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            backgroundColor: "#dc3545",
                            color: "#fff",
                            borderRadius: "50%",
                            fontSize: "0.65rem",
                            padding: "1px 5px",
                            fontWeight: "bold",
                            lineHeight: "1.3",
                        }}
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        width: "340px",
                        maxHeight: "440px",
                        overflowY: "auto",
                        backgroundColor: "var(--bs-body-bg, #fff)",
                        border: "1px solid var(--bs-border-color, #dee2e6)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                        zIndex: 9999,
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--bs-border-color, #dee2e6)",
                        }}
                    >
                        <strong>{t("notifications.title", "Notifications")}</strong>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={markAllReadMut.isPending}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
                                    color: "#0d6efd",
                                    textDecoration: "underline",
                                }}
                            >
                                {t("notifications.markAllRead", "Mark all as read")}
                            </button>
                        )}
                    </div>

                    {/* List */}
                    {isLoading ? (
                        <div style={{ padding: "20px", textAlign: "center", opacity: 0.6 }}>
                            {t("common.loading", "Loading...")}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", opacity: 0.6 }}>
                            {t("notifications.empty", "No notifications")}
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    padding: "10px 14px",
                                    borderBottom: "1px solid var(--bs-border-color, #eee)",
                                    backgroundColor: n.isRead ? "transparent" : "var(--bs-info-bg-subtle, #e8f4fd)",
                                    cursor: "pointer",
                                }}
                                onClick={() => !n.isRead && handleMarkRead(n.id)}
                            >
                                <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>
                                    {NOTIF_TYPE_LABELS[n.type as number] ?? "📢"}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: n.isRead ? "normal" : "600", fontSize: "0.9rem" }}>
                                        {n.title}
                                    </div>
                                    {n.body && (
                                        <div style={{ fontSize: "0.82rem", opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {n.body}
                                        </div>
                                    )}
                                    <div style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "2px" }}>
                                        {formatDate(n.createdAt)}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(n.id);
                                    }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "0.85rem",
                                        opacity: 0.5,
                                        alignSelf: "flex-start",
                                    }}
                                    title={t("notifications.delete", "Delete")}
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
});
NotificationBell.displayName = "NotificationBell";

export default NotificationBell;
