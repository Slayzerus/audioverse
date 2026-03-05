import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ui/ToastProvider";
import * as apiAdmin from "../../scripts/api/apiAdmin";
import { PasswordRequirementsDto } from "../../models/modelsAdmin";
import './adminPasswordRequirements.module.css';

interface PasswordRequirementEntry extends PasswordRequirementsDto {
    id?: number;
    active?: boolean;
    description?: string;
}

const AdminPasswordRequirementsPage: React.FC = () => {
    const { t } = useTranslation();
    const [requirements, setRequirements] = useState<PasswordRequirementEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadRequirements();
    }, []);

    const loadRequirements = async () => {
        try {
            setLoading(true);
            const data = await apiAdmin.getPasswordRequirements();
            if (Array.isArray(data)) {
                setRequirements(data);
            } else {
                setRequirements([]);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('adminPasswordReqs.errorLoad'));
        } finally {
            setLoading(false);
        }
    };

    const { showToast } = useToast();

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await apiAdmin.setPasswordRequirements(requirements);
            setError(null);
            showToast(t('adminPasswordReqs.successSaved'), 'success');
        } catch (err) {
            setError(err instanceof Error ? err.message : t('adminPasswordReqs.errorSave'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleFieldChange = (idx: number, key: string, value: string | number | boolean) => {
        setRequirements(reqs => reqs.map((r, i) => i === idx ? { ...r, [key]: value } : r));
    };

    return (
        <div style={{
            width: "100%",
            height: "100%",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflow: "auto"
        }}>
            <h1>{t('adminPasswordReqs.title')}</h1>

            {error && (
                <div style={{
                    padding: "10px",
                    backgroundColor: "var(--error-bg, #ffcccc)",
                    borderRadius: "4px",
                    color: "var(--error, #cc0000)"
                }}>
                    {error}
                </div>
            )}

            {loading ? (
                <p>{t('adminPasswordReqs.loading')}</p>
            ) : requirements && requirements.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: "collapse", width: "100%", background: "var(--card-bg, #fff)" }}>
                    <thead>
                        <tr style={{ background: 'var(--card-elevated, #232323)' }}>
                            <th style={{ color: 'var(--text-primary, #fff)', padding: '10px', fontWeight: 700 }}>{t('adminPasswordReqs.colId')}</th>
                            <th style={{ color: 'var(--text-primary, #fff)', padding: '10px', fontWeight: 700 }}>{t('adminPasswordReqs.colActive')}</th>
                            <th style={{ color: 'var(--text-primary, #fff)', padding: '10px', fontWeight: 700 }}>{t('adminPasswordReqs.colDescription')}</th>
                            <th style={{ color: 'var(--text-primary, #fff)', padding: '10px', fontWeight: 700 }}>{t('adminPasswordReqs.colMin')}</th>
                            <th style={{ color: 'var(--text-primary, #fff)', padding: '10px', fontWeight: 700 }}>{t('adminPasswordReqs.colMax')}</th>
                            <th style={{ color: 'var(--text-primary, #fff)', padding: '10px', fontWeight: 700 }}>{t('adminPasswordReqs.colUpper')}</th>
                            <th style={{ color: 'var(--text-primary, #fff)', padding: '10px', fontWeight: 700 }}>{t('adminPasswordReqs.colLower')}</th>
                            <th style={{ color: 'var(--text-primary, #fff)', padding: '10px', fontWeight: 700 }}>{t('adminPasswordReqs.colDigit')}</th>
                            <th style={{ color: 'var(--text-primary, #fff)', padding: '10px', fontWeight: 700 }}>{t('adminPasswordReqs.colSpecial')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requirements.map((req, idx) => (
                            <tr key={req.id || idx} style={{ background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                                <td>{req.id}</td>
                                <td>
                                    <input type="checkbox" checked={!!req.active} onChange={e => handleFieldChange(idx, "active", e.target.checked)} />
                                </td>
                                <td>
                                    <input type="text" value={req.description || ""} onChange={e => handleFieldChange(idx, "description", e.target.value)} style={{ width: 180 }} />
                                </td>
                                <td>
                                    <input type="number" value={req.minLength || 0} min={0} max={128} onChange={e => handleFieldChange(idx, "minLength", parseInt(e.target.value) || 0)} style={{ width: 60 }} />
                                </td>
                                <td>
                                    <input type="number" value={req.maxLength || 0} min={0} max={1024} onChange={e => handleFieldChange(idx, "maxLength", parseInt(e.target.value) || 0)} style={{ width: 60 }} />
                                </td>
                                <td>
                                    <input type="checkbox" checked={!!req.requireUppercase} onChange={e => handleFieldChange(idx, "requireUppercase", e.target.checked)} />
                                </td>
                                <td>
                                    <input type="checkbox" checked={!!req.requireLowercase} onChange={e => handleFieldChange(idx, "requireLowercase", e.target.checked)} />
                                </td>
                                <td>
                                    <input type="checkbox" checked={!!req.requireDigit} onChange={e => handleFieldChange(idx, "requireDigit", e.target.checked)} />
                                </td>
                                <td>
                                    <input type="checkbox" checked={!!req.requireSpecialChar} onChange={e => handleFieldChange(idx, "requireSpecialChar", e.target.checked)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            ) : (
                <p>{t('adminPasswordReqs.noData')}</p>
            )}
            <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                    padding: "10px 20px",
                    backgroundColor: "var(--success, #4CAF50)",
                    color: "var(--btn-text, white)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "16px",
                    marginTop: "10px",
                    maxWidth: 200
                }}
            >
                {isSaving ? t('adminPasswordReqs.saving') : t('adminPasswordReqs.saveChanges')}
            </button>
        </div>
    );
};

export default AdminPasswordRequirementsPage;
