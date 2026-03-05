import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import apiAdmin from "../../scripts/api/apiAdmin";

interface LoginAttempt {
  id: number;
  userId: number;
  username: string;
  success: boolean;
  attemptTime: string;
  ipAddress: string;
}

const LoginAttemptsPage: React.FC = () => {
  const { t } = useTranslation();
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fn = apiAdmin.getAllLoginAttempts;
    if (typeof fn !== "function") {
      setLoading(false);
      return;
    }
    fn()
      .then((data: { success: boolean; attempts: LoginAttempt[] }) => {
        if (data && data.success && Array.isArray(data.attempts)) {
          setAttempts(data.attempts);
        } else {
          setAttempts([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(t("loginAttemptsPage.fetchError"));
        setLoading(false);
      });
  }, [t]);

  return (
    <div style={{ padding: 32 }}>
      <h2>{t("loginAttemptsPage.title")}</h2>
      {loading && <div>{t("common.loading")}</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div style={{ overflowX: 'auto' }}>
      <table className="table table-dark table-striped">
        <thead>
          <tr>
            <th scope="col">{t("loginAttemptsPage.user")}</th>
            <th scope="col">{t("loginAttemptsPage.date")}</th>
            <th scope="col">{t("loginAttemptsPage.success")}</th>
            <th scope="col">{t("loginAttemptsPage.ip")}</th>
          </tr>
        </thead>
        <tbody>
          {attempts.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted, #aaa)' }}>{t("loginAttemptsPage.empty")}</td></tr>
          ) : attempts.map(a => (
            <tr key={a.id}>
              <td>{a.username}</td>
              <td>{a.attemptTime ? new Date(a.attemptTime).toLocaleString() : ''}</td>
              <td>{a.success ? "✔️" : "❌"}</td>
              <td>{a.ipAddress}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default LoginAttemptsPage;
