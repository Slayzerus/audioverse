// AttractionPicker.tsx — Polished icon grid for choosing attraction types
import React from "react";
import { useTranslation } from "react-i18next";
import type { AttractionType } from "../../models/modelsKaraoke";

interface SessionTypeDef {
    type: AttractionType;
    icon: string;
    labelKey: string;
    fallback: string;
    color: string;
}

/** All session types available for events. */
const SESSION_TYPES: SessionTypeDef[] = [
    { type: "karaoke",    icon: "🎤", labelKey: "party.sessionType.karaoke",    fallback: "Karaoke",        color: "rgba(255,87,87,0.12)" },
    { type: "videoGame",  icon: "🎮", labelKey: "party.sessionType.videoGame",  fallback: "Gra wideo",      color: "rgba(87,137,255,0.12)" },
    { type: "boardGame",  icon: "🎲", labelKey: "party.sessionType.boardGame",  fallback: "Gra planszowa",  color: "rgba(255,193,7,0.12)" },
    { type: "photoBooth", icon: "📷", labelKey: "party.sessionType.photoBooth", fallback: "Photo Booth",    color: "rgba(156,39,176,0.12)" },
    { type: "danceFloor", icon: "🕺", labelKey: "party.sessionType.danceFloor", fallback: "Parkiet",        color: "rgba(0,188,212,0.12)" },
    { type: "djSet",      icon: "🎧", labelKey: "party.sessionType.djSet",      fallback: "DJ Set",         color: "rgba(76,175,80,0.12)" },
    { type: "custom",     icon: "⭐", labelKey: "party.sessionType.custom",     fallback: "Inna atrakcja",  color: "rgba(255,152,0,0.12)" },
];

interface AttractionPickerProps {
    onSelect: (type: AttractionType) => void;
    onCancel: () => void;
}

const AttractionPicker: React.FC<AttractionPickerProps> = ({ onSelect, onCancel }) => {
    const { t } = useTranslation();

    return (
        <div style={{ padding: 20 }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 10,
            }}>
                {SESSION_TYPES.map(s => (
                    <button
                        key={s.type}
                        onClick={() => onSelect(s.type)}
                        className="btn"
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            gap: 8, padding: '18px 12px', fontSize: 13,
                            borderRadius: 12, transition: 'all .2s ease',
                            background: s.color,
                            border: '1px solid rgba(255,255,255,0.06)',
                            fontWeight: 500,
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.03)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'none';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                        }}
                    >
                        <span style={{ fontSize: 36, lineHeight: 1 }}>{s.icon}</span>
                        <span>{t(s.labelKey, s.fallback)}</span>
                    </button>
                ))}
            </div>
            <div className="text-end mt-3">
                <button className="btn btn-sm btn-outline-secondary" onClick={onCancel}>
                    {t('common.cancel', 'Anuluj')}
                </button>
            </div>
        </div>
    );
};

export default AttractionPicker;
