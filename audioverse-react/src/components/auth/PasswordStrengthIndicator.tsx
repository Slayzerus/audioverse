import React from "react";

interface PasswordStrengthIndicatorProps {
  rules: { label: string; valid: boolean }[];
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ rules }) => (
  <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", textAlign: "left" }}>
    {rules.map((rule, idx) => (
      <li key={idx} style={{ color: rule.valid ? "#4caf50" : "#f44336", fontWeight: 500 }}>
        {rule.valid ? "✅" : "❌"} {rule.label}
      </li>
    ))}
  </ul>
);

export default PasswordStrengthIndicator;
