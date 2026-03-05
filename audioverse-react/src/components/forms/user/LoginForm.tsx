import { Focusable } from "../../common/Focusable";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useUser } from "../../../contexts/UserContext";
import apiUser from "../../../scripts/api/apiUser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import CaptchaComponent from "../../auth/CaptchaComponent";
import { generateCaptcha } from "../../../services/authService";
import styles from './loginForm.module.css';
import { logger } from '../../../utils/logger';

const log = logger.scoped('LoginForm');

const LoginForm: React.FC = () => {

    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const { login, systemConfig } = useUser();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // CAPTCHA
    const [captcha, setCaptcha] = useState<{ challenge: string; type: number; media?: string; mediaType?: string } | null>(null);
    const [captchaAnswer, setCaptchaAnswer] = useState("");
    const [_captchaValid, setCaptchaValid] = useState(false);
    const [captchaError, setCaptchaError] = useState<string | null>(null);
    // Używaj systemConfig.captchaOption jeśli dostępny, domyślnie 2
    const [captchaType, setCaptchaType] = useState(systemConfig?.captchaOption ?? 2);
    // Przy logowaniu captcha wyłączona (zgodnie z poleceniem)
    const captchaEnabled = false;
    useEffect(() => {
        if (captchaEnabled) fetchCaptcha();
    }, [captchaType, captchaEnabled, systemConfig]);

    const fetchCaptcha = async () => {
        // Nie czyść captchaError tutaj, aby komunikat o błędzie był widoczny po nieudanej walidacji
        setCaptchaAnswer("");
        setCaptchaValid(false);
        try {
            const captchaData = await generateCaptcha(captchaType);
            log.debug("Otrzymano dane CAPTCHA:", captchaData);
            setCaptcha(captchaData);
        } catch (_e) {
            setCaptchaError(t('auth.captchaLoadError'));
        }
    };

    const handleCaptchaAnswer = (val: string) => {
        setCaptchaAnswer(val);
        setCaptchaValid(false);
        setCaptchaError(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setCaptchaError(null);
        log.debug("handleSubmit START", { credentials, captcha, captchaAnswer });
        // Pomijamy captcha na logowaniu
        try {
            const loginPayload = {
                username: credentials.username,
                password: credentials.password
            };
            const loginRes = await apiUser.loginUser(loginPayload);
            if (!loginRes.success) {
                setError(loginRes.errorMessage || t('auth.loginError'));
                return;
            }
            await login();
            if (loginRes.requirePasswordChange) {
                navigate("/profile/change-password");
            } else {
                navigate("/");
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : t('auth.loginError'));
        }
        log.debug("handleSubmit END");
    };

    return (
        <div className={styles['login-container']}>
            <form onSubmit={handleSubmit} className={styles['login-form']}>
                                {error && (
                                    <div role="alert" className="error" style={{
                                        color: '#fff',
                                        background: '#d32f2f',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        marginBottom: '12px',
                                        textAlign: 'center',
                                    }}>{error}</div>
                                )}
                <div className={styles['input-group']} style={{ flexWrap: "nowrap", alignItems: "center" }}>
                    <FontAwesomeIcon icon={faUser} className={styles.icon} />
                    <input type="text" name="username" placeholder={t('auth.username')} aria-label={t('auth.username')} onChange={handleChange} required />
                </div>
                <div className={styles['input-group']} style={{ flexWrap: "nowrap", alignItems: "center" }}>
                    <FontAwesomeIcon icon={faLock} className={styles.icon} />
                    <input type="password" name="password" placeholder={t('auth.password')} aria-label={t('auth.password')} onChange={handleChange} required />
                </div>
                {/* CAPTCHA disabled on login */}
                {captchaEnabled && (
                  <>
                    <div style={{ margin: '16px 0' }}>
                        <label style={{ color: '#fff', marginRight: 8 }}>{t('captcha.captchaType', 'CAPTCHA Type:')}</label>
                        <select value={captchaType} onChange={e => setCaptchaType(Number(e.target.value))} style={{ fontSize: 16 }}>
                            <option value={1}>{t('captcha.questionAnswer', 'Question Answer')}</option>
                            <option value={2}>{t('captcha.reverseString', 'Reverse String')}</option>
                            <option value={3}>{t('captcha.imageQuestion', 'Image Question')}</option>
                            <option value={4}>{t('captcha.mathProblem', 'Math Problem')}</option>
                            <option value={5}>{t('captcha.imageSelection', 'Image Selection')}</option>
                            <option value={6}>{t('captcha.imageRegionSelection', 'Image Region Selection')}</option>
                            <option value={7}>{t('captcha.puzzleMatching', 'Puzzle Matching')}</option>
                            <option value={8}>{t('captcha.audioQuestion', 'Audio Question')}</option>
                        </select>
                        <button type="button" onClick={fetchCaptcha} style={{ marginLeft: 12 }}>{t('captcha.generate', 'Generate CAPTCHA')}</button>
                    </div>
                    {captcha && (
                        <>
                            {/*console.log("[LoginForm] Passing to CaptchaComponent:", {
                                challenge: captcha.challenge,
                                type: captcha.type,
                                media: captcha.media,
                                mediaType: captcha.mediaType
                            })*/}
                            <CaptchaComponent
                                challenge={captcha.challenge}
                                type={captcha.type}
                                onAnswer={handleCaptchaAnswer}
                                answer={captchaAnswer}
                                media={captcha.media}
                                mediaType={captcha.mediaType}
                            />
                        </>
                    )}
                  </>
                )}
                                {captchaError && (
                                    <div style={{
                                        color: '#fff',
                                        background: '#d32f2f',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        marginBottom: '12px',
                                        textAlign: 'center',
                                    }}>{captchaError}</div>
                                )}
                                <Focusable id="login-submit">
                                    <button type="submit">{t('auth.loginButton')}</button>
                                </Focusable>
            </form>
        </div>
    );
};

export default LoginForm;
