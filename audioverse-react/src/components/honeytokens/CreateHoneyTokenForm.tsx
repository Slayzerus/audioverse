import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { createHoneyToken } from "../../services/honeyTokenService";

const TOKEN_TYPES = ["HTTP", "DNS", "Database", "Email"];

const CreateHoneyTokenForm: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const { t } = useTranslation();
  const [type, setType] = useState("HTTP");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createHoneyToken({ type, description });
      onCreated();
      setDescription("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('honeyTokens.createError', 'Failed to create token'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
      <select value={type} onChange={e => setType(e.target.value)} aria-label="Token type">
        {TOKEN_TYPES.map(tt => <option key={tt} value={tt}>{tt}</option>)}
      </select>
      <input
        type="text"
        placeholder={t('honeyTokens.description', 'Description')}
        value={description}
        onChange={e => setDescription(e.target.value)}
        style={{ width: 180 }}
        aria-label="Token description"
      />
      <button type="submit" disabled={loading}>{loading ? t('honeyTokens.creating', 'Creating...') : t('honeyTokens.createToken', 'Create Token')}</button>
      {error && <span style={{ color: "red" }}>{error}</span>}
    </form>
  );
};

export default CreateHoneyTokenForm;
