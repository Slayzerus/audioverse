// ReportButton.tsx — Universal "Report" button for any content
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAbuseReportMutation } from "../../scripts/api/apiModeration";

interface ReportButtonProps {
    /** Content type being reported (e.g. "photo", "video", "comment", "user") */
    targetType: string;
    /** Identifier of the reported content */
    targetValue: string;
    /** Optional display variant — "icon" for icon-only, "text" for full button */
    variant?: "icon" | "text";
}

const REASON_OPTIONS = [
    { key: "spam", labelKey: "report.reason.spam", labelDefault: "Spam" },
    { key: "offensive", labelKey: "report.reason.offensive", labelDefault: "Offensive content" },
    { key: "harassment", labelKey: "report.reason.harassment", labelDefault: "Harassment" },
    { key: "inappropriate", labelKey: "report.reason.inappropriate", labelDefault: "Inappropriate content" },
    { key: "other", labelKey: "report.reason.other", labelDefault: "Other" },
];

const ReportButton: React.FC<ReportButtonProps> = ({ targetType, targetValue, variant = "icon" }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [comment, setComment] = useState("");
    const [sent, setSent] = useState(false);
    const reportMut = useAbuseReportMutation();

    const handleSubmit = useCallback(() => {
        if (!reason) return;
        reportMut.mutate(
            { targetType, targetValue, reason, comment: comment.trim() || undefined },
            {
                onSuccess: () => {
                    setSent(true);
                    setTimeout(() => { setOpen(false); setSent(false); setReason(""); setComment(""); }, 1500);
                },
            },
        );
    }, [reason, comment, targetType, targetValue, reportMut]);

    return (
        <>
            {variant === "icon" ? (
                <button
                    onClick={() => setOpen(true)}
                    title={t("report.title", "Report")}
                    style={{
                        background: "transparent", border: "none", cursor: "pointer",
                        color: "var(--text-secondary, #999)", fontSize: 16, padding: "2px 6px",
                    }}
                >
                    🚩
                </button>
            ) : (
                <button
                    onClick={() => setOpen(true)}
                    className="btn btn-outline-danger btn-sm"
                >
                    🚩 {t("report.title", "Report")}
                </button>
            )}

            {open && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 10000,
                        background: "rgba(0,0,0,0.6)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                    }}
                    onClick={() => { setOpen(false); setSent(false); }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: "var(--card-bg, #23272f)", borderRadius: 12,
                            padding: 24, maxWidth: 400, width: "90vw",
                            border: "1px solid var(--border-color, #444)",
                            color: "var(--text-primary, #eee)",
                        }}
                    >
                        {sent ? (
                            <div style={{ textAlign: "center", padding: 20 }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                                <p>{t("report.sent", "Report sent. Thank you!")}</p>
                            </div>
                        ) : (
                            <>
                                <h5 style={{ marginBottom: 12 }}>🚩 {t("report.title", "Report")}</h5>
                                <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
                                    {t("report.subtitle", "Choose a reason for reporting:")}
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                                    {REASON_OPTIONS.map(opt => (
                                        <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                                            <input
                                                type="radio"
                                                name="report-reason"
                                                checked={reason === opt.key}
                                                onChange={() => setReason(opt.key)}
                                            />
                                            {t(opt.labelKey, opt.labelDefault)}
                                        </label>
                                    ))}
                                </div>

                                <textarea
                                    placeholder={t("report.commentPlaceholder", "Additional comment (optional)...")}
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    rows={3}
                                    style={{
                                        width: "100%", padding: "8px 10px", borderRadius: 6,
                                        border: "1px solid var(--border-color, #555)",
                                        background: "var(--input-bg, #1a1e24)", color: "var(--text-primary, #eee)",
                                        fontSize: 13, resize: "vertical",
                                    }}
                                />

                                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!reason || reportMut.isPending}
                                        style={{
                                            flex: 1, padding: "8px 16px", borderRadius: 6,
                                            background: !reason ? "#555" : "#dc3545", color: "#fff",
                                            border: "none", cursor: reason ? "pointer" : "not-allowed", fontSize: 14,
                                        }}
                                    >
                                        {reportMut.isPending
                                            ? t("common.sending", "Sending...")
                                            : t("report.submit", "Submit report")}
                                    </button>
                                    <button
                                        onClick={() => setOpen(false)}
                                        style={{
                                            padding: "8px 16px", borderRadius: 6,
                                            background: "transparent", color: "var(--text-primary, #ccc)",
                                            border: "1px solid var(--border-color, #555)", cursor: "pointer", fontSize: 14,
                                        }}
                                    >
                                        {t("common.cancel", "Cancel")}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportButton;
