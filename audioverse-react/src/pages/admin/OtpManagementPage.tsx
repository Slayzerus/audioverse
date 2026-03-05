import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getOtpHistory } from "../../scripts/api/apiAdmin";
import { OtpHistoryEntry } from "../../models/modelsAdmin";

const OtpManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [otpHistory, setOtpHistory] = useState<OtpHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOtpHistory()
      .then((data) => setOtpHistory(Array.isArray(data) ? data : []))
      .catch(() => setError(t("otpManagement.fetchError")))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div style={{ padding: 32 }}>
      <h2>{t("otpManagement.title")}</h2>
      {loading && <div>{t("common.loading")}</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div style={{ overflowX: 'auto' }}><table className="table table-dark table-striped">
        <thead>
          <tr>
            <th scope="col">{t("otpManagement.user")}</th>
            <th scope="col">{t("otpManagement.otp")}</th>
            <th scope="col">{t("otpManagement.created")}</th>
            <th scope="col">{t("otpManagement.expires")}</th>
            <th scope="col">{t("otpManagement.used")}</th>
          </tr>
        </thead>
        <tbody>
          {otpHistory.map((otp) => (
            <tr key={otp.id} style={otp.used ? { background: "#232" } : {}}>
              <td>{otp.userId}</td>
              <td>{otp.otp}</td>
              <td>{new Date(otp.createdAt).toLocaleString()}</td>
              <td>{new Date(otp.expiresAt).toLocaleString()}</td>
              <td>{otp.used ? t("common.yes") : t("common.no")}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
};

export default OtpManagementPage;
