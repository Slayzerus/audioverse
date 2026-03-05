
import React from "react";
import { Link } from "react-router-dom";
import { NavDropdown } from "react-bootstrap";
import { useUser } from "../../contexts/UserContext";
import { useTranslation } from "react-i18next";

const RoleBasedNavigation: React.FC = () => {
  const { currentUser, isAdmin } = useUser();
  const { t } = useTranslation();
  if (!currentUser) return null;

  return (
    <nav style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
      {isAdmin && (
        <NavDropdown title={t('roleNav.admin', 'Admin')} id="admin-dropdown" className="nav-drop" style={{ color: "goldenrod" }}>
          <NavDropdown.Item as={Link} to="/admin/dashboard">{t('roleNav.dashboard', 'Dashboard')}</NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/admin/audit">{t('roleNav.audit', 'Audit')}</NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/admin/users">{t('roleNav.users', 'Users')}</NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/admin/settings">{t('roleNav.settings', 'Settings')}</NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/admin/password-requirements">{t('roleNav.passwordReqs', 'Password Requirements')}</NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/admin/honeytokens">{t('roleNav.honeyTokens', 'HoneyTokens')}</NavDropdown.Item>
        </NavDropdown>
      )}
    </nav>
  );
};

export default RoleBasedNavigation;
