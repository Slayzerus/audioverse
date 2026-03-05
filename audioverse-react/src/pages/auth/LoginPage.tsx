
import React from "react";
import LoginForm from "../../components/forms/user/LoginForm";
import { useTranslation } from "react-i18next";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 0, background: "var(--bg-primary)", outline: "none" }}>
      <div style={{ background: "var(--card-bg)", margin: 10, padding: 32, borderRadius: 12, boxShadow: "var(--shadow-lg)" }}>
        <h2 style={{ color: "goldenrod", textAlign: "center", marginBottom: 24 }}>{t('loginPage.title')}</h2>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
