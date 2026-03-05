import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import apiUser from "../../scripts/api/apiUser";
import type { AuditLogDto } from "../../types/securityTypes";

const AuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ username: "", action: "", date: "" });

  // ── Debounced filter (300 ms) ──
  const [debouncedFilter, setDebouncedFilter] = useState(filter);
  useEffect(() => {
      const timer = setTimeout(() => setDebouncedFilter(filter), 300);
      return () => clearTimeout(timer);
  }, [filter]);

  useEffect(() => {
    const fn = apiUser.getAuditLogsAll;
    if (typeof fn !== "function") {
      setLoading(false);
      return;
    }
    fn()
      .then((data: AuditLogDto[] | { logs: AuditLogDto[] }) => {
        if (Array.isArray(data)) {
          setLogs(data);
        } else if (data && Array.isArray((data as { logs: AuditLogDto[] }).logs)) {
          setLogs((data as { logs: AuditLogDto[] }).logs);
        } else {
          setLogs([]);
        }
      })
      .catch(() => setError(t("auditLogsPage.fetchError")))
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = logs.filter(l =>
    (!debouncedFilter.username || l.username?.toLowerCase().includes(debouncedFilter.username.toLowerCase())) &&
    (!debouncedFilter.action || l.action?.toLowerCase().includes(debouncedFilter.action.toLowerCase())) &&
    (!debouncedFilter.date || l.timestamp?.startsWith(debouncedFilter.date))
  );

  return (
    <div style={{ padding: 32 }}>
      <h2>{t("auditLogsPage.title")}</h2>
      <div style={{ marginBottom: 16 }}>
        <input placeholder={t("auditLogsPage.userPlaceholder")} value={filter.username} onChange={e => setFilter(f => ({ ...f, username: e.target.value }))} style={{ marginRight: 8 }} aria-label={t("auditLogsPage.userAria")} />
        <input placeholder={t("auditLogsPage.actionPlaceholder")} value={filter.action} onChange={e => setFilter(f => ({ ...f, action: e.target.value }))} style={{ marginRight: 8 }} aria-label={t("auditLogsPage.actionAria")} />
        <input type="date" value={filter.date} onChange={e => setFilter(f => ({ ...f, date: e.target.value }))} aria-label={t("auditLogsPage.dateAria")} />
      </div>
      {loading && <div>{t("common.loading")}</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div style={{ overflowX: 'auto' }}>
      <table className="table table-dark table-striped">
        <thead>
          <tr>
            <th scope="col">{t("auditLogsPage.user")}</th>
            <th scope="col">{t("auditLogsPage.date")}</th>
            <th scope="col">{t("auditLogsPage.action")}</th>
            <th scope="col">{t("auditLogsPage.status")}</th>
            <th scope="col">{t("auditLogsPage.ip")}</th>
            <th scope="col">{t("auditLogsPage.userAgent")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: '#aaa' }}>{t("auditLogsPage.empty")}</td>
            </tr>
          ) : filtered.map((l, i) => (
            <tr key={i}>
              <td>{l.username}</td>
              <td>{l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}</td>
              <td>{l.action}{l.description ? `: ${l.description}` : ''}</td>
              <td>{typeof l.success === 'boolean' ? (l.success ? t("common.yes") : t("common.no")) : ''}</td>
              <td>{l.ipAddress}</td>
              <td>{l.userAgent}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default AuditLogsPage;
