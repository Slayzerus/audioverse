import React from "react";
import { useTranslation } from 'react-i18next';

interface PasswordRulesListProps {
  rules: { label: string; valid: boolean }[];
}

const PasswordRulesList: React.FC<PasswordRulesListProps> = ({ rules }) => {
  const { t } = useTranslation();
  return (
    <div style={{ margin: "12px 0" }}>
      <h4 style={{ color: "var(--text-primary, #fff)", fontSize: 18, marginBottom: 8 }}>{t('passwordRulesList.heading', 'Password Requirements:')}</h4>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {rules.map((rule, idx) => (
          <li key={idx} style={{ color: rule.valid ? "var(--success, #4caf50)" : "var(--error, #f44336)" }}>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordRulesList;
