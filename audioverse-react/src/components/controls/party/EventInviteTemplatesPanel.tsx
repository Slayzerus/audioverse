// EventInviteTemplatesPanel.tsx — Invite templates & bulk invite panel for PartyPage invites tab
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    useInviteTemplatesQuery,
    useCreateInviteTemplateMutation,
    useUpdateInviteTemplateMutation,
    useDeleteInviteTemplateMutation,
    useBulkInviteMutation,
    useBulkInviteStatusQuery,
    type EventInviteTemplate,
} from "../../../scripts/api/apiEventInviteTemplates";

interface Props {
    eventId: number;
    isOrganizer?: boolean;
}

const cardStyle: React.CSSProperties = {
    background: "var(--card-bg, #23272f)",
    border: "1px solid var(--border-color, #333)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
};

const EventInviteTemplatesPanel: React.FC<Props> = ({ eventId, isOrganizer = false }) => {
    const { t } = useTranslation();
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<number | null>(null);
    const [form, setForm] = useState<Partial<EventInviteTemplate>>({});
    const [bulkEmails, setBulkEmails] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [activeJobId, setActiveJobId] = useState("");

    const templatesQ = useInviteTemplatesQuery(eventId);
    const createTemplate = useCreateInviteTemplateMutation();
    const updateTemplate = useUpdateInviteTemplateMutation();
    const deleteTemplate = useDeleteInviteTemplateMutation();
    const bulkInvite = useBulkInviteMutation();
    const bulkStatusQ = useBulkInviteStatusQuery(eventId, activeJobId);

    const handleSave = async () => {
        if (!form.name?.trim()) return;
        if (editing != null) {
            await updateTemplate.mutateAsync({ eventId, id: editing, template: form });
            setEditing(null);
        } else {
            await createTemplate.mutateAsync({ eventId, template: form });
        }
        setForm({});
        setShowCreate(false);
    };

    const handleEdit = (tpl: EventInviteTemplate) => {
        setForm({ name: tpl.name, subject: tpl.subject, bodyHtml: tpl.bodyHtml, bodyText: tpl.bodyText });
        setEditing(tpl.id);
        setShowCreate(true);
    };

    const handleBulkInvite = async () => {
        const emails = bulkEmails.split(/[,;\s]+/).filter(e => e.includes("@"));
        if (emails.length === 0) return;
        const result = await bulkInvite.mutateAsync({
            eventId,
            request: { templateId: selectedTemplate ?? undefined, emails },
        });
        setActiveJobId(result.jobId);
        setBulkEmails("");
    };

    if (!isOrganizer) return null;

    return (
        <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0"><i className="fa fa-file-text me-1" />{t("inviteTemplates.title", "Invite Templates")}</h6>
                <button className="btn btn-outline-primary btn-sm" onClick={() => { setShowCreate(s => !s); setEditing(null); setForm({}); }}>
                    <i className="fa fa-plus me-1" />{t("common.add", "Add")}
                </button>
            </div>

            {/* Create/Edit form */}
            {showCreate && (
                <div style={cardStyle}>
                    <div className="row g-2">
                        <div className="col-md-4">
                            <input className="form-control form-control-sm" placeholder={t("inviteTemplates.name", "Template name")}
                                value={form.name ?? ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="col-md-8">
                            <input className="form-control form-control-sm" placeholder={t("inviteTemplates.subject", "Email subject")}
                                value={form.subject ?? ""} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                        </div>
                        <div className="col-12">
                            <textarea className="form-control form-control-sm" rows={3} placeholder={t("inviteTemplates.body", "Email body (HTML)")}
                                value={form.bodyHtml ?? ""} onChange={e => setForm(p => ({ ...p, bodyHtml: e.target.value }))} />
                        </div>
                    </div>
                    <button className="btn btn-success btn-sm mt-2" onClick={handleSave}
                        disabled={createTemplate.isPending || updateTemplate.isPending}>
                        {editing != null ? t("common.update", "Update") : t("common.save", "Save")}
                    </button>
                    {editing != null && (
                        <button className="btn btn-outline-secondary btn-sm mt-2 ms-2" onClick={() => { setEditing(null); setForm({}); setShowCreate(false); }}>
                            {t("common.cancel", "Cancel")}
                        </button>
                    )}
                </div>
            )}

            {/* Templates list */}
            {templatesQ.isLoading && <p className="text-muted small">{t("common.loading", "Loading...")}</p>}
            {(templatesQ.data ?? []).map(tpl => (
                <div key={tpl.id} style={cardStyle} className="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>{tpl.name}</strong>
                        {tpl.subject && <span className="text-muted ms-2 small">— {tpl.subject}</span>}
                    </div>
                    <div className="d-flex gap-1">
                        <button className="btn btn-outline-info btn-sm" onClick={() => handleEdit(tpl)}>
                            <i className="fa fa-edit" />
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => deleteTemplate.mutate({ eventId, id: tpl.id })}>
                            <i className="fa fa-trash" />
                        </button>
                    </div>
                </div>
            ))}

            {/* Bulk invite */}
            <div style={{ ...cardStyle, marginTop: 16 }}>
                <h6><i className="fa fa-paper-plane me-1" />{t("inviteTemplates.bulkTitle", "Bulk Invite")}</h6>
                <div className="mb-2">
                    <select className="form-select form-select-sm" value={selectedTemplate ?? ""}
                        onChange={e => setSelectedTemplate(e.target.value ? Number(e.target.value) : null)}>
                        <option value="">{t("inviteTemplates.noTemplate", "Without template")}</option>
                        {(templatesQ.data ?? []).map(tpl => (
                            <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                        ))}
                    </select>
                </div>
                <textarea className="form-control form-control-sm mb-2" rows={2}
                    placeholder={t("inviteTemplates.bulkEmails", "Email addresses (comma or newline separated)")}
                    value={bulkEmails} onChange={e => setBulkEmails(e.target.value)} />
                <button className="btn btn-primary btn-sm" onClick={handleBulkInvite} disabled={bulkInvite.isPending}>
                    <i className="fa fa-send me-1" />{t("inviteTemplates.sendBulk", "Send Bulk Invites")}
                </button>

                {/* Job status */}
                {activeJobId && bulkStatusQ.data && (
                    <div className="mt-2 p-2" style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 13 }}>
                        <div>{t("inviteTemplates.jobStatus", "Status")}: <strong>{bulkStatusQ.data.status}</strong></div>
                        <div>{t("inviteTemplates.jobSent", "Sent")}: {bulkStatusQ.data.sent ?? 0} / {bulkStatusQ.data.total ?? 0}</div>
                        {(bulkStatusQ.data.failed ?? 0) > 0 && <div className="text-danger">{t("inviteTemplates.jobFailed", "Failed")}: {bulkStatusQ.data.failed}</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(EventInviteTemplatesPanel);
