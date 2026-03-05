import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getUserAuditLogs } from "../../services/auditService";
import AuditLogTable from "../../components/audit/AuditLogTable";
import LogFilterPanel from "../../components/audit/LogFilterPanel";
import { AuditLogDto } from "../../types/securityTypes";

const MyAuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getUserAuditLogs({})
      .then((res: AuditLogDto[]) => setLogs(Array.isArray(res) ? res : []))
      .catch(() => setError(t('myAuditLogs.errorFetch')))
      .finally(() => setLoading(false));
  }, [action, dateFrom, dateTo]);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "var(--card-bg)", padding: 'clamp(12px, 3vw, 32px)', borderRadius: 12 }}>
      <h2 style={{ color: "goldenrod" }}>{t('myAuditLogs.title')}</h2>
      <LogFilterPanel
        actionTypes={["Login", "Logout", "ChangePassword", "DownloadReport"]}
        selectedAction={action}
        onActionChange={setAction}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />
      {loading && <div style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>{t('myAuditLogs.loading')}</div>}
      {error && <div style={{ color: 'var(--error)', margin: '16px 0' }}>{error}</div>}
      {!loading && !error && <AuditLogTable logs={logs} />}
    </div>
  );
};

export default MyAuditLogsPage;
