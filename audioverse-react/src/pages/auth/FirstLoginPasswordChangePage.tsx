import React, { useState, useEffect } from "react";
import PasswordStrengthIndicator from "../../components/auth/PasswordStrengthIndicator";
import PasswordRulesList from "../../components/auth/PasswordRulesList";
import { firstLoginPasswordChange } from "../../scripts/api/apiUser";
import { getPasswordRequirements } from "../../scripts/api/apiAdmin";
import { useTranslation } from "react-i18next";
import type { PasswordRequirementsDto } from "../../models/modelsAdmin";
import { useNavigate } from "react-router-dom";

const FirstLoginPasswordChangePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordRules, setPasswordRules] = useState<PasswordRequirementsDto | null>(null);

  // Fetch rules from backend
  useEffect(() => {
    getPasswordRequirements()
      .then(reqs => {
        if (reqs && reqs.length > 0) setPasswordRules(reqs[0]);
      })
      .catch(() => { /* fallback to defaults */ });
  }, []);

  const rules = passwordRules ? [
    { label: t('auth.passwordRules.minLength', { count: passwordRules.minLength ?? 12 }), valid: newPassword.length >= (passwordRules.minLength ?? 12) },
    ...(passwordRules.requireDigit ? [{ label: t('auth.passwordRules.digit'), valid: /\d/.test(newPassword) }] : []),
    ...(passwordRules.requireSpecialChar ? [{ label: t('auth.passwordRules.special'), valid: /[!@#$%^&*()_\-+=[\]{}|;:',.<>?/~`]/.test(newPassword) }] : []),
    ...(passwordRules.requireUppercase ? [{ label: t('auth.passwordRules.uppercase'), valid: /[A-Z]/.test(newPassword) }] : []),
    ...(passwordRules.requireLowercase ? [{ label: t('auth.passwordRules.lowercase'), valid: /[a-z]/.test(newPassword) }] : []),
    ...(passwordRules.maxLength ? [{ label: t('auth.passwordRules.maxLength', { count: passwordRules.maxLength }), valid: newPassword.length <= passwordRules.maxLength }] : []),
  ] : [
    { label: t('changePassword.minChars', '12 characters minimum'), valid: newPassword.length >= 12 },
    { label: t('changePassword.atLeastDigit', 'At least 1 digit'), valid: /\d/.test(newPassword) },
    { label: t('changePassword.atLeastSpecial', 'At least 1 special character'), valid: /[!@#$%^&*]/.test(newPassword) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSubmitStatus({ type: 'error', message: t('auth.passwordMismatch', 'Passwords do not match') });
      return;
    }
    if (!rules.every(r => r.valid)) {
      setSubmitStatus({ type: 'error', message: t('auth.passwordRulesNotMet', 'Password does not meet requirements') });
      return;
    }
    setIsSubmitting(true);
    try {
      await firstLoginPasswordChange({ oldPassword: '', newPassword });
      setSubmitStatus({ type: 'success', message: t('auth.passwordChanged', 'Password changed successfully') });
      setTimeout(() => navigate('/'), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.passwordChangeFailed', 'Failed to change password');
      setSubmitStatus({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", background: "var(--card-bg, #181818)", padding: 32, borderRadius: 12 }}>
      <h2 style={{ color: "var(--accent-gold, goldenrod)", textAlign: "center" }}>{t('auth.changePassword', 'Change Password')}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder={t('auth.newPassword', 'New Password')}
          aria-label={t('changePassword.newPassword', 'New Password')}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          style={{ width: "100%", fontSize: 18, marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder={t('auth.confirmPassword', 'Confirm Password')}
          aria-label={t('changePassword.confirmPassword', 'Confirm Password')}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          style={{ width: "100%", fontSize: 18, marginBottom: 8 }}
        />
        <PasswordStrengthIndicator rules={rules} />
        <PasswordRulesList rules={rules} />
        {submitStatus && (
          <div style={{ color: submitStatus.type === 'success' ? 'var(--stat-success, #4caf50)' : 'var(--stat-error, #d32f2f)', padding: '12px', borderRadius: '6px', fontWeight: 600, marginBottom: '12px', textAlign: 'center', background: submitStatus.type === 'success' ? 'var(--stat-success-bg, rgba(76,175,80,0.1))' : 'var(--stat-error-bg, rgba(211,47,47,0.1))' }}>
            {submitStatus.message}
          </div>
        )}
        <button style={{ width: "100%", fontSize: 18, marginTop: 12 }} disabled={isSubmitting}>
          {isSubmitting ? t('auth.changingPassword', 'Changing...') : t('auth.changePassword', 'Change Password')}
        </button>
      </form>
    </div>
  );
};

export default FirstLoginPasswordChangePage;
