// SocialPanel.tsx — Composite panel: ratings + tags + comments + user lists
// Drop this on any entity page with just entityType + entityId.
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { EntityTypeString } from "../../models/modelsSocial";
import RatingPanel from "./RatingPanel";
import CommentsPanel from "./CommentsPanel";
import TagCloudPanel from "./TagCloudPanel";
import UserListPanel from "./UserListPanel";

// ══════════════════════════════════════════════════════════════════
//  SOCIAL PANEL
// ══════════════════════════════════════════════════════════════════

export interface SocialPanelProps {
    entityType: EntityTypeString;
    entityId: number;
    /** Which sections to show (default: all) */
    sections?: ("ratings" | "tags" | "comments" | "lists")[];
    /** Whether to use tabs or vertical stack (default: tabs) */
    layout?: "tabs" | "stack";
}

const ALL_SECTIONS = ["ratings", "tags", "comments", "lists"] as const;

const SocialPanel: React.FC<SocialPanelProps> = ({
    entityType,
    entityId,
    sections,
    layout = "tabs",
}) => {
    const { t } = useTranslation();
    const active = sections ?? [...ALL_SECTIONS];

    const tabLabels: Record<string, string> = {
        ratings:  t("social.ratings", "Ratings"),
        tags:     t("social.tags", "Tags"),
        comments: t("social.comments", "Comments"),
        lists:    t("social.lists", "My Lists"),
    };

    const [tab, setTab] = useState(active[0]);

    const renderSection = (section: string) => {
        switch (section) {
            case "ratings":
                return <RatingPanel entityType={entityType} entityId={entityId} />;
            case "tags":
                return <TagCloudPanel entityType={entityType} entityId={entityId} />;
            case "comments":
                return <CommentsPanel entityType={entityType} entityId={entityId} />;
            case "lists":
                return <UserListPanel entityType={entityType} entityId={entityId} />;
            default:
                return null;
        }
    };

    if (entityId <= 0) return null;

    // ── Stack layout ────────────────────────────────────────────────
    if (layout === "stack") {
        return (
            <div className="mt-4">
                {active.map((s) => (
                    <React.Fragment key={s}>{renderSection(s)}</React.Fragment>
                ))}
            </div>
        );
    }

    // ── Tabs layout (default) ───────────────────────────────────────
    return (
        <div className="mt-4">
            <ul className="nav nav-tabs mb-3">
                {active.map((s) => (
                    <li key={s} className="nav-item">
                        <button
                            className={`nav-link ${tab === s ? "active" : ""}`}
                            style={tab === s ? { fontWeight: 600 } : undefined}
                            onClick={() => setTab(s)}
                        >
                            {tabLabels[s] ?? s}
                        </button>
                    </li>
                ))}
            </ul>

            {renderSection(tab)}
        </div>
    );
};

export default SocialPanel;
