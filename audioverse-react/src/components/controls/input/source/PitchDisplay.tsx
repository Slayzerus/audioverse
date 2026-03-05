/**
 * PitchDisplay — shows the start/listening indicator, pitch bar and current note.
 */
import React from "react";
import type { TFunction } from 'i18next';

interface PitchDisplayProps {
    analysisActive: boolean;
    startAnalysis: () => void;
    barWidth: number;
    note: string;
    pitch: number | null;
    t: TFunction;
    backendUnavailable?: boolean;
}

const PitchDisplay: React.FC<PitchDisplayProps> = ({
    analysisActive, startAnalysis, barWidth, note, pitch, t, backendUnavailable,
}) => (
    <>
    {backendUnavailable && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--surface-warning, #3a2500)', border: '1px solid var(--accent-warning, #ff9800)', borderRadius: 4, fontSize: 12, color: 'var(--accent-warning, #ff9800)', marginBottom: 4 }}>
            <span>⚠</span>
            <span>{t('pitch.backendUnavailable', 'Backend server unavailable — Librosa/CREPE requires the Python backend running')}</span>
        </div>
    )}
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {!analysisActive ? (
            <button className="btn btn-sm btn-outline-success" onClick={startAnalysis} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                ▶ {t('pitch.startAnalysis', 'Start Analysis')}
            </button>
        ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent-success, #4CAF50)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-success, #4CAF50)', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
                {t('pitch.listening', 'Listening...')}
            </span>
        )}
        <div style={{ width: "100px", height: "10px", backgroundColor: "#ddd", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(barWidth, 100)}%`, height: "100%", backgroundColor: "var(--accent-success, #4CAF50)", transition: 'width 0.1s ease-out' }} />
        </div>
        <span style={{ fontSize: "12px", fontWeight: "bold", minWidth: "40px", height: "13.5px", display: 'flex', alignItems: 'center', gap: 2 }}>
            {note !== "-" ? (
                <span style={{ fontSize: 10, color: 'var(--text-muted, #888)' }}>{pitch ? `${pitch.toFixed(1)} Hz` : ''}</span>
            ) : "—"}
        </span>
    </div>
    </>
);

export default React.memo(PitchDisplay);
