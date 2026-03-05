
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import StatCard from "../../components/common/StatCard";
import { SimpleLineChart, SimpleBarChart } from "../../components/common/Charts";
import { getAllAuditLogs } from "../../services/auditService";
import { getTriggeredHoneyTokens } from "../../services/honeyTokenService";
import type { AuditLogDto, TriggeredHoneyTokenDto } from "../../types/securityTypes";

const SecurityDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [honeytokens, setHoneytokens] = useState<TriggeredHoneyTokenDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getAllAuditLogs(),
      getTriggeredHoneyTokens(),
    ])
      .then(([logsRes, honeyRes]) => {
        setAuditLogs(Array.isArray(logsRes) ? logsRes : []);
        setHoneytokens(Array.isArray(honeyRes) ? honeyRes : []);
      })
      .catch((_e) => {
        setError(t('securityDashboard.loadError', 'Failed to load analytics data'));
      })
      .finally(() => setLoading(false));
  }, []);

  // Example metrics
  const totalAuditEvents = auditLogs.length;
  const totalTriggeredHoneytokens = honeytokens.length;
  // Add more metrics as needed

  // Group audit logs by day for trend chart
  const auditLogsByDay = auditLogs.reduce((acc: Record<string, number>, log: AuditLogDto) => {
    const date = log.timestamp ? log.timestamp.slice(0, 10) : "unknown";
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  const auditTrendData = Object.entries(auditLogsByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group honeytokens by day for bar chart
  const honeyByDay = honeytokens.reduce((acc: Record<string, number>, token: TriggeredHoneyTokenDto) => {
    const date = token.triggeredAt ? token.triggeredAt.slice(0, 10) : "unknown";
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  const honeyTrendData = Object.entries(honeyByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", background: "var(--card-bg)", padding: 'clamp(12px, 3vw, 32px)', borderRadius: 12 }}>
      <h2 style={{ color: "goldenrod" }}>{t('securityDashboard.title')}</h2>
      <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
        <StatCard label="Total Audit Events" value={totalAuditEvents} color="var(--success)" />
        <StatCard label="Triggered Honeytokens" value={totalTriggeredHoneytokens} color="var(--error)" />
      </div>
      <div style={{ color: 'var(--text-primary)', marginTop: 32 }}>
        {loading && <p>{t('securityDashboard.loading')}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          <>
            <div style={{ margin: '32px 0', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 'min(320px, 100%)' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>{t('securityDashboard.auditEventsTrend')}</h4>
                <SimpleLineChart data={auditTrendData} xKey="date" yKey="count" color="var(--success)" />
              </div>
              <div style={{ flex: 1, minWidth: 'min(320px, 100%)' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>{t('securityDashboard.honeytokensTrend')}</h4>
                <SimpleBarChart data={honeyTrendData} xKey="date" yKey="count" color="var(--error)" />
              </div>
            </div>
            <p style={{ color: 'var(--text-muted, #aaa)' }}>{t('securityDashboard.comingSoon')}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;
