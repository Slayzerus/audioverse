// Deklaracja globalna dla grecaptcha (Google reCaptcha v3)
declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Focusable } from "../../components/common/Focusable";
import { changePasswordWithRecaptcha, generateCaptcha, validateCaptcha } from "../../scripts/api/apiUser";
import apiAdmin from "../../scripts/api/apiAdmin";
import { PasswordRequirementsDto } from "../../models/modelsAdmin";
import CaptchaComponent from "../../components/auth/CaptchaComponent";
import PasswordStrengthIndicator from "../../components/auth/PasswordStrengthIndicator";

interface CaptchaData {
  captchaId?: string | number;
  challenge?: string;
  type?: number;
  media?: string;
  mediaType?: string;
}

const ChangePasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password requirements
  const [requirements, setRequirements] = useState<PasswordRequirementsDto[] | null>(null);
  useEffect(() => {
    apiAdmin.getPasswordRequirements()
      .then((res) => {
        const wrapped = res as unknown as { requirements?: Array<PasswordRequirementsDto & { active?: boolean }> } | undefined;
        if (wrapped && !Array.isArray(wrapped) && Array.isArray(wrapped.requirements)) {
          setRequirements(wrapped.requirements.filter((r) => r.active));
        } else if (Array.isArray(res)) {
          setRequirements(res);
        } else {
          setRequirements(null);
        }
      })
      .catch(() => setRequirements(null));
  }, []);

  // Password rules for indicator
  const passwordRules = requirements && requirements.length > 0
    ? requirements.flatMap((req) => {
        const rules = [] as { label: string; valid: boolean }[];
        if (req.minLength) rules.push({ label: t('auth.passwordRules.minLength', { count: req.minLength }), valid: newPassword.length >= req.minLength });
        if (req.maxLength) rules.push({ label: t('auth.passwordRules.maxLength', { count: req.maxLength }), valid: newPassword.length <= req.maxLength });
        if (req.requireUppercase) rules.push({ label: t('auth.passwordRules.uppercase'), valid: /[A-Z]/.test(newPassword) });
        if (req.requireLowercase) rules.push({ label: t('auth.passwordRules.lowercase'), valid: /[a-z]/.test(newPassword) });
        if (req.requireDigit) rules.push({ label: t('auth.passwordRules.digit'), valid: /[0-9]/.test(newPassword) });
        if (req.requireSpecialChar) rules.push({ label: t('auth.passwordRules.special'), valid: /[^A-Za-z0-9]/.test(newPassword) });
        return rules;
      })
    : [
        { label: t('auth.passwordRules.minLength', { count: 8 }), valid: newPassword.length >= 8 },
        { label: t('auth.passwordRules.uppercase'), valid: /[A-Z]/.test(newPassword) },
        { label: t('auth.passwordRules.lowercase'), valid: /[a-z]/.test(newPassword) },
        { label: t('auth.passwordRules.digit'), valid: /[0-9]/.test(newPassword) },
        { label: t('auth.passwordRules.special'), valid: /[^A-Za-z0-9]/.test(newPassword) },
      ];

  // CAPTCHA
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [, setCaptchaValid] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaType, setCaptchaType] = useState(2);

  const fetchCaptcha = useCallback(async () => {
    setCaptchaError(null);
    setCaptchaAnswer("");
    setCaptchaValid(false);
    try {
      const res = await generateCaptcha(captchaType);
      setCaptcha(res);
    } catch (_e) {
      setCaptchaError(t('auth.captchaLoadError'));
    }
  }, [captchaType, t]);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  const handleCaptchaAnswer = (val: string) => {
    setCaptchaAnswer(val);
    setCaptchaValid(false);
    setCaptchaError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setCaptchaError(null);
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (passwordRules.some(r => !r.valid)) {
      setError(t('auth.passwordNotMeetRequirements'));
      return;
    }
    // Najpierw walidacja CAPTCHA
    try {
      const captchaRes = await validateCaptcha({ captchaId: String(captcha?.captchaId ?? ''), answer: captchaAnswer });
      if (!captchaRes.success) {
        setCaptchaValid(false);
        setCaptchaError(t('auth.captchaInvalid'));
        fetchCaptcha();
        return;
      }
      setCaptchaValid(true);
    } catch (_e) {
      setCaptchaValid(false);
      setCaptchaError(t('auth.captchaValidationError'));
      fetchCaptcha();
      return;
    }
    setLoading(true);
    try {
      // reCaptcha v3 integration
      if (typeof window !== "undefined" && window.grecaptcha && typeof window.grecaptcha.ready === "function") {
        window.grecaptcha.ready(async function() {
          if (window.grecaptcha && typeof window.grecaptcha.execute === "function") {
            try {
              const token = await window.grecaptcha.execute('6LeWbFQsAAAAAIZHBLD-qomYxAVcdC-zxJEb28t1', { action: 'changepassword' });
              await changePasswordWithRecaptcha({
                oldPassword: currentPassword,
                newPassword: newPassword,
                recaptchaToken: token
              });
              setSuccess(true);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setCaptchaAnswer("");
              fetchCaptcha();
            } catch (err: unknown) {
              const respMsg = typeof err === 'object' && err !== null && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
              setError(respMsg || t('auth.recaptchaFailed'));
            } finally {
              setLoading(false);
            }
          } else {
            setError(t('auth.recaptchaExecuteError'));
            setLoading(false);
          }
        });
      } else {
        setError(t('auth.recaptchaLoadError'));
        setLoading(false);
      }
    } catch (err: unknown) {
      const respMsg = typeof err === 'object' && err !== null && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      setError(respMsg || t('auth.passwordChangeFailed'));
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 400 }}>
      <h2>{t('auth.changePassword')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="currentPassword" className="form-label">{t('auth.currentPassword')}</label>
          <Focusable id="ChangePasswordPage-current-password">
            <input
              type="password"
              className="form-control"
              id="currentPassword"
              name="currentPassword"
              aria-label={t('auth.currentPassword')}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </Focusable>
        </div>
        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">{t('auth.newPassword')}</label>
          <Focusable id="ChangePasswordPage-new-password">
            <input
              type="password"
              className="form-control"
              id="newPassword"
              name="newPassword"
              aria-label={t('auth.newPassword')}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </Focusable>
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">{t('auth.confirmNewPassword')}</label>
          <Focusable id="ChangePasswordPage-confirm-password">
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              name="confirmPassword"
              aria-label={t('auth.confirmPassword')}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </Focusable>
        </div>
        <PasswordStrengthIndicator rules={passwordRules} />
        {/* CAPTCHA controls */}
        <div style={{ margin: '16px 0' }}>
          <label style={{ color: 'var(--text-on-dark, #fff)', marginRight: 8 }}>{t('auth.captchaType')}</label>
          <Focusable id="ChangePasswordPage-captcha-type" isDropdown={true}>
            <select value={captchaType} onChange={e => setCaptchaType(Number(e.target.value))} style={{ fontSize: 16 }}>
            <option value={1}>{t('auth.captchaTypes.textQuestion')}</option>
            <option value={2}>{t('auth.captchaTypes.reversedText')}</option>
            <option value={3}>{t('auth.captchaTypes.imageQuestion')}</option>
            <option value={4}>{t('auth.captchaTypes.mathImage')}</option>
            <option value={5}>{t('auth.captchaTypes.imageSelection')}</option>
            <option value={6}>{t('auth.captchaTypes.regionSelection')}</option>
            <option value={7}>{t('auth.captchaTypes.puzzle')}</option>
            <option value={8}>{t('auth.captchaTypes.audio')}</option>
          </select>
          </Focusable>
          <Focusable id="ChangePasswordPage-generate-captcha">
            <button type="button" onClick={fetchCaptcha} style={{ marginLeft: 12 }}>{t('auth.generateCaptcha')}</button>
          </Focusable>
        </div>
        {captcha && (() => {
          let media = captcha.media;
          let mediaType = captcha.mediaType;
          if ((!media || !mediaType) && typeof captcha.challenge === 'string' && captcha.challenge.includes('|')) {
            const parts = captcha.challenge.split('|');
            if (parts.length === 2) {
              if (parts[1].startsWith('data:image')) {
                media = parts[1];
                mediaType = 'image';
              } else if (parts[1].startsWith('data:audio')) {
                media = parts[1];
                mediaType = 'audio';
              }
            }
          }
          return (
            <CaptchaComponent
              challenge={captcha.challenge ?? ''}
              type={captcha.type ?? 0}
              onAnswer={handleCaptchaAnswer}
              answer={captchaAnswer}
              media={media}
              mediaType={mediaType}
            />
          );
        })()}
        <div style={{ position: 'relative' }}>
          <AnimatePresence>
            {captchaError && (
              <motion.div key="caperr" initial={{ opacity: 0, y: -8, scale: 0.995 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.995 }} transition={{ type: 'spring', stiffness: 380, damping: 28 }} className="alert alert-danger">{captchaError}</motion.div>
            )}
            {error && (
              <motion.div key="err" initial={{ opacity: 0, y: -8, scale: 0.995 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.995 }} transition={{ type: 'spring', stiffness: 380, damping: 28 }} className="alert alert-danger">{error}</motion.div>
            )}
            {success && (
              <motion.div key="ok" initial={{ opacity: 0, y: -8, scale: 0.995 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.995 }} transition={{ type: 'spring', stiffness: 380, damping: 28 }} className="alert alert-success">{t('auth.passwordChangeSuccess')}</motion.div>
            )}
          </AnimatePresence>
        </div>
        <Focusable id="ChangePasswordPage-submit">
          <button type="submit" className="btn btn-primary" disabled={loading || passwordRules.some(r => !r.valid)}>
            {loading ? t('auth.changingPassword') : t('auth.changePasswordButton')}
          </button>
        </Focusable>
      </form>
    </div>
  );
};


// Add reCaptcha v3 badge for compliance
// This should be rendered at the bottom right of the page
// Google requires this for reCaptcha v3 usage
// You can style or move as needed

// ...existing code...

// Add this inside your component's return, after the form:
// <div style={{ position: 'fixed', right: 0, bottom: 0, zIndex: 9999 }}>
//   <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer">
//     <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" style={{ width: 48, height: 48, opacity: 0.7 }} />
//   </a>
//   <span style={{ color: 'var(--text-on-dark, #fff)', fontSize: 10, marginLeft: 4 }}>reCAPTCHA protected</span>
// </div>

// For direct code insertion:
// Find the closing </div> of your main container and insert above it:

// <div style={{ position: 'fixed', right: 0, bottom: 0, zIndex: 9999 }}>
//   <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer">
//     <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" style={{ width: 48, height: 48, opacity: 0.7 }} />
//   </a>
//   <span style={{ color: 'var(--text-on-dark, #fff)', fontSize: 10, marginLeft: 4 }}>reCAPTCHA protected</span>
// </div>

export default ChangePasswordPage;
