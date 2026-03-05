import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'pl', label: 'PL', flag: '🇵🇱', name: 'Polski' },
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'es', label: 'ES', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', label: 'FR', flag: '🇫🇷', name: 'Français' },
  { code: 'de', label: 'DE', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'zh', label: '中文', flag: '🇨🇳', name: '中文' },
  { code: 'ja', label: 'JA', flag: '🇯🇵', name: '日本語' },
];

/**
 * Compact language switcher — shows current language flag,
 * expands to a dropdown with all available languages.
 */
const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => i18n.language?.startsWith(l.code)) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={t('languageSwitcher.changeLanguage', 'Change language')}
        title={t('languageSwitcher.changeLanguage', 'Change language')}
          style={{
          background: 'transparent',
          border: '2px solid var(--nav-active, #daa520)',
          borderRadius: 8,
          minHeight: 40,
          padding: '4px 12px',
          cursor: 'pointer',
          fontSize: 14,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1, position: 'relative', top: -1 }}>{currentLang.label}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            background: 'var(--dropdown-bg, #1a1a1a)',
            border: '1px solid var(--border-primary, rgba(255,255,255,0.15))',
            borderRadius: 8,
            boxShadow: 'var(--shadow-md, 0 4px 8px rgba(0,0,0,0.4))',
            zIndex: 9999,
            minWidth: 150,
            overflow: 'hidden',
          }}
        >
          {LANGUAGES.map(({ code, flag, name }) => {
            const isActive = i18n.language?.startsWith(code);
            return (
              <button
                key={code}
                onClick={() => { i18n.changeLanguage(code); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 14px',
                  background: isActive ? 'var(--dropdown-hover-bg, rgba(255,255,255,0.08))' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--nav-active, #daa520)' : '3px solid transparent',
                  color: isActive ? 'var(--nav-active, #daa520)' : 'var(--dropdown-text, #fff)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 400,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 18 }}>{flag}</span>
                <span>{name}</span>
                {isActive && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
