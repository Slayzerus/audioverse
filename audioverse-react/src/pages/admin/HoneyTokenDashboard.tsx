import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateHoneyTokenForm from "../../components/honeytokens/CreateHoneyTokenForm";
import ActiveTokensList from "../../components/honeytokens/ActiveTokensList";
import TriggeredTokensAlert from "../../components/honeytokens/TriggeredTokensAlert";
import { getTriggeredHoneyTokens, getHoneyTokens } from "../../services/honeyTokenService";
import type { HoneyTokenDto, TriggeredHoneyTokenDto } from "../../types/securityTypes";

const HoneyTokenDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<HoneyTokenDto[]>([]);
  const [triggered, setTriggered] = useState<TriggeredHoneyTokenDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHoneyTokens();
      setTokens(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (e: unknown) {
      void e;
      setError(t('honeyTokenDashboard.errorFetch'));
    } finally {
      setLoading(false);
    }
  };
  const fetchTriggered = async () => {
    const res = await getTriggeredHoneyTokens();
    setTriggered(res.data || []);
  };

  useEffect(() => {
    fetchTokens();
    fetchTriggered();
    const interval = setInterval(fetchTriggered, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "var(--card-elevated, #181818)", padding: 'clamp(12px, 3vw, 32px)', borderRadius: 12 }}>
      <h2 style={{ color: "var(--gold-light, goldenrod)" }}>{t('honeyTokenDashboard.title')}</h2>
      <CreateHoneyTokenForm onCreated={fetchTokens} />
      {loading && <div style={{ color: 'var(--text-secondary, #aaa)', margin: '16px 0' }}>{t('honeyTokenDashboard.loading')}</div>}
      {error && <div style={{ color: 'var(--error, #f44336)', margin: '16px 0' }}>{error}</div>}
      {!loading && !error && <ActiveTokensList tokens={tokens} />}
      <TriggeredTokensAlert tokens={triggered} />
    </div>
  );
};

export default HoneyTokenDashboard;
