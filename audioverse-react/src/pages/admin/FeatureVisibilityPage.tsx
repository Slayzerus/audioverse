import React, { useState, useEffect, useCallback } from "react";
import {
    defaultFeatureRules,
    loadOverrides,
    saveOverrides,
    setBackendOverrides,
    FeatureOverride,
    FeatureVisibilityRule,
} from "../../config/featureVisibility";
import { putFeatureOverrides } from "../../scripts/api/apiAdmin";

import { useUser } from "../../contexts/UserContext";

const KNOWN_ROLES = ["admin", "user", "moderator"];

/** Groups with many items get collapsed by default */
const LARGE_GROUP_THRESHOLD = 10;

/** Merge defaults with current overrides to get the working state */
function buildState(overrides: FeatureOverride[]): FeatureVisibilityRule[] {
    const map = new Map(overrides.map((o) => [o.featureId, o]));
    return defaultFeatureRules.map((rule) => {
        const o = map.get(rule.featureId);
        if (!o) return { ...rule };
        return { ...rule, visibleToRoles: o.visibleToRoles, hidden: o.hidden };
    });
}

const FeatureVisibilityPage: React.FC = () => {
    const { systemConfig } = useUser();
    const [rules, setRules] = useState<FeatureVisibilityRule[]>([]);
    const [saved, setSaved] = useState(false);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // Prefer backend overrides from systemConfig, fall back to localStorage
        const overrides: FeatureOverride[] =
            (systemConfig?.featureVisibilityOverrides as FeatureOverride[] | undefined)?.length
                ? (systemConfig!.featureVisibilityOverrides as FeatureOverride[])
                : loadOverrides();
        const state = buildState(overrides);
        setRules(state);
        // Auto-collapse groups with many items
        const groups = state.reduce<Record<string, number>>((acc, r) => {
            acc[r.group] = (acc[r.group] ?? 0) + 1;
            return acc;
        }, {});
        const autoCollapsed: Record<string, boolean> = {};
        for (const [group, count] of Object.entries(groups)) {
            if (count >= LARGE_GROUP_THRESHOLD) autoCollapsed[group] = true;
        }
        setCollapsed(autoCollapsed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemConfig]);

    const toggle = useCallback((featureId: string) => {
        setRules((prev) =>
            prev.map((r) => (r.featureId === featureId ? { ...r, hidden: !r.hidden } : r)),
        );
        setSaved(false);
    }, []);

    const toggleRole = useCallback((featureId: string, role: string) => {
        setRules((prev) =>
            prev.map((r) => {
                if (r.featureId !== featureId) return r;
                const has = r.visibleToRoles.includes(role);
                return {
                    ...r,
                    visibleToRoles: has
                        ? r.visibleToRoles.filter((x) => x !== role)
                        : [...r.visibleToRoles, role],
                };
            }),
        );
        setSaved(false);
    }, []);

    /** Toggle visibility for all items in a group at once */
    const toggleGroupAll = useCallback((group: string, makeVisible: boolean) => {
        setRules((prev) =>
            prev.map((r) => (r.group === group ? { ...r, hidden: !makeVisible } : r)),
        );
        setSaved(false);
    }, []);

    /** Set a specific role for all items in a group */
    const toggleGroupRole = useCallback((group: string, role: string) => {
        setRules((prev) => {
            const groupItems = prev.filter((r) => r.group === group);
            const allHaveRole = groupItems.every((r) => r.visibleToRoles.includes(role));
            return prev.map((r) => {
                if (r.group !== group) return r;
                return {
                    ...r,
                    visibleToRoles: allHaveRole
                        ? r.visibleToRoles.filter((x) => x !== role)
                        : r.visibleToRoles.includes(role)
                            ? r.visibleToRoles
                            : [...r.visibleToRoles, role],
                };
            });
        });
        setSaved(false);
    }, []);

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const overrides: FeatureOverride[] = rules
            .filter((r) => {
                const def = defaultFeatureRules.find((d) => d.featureId === r.featureId);
                if (!def) return true;
                return (
                    r.hidden !== def.hidden ||
                    JSON.stringify(r.visibleToRoles.slice().sort()) !==
                        JSON.stringify(def.visibleToRoles.slice().sort())
                );
            })
            .map((r) => ({
                featureId: r.featureId,
                visibleToRoles: r.visibleToRoles,
                hidden: r.hidden,
            }));

        setSaving(true);
        try {
            // Save to backend via dedicated features endpoint
            await putFeatureOverrides(overrides);
            // Update in-memory backend overrides so the app reacts immediately
            setBackendOverrides(overrides);
        } catch {
            // Backend unavailable — localStorage will still work as fallback
        }
        // Always save to localStorage as cache / fallback
        saveOverrides(overrides);
        setSaving(false);
        setSaved(true);
    };

    const handleReset = async () => {
        setSaving(true);
        try {
            await putFeatureOverrides([]);
            setBackendOverrides([]);
        } catch { /* fallback to localStorage only */ }
        saveOverrides([]);
        setRules(buildState([]));
        setSaving(false);
        setSaved(true);
    };

    // Group rules by group
    const groups = rules.reduce<Record<string, FeatureVisibilityRule[]>>((acc, r) => {
        (acc[r.group] ??= []).push(r);
        return acc;
    }, {});

    const toggleCollapse = (group: string) => {
        setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }));
    };

    return (
        <div style={{ width: "100%", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
            <h1 style={{ marginBottom: 8 }}>Feature Visibility</h1>
            <p style={{ color: "var(--text-secondary, #666)", marginBottom: 24 }}>
                Toggle features, navbar menus, and individual games on/off — assign role restrictions.
                Changes are saved to backend and apply to all users across all browsers.
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : saved ? "✓ Saved" : "Save changes"}
                </button>
                <button onClick={handleReset} disabled={saving} style={btnSecondary}>
                    Reset to defaults
                </button>
                <div style={{ flex: 1 }} />
                <input
                    type="text"
                    placeholder="Search features & games…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "1px solid var(--border-primary, #ccc)",
                        background: "var(--bg-secondary, #f8f8f8)",
                        color: "var(--text-primary, #333)",
                        fontSize: 14,
                        minWidth: 220,
                    }}
                />
            </div>

            {Object.entries(groups).map(([group, items]) => {
                const query = searchQuery.toLowerCase().trim();
                const filteredItems = query
                    ? items.filter(
                          (r) =>
                              r.label.toLowerCase().includes(query) ||
                              r.featureId.toLowerCase().includes(query),
                      )
                    : items;
                if (query && filteredItems.length === 0) return null;

                const isCollapsed = collapsed[group] && !query;
                const isCollapsible = items.length >= LARGE_GROUP_THRESHOLD;
                const allVisible = filteredItems.every((r) => !r.hidden);
                const hiddenCount = filteredItems.filter((r) => r.hidden).length;
                const noneVisible = hiddenCount === filteredItems.length;

                return (
                    <div key={group} style={{ marginBottom: 32 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                borderBottom: "1px solid var(--border-primary, #ddd)",
                                paddingBottom: 6,
                                marginBottom: isCollapsed ? 0 : 12,
                                cursor: isCollapsible ? "pointer" : undefined,
                                flexWrap: "wrap",
                            }}
                            onClick={isCollapsible ? () => toggleCollapse(group) : undefined}
                        >
                            {isCollapsible && (
                                <span style={{ fontSize: 14, color: "var(--text-secondary, #888)", userSelect: "none" }}>
                                    {isCollapsed ? "▶" : "▼"}
                                </span>
                            )}
                            <h2 style={{ fontSize: 18, margin: 0 }}>
                                {group}
                                <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-secondary, #888)", marginLeft: 8 }}>
                                    ({filteredItems.length} items{hiddenCount > 0 ? `, ${hiddenCount} hidden` : ""})
                                </span>
                            </h2>
                            {!isCollapsed && (
                                <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleGroupAll(group, true); }}
                                        style={{ ...btnSmall, background: allVisible ? "#22c55e" : "var(--bg-secondary, #e5e5e5)", color: allVisible ? "#fff" : "var(--text-primary, #333)" }}
                                    >
                                        Show all
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleGroupAll(group, false); }}
                                        style={{ ...btnSmall, background: noneVisible ? "#ef4444" : "var(--bg-secondary, #e5e5e5)", color: noneVisible ? "#fff" : "var(--text-primary, #333)" }}
                                    >
                                        Hide all
                                    </button>
                                    {KNOWN_ROLES.map((role) => {
                                        const allHave = filteredItems.every((r) => r.visibleToRoles.includes(role));
                                        return (
                                            <button
                                                key={role}
                                                onClick={(e) => { e.stopPropagation(); toggleGroupRole(group, role); }}
                                                style={{ ...btnSmall, background: allHave ? "#3b82f6" : "var(--bg-secondary, #e5e5e5)", color: allHave ? "#fff" : "var(--text-primary, #333)" }}
                                                title={`Toggle "${role}" role for all ${group}`}
                                            >
                                                {allHave ? `✓ ${role}` : role}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {!isCollapsed && (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Feature</th>
                                        <th style={{ ...thStyle, width: 100, textAlign: "center" }}>Visible</th>
                                        {KNOWN_ROLES.map((role) => (
                                            <th key={role} style={{ ...thStyle, width: 100, textAlign: "center" }}>
                                                {role}
                                            </th>
                                        ))}
                                        <th style={thStyle}>Auth req.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map((r) => (
                                        <tr key={r.featureId} style={{ borderBottom: "1px solid var(--border-primary, #eee)" }}>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: 500 }}>{r.label}</span>
                                                <br />
                                                <code style={{ fontSize: 11, color: "var(--text-secondary, #888)" }}>
                                                    {r.featureId}
                                                </code>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: "center" }}>
                                                <ToggleSwitch checked={!r.hidden} onChange={() => toggle(r.featureId)} />
                                            </td>
                                            {KNOWN_ROLES.map((role) => (
                                                <td key={role} style={{ ...tdStyle, textAlign: "center" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={r.visibleToRoles.includes(role)}
                                                        onChange={() => toggleRole(r.featureId, role)}
                                                        style={{ width: 18, height: 18, cursor: "pointer" }}
                                                    />
                                                </td>
                                            ))}
                                            <td style={{ ...tdStyle, textAlign: "center" }}>
                                                {r.requiresAuth ? "🔒" : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default FeatureVisibilityPage;

// ── Tiny toggle switch ─────────────────────────────────────────────

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: "none",
            background: checked ? "#22c55e" : "#d1d5db",
            position: "relative",
            cursor: "pointer",
            transition: "background 0.2s",
        }}
    >
        <span
            style={{
                position: "absolute",
                top: 2,
                left: checked ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,.3)",
            }}
        />
    </button>
);

// ── Shared styles ──────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-secondary, #555)",
    borderBottom: "2px solid var(--border-primary, #ccc)",
};

const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    verticalAlign: "middle",
};

const btnPrimary: React.CSSProperties = {
    padding: "8px 20px",
    borderRadius: 6,
    border: "none",
    background: "var(--accent, #3b82f6)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
};

const btnSecondary: React.CSSProperties = {
    padding: "8px 20px",
    borderRadius: 6,
    border: "1px solid var(--border-primary, #ccc)",
    background: "transparent",
    color: "var(--text-primary, #333)",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
};

const btnSmall: React.CSSProperties = {
    padding: "3px 10px",
    borderRadius: 4,
    border: "none",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    color: "var(--text-primary, #333)",
};
