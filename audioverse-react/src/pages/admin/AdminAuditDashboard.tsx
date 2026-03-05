import React, { useEffect, useState } from "react";
import { getAllAuditLogs } from "../../services/auditService";
import AuditLogTable from "../../components/audit/AuditLogTable";
import LogFilterPanel from "../../components/audit/LogFilterPanel";
import { AuditLogDto } from "../../types/securityTypes";
import { useTranslation } from "react-i18next";

const AdminAuditDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAllAuditLogs()
      .then(res => setLogs(Array.isArray(res) ? res : []))
      .catch(() => setError(t('adminAudit.fetchError', 'Failed to fetch audit logs.')))
      .finally(() => setLoading(false));
  }, [action, dateFrom, dateTo, username]);

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", background: "var(--card-bg)", padding: 'clamp(12px, 3vw, 32px)', borderRadius: 12 }}>
      <h2 style={{ color: "var(--accent-primary)" }}>{t('adminAudit.title', 'All Audit Logs (Admin)')}</h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <input type="text" placeholder={t('adminAudit.username', 'Username')} value={username} onChange={e => setUsername(e.target.value)} aria-label={t('adminAudit.filterByUsername', 'Filter by username')} />
        <LogFilterPanel
          actionTypes={["Login", "Logout", "ChangePassword", "DownloadReport"]}
          selectedAction={action}
          onActionChange={setAction}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
        />
      </div>
      {loading && <div style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>{t('adminAudit.loading', 'Loading...')}</div>}
      {error && <div style={{ color: 'var(--error)', margin: '16px 0' }}>{error}</div>}
      {!loading && !error && <AuditLogTable logs={logs} />}
    </div>
  );
};

export default AdminAuditDashboard;
