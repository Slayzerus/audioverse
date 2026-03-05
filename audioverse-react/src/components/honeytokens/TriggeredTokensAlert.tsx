import React from "react";
import { useTranslation } from 'react-i18next';
import { TriggeredHoneyTokenDto } from "../../types/securityTypes";

interface TriggeredTokensAlertProps {
  tokens: TriggeredHoneyTokenDto[];
}

const TriggeredTokensAlert: React.FC<TriggeredTokensAlertProps> = ({ tokens }) => {
  const { t } = useTranslation();
  return (
    <div style={{ margin: "16px 0" }}>
      {tokens.length === 0 ? null : (
        <div style={{ background: "var(--error-bg)", color: "var(--text-primary)", padding: 12, borderRadius: 8, border: "2px solid var(--error)" }}>
          <b>{t('honeyTokens.triggeredHeading', 'Triggered Honeytokens:')}</b>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {tokens.map(tk => (
              <li key={tk.tokenId + tk.triggeredAt}>
                <span style={{ color: "var(--error)", fontWeight: 600 }}>●</span> {t('honeyTokens.tokenTriggered', 'Token #{{id}} triggered at {{time}}', { id: tk.tokenId, time: new Date(tk.triggeredAt).toLocaleString() })} {tk.details ? `(${tk.details})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TriggeredTokensAlert;
