import React from "react";
import { useTranslation } from 'react-i18next';

interface CaptchaTypeSelectorProps {
  value: number;
  onChange: (type: number) => void;
}

export const CaptchaTypeSelector: React.FC<CaptchaTypeSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const CAPTCHA_TYPES = [
    { value: 1, label: t('captcha.questionAnswer', 'Question Answer') },
    { value: 2, label: t('captcha.reverseString', 'Reverse String') },
    { value: 3, label: t('captcha.imageQuestion', 'Image Question') },
    { value: 4, label: t('captcha.mathProblem', 'Math Problem') },
    { value: 5, label: t('captcha.imageSelection', 'Image Selection') },
    { value: 6, label: t('captcha.imageRegionSelection', 'Image Region Selection') },
    { value: 7, label: t('captcha.puzzleMatching', 'Puzzle Matching') },
    { value: 8, label: t('captcha.audioQuestion', 'Audio Question') },
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ color: "#fff", fontWeight: 500 }}>{t('captcha.captchaType', 'CAPTCHA Type:')}</label>
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ marginLeft: 12, padding: 4, fontSize: 16 }}
      >
        {CAPTCHA_TYPES.map(ct => (
          <option key={ct.value} value={ct.value}>{ct.label}</option>
        ))}
      </select>
    </div>
  );
};

export default CaptchaTypeSelector;
