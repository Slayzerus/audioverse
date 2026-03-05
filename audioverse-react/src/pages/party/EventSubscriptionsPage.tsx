// EventSubscriptionsPage.tsx — User's event notification subscriptions management
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    EventSubscription,
    EventNotificationLevel,
    EventNotificationCategory,
    UpdateSubscriptionRequest,
    useMySubscriptionsQuery,
    useUpdateSubscriptionMutation,
    useUnsubscribeMutation,
    useToggleSubscriptionMutation,
} from "../../scripts/api/apiEventSubscriptions";

// ── Styles ──────────────────────────────────────────────────────────
const page: React.CSSProperties = {
    width: "100%", height: "100%", padding: 20,
    display: "flex", flexDirection: "column", gap: 20, overflow: "auto",
};
const card: React.CSSProperties = {
    border: "1px solid var(--border-color, #ddd)", padding: 16,
    borderRadius: 8, display: "flex", flexDirection: "column", gap: 10,
    cursor: "pointer", transition: "background 0.15s",
};
const badge = (bg: string): React.CSSProperties => ({
    display: "inline-block", padding: "2px 8px", borderRadius: 10,
    fontSize: 11, fontWeight: 600, backgroundColor: bg, color: "#fff",
});
const btn = (accent = false): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: 13,
    backgroundColor: accent ? "var(--accent, #5865F2)" : "var(--bg-secondary, #2b2d31)",
    color: accent ? "#fff" : "inherit",
});
const gridStyle: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14,
};
const toggleRow: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "4px 0", fontSize: 13,
};
const panelStyle: React.CSSProperties = {
    marginTop: 8, padding: 14, borderRadius: 8,
    border: "1px solid var(--border-color, #444)",
    backgroundColor: "var(--bg-secondary, #2b2d31)",
    display: "flex", flexDirection: "column", gap: 10,
};

// ── Helpers ─────────────────────────────────────────────────────────
const levelInfo: Record<EventNotificationLevel, { label: string; color: string }> = {
    [EventNotificationLevel.Muted]: { label: "Muted", color: "#636e72" },
    [EventNotificationLevel.Essential]: { label: "Essential", color: "#e17055" },
    [EventNotificationLevel.Standard]: { label: "Standard", color: "#0984e3" },
    [EventNotificationLevel.All]: { label: "All", color: "#00b894" },
};

const allCategories: { value: EventNotificationCategory; label: string }[] = [
    { value: EventNotificationCategory.Cancellation, label: "Cancellation" },
    { value: EventNotificationCategory.DateTimeChange, label: "Date/Time Change" },
    { value: EventNotificationCategory.Reminder24h, label: "24h Reminder" },
    { value: EventNotificationCategory.Reminder1h, label: "1h Reminder" },
    { value: EventNotificationCategory.ScheduleUpdate, label: "Schedule Update" },
    { value: EventNotificationCategory.NewParticipant, label: "New Participant" },
    { value: EventNotificationCategory.News, label: "News" },
    { value: EventNotificationCategory.Comments, label: "Comments" },
    { value: EventNotificationCategory.Polls, label: "Polls" },
    { value: EventNotificationCategory.Media, label: "Media" },
    { value: EventNotificationCategory.GameUpdates, label: "Game Updates" },
];

const hasCategory = (mask: number | undefined, cat: EventNotificationCategory): boolean =>
    ((mask ?? 0) & cat) !== 0;

const toggleCategory = (mask: number | undefined, cat: EventNotificationCategory): number =>
    hasCategory(mask, cat) ? (mask ?? 0) & ~cat : (mask ?? 0) | cat;

const activeCategories = (mask: number | undefined): string[] =>
    allCategories.filter((c) => hasCategory(mask, c.value)).map((c) => c.label);

// ── Toggle Switch ───────────────────────────────────────────────────
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
    checked, onChange, label,
}) => (
    <div style={toggleRow}>
        <span>{label}</span>
        <button
            style={{
                ...btn(checked),
                minWidth: 48, textAlign: "center",
                backgroundColor: checked ? "#00b894" : "var(--bg-secondary, #2b2d31)",
            }}
            onClick={() => onChange(!checked)}>
            {checked ? "ON" : "OFF"}
        </button>
    </div>
);

// ── Inline Settings Panel ───────────────────────────────────────────
interface SettingsPanelProps {
    sub: EventSubscription;
}
const SettingsPanel: React.FC<SettingsPanelProps> = ({ sub }) => {
    const { t } = useTranslation();
    const updateSub = useUpdateSubscriptionMutation();

    const [level, setLevel] = useState<EventNotificationLevel>(sub.level);
    const [useCustom, setUseCustom] = useState(sub.customCategories != null && sub.customCategories > 0);
    const [customMask, setCustomMask] = useState(sub.customCategories ?? 0);
    const [emailEnabled, setEmailEnabled] = useState(sub.emailEnabled);
    const [pushEnabled, setPushEnabled] = useState(sub.pushEnabled);

    const handleSave = useCallback(() => {
        const req: UpdateSubscriptionRequest = {
            level,
            emailEnabled,
            pushEnabled,
            customCategories: useCustom ? customMask : undefined,
        };
        updateSub.mutate({ eventId: sub.eventId, req });
    }, [level, emailEnabled, pushEnabled, useCustom, customMask, sub.eventId, updateSub]);

    return (
        <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
            {/* Level selector */}
            <div>
                <strong style={{ fontSize: 13 }}>{t("eventSubscriptions.level", "Notification Level")}</strong>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {([
                        EventNotificationLevel.Muted,
                        EventNotificationLevel.Essential,
                        EventNotificationLevel.Standard,
                        EventNotificationLevel.All,
                    ] as const).map((lv) => (
                        <label key={lv} style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                            backgroundColor: level === lv ? levelInfo[lv].color : "transparent",
                            color: level === lv ? "#fff" : "inherit",
                            border: `1px solid ${levelInfo[lv].color}`,
                        }}>
                            <input type="radio" name={`level-${sub.id}`} value={lv}
                                checked={level === lv} onChange={() => { setLevel(lv); setUseCustom(false); }}
                                style={{ display: "none" }} />
                            {levelInfo[lv].label}
                        </label>
                    ))}
                </div>
            </div>

            {/* Custom categories */}
            <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input type="checkbox" checked={useCustom}
                        onChange={(e) => setUseCustom(e.target.checked)} />
                    {t("eventSubscriptions.useCustom", "Use custom categories")}
                </label>
                {useCustom && (
                    <div style={{
                        display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6,
                    }}>
                        {allCategories.map((cat) => (
                            <label key={cat.value} style={{
                                display: "flex", alignItems: "center", gap: 4,
                                fontSize: 12, cursor: "pointer",
                                padding: "2px 8px", borderRadius: 4,
                                backgroundColor: hasCategory(customMask, cat.value)
                                    ? "var(--accent, #5865F2)" : "transparent",
                                color: hasCategory(customMask, cat.value) ? "#fff" : "inherit",
                                border: "1px solid var(--border-color, #555)",
                            }}>
                                <input type="checkbox" checked={hasCategory(customMask, cat.value)}
                                    onChange={() => setCustomMask((m) => toggleCategory(m, cat.value))}
                                    style={{ display: "none" }} />
                                {cat.label}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Email / Push toggles */}
            <ToggleSwitch checked={emailEnabled} onChange={setEmailEnabled}
                label={t("eventSubscriptions.email", "Email notifications")} />
            <ToggleSwitch checked={pushEnabled} onChange={setPushEnabled}
                label={t("eventSubscriptions.push", "Push notifications")} />

            {/* Save */}
            <button style={{ ...btn(true), alignSelf: "flex-end" }} onClick={handleSave}
                disabled={updateSub.isPending}>
                {updateSub.isPending
                    ? t("common.saving", "Saving…")
                    : t("common.save", "Save")}
            </button>
        </div>
    );
};

// ── Main Page ───────────────────────────────────────────────────────
const EventSubscriptionsPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: subs, isLoading } = useMySubscriptionsQuery();
    const unsubscribe = useUnsubscribeMutation();
    const toggleSub = useToggleSubscriptionMutation();

    const [expandedId, setExpandedId] = useState<number | null>(null);

    const subscriptions = subs ?? [];

    return (
        <div style={page}>
            {/* Header */}
            <h1 style={{ margin: 0 }}>{t("eventSubscriptions.title", "My Event Subscriptions")}</h1>

            {isLoading ? (
                <p>{t("common.loading", "Loading…")}</p>
            ) : subscriptions.length === 0 ? (
                <p style={{ opacity: 0.6 }}>
                    {t("eventSubscriptions.empty", "You have no event subscriptions.")}
                </p>
            ) : (
                <div style={gridStyle}>
                    {subscriptions.map((sub) => {
                        const info = levelInfo[sub.level];
                        const expanded = expandedId === sub.id;
                        const cats = activeCategories(sub.customCategories);

                        return (
                            <div key={sub.id} style={{
                                ...card,
                                borderColor: expanded ? "var(--accent, #5865F2)" : undefined,
                            }}
                                onClick={() => setExpandedId(expanded ? null : sub.id)}>

                                {/* Event + level badge */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontWeight: 600, flex: 1 }}>
                                        {t("eventSubscriptions.event", "Event")} #{sub.eventId}
                                    </span>
                                    <span style={badge(info.color)}>{info.label}</span>
                                </div>

                                {/* Email / Push */}
                                <div style={{ display: "flex", gap: 10, fontSize: 12, opacity: 0.8 }}>
                                    <span>✉️ {sub.emailEnabled
                                        ? t("eventSubscriptions.on", "On")
                                        : t("eventSubscriptions.off", "Off")}</span>
                                    <span><i className="fa-solid fa-bell" />{" "}{sub.pushEnabled
                                        ? t("eventSubscriptions.on", "On")
                                        : t("eventSubscriptions.off", "Off")}</span>
                                </div>

                                {/* Custom categories display */}
                                {cats.length > 0 && (
                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                        {cats.map((c) => (
                                            <span key={c} style={{
                                                ...badge("var(--accent, #5865F2)"),
                                                fontSize: 10,
                                            }}>{c}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Quick actions */}
                                <div style={{ display: "flex", gap: 6 }}
                                    onClick={(e) => e.stopPropagation()}>
                                    <button style={btn()} onClick={() => toggleSub.mutate(sub.eventId)}
                                        title={t("eventSubscriptions.toggle", "Toggle")}>
                                        <i className="fa-solid fa-bolt" />
                                    </button>
                                    <button style={{ ...btn(), color: "#e74c3c" }}
                                        onClick={() => {
                                            if (confirm(t("eventSubscriptions.confirmUnsub",
                                                "Unsubscribe from this event?")))
                                                unsubscribe.mutate(sub.eventId);
                                        }}
                                        title={t("eventSubscriptions.unsubscribe", "Unsubscribe")}>
                                        ✕
                                    </button>
                                </div>

                                {/* Inline settings panel */}
                                {expanded && <SettingsPanel sub={sub} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EventSubscriptionsPage;
