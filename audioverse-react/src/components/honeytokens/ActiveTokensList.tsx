import React from "react";
import { useTranslation } from "react-i18next";
import { HoneyTokenDto } from "../../types/securityTypes";

interface ActiveTokensListProps {
  tokens: HoneyTokenDto[];
}

const ActiveTokensList: React.FC<ActiveTokensListProps> = ({ tokens }) => {
  const { t } = useTranslation();
  return (
  <div style={{ overflowX: 'auto' }}><table style={{ width: "100%", color: "var(--text-primary)", background: "var(--card-bg)", borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th scope="col">{t('activeTokens.type')}</th>
        <th scope="col">{t('activeTokens.description')}</th>
        <th scope="col">{t('activeTokens.tokenId')}</th>
      </tr>
    </thead>
    <tbody>
      {tokens.map(token => (
        <tr key={token.id}>
          <td>{token.type}</td>
          <td>{token.description}</td>
          <td>{token.id}</td>
        </tr>
      ))}
    </tbody>
  </table></div>
  );
};

export default ActiveTokensList;
