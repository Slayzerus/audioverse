import React from "react";
import { AuditLogDto } from "../../types/securityTypes";

interface AuditLogDetailProps {
  log: AuditLogDto;
}

const AuditLogDetail: React.FC<AuditLogDetailProps> = ({ log }) => (
  <div style={{ color: "var(--text-on-dark, #fff)", background: "var(--card-dark-bg, #222)", padding: 16, borderRadius: 8, margin: 8 }}>
    <div><b>Action:</b> {log.action}</div>
    {log.details && <div><b>Details:</b> {log.details}</div>}
    <div><b>Timestamp:</b> {new Date(log.timestamp).toLocaleString()}</div>
  </div>
);

export default AuditLogDetail;
