
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import apiUser from "../../../scripts/api/apiUser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import PasswordStrengthIndicator from "../../auth/PasswordStrengthIndicator";
import apiAdmin from '../../../scripts/api/apiAdmin';
import { PasswordRequirementsDto } from '../../../models/modelsAdmin';
import { generateCaptcha } from "../../../services/authService";
import styles from './registrationForm.module.css';

const RegistrationForm: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();


    const [user, setUser] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // CAPTCHA disabled
    const captchaEnabled = false;
    const [captcha, setCaptcha] = useState<{ captchaId?: string; challenge?: string; type?: number; media?: string; mediaType?: string } | null>(null);
    const [captchaAnswer, setCaptchaAnswer] = useState("");
    const [_captchaValid, setCaptchaValid] = useState(false);
    const [, setCaptchaError] = useState<string | null>(null);

    const [captchaType] = useState(2);
    useEffect(() => {
        if (captchaEnabled) fetchCaptcha();
    }, [captchaType, captchaEnabled]);

    const fetchCaptcha = async () => {
        setCaptchaError(null);
        setCaptchaAnswer("");
        setCaptchaValid(false);
        try {
            const res = await generateCaptcha(captchaType);
            setCaptcha(res); // Set the entire object, not just .data
        } catch (_e) {
            setCaptchaError(t('auth.captchaLoadError'));
        }
    };

    // Dynamiczne reguły bezpieczeństwa hasła z backendu (obsługa tablicy)
    const [requirements, setRequirements] = useState<PasswordRequirementsDto[] | null>(null);
    useEffect(() => {
        apiAdmin.getPasswordRequirements()
            .then((res) => {
                // API: { success, count, requirements: [...] } or direct array
                const wrapped = res as unknown as { requirements?: Array<PasswordRequirementsDto & { active?: boolean }> } | undefined;
                if (wrapped && !Array.isArray(wrapped) && Array.isArray(wrapped.requirements)) {
                    setRequirements(wrapped.requirements.filter((r) => r.active !== false));
                } else if (Array.isArray(res)) {
                    setRequirements(res);
                } else {
                    setRequirements(null);
                }
            })
            .catch(() => setRequirements(null));
    }, []);

    // Generating rules for display and validation
    const passwordRules = requirements && requirements.length > 0
        ? requirements.flatMap((req, _idx) => {
            const rules = [];
            if (req.minLength) rules.push({ label: t('passwordRules.minLength', 'Min. {{count}} characters', { count: req.minLength }), valid: user.password.length >= req.minLength });
            if (req.maxLength) rules.push({ label: t('passwordRules.maxLength', 'Max. {{count}} characters', { count: req.maxLength }), valid: user.password.length <= req.maxLength });
            if (req.requireUppercase) rules.push({ label: t('passwordRules.requireUppercase', 'At least one uppercase letter'), valid: /[A-Z]/.test(user.password) });
            if (req.requireLowercase) rules.push({ label: t('passwordRules.requireLowercase', 'At least one lowercase letter'), valid: /[a-z]/.test(user.password) });
            if (req.requireDigit) rules.push({ label: t('passwordRules.requireDigit', 'At least one digit'), valid: /[0-9]/.test(user.password) });
            if (req.requireSpecialChar) rules.push({ label: t('passwordRules.requireSpecialChar', 'At least one special character'), valid: /[^A-Za-z0-9]/.test(user.password) });
            // You can add other rules if they appear in the API
            return rules;
        })
        : [
            { label: t('passwordRules.minLength', 'Min. {{count}} characters', { count: 8 }), valid: user.password.length >= 8 },
            { label: t('passwordRules.requireUppercase', 'At least one uppercase letter'), valid: /[A-Z]/.test(user.password) },
            { label: t('passwordRules.requireLowercase', 'At least one lowercase letter'), valid: /[a-z]/.test(user.password) },
            { label: t('passwordRules.requireDigit', 'At least one digit'), valid: /[0-9]/.test(user.password) },
            { label: t('passwordRules.requireSpecialChar', 'At least one special character'), valid: /[^A-Za-z0-9]/.test(user.password) },
        ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setCaptchaError(null);
        // CAPTCHA validation skipped (disabled)
        // Rejestracja
        try {
            await apiUser.registerUser({
                ...user,
                captchaId: captcha?.captchaId,
                captchaAnswer: captchaAnswer
            });
            setSuccess(t('auth.registerSuccess'));
            setTimeout(() => navigate("/login"), 1200);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : t('auth.registerError'));
        }
    };

    return (
        <div className={styles['registration-container']}>
            <form onSubmit={handleSubmit} className={styles['registration-form']}>
                {error && <p className={styles.error}>{error}</p>}
                {success && <p className={styles.success}>{success}</p>}
                <div className={styles['input-group']}>
                    <FontAwesomeIcon icon={faUser} className={styles.icon} />
                    <input type="text" name="username" placeholder={t('auth.username')} aria-label={t('auth.username')} onChange={handleChange} required />
                </div>
                <div className={styles['input-group']}>
                    <FontAwesomeIcon icon={faEnvelope} className={styles.icon} />
                    <input type="email" name="email" placeholder={t('auth.email', 'Email')} onChange={handleChange} required />
                </div>
                <div className={styles['input-group']}>
                    <FontAwesomeIcon icon={faLock} className={styles.icon} />
                    <input type="password" name="password" placeholder={t('auth.password')} aria-label={t('auth.password')} onChange={handleChange} required />
                </div>
                {/* Only show PasswordStrengthIndicator */}
                <PasswordStrengthIndicator rules={passwordRules} />
                <button type="submit" disabled={passwordRules.some(r => !r.valid)}>{t('auth.registerButton')}</button>
            </form>
        </div>
    );
};

export default RegistrationForm;
