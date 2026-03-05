import React, { useState, useEffect } from "react";
import * as apiAdmin from "../../scripts/api/apiAdmin";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { useToast } from "../../components/ui/ToastProvider";
import { useTranslation } from 'react-i18next';
import { UserDetailsDto } from "../../models/modelsAdmin";

const AdminUsersPage: React.FC = () => {
    const { t } = useTranslation();
    const confirm = useConfirm();
    const { showToast } = useToast();
    const [users, setUsers] = useState<UserDetailsDto[]>([]);
    const [editCell, setEditCell] = useState<{ userId: number; field: 'email' | 'fullName' | 'requirePasswordChange' | 'passwordExpiryDate' } | null>(null);
    const [editValue, setEditValue] = useState<string | boolean>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [otpModal, setOtpModal] = useState<{ open: boolean; otp: string | null; expiresAt?: string | null }>({ open: false, otp: null, expiresAt: null });
    const handleGenerateOtp = async (userId: number) => {
        try {
            const res = await apiAdmin.generateOtpForUser(userId);
            if (res?.otp) {
                setOtpModal({ open: true, otp: res.otp, expiresAt: res.expiresAt });
            } else {
                setOtpModal({ open: true, otp: t('admin.otpError'), expiresAt: null });
            }
        } catch (_err) {
            setOtpModal({ open: true, otp: t('admin.otpError'), expiresAt: null });
        }
    };
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        fullName: "",
        password: "",
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await apiAdmin.getAllUsers();
            setUsers(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('admin.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Mapuj na typ wymagany przez backend
            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
            };
            await apiAdmin.createUser(payload);
            setFormData({ username: "", email: "", fullName: "", password: "" });
            setShowCreateForm(false);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('admin.createError'));
        }
    };

    const handleDeleteUser = async (userId: number) => {
        try {
            const ok = await confirm(t('admin.deleteConfirm'));
            if (!ok) return;
            await apiAdmin.deleteUser(userId);
            await loadUsers();
        } catch (err) {
            showToast(err instanceof Error ? err.message : t('admin.deleteError'), 'error');
            setError(err instanceof Error ? err.message : t('admin.deleteError'));
        }
    };

    const handleBlockUser = async (userId: number) => {
        try {
            const user = users.find(u => u.id === userId);
            if (!user) return;
            // Toggle block state
            await apiAdmin.blockUser(userId, { isBlocked: !user.isBlocked });
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('admin.blockError'));
        }
    };

    // Save edited value to backend
    const handleSaveEdit = async (userId: number, field: 'email' | 'fullName' | 'requirePasswordChange' | 'passwordExpiryDate') => {
        try {
            setLoading(true);
            if (field === 'email') {
                await apiAdmin.updateUserDetails(userId, { email: String(editValue) });
            } else if (field === 'fullName') {
                await apiAdmin.updateUserDetails(userId, { fullName: String(editValue) });
            } else if (field === 'requirePasswordChange') {
                await apiAdmin.updateUserDetails(userId, { requirePasswordChange: !!editValue });
            } else if (field === 'passwordExpiryDate') {
                await apiAdmin.updateUserDetails(userId, { passwordExpiryDate: String(editValue) });
            }
            setEditCell(null);
            setEditValue("");
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('admin.updateError'));
        } finally {
            setLoading(false);
        }
    };

    // After clicking a cell, start editing
    const handleCellClick = (userId: number, field: 'email' | 'fullName' | 'requirePasswordChange' | 'passwordExpiryDate', currentValue: string | boolean | undefined) => {
        setEditCell({ userId, field });
        setEditValue(currentValue ?? "");
    };

    // Po utracie focusa lub enterze, zapisz
    const handleEditBlur = (userId: number, field: 'email' | 'fullName' | 'requirePasswordChange' | 'passwordExpiryDate') => {
        handleSaveEdit(userId, field);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, userId: number, field: 'email' | 'fullName' | 'passwordExpiryDate') => {
        if (e.key === 'Enter') {
            handleSaveEdit(userId, field);
        } else if (e.key === 'Escape') {
            setEditCell(null);
            setEditValue("");
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: 0 }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 0, letterSpacing: 0.5 }}>{t('admin.users')}</h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    style={{
                        width: 40,
                        height: 40,
                        minWidth: 40,
                        minHeight: 40,
                        fontSize: '1.7rem',
                        borderRadius: '50%',
                        background: 'var(--card-bg, #fff)',
                        color: 'var(--text-primary, #222)',
                        fontWeight: 700,
                        border: '1px solid var(--border-color, #ddd)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 0,
                        marginLeft: 0
                    }}
                    title={showCreateForm ? t('common.cancel') : t('admin.createUser')}
                >
                    {showCreateForm ? '×' : '+'}
                </button>
            </div>

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

            {showCreateForm && (
                <form onSubmit={handleCreateUser} style={{
                    border: "1px solid var(--border-color, #ddd)",
                    padding: "20px",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    maxWidth: "500px"
                }}>
                    <input
                        type="text"
                        placeholder={t('admin.usernamePlaceholder')}
                        aria-label={t('admin.usernamePlaceholder')}
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                    <input
                        type="email"
                        placeholder={t('admin.emailPlaceholder')}
                        aria-label={t('admin.emailPlaceholder')}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder={t('admin.fullNamePlaceholder')}
                        aria-label={t('admin.fullNamePlaceholder')}
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    <input
                        type="password"
                        placeholder={t('admin.tempPasswordPlaceholder')}
                        aria-label={t('admin.tempPasswordPlaceholder')}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                    <button type="submit">{t('admin.createUser')}</button>
                </form>
            )}

                {loading ? (
                <p>{t('admin.loadingUsers')}</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px"
                }}>
                    <thead>
                        <tr style={{ backgroundColor: "var(--card-elevated, #232323)" }}>
                            <th scope="col" style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid var(--border-secondary, #444)", color: 'var(--text-primary, #fff)', background: 'inherit' }}>{t('admin.tableId')}</th>
                            <th scope="col" style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid var(--border-secondary, #444)", color: 'var(--text-primary, #fff)', background: 'inherit' }}>{t('admin.tableUsername')}</th>
                            <th scope="col" style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid var(--border-secondary, #444)", color: 'var(--text-primary, #fff)', background: 'inherit' }}>{t('admin.tableEmail')}</th>
                            <th scope="col" style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid var(--border-secondary, #444)", color: 'var(--text-primary, #fff)', background: 'inherit' }}>{t('admin.tableName')}</th>
                            <th scope="col" style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid var(--border-secondary, #444)", color: 'var(--text-primary, #fff)', background: 'inherit' }}>{t('admin.tablePasswordChange')}</th>
                            <th scope="col" style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid var(--border-secondary, #444)", color: 'var(--text-primary, #fff)', background: 'inherit' }}>{t('admin.tablePasswordExpiry')}</th>
                            <th scope="col" style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid var(--border-secondary, #444)", color: 'var(--text-primary, #fff)', background: 'inherit' }}>{t('admin.tableStatus')}</th>
                            <th scope="col" style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid var(--border-secondary, #444)", color: 'var(--text-primary, #fff)', background: 'inherit' }}>{t('admin.tableActions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} style={{ borderBottom: "1px solid var(--border-color, #ddd)" }}>
                                <td style={{ padding: "10px" }}>{user.id}</td>
                                <td style={{ padding: "10px" }}>{user.userName}</td>
                                {/* Email edytowalny */}
                                <td
                                    style={{ padding: "10px", cursor: "pointer", minWidth: 120 }}
                                    onClick={() => handleCellClick(user.id, 'email', user.email)}
                                >
                                    {editCell && editCell.userId === user.id && editCell.field === 'email' ? (
                                        <input
                                            type="email"
                                            value={String(editValue)}
                                            autoFocus
                                            style={{ fontSize: 14, padding: 2, width: '100%' }}
                                            onChange={e => setEditValue(e.target.value)}
                                            onBlur={() => handleEditBlur(user.id, 'email')}
                                            onKeyDown={e => handleEditKeyDown(e, user.id, 'email')}
                                        />
                                    ) : (
                                        user.email
                                    )}
                                </td>
                                {/* Name edytowalny */}
                                <td
                                    style={{ padding: "10px", cursor: "pointer", minWidth: 120 }}
                                    onClick={() => handleCellClick(user.id, 'fullName', user.fullName || "")}
                                >
                                    {editCell && editCell.userId === user.id && editCell.field === 'fullName' ? (
                                        <input
                                            type="text"
                                            value={String(editValue)}
                                            autoFocus
                                            style={{ fontSize: 14, padding: 2, width: '100%' }}
                                            onChange={e => setEditValue(e.target.value)}
                                            onBlur={() => handleEditBlur(user.id, 'fullName')}
                                            onKeyDown={e => handleEditKeyDown(e, user.id, 'fullName')}
                                        />
                                    ) : (
                                        user.fullName
                                    )}
                                </td>
                                {/* Password change editable */}
                                <td
                                    style={{ padding: "10px", cursor: "pointer", textAlign: 'center' }}
                                    onClick={() => handleCellClick(user.id, 'requirePasswordChange', user.requirePasswordChange)}
                                >
                                    {editCell && editCell.userId === user.id && editCell.field === 'requirePasswordChange' ? (
                                        <input
                                            type="checkbox"
                                            checked={!!editValue}
                                            autoFocus
                                            onChange={e => setEditValue(e.target.checked)}
                                            onBlur={() => handleEditBlur(user.id, 'requirePasswordChange')}
                                        />
                                    ) : (
                                        <input
                                            type="checkbox"
                                            checked={!!user.requirePasswordChange}
                                            readOnly
                                            style={{ pointerEvents: 'none' }}
                                        />
                                    )}
                                </td>
                                {/* Password expiry date editable */}
                                <td
                                    style={{ padding: "10px", cursor: "pointer", minWidth: 140 }}
                                    onClick={() => handleCellClick(user.id, 'passwordExpiryDate', user.passwordExpiryDate ? user.passwordExpiryDate.substring(0, 10) : "")}
                                >
                                    {editCell && editCell.userId === user.id && editCell.field === 'passwordExpiryDate' ? (
                                        <input
                                            type="date"
                                            value={String(editValue)}
                                            autoFocus
                                            style={{ fontSize: 14, padding: 2, width: '100%' }}
                                            onChange={e => setEditValue(e.target.value)}
                                            onBlur={() => handleEditBlur(user.id, 'passwordExpiryDate')}
                                            onKeyDown={e => handleEditKeyDown(e, user.id, 'passwordExpiryDate')}
                                        />
                                    ) : (
                                        user.passwordExpiryDate ? user.passwordExpiryDate.substring(0, 10) : ""
                                    )}
                                </td>
                                <td style={{ padding: "10px" }}>
                                    {user.isBlocked ? t('admin.blocked') : t('admin.activeStatus')}
                                </td>
                                <td style={{ padding: "10px", display: "flex", gap: "5px", alignItems: "center" }}>
                                    <button
                                        onClick={() => handleBlockUser(user.id)}
                                        style={{ padding: "5px 10px", fontSize: "12px" }}
                                    >
                                        {user.isBlocked ? t('admin.unblock') : t('admin.block')}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        style={{ padding: "5px 10px", fontSize: "12px", backgroundColor: "var(--error, #ff6b6b)", color: "var(--btn-text, #fff)" }}
                                    >
                                        {t('admin.deleteBtn')}
                                    </button>
                                    <button
                                        onClick={() => handleGenerateOtp(user.id)}
                                        style={{ padding: "5px 10px", fontSize: "12px", backgroundColor: "var(--gold-light, #ffd700)", color: "var(--text-primary, #222)" }}
                                    >
                                        {t('admin.otpBtn')}
                                    </button>
                                    {/* OTP status removed, now shown in modal */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            )}

        {/* OTP Modal Popup */}
        {otpModal.open && (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}>
                <div style={{
                    background: '#fff',
                    padding: 32,
                    borderRadius: 12,
                    boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
                    minWidth: 'min(320px, 90vw)',
                    textAlign: 'center',
                    position: 'relative'
                }}>
                    <h3 style={{ marginBottom: 16, color: '#222' }}>{t('admin.generatedOtp')}</h3>
                    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: '#111' }}>{otpModal.otp}</div>
                    {otpModal.expiresAt && (
                        <div style={{ fontSize: 14, color: '#333', marginBottom: 12 }}>
                            {t('admin.validUntil', { date: new Date(otpModal.expiresAt).toLocaleString() })}
                        </div>
                    )}
                    <button
                        onClick={() => {
                        if (otpModal.otp && otpModal.otp !== t('admin.otpError')) {
                            navigator.clipboard.writeText(otpModal.otp);
                        }
                    }}
                    style={{ marginRight: 12, padding: '8px 18px', fontSize: 16 }}
                    >{t('common.copy')}</button>
                    <button
                        onClick={() => setOtpModal({ open: false, otp: null, expiresAt: null })}
                        style={{ padding: '8px 18px', fontSize: 16 }}
                    >{t('common.close')}</button>
                </div>
            </div>
        )}
        {/* Close main container div */}
        </div>
    );
};

export default AdminUsersPage;
