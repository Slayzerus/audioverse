import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import apiUser from "../../scripts/api/apiUser";

const LogoutButton: React.FC = React.memo(function LogoutButton() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleLogout = async () => {
    try {
      await apiUser.logoutUser(0); // or pass userId if available
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };
  return (
    <button onClick={handleLogout} style={{ marginTop: 12, fontSize: 16 }}>{t('nav.signOut')}</button>
  );
});
LogoutButton.displayName = "LogoutButton";

export default LogoutButton;
