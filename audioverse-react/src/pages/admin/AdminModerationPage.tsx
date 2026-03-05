// AdminModerationPage.tsx — Admin panel for viewing & resolving abuse reports
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminReportsQuery, useResolveReportMutation } from "../../scripts/api/apiModeration";

const cardStyle: React.CSSProperties = {
    background: "var(--card-bg, #23272f)",
    border: "1px solid var(--border-color, #333)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
};

type StatusFilter = "all" | "pending" | "resolved";

const AdminModerationPage: React.FC = () => {
    const { t } = useTranslation();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
    const [resolvingId, setResolvingId] = useState<number | null>(null);
    const [moderatorComment, setModeratorComment] = useState("");

    const queryStatus = statusFilter === "all" ? undefined : statusFilter;
    const reportsQuery = useAdminReportsQuery(queryStatus);
    const resolveMut = useResolveReportMutation();

    const reports = reportsQuery.data ?? [];

    const handleResolve = (id: number, resolved: boolean) => {
        resolveMut.mutate(
            { id, request: { resolved, moderatorComment: moderatorComment.trim() || undefined } },
            { onSuccess: () => { setResolvingId(null); setModeratorComment(""); } },
        );
    };

    const filterBtnStyle = (active: boolean): React.CSSProperties => ({
        padding: "6px 14px",
        borderRadius: 6,
        border: `1px solid ${active ? "var(--accent, #5865F2)" : "var(--border-color, #555)"}`,
        background: active ? "var(--accent, #5865F2)" : "transparent",
        color: active ? "#fff" : "var(--text-primary, #ccc)",
        cursor: "pointer",
        fontSize: 13,
    });

    return (
        <div className="container mt-4" style={{ maxWidth: 1000 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>🚩 {t("admin.moderation.title", "Moderation — Reports")}</h2>

            {/* Status filter */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {(["pending", "resolved", "all"] as StatusFilter[]).map(s => (
                    <button key={s} style={filterBtnStyle(statusFilter === s)} onClick={() => setStatusFilter(s)}>
                        {s === "pending" ? t("admin.moderation.pending", "Pending")
                            : s === "resolved" ? t("admin.moderation.resolved", "Resolved")
                                : t("admin.moderation.all", "All")}
                    </button>
                ))}
                <span style={{ marginLeft: "auto", fontSize: 13, opacity: 0.5 }}>
                    {reports.length} {t("admin.moderation.results", "results")}
                </span>
            </div>

            {/* Loading */}
            {reportsQuery.isLoading && <p className="text-muted">{t("common.loading", "Loading...")}</p>}

            {/* Reports list */}
            {reports.length === 0 && !reportsQuery.isLoading && (
                <div style={{ ...cardStyle, textAlign: "center", padding: 32, opacity: 0.5 }}>
                    {t("admin.moderation.empty", "No reports to display.")}
                </div>
            )}

            {reports.map((report) => {
                const id = report.id as number | undefined;
                const targetType = (report.targetType as string) || "—";
                const targetValue = (report.targetValue as string) || "—";
                const reason = (report.reason as string) || "";
                const comment = (report.comment as string) || "";
                const resolved = report.resolved as boolean | undefined;
                const createdAt = report.createdAt as string | undefined;
                const reportedBy = (report.reportedByUserName as string) || (report.reportedByUserId as string) || "?";
                const modComment = report.moderatorComment as string | undefined;

                return (
                    <div key={id ?? Math.random()} style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                                    <span style={{
                                        padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                                        background: resolved ? "rgba(25,135,84,0.2)" : "rgba(220,53,69,0.2)",
                                        color: resolved ? "#198754" : "#dc3545",
                                    }}>
                                        {resolved ? "✅ " + t("admin.moderation.resolved", "Resolved") : "⏳ " + t("admin.moderation.pending", "Pending")}
                                    </span>
                                    <span style={{ fontSize: 12, opacity: 0.4 }}>
                                        {targetType}: <code style={{ fontSize: 12 }}>{targetValue}</code>
                                    </span>
                                </div>

                                <div style={{ fontSize: 14, marginBottom: 4 }}>
                                    <strong>{t("admin.moderation.reason", "Reason")}:</strong> {reason}
                                </div>
                                {comment && (
                                    <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>
                                        💬 {comment}
                                    </div>
                                )}
                                <div style={{ fontSize: 11, opacity: 0.4 }}>
                                    {t("admin.moderation.reportedBy", "Reported by")}: {reportedBy}
                                    {createdAt && ` · ${new Date(createdAt).toLocaleString()}`}
                                </div>
                                {modComment && (
                                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4, fontStyle: "italic" }}>
                                        🛡️ {modComment}
                                    </div>
                                )}
                            </div>

                            {/* Resolve actions */}
                            {!resolved && id != null && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {resolvingId === id ? (
                                        <>
                                            <textarea
                                                rows={2}
                                                placeholder={t("admin.moderation.modComment", "Moderator comment...")}
                                                value={moderatorComment}
                                                onChange={e => setModeratorComment(e.target.value)}
                                                style={{
                                                    width: 200, padding: "4px 8px", borderRadius: 6, fontSize: 12,
                                                    border: "1px solid var(--border-color, #555)",
                                                    background: "var(--input-bg, #1a1e24)",
                                                    color: "var(--text-primary, #eee)",
                                                }}
                                            />
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <button
                                                    onClick={() => handleResolve(id, true)}
                                                    disabled={resolveMut.isPending}
                                                    style={{
                                                        flex: 1, padding: "4px 8px", borderRadius: 6,
                                                        background: "#198754", color: "#fff",
                                                        border: "none", cursor: "pointer", fontSize: 12,
                                                    }}
                                                >
                                                    ✅ {t("admin.moderation.resolve", "Resolve")}
                                                </button>
                                                <button
                                                    onClick={() => setResolvingId(null)}
                                                    style={{
                                                        padding: "4px 8px", borderRadius: 6,
                                                        background: "transparent", color: "var(--text-primary, #ccc)",
                                                        border: "1px solid var(--border-color, #555)",
                                                        cursor: "pointer", fontSize: 12,
                                                    }}
                                                >
                                                    ✖
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setResolvingId(id)}
                                            style={{
                                                padding: "6px 14px", borderRadius: 6,
                                                background: "#198754", color: "#fff",
                                                border: "none", cursor: "pointer", fontSize: 13,
                                            }}
                                        >
                                            🛡️ {t("admin.moderation.resolve", "Resolve")}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AdminModerationPage;
