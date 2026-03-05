// SharedEventListPage.tsx — Read-only view of a shared event list (via share token)
import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    EventListType,
    EventListVisibility,
    useSharedEventListQuery,
} from "../../scripts/api/apiEventLists";

// ── Styles ──────────────────────────────────────────────────────────
const page: React.CSSProperties = {
    width: "100%", height: "100%", padding: 20,
    display: "flex", flexDirection: "column", gap: 20, overflow: "auto",
    maxWidth: 800, margin: "0 auto",
};
const card: React.CSSProperties = {
    border: "1px solid var(--border-color, #ddd)", padding: 20,
    borderRadius: 8, display: "flex", flexDirection: "column", gap: 12,
};
const badge = (bg: string): React.CSSProperties => ({
    display: "inline-block", padding: "2px 8px", borderRadius: 10,
    fontSize: 11, fontWeight: 600, backgroundColor: bg, color: "#fff",
});
const tableStyle: React.CSSProperties = {
    width: "100%", borderCollapse: "collapse", fontSize: 13,
};
const th: React.CSSProperties = {
    textAlign: "left", padding: "8px 10px",
    borderBottom: "2px solid var(--border-color, #555)", fontWeight: 600,
};
const td: React.CSSProperties = {
    padding: "8px 10px", borderBottom: "1px solid var(--border-color, #333)",
};

const typeLabel = (t: EventListType): string =>
    ["Custom", "Favorites", "Watched", "ByLocation", "ByCategory", "Archive"][t] ?? "Custom";
const typeBgColor = (t: EventListType): string =>
    ["#5865F2", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#7f8c8d"][t] ?? "#5865F2";

const SharedEventListPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { t } = useTranslation();
    const { data: list, isLoading, isError } = useSharedEventListQuery(token ?? "");

    if (isLoading) {
        return (
            <div style={page}>
                <p>{t("common.loading", "Loading…")}</p>
            </div>
        );
    }

    if (isError || !list) {
        return (
            <div style={page}>
                <h2>{t("eventLists.sharedTitle", "Shared Event List")}</h2>
                <p style={{ opacity: 0.6 }}>
                    {t("eventLists.sharedNotFound", "Event list not found or link has expired.")}
                </p>
                <Link to="/my-event-lists" style={{ color: "var(--accent, #5865F2)", textDecoration: "none" }}>
                    ← {t("eventLists.backToMyLists", "Back to My Lists")}
                </Link>
            </div>
        );
    }

    const items = [...(list.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div style={page}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {list.iconKey && (
                    <i className={`fa-solid fa-${list.iconKey}`}
                        style={{ fontSize: 28, color: list.color || "#5865F2" }} />
                )}
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0 }}>{list.name}</h1>
                    {list.description && (
                        <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.7 }}>{list.description}</p>
                    )}
                </div>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={badge(typeBgColor(list.type))}>{typeLabel(list.type)}</span>
                <span style={badge("#3498db")}>
                    {list.visibility === EventListVisibility.Shared
                        ? t("eventLists.sharedVis", "Shared")
                        : t("eventLists.publicVis", "Public")}
                </span>
                <span style={{ fontSize: 12, opacity: 0.6 }}>
                    {items.length} {t("eventLists.items", "items")}
                </span>
            </div>

            {/* Items table */}
            {items.length === 0 ? (
                <div style={card}>
                    <p style={{ opacity: 0.6, fontSize: 13, margin: 0 }}>
                        {t("eventLists.noItems", "No items in this list.")}
                    </p>
                </div>
            ) : (
                <div style={card}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={th}>#</th>
                                <th style={th}>{t("eventLists.event", "Event")}</th>
                                <th style={th}>{t("eventLists.note", "Note")}</th>
                                <th style={th}>{t("eventLists.tags", "Tags")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={item.id}>
                                    <td style={td}>{idx + 1}</td>
                                    <td style={td}>
                                        <Link to={`/parties/${item.eventId}/details`}
                                            style={{ color: "var(--accent, #5865F2)", textDecoration: "none", fontWeight: 600 }}>
                                            {t("eventLists.eventLabel", "Event")} #{item.eventId}
                                        </Link>
                                    </td>
                                    <td style={td}>{item.note || "—"}</td>
                                    <td style={td}>
                                        {item.tags ? (
                                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                {item.tags.split(",").map((tag) => (
                                                    <span key={tag} style={badge("#5865F2")}>{tag.trim()}</span>
                                                ))}
                                            </div>
                                        ) : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Footer link */}
            <Link to="/my-event-lists" style={{ color: "var(--accent, #5865F2)", textDecoration: "none", fontWeight: 600 }}>
                ← {t("eventLists.backToMyLists", "Back to My Lists")}
            </Link>
        </div>
    );
};

export default SharedEventListPage;
