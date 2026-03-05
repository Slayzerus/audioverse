import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { postTestSms, postTestEmail } from "../../scripts/api/apiSystemNotifications";

// ── Styles ─────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
    border: "1px solid var(--border-color, #ddd)",
    padding: "20px",
    borderRadius: "8px",
    maxWidth: "min(560px, 100%)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
};

const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid var(--border-color, #ccc)",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "var(--accent, #5865F2)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    alignSelf: "flex-start",
};

const labelStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: "13px",
    marginBottom: "2px",
};

// ── Component ──────────────────────────────────────────────────────
const AdminNotificationsPage: React.FC = () => {
    const { t } = useTranslation();

    // --- SMS state ---
    const [smsPhone, setSmsPhone] = useState("48");
    const [smsMessage, setSmsMessage] = useState("");
    const [smsBusy, setSmsBusy] = useState(false);
    const [smsResult, setSmsResult] = useState<{ ok: boolean; text: string } | null>(null);

    // --- Email state ---
    const [emailTo, setEmailTo] = useState("");
    const [emailSubject, setEmailSubject] = useState("Test AudioVerse");
    const [emailBody, setEmailBody] = useState("");
    const [emailBusy, setEmailBusy] = useState(false);
    const [emailResult, setEmailResult] = useState<{ ok: boolean; text: string } | null>(null);

    // --- Handlers ---
    const handleSendSms = async (e: React.FormEvent) => {
        e.preventDefault();
        setSmsResult(null);
        setSmsBusy(true);
        try {
            const res = await postTestSms({ phone: smsPhone, message: smsMessage });
            setSmsResult({ ok: res.success !== false, text: res.message ?? "SMS sent" });
        } catch (err: unknown) {
            const e = err as Record<string, unknown> | undefined;
            const resp = (e && typeof e === 'object' ? e['response'] : undefined) as Record<string, unknown> | undefined;
            const data = (resp && typeof resp === 'object' ? resp['data'] : undefined) as Record<string, unknown> | string | undefined;
            const msg = (typeof data === 'object' && data ? data['message'] : data) ?? (err instanceof Error ? err.message : null) ?? "SMS sending error";
            setSmsResult({ ok: false, text: String(msg) });
        } finally {
            setSmsBusy(false);
        }
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailResult(null);
        setEmailBusy(true);
        try {
            const res = await postTestEmail({ to: emailTo, subject: emailSubject, body: emailBody });
            setEmailResult({ ok: res.success !== false, text: res.message ?? "Email sent" });
        } catch (err: unknown) {
            const e = err as Record<string, unknown> | undefined;
            const resp = (e && typeof e === 'object' ? e['response'] : undefined) as Record<string, unknown> | undefined;
            const data = (resp && typeof resp === 'object' ? resp['data'] : undefined) as Record<string, unknown> | string | undefined;
            const msg = (typeof data === 'object' && data ? data['message'] : data) ?? (err instanceof Error ? err.message : null) ?? "Email sending error";
            setEmailResult({ ok: false, text: String(msg) });
        } finally {
            setEmailBusy(false);
        }
    };

    const resultBox = (r: { ok: boolean; text: string } | null) =>
        r ? (
            <div
                style={{
                    padding: "10px",
                    borderRadius: "4px",
                    backgroundColor: r.ok
                        ? "var(--success-bg, #ccffcc)"
                        : "var(--error-bg, #ffcccc)",
                    color: r.ok
                        ? "var(--success, #00aa00)"
                        : "var(--error, #cc0000)",
                }}
            >
                {r.text}
            </div>
        ) : null;

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "28px",
                overflow: "auto",
            }}
        >
            <h1>{t("adminNotifications.title", "Notifications — Test")}</h1>
            <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
                {t(
                    "adminNotifications.subtitle",
                    "Send a test SMS (SMSAPI.pl) or email from the backend."
                )}
            </p>

            {/* ── SMS Card ──────────────────────────────────────── */}
            <div style={cardStyle}>
                <h2 style={{ margin: 0 }}>
                    📱 {t("adminNotifications.smsTitle", "Test SMS")}
                </h2>
                <form onSubmit={handleSendSms} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={labelStyle}>
                            {t("adminNotifications.phone", "Phone number")}
                        </label>
                        <input
                            type="tel"
                            placeholder="48XXXXXXXXX"
                            value={smsPhone}
                            onChange={(e) => setSmsPhone(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={labelStyle}>
                            {t("adminNotifications.message", "Message")}
                        </label>
                        <textarea
                            placeholder={t("adminNotifications.smsPlaceholder", "SMS content…")}
                            value={smsMessage}
                            onChange={(e) => setSmsMessage(e.target.value)}
                            required
                            rows={3}
                            style={{ ...inputStyle, resize: "vertical" }}
                        />
                    </div>
                    <button type="submit" disabled={smsBusy} style={{ ...buttonStyle, opacity: smsBusy ? 0.6 : 1 }}>
                        {smsBusy
                            ? t("adminNotifications.sending", "Sending…")
                            : t("adminNotifications.sendSms", "Send SMS")}
                    </button>
                </form>
                {resultBox(smsResult)}
            </div>

            {/* ── Email Card ────────────────────────────────────── */}
            <div style={cardStyle}>
                <h2 style={{ margin: 0 }}>
                    ✉️ {t("adminNotifications.emailTitle", "Test E-mail")}
                </h2>
                <form onSubmit={handleSendEmail} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={labelStyle}>
                            {t("adminNotifications.emailTo", "Recipient")}
                        </label>
                        <input
                            type="email"
                            placeholder="user@example.com"
                            value={emailTo}
                            onChange={(e) => setEmailTo(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={labelStyle}>
                            {t("adminNotifications.emailSubject", "Subject")}
                        </label>
                        <input
                            type="text"
                            placeholder="Subject"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={labelStyle}>
                            {t("adminNotifications.emailBody", "Body (optional)")}
                        </label>
                        <textarea
                            placeholder={t("adminNotifications.emailBodyPlaceholder", "Message content…")}
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            rows={4}
                            style={{ ...inputStyle, resize: "vertical" }}
                        />
                    </div>
                    <button type="submit" disabled={emailBusy} style={{ ...buttonStyle, opacity: emailBusy ? 0.6 : 1 }}>
                        {emailBusy
                            ? t("adminNotifications.sending", "Sending…")
                            : t("adminNotifications.sendEmail", "Send email")}
                    </button>
                </form>
                {resultBox(emailResult)}
            </div>
        </div>
    );
};

export default AdminNotificationsPage;
