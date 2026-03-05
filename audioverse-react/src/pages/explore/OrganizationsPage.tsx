// OrganizationsPage.tsx — CRUD for organizations
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    useOrganizationsQuery,
    useCreateOrganizationMutation,
    useUpdateOrganizationMutation,
    useDeleteOrganizationMutation,
} from "../../scripts/api/apiOrganizations";
import {
    EventList,
    EventListType,
    useOrganizationEventListsQuery,
} from "../../scripts/api/apiEventLists";
import type { Organization } from "../../models/modelsKaraoke";

const cardStyle: React.CSSProperties = {
    background: "var(--card-bg, #23272f)",
    borderRadius: 12,
    padding: 20,
    border: "1px solid var(--border-primary, rgba(255,255,255,0.08))",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--border-primary, rgba(255,255,255,0.15))",
    background: "var(--bg-primary, #1a1d23)",
    color: "var(--text-primary, #fff)",
    fontSize: 14,
};

const btnStyle = (variant: "primary" | "danger" | "secondary"): React.CSSProperties => ({
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    background: variant === "primary" ? "var(--accent, #5865F2)" : variant === "danger" ? "#e53935" : "var(--bg-secondary, #2c2f36)",
    color: "#fff",
    transition: "opacity .15s",
});

const emptyForm = { name: "", description: "", logoUrl: "", website: "" };

const OrganizationsPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: orgs = [], isLoading } = useOrganizationsQuery();
    const createMut = useCreateOrganizationMutation();
    const updateMut = useUpdateOrganizationMutation();
    const deleteMut = useDeleteOrganizationMutation();

    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [expandedOrgId, setExpandedOrgId] = useState<number | null>(null);

    const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = () => {
        if (!form.name.trim()) return;
        if (editId != null) {
            updateMut.mutate({ id: editId, payload: form }, { onSuccess: () => { setEditId(null); setForm(emptyForm); setShowForm(false); } });
        } else {
            createMut.mutate(form, { onSuccess: () => { setForm(emptyForm); setShowForm(false); } });
        }
    };

    const handleEdit = (org: Organization) => {
        setForm({ name: org.name ?? "", description: org.description ?? "", logoUrl: org.logoUrl ?? "", website: org.website ?? "" });
        setEditId(org.id);
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t("organizations.confirmDelete", "Are you sure?"))) deleteMut.mutate(id);
    };

    return (
        <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ color: "var(--text-primary)", fontWeight: 800, margin: 0 }}>
                    🏢 {t("organizations.title", "Organizations")}
                </h2>
                <button style={btnStyle("primary")} onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>
                    {showForm ? t("common.cancel", "Cancel") : t("organizations.create", "+ New Organization")}
                </button>
            </div>

            {/* ── Create / Edit form ── */}
            {showForm && (
                <div style={{ ...cardStyle, marginBottom: 20 }}>
                    <h4 style={{ color: "var(--text-primary)", fontWeight: 700, marginTop: 0 }}>
                        {editId ? t("organizations.edit", "Edit Organization") : t("organizations.new", "New Organization")}
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                            <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>{t("organizations.name", "Name")} *</label>
                            <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Organization name" />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>{t("organizations.website", "Website")}</label>
                            <input style={inputStyle} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
                        </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>{t("organizations.description", "Description")}</label>
                        <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.description} onChange={(e) => set("description", e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>{t("organizations.logoUrl", "Logo URL")}</label>
                        <input style={inputStyle} value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://..." />
                    </div>
                    <button style={btnStyle("primary")} onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
                        {editId ? t("common.save", "Save") : t("common.create", "Create")}
                    </button>
                </div>
            )}

            {/* ── List ── */}
            {isLoading ? (
                <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: 40 }}>Loading…</p>
            ) : orgs.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: "center", padding: 40 }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>{t("organizations.empty", "No organizations yet.")}</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {orgs.map((org) => (
                        <div key={org.id} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", gap: 16, alignItems: "center", cursor: "pointer" }}
                                onClick={() => setExpandedOrgId(expandedOrgId === org.id ? null : org.id)}>
                            {org.logoUrl ? (
                                <img src={org.logoUrl} alt={`${org.name} logo`} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--accent, #5865F2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff" }}>
                                    {(org.name ?? "?")[0].toUpperCase()}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>{org.name}</div>
                                {org.description && <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{org.description}</div>}
                                {org.website && <a href={org.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--accent, #5865F2)" }}>{org.website}</a>}
                            </div>
                            <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                                <button style={btnStyle("secondary")} onClick={() => handleEdit(org)}>✏️</button>
                                <button style={btnStyle("danger")} onClick={() => handleDelete(org.id)}><i className="fa-solid fa-trash" /></button>
                            </div>
                            </div>
                            {/* ── Organization Event Lists ── */}
                            {expandedOrgId === org.id && (
                                <OrgEventLists orgId={org.id} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Organization Event Lists sub-component ──
const typeLabel = (t: EventListType): string =>
    ["Custom", "Favorites", "Watched", "ByLocation", "ByCategory", "Archive"][t] ?? "Custom";
const typeBgColor = (t: EventListType): string =>
    ["#5865F2", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#7f8c8d"][t] ?? "#5865F2";

const OrgEventLists: React.FC<{ orgId: number }> = ({ orgId }) => {
    const { data: lists = [], isLoading } = useOrganizationEventListsQuery(orgId);

    if (isLoading) return <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Loading event lists…</p>;
    if (lists.length === 0) {
        return <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>No event lists for this organization.</p>;
    }

    return (
        <div style={{ borderTop: "1px solid var(--border-primary, rgba(255,255,255,0.08))", paddingTop: 10 }}>
            <strong style={{ fontSize: 13, color: "var(--text-primary)" }}>
                <i className="fa-solid fa-list" /> Event Lists ({lists.length})
            </strong>
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                {lists.map((list: EventList) => (
                    <div key={list.id} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 10px", borderRadius: 6,
                        background: "var(--bg-primary, #1a1d23)", fontSize: 13,
                    }}>
                        {list.iconKey && (
                            <i className={`fa-solid fa-${list.iconKey}`}
                                style={{ color: list.color || "#5865F2", fontSize: 14 }} />
                        )}
                        <span style={{ flex: 1, fontWeight: 600 }}>{list.name}</span>
                        <span style={{
                            display: "inline-block", padding: "1px 6px", borderRadius: 8,
                            fontSize: 10, fontWeight: 600, backgroundColor: typeBgColor(list.type), color: "#fff",
                        }}>
                            {typeLabel(list.type)}
                        </span>
                        <span style={{ fontSize: 11, opacity: 0.6 }}>
                            {list.itemCount ?? list.items?.length ?? 0} items
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrganizationsPage;
