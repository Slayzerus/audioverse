import React from "react";
import { useTranslation } from "react-i18next";
import { AuditLogDto } from "../../types/securityTypes";

interface AuditLogTableProps {
  logs: AuditLogDto[];
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs }) => {
  const { t } = useTranslation();
  return (
  <div style={{ overflowX: 'auto' }}><table style={{ width: "100%", color: "var(--text-primary, #fff)", background: "var(--card-bg, #181818)", borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th scope="col">{t('auditLog.action')}</th>
        <th scope="col">{t('auditLog.details')}</th>
        <th scope="col">{t('auditLog.timestamp')}</th>
      </tr>
    </thead>
    <tbody>
      {logs.map(log => (
        <tr key={log.id}>
          <td>{log.action}</td>
          <td>{log.details || ""}</td>
          <td>{new Date(log.timestamp).toLocaleString()}</td>
        </tr>
      ))}
    </tbody>
  </table></div>
  );
};

export default AuditLogTable;
