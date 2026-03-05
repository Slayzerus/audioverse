// EventsManagerPage.tsx — Full CRUD page for managing events
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    useFilteredEventsQuery,
    useCreateEventMutation,
    useUpdateEventMutation,
    useDeleteEventMutation,
    useEventPdfExportMutation,
} from "../../scripts/api/apiEvents";
import {
    useSoftDeleteEventMutation,
    useCancelEventMutation,
    useRestoreEventMutation,
} from "../../scripts/api/apiEvents";
import type { Event } from "../../models/modelsKaraoke";
import { EventType, EventStatus, EventAccessType, EventVisibility, EventLocationType } from "../../models/modelsKaraoke";

const cardStyle: React.CSSProperties = { background: "var(--card-bg, #23272f)", borderRadius: 12, padding: 20, border: "1px solid var(--border-primary, rgba(255,255,255,0.08))" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-primary, rgba(255,255,255,0.15))", background: "var(--bg-primary, #1a1d23)", color: "var(--text-primary, #fff)", fontSize: 14, boxSizing: "border-box" as const };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "var(--text-secondary, #aaa)", fontWeight: 500, display: "block", marginBottom: 4 };
const btn = (v: "pri" | "sec" | "dan" | "suc" | "warn"): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#fff",
    background: v === "pri" ? "var(--accent, #5865F2)" : v === "dan" ? "#e53935" : v === "suc" ? "#66bb6a" : v === "warn" ? "#ffa726" : "var(--bg-secondary, #2c2f36)",
});
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "auto" as const };

const EVENT_TYPE_LABELS: Record<number, string> = { 0: "Unknown", 1: "Event", 2: "Meeting", 3: "Conference", 4: "Workshop", 5: "Game Night", 6: "Screening" };
const EVENT_STATUS_LABELS: Record<number, string> = { 0: "Created", 1: "Planned", 2: "It's On!", 3: "Finished", 4: "Cancelled" };
const ACCESS_LABELS: Record<number, string> = { 0: "Public", 1: "Private", 2: "Code", 3: "Link" };
const VISIBILITY_LABELS: Record<number, string> = { 0: "Private", 1: "Unlisted", 2: "Public" };
const LOCATION_TYPE_LABELS: Record<number, string> = { 0: "Virtual", 1: "Real" };

const STATUS_COLOR: Record<number, string> = { 0: "#9e9e9e", 1: "#42a5f5", 2: "#66bb6a", 3: "#78909c", 4: "#e53935" };

type EditorMode = "closed" | "create" | "edit";

const emptyForm: Partial<Event> = {
    title: "", description: "",
    type: EventType.Event,
    startTime: "", endTime: "",
    maxParticipants: undefined,
    waitingListEnabled: false,
    visibility: EventVisibility.Public,
    access: EventAccessType.Public,
    locationType: EventLocationType.Real,
    locationName: "",
    poster: "",
};

const EventsManagerPage: React.FC = () => {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState<number | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);

    const { data, isLoading } = useFilteredEventsQuery({ page, pageSize: 20, search: search || undefined, type: typeFilter, status: statusFilter, sortBy: "startTime", sortDesc: true });
    const events = data?.items ?? [];
    const total = data?.totalCount ?? events.length;

    const [mode, setMode] = useState<EditorMode>("closed");
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState<Partial<Event>>({ ...emptyForm });

    const createMut = useCreateEventMutation();
    const updateMut = useUpdateEventMutation();
    const deleteMut = useDeleteEventMutation();
    const softDeleteMut = useSoftDeleteEventMutation();
    const cancelMut = useCancelEventMutation();
    const restoreMut = useRestoreEventMutation();
    const pdfMut = useEventPdfExportMutation();

    const openCreate = () => { setMode("create"); setEditId(null); setForm({ ...emptyForm }); };
    const openEdit = (ev: Event) => { setMode("edit"); setEditId(ev.id); setForm({ ...ev }); };
    const close = () => { setMode("closed"); setEditId(null); };

    const setField = useCallback(<K extends keyof Event>(key: K, val: Event[K]) => setForm((f) => ({ ...f, [key]: val })), []);

    const save = () => {
        if (!form.title?.trim()) return;
        if (mode === "create") {
            createMut.mutate(form, { onSuccess: close });
        } else if (mode === "edit" && editId !== null) {
            updateMut.mutate({ id: editId, event: form }, { onSuccess: close });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm(t("events.confirmDelete", "Permanently delete this event?"))) deleteMut.mutate(id);
    };
    const handleSoftDelete = (id: number) => { softDeleteMut.mutate(id); };
    const handleRestore = (id: number) => { restoreMut.mutate(id); };
    const handleCancel = (id: number) => {
        const reason = prompt(t("events.cancelReason", "Cancellation reason (optional):")) ?? undefined;
        cancelMut.mutate({ id, reason });
    };
    const handlePdf = (id: number) => {
        pdfMut.mutate(id, { onSuccess: (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `event-${id}.pdf`; a.click();
            URL.revokeObjectURL(url);
        }});
    };

    const formatDate = (s?: string | null) => s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

    return (
        <div style={{ padding: 24, maxWidth: 1040, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ color: "var(--text-primary)", fontWeight: 800, margin: 0 }}>
                    <i className="fa-solid fa-calendar" />{" "}{t("events.title", "Events Manager")}
                </h2>
                <button style={btn("pri")} onClick={openCreate}>+ {t("events.create", "Create Event")}</button>
            </div>

            {/* ──── Filters ──── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                <input style={{ ...inputStyle, maxWidth: 240 }} placeholder={t("events.search", "Search events…")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                <select style={{ ...selectStyle, maxWidth: 140 }} value={typeFilter ?? ""} onChange={(e) => { setTypeFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}>
                    <option value="">All types</option>
                    {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select style={{ ...selectStyle, maxWidth: 140 }} value={statusFilter ?? ""} onChange={(e) => { setStatusFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}>
                    <option value="">All statuses</option>
                    {Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{total} events</span>
            </div>

            {/* ──── Form ──── */}
            {mode !== "closed" && (
                <div style={{ ...cardStyle, marginBottom: 16 }}>
                    <h4 style={{ color: "var(--text-primary)", fontWeight: 700, marginTop: 0 }}>
                        {mode === "create" ? t("events.newEvent", "New Event") : t("events.editEvent", "Edit Event")}
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ gridColumn: "span 2" }}>
                            <label style={labelStyle}>{t("events.fieldTitle", "Title")} *</label>
                            <input style={inputStyle} value={form.title ?? ""} onChange={(e) => setField("title", e.target.value)} />
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                            <label style={labelStyle}>{t("events.fieldDesc", "Description")}</label>
                            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.description ?? ""} onChange={(e) => setField("description", e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>{t("events.fieldType", "Type")}</label>
                            <select style={selectStyle} value={form.type ?? 1} onChange={(e) => setField("type", Number(e.target.value) as EventType)}>
                                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>{t("events.fieldAccess", "Access")}</label>
                            <select style={selectStyle} value={form.access ?? 0} onChange={(e) => setField("access", Number(e.target.value) as EventAccessType)}>
                                {Object.entries(ACCESS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>{t("events.fieldStart", "Start")}</label>
                            <input style={inputStyle} type="datetime-local" value={form.startTime ? form.startTime.slice(0, 16) : ""} onChange={(e) => setField("startTime", e.target.value ? new Date(e.target.value).toISOString() : null)} />
                        </div>
                        <div>
                            <label style={labelStyle}>{t("events.fieldEnd", "End")}</label>
                            <input style={inputStyle} type="datetime-local" value={form.endTime ? form.endTime.slice(0, 16) : ""} onChange={(e) => setField("endTime", e.target.value ? new Date(e.target.value).toISOString() : null)} />
                        </div>
                        <div>
                            <label style={labelStyle}>{t("events.fieldVisibility", "Visibility")}</label>
                            <select style={selectStyle} value={form.visibility ?? 2} onChange={(e) => setField("visibility", Number(e.target.value) as EventVisibility)}>
                                {Object.entries(VISIBILITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>{t("events.fieldLocType", "Location Type")}</label>
                            <select style={selectStyle} value={form.locationType ?? 1} onChange={(e) => setField("locationType", Number(e.target.value) as EventLocationType)}>
                                {Object.entries(LOCATION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>{t("events.fieldLocation", "Location Name")}</label>
                            <input style={inputStyle} value={form.locationName ?? ""} onChange={(e) => setField("locationName", e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>{t("events.fieldMax", "Max Participants")}</label>
                            <input style={inputStyle} type="number" min={0} value={form.maxParticipants ?? ""} onChange={(e) => setField("maxParticipants", e.target.value ? Number(e.target.value) : undefined)} />
                        </div>
                        <div>
                            <label style={labelStyle}>{t("events.fieldPoster", "Poster URL")}</label>
                            <input style={inputStyle} value={form.poster ?? ""} onChange={(e) => setField("poster", e.target.value)} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="checkbox" id="waitingList" checked={form.waitingListEnabled ?? false} onChange={(e) => setField("waitingListEnabled", e.target.checked)} />
                            <label htmlFor="waitingList" style={{ fontSize: 13, color: "var(--text-primary)" }}>{t("events.fieldWaiting", "Enable waiting list")}</label>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <button style={btn("pri")} onClick={save} disabled={createMut.isPending || updateMut.isPending}>
                            {mode === "create" ? t("events.createBtn", "Create") : t("events.saveBtn", "Save Changes")}
                        </button>
                        <button style={btn("sec")} onClick={close}>{t("events.cancel", "Cancel")}</button>
                    </div>
                </div>
            )}

            {/* ──── List ──── */}
            {isLoading ? (
                <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: 30 }}>Loading…</p>
            ) : events.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: "center", padding: 40 }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>{t("events.noResults", "No events found.")}</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 10 }}>
                    {events.map((ev) => (
                        <div key={ev.id} style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>{ev.title ?? ev.name ?? `Event #${ev.id}`}</span>
                                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: STATUS_COLOR[ev.status ?? 0] + "22", color: STATUS_COLOR[ev.status ?? 0], fontWeight: 600 }}>
                                        {EVENT_STATUS_LABELS[ev.status ?? 0]}
                                    </span>
                                    <span style={{ fontSize: 11, color: "var(--text-secondary)", padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>
                                        {EVENT_TYPE_LABELS[ev.type] ?? "?"}
                                    </span>
                                </div>
                                {ev.description && <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "4px 0 0" }}>{ev.description.slice(0, 150)}{ev.description.length > 150 ? "…" : ""}</p>}
                                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                                    <span>🗓 {formatDate(ev.startTime)}</span>
                                    {ev.endTime && <span>→ {formatDate(ev.endTime)}</span>}
                                    {ev.locationName && <span><i className="fa-solid fa-location-dot" />{" "}{ev.locationName}</span>}
                                    <span>{VISIBILITY_LABELS[ev.visibility ?? 0]} · {ACCESS_LABELS[ev.access ?? 0]}</span>
                                    {ev.maxParticipants && <span>Max: {ev.maxParticipants}</span>}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button style={btn("sec")} onClick={() => openEdit(ev)}>✏️</button>
                                <button style={btn("sec")} title="Export PDF" onClick={() => handlePdf(ev.id)}>📄</button>
                                {ev.status !== EventStatus.Cancelled ? (
                                    <button style={btn("warn")} title="Cancel event" onClick={() => handleCancel(ev.id)}>⛔</button>
                                ) : (
                                    <button style={btn("suc")} title="Restore event" onClick={() => handleRestore(ev.id)}>♻️</button>
                                )}
                                <button style={btn("sec")} title="Soft delete (archive)" onClick={() => handleSoftDelete(ev.id)}><i className="fa-solid fa-trash" /></button>
                                <button style={btn("dan")} title="Permanently delete" onClick={() => handleDelete(ev.id)}>✖</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ──── Pagination ──── */}
            {total > 20 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                    <button style={btn("sec")} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                    <span style={{ fontSize: 14, color: "var(--text-secondary)", alignSelf: "center" }}>Page {page}</span>
                    <button style={btn("sec")} onClick={() => setPage((p) => p + 1)}>Next →</button>
                </div>
            )}
        </div>
    );
};

export default EventsManagerPage;
