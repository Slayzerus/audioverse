import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const cardStyle: React.CSSProperties = {
    padding: "20px",
    backgroundColor: "#f0f0f0",
    borderRadius: "8px",
    textDecoration: "none",
    color: "inherit",
    border: "1px solid #ddd",
    cursor: "pointer",
};

const AdminDashboard: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div style={{
            width: "100%",
            height: "100%",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflow: "auto",
        }}>
            <h1>{t('adminDashboard.title')}</h1>

            {/* ── Management ───────────────────────────── */}
            <h2 style={{ margin: 0, fontSize: "16px", color: "#888" }}>
                {t('adminDashboard.sectionManagement', 'Zarządzanie')}
            </h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
            }}>
                <Link to="/admin/users" style={cardStyle}>
                    <h3>{t('adminDashboard.userManagement')}</h3>
                    <p>{t('adminDashboard.userManagementDesc')}</p>
                </Link>

                <Link to="/admin/password-requirements" style={cardStyle}>
                    <h3>{t('adminDashboard.passwordRequirements')}</h3>
                    <p>{t('adminDashboard.passwordRequirementsDesc')}</p>
                </Link>

                <Link to="/admin/settings" style={cardStyle}>
                    <h3>{t('adminDashboard.adminSettings')}</h3>
                    <p>{t('adminDashboard.adminSettingsDesc')}</p>
                </Link>

                <Link to="/admin/scoring-presets" style={cardStyle}>
                    <h3>{t('adminDashboard.scoringPresets')}</h3>
                    <p>{t('adminDashboard.scoringPresetsDesc')}</p>
                </Link>

                <Link to="/admin/skins" style={cardStyle}>
                    <h3>{t('adminDashboard.skins')}</h3>
                    <p>{t('adminDashboard.skinsDesc')}</p>
                </Link>

                <Link to="/admin/feature-visibility" style={cardStyle}>
                    <h3>{t('adminDashboard.featureVisibility', 'Feature Visibility')}</h3>
                    <p>{t('adminDashboard.featureVisibilityDesc', 'Włączaj / wyłączaj funkcje aplikacji')}</p>
                </Link>

                <Link to="/admin/news-feeds" style={cardStyle}>
                    <h3>{t('adminDashboard.newsFeeds', 'News Feeds')}</h3>
                    <p>{t('adminDashboard.newsFeedsDesc', 'Zarządzanie kanałami informacyjnymi')}</p>
                </Link>

                <Link to="/admin/asset-manager" style={cardStyle}>
                    <h3>{t('adminDashboard.assetManager')}</h3>
                    <p>{t('adminDashboard.assetManagerDesc')}</p>
                </Link>

                <Link to="/admin/notifications" style={cardStyle}>
                    <h3>{t('adminDashboard.notifications', 'Powiadomienia')}</h3>
                    <p>{t('adminDashboard.notificationsDesc', 'Test SMS (SMSAPI) i e-mail')}</p>
                </Link>
            </div>

            {/* ── Security ─────────────────────────────── */}
            <h2 style={{ margin: 0, fontSize: "16px", color: "#888" }}>
                {t('adminDashboard.sectionSecurity', 'Bezpieczeństwo')}
            </h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
            }}>
                <Link to="/admin/otp" style={cardStyle}>
                    <h3>{t('adminDashboard.otp', 'OTP')}</h3>
                    <p>{t('adminDashboard.otpDesc', 'Zarządzanie jednorazowymi hasłami')}</p>
                </Link>

                <Link to="/admin/audit-logs" style={cardStyle}>
                    <h3>{t('adminDashboard.auditLogs', 'Audit Logs')}</h3>
                    <p>{t('adminDashboard.auditLogsDesc', 'Dziennik zdarzeń systemowych')}</p>
                </Link>

                <Link to="/admin/login-attempts" style={cardStyle}>
                    <h3>{t('adminDashboard.loginAttempts', 'Login Attempts')}</h3>
                    <p>{t('adminDashboard.loginAttemptsDesc', 'Próby logowania użytkowników')}</p>
                </Link>

                <Link to="/admin/audit" style={cardStyle}>
                    <h3>{t('adminDashboard.auditDashboard', 'Audit Dashboard')}</h3>
                    <p>{t('adminDashboard.auditDashboardDesc', 'Przegląd audytu bezpieczeństwa')}</p>
                </Link>

                <Link to="/admin/honeytokens" style={cardStyle}>
                    <h3>{t('adminDashboard.honeytokens', 'Honey Tokens')}</h3>
                    <p>{t('adminDashboard.honeytokensDesc', 'Tokeny-pułapki do wykrywania naruszeń')}</p>
                </Link>

                <Link to="/admin/security-dashboard" style={cardStyle}>
                    <h3>{t('adminDashboard.securityDashboard', 'Security Dashboard')}</h3>
                    <p>{t('adminDashboard.securityDashboardDesc', 'Centralny panel bezpieczeństwa')}</p>
                </Link>

                <Link to={"/admin/diagrams"} style={cardStyle}>
                    <h3>{t('adminDashboard.diagrams', 'Diagramy modelu danych')}</h3>
                    <p>{t('adminDashboard.diagramsDesc', 'Auto-generowany interaktywny diagram ER')}</p>
                </Link>

                <Link to={"/admin/diagram-gallery"} style={cardStyle}>
                    <h3>{t('adminDashboard.diagramGallery', 'Galeria diagramów')}</h3>
                    <p>{t('adminDashboard.diagramGalleryDesc', 'Przeglądaj 16 diagramów architektury (backend + frontend)')}</p>
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboard;
