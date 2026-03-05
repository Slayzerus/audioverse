import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import apiUser, { type CurrentUserResponse } from "../../scripts/api/apiUser";

const UserInfo: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<CurrentUserResponse | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiUser.getCurrentUser();
        setUser(res);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  if (!user) return <div style={{ color: "var(--text-primary, #fff)" }}>{t('userInfo.loading', 'Loading user info...')}</div>;

  return (
    <div style={{ color: "var(--text-primary, #fff)", marginBottom: 16 }}>
      <b>{t('userInfo.welcome', 'Welcome, {{username}}', { username: user.username })}</b> <span style={{ color: "var(--accent-primary, goldenrod)" }}>[{user.roles?.join(", ")}]</span>
      {user.requirePasswordChange && (
        <div style={{ color: "var(--error, #f44336)" }}>{t('userInfo.passwordChangeRequired', 'Password change required at first login!')}</div>
      )}
    </div>
  );
};

export default UserInfo;
