import React, { useState } from "react";
import * as apiAdmin from "../../scripts/api/apiAdmin";
import { ChangeAdminPasswordCommand } from "../../models/modelsAdmin";
import { useTranslation } from "react-i18next";

const AdminSettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const [passwordForm, setPasswordForm] = useState<ChangeAdminPasswordCommand>({
        currentPassword: "",
        newPassword: "",
    });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwordForm.newPassword !== confirmPassword) {
            setError(t('adminSettings.errorPasswordsMismatch'));
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setError(t('adminSettings.errorPasswordTooShort'));
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            setSuccess(null);
            
            await apiAdmin.changeAdminPassword(passwordForm);
            
            setPasswordForm({ currentPassword: "", newPassword: "" });
            setConfirmPassword("");
            setSuccess(t('adminSettings.successPasswordChanged'));
        } catch (err) {
            setError(err instanceof Error ? err.message : t('adminSettings.errorChangeFailed'));
        } finally {
            setIsSaving(false);
        }
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
            <h1>{t('adminSettings.title')}</h1>

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

            {success && (
                <div style={{
                    padding: "10px",
                    backgroundColor: "var(--success-bg, #ccffcc)",
                    borderRadius: "4px",
                    color: "var(--success, #00cc00)"
                }}>
                    {success}
                </div>
            )}

            <div style={{
                border: "1px solid var(--border-color, #ddd)",
                padding: "20px",
                borderRadius: "8px",
                maxWidth: "min(500px, 100%)",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
            }}>
                <h2>{t('adminSettings.changePassword')}</h2>
                
                <form onSubmit={handlePasswordChange} style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px"
                }}>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                    }}>
                        <label htmlFor="currentPassword">{t('adminSettings.currentPassword')}</label>
                        <input
                            type="password"
                            id="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value
                            })}
                            placeholder={t('adminSettings.placeholderCurrentPassword')}
                            required
                                style={{
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid var(--border-color, #ddd)",
                                fontSize: "14px"
                            }}
                        />
                    </div>

                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                    }}>
                        <label htmlFor="newPassword">{t('adminSettings.newPassword')}</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({
                                ...passwordForm,
                                newPassword: e.target.value
                            })}
                            placeholder={t('adminSettings.placeholderNewPassword')}
                            required
                            style={{
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ddd",
                                fontSize: "14px"
                            }}
                        />
                    </div>

                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                    }}>
                        <label htmlFor="confirmPassword">{t('adminSettings.confirmPassword')}</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('adminSettings.placeholderConfirmPassword')}
                            required
                            style={{
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ddd",
                                fontSize: "14px"
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        style={{
                                padding: "10px 20px",
                                backgroundColor: "var(--success, #4CAF50)",
                                color: "var(--btn-text, #fff)",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "16px",
                                marginTop: "10px"
                            }}
                    >
                        {isSaving ? t('adminSettings.changing') : t('adminSettings.changePasswordBtn')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminSettingsPage;
