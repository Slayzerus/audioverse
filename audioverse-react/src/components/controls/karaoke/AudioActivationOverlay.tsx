import React from "react";
import type { TFunction } from "i18next";
import { Focusable } from "../../common/Focusable";

interface AudioActivationOverlayProps {
    isPadMode: boolean;
    activateAudio: () => void;
    activateBtnRef: React.RefObject<HTMLButtonElement>;
    t: TFunction;
}

const AudioActivationOverlay: React.FC<AudioActivationOverlayProps> = ({
    isPadMode,
    activateAudio,
    activateBtnRef,
    t,
}) => {
    // Guard: prevent multiple activations from bubbling clicks
    const calledRef = React.useRef(false);
    const safeActivate = React.useCallback(() => {
        if (calledRef.current) return;
        calledRef.current = true;
        activateAudio();
    }, [activateAudio]);

    return (
    <div
        style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            color: '#fff',
        }}
        onClick={safeActivate}
        onKeyDown={(e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); safeActivate(); } }}
        role="button"
        tabIndex={0}
        aria-label="Activate audio"
    >
        <div
            onClick={safeActivate}
            style={{
                background: '#1f2937',
                borderRadius: 20,
                padding: 'clamp(16px, 4vw, 40px) clamp(16px, 4vw, 48px)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                maxWidth: 440,
                cursor: 'pointer',
            }}
        >
            <div style={{ fontSize: 56 }}>{isPadMode ? '🎮' : '🎤'}</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                {isPadMode ? t('karaokeManager.padActivate', 'Pad Mode — Activate audio') : t('karaokeManager.activateAudio', 'Activate audio')}
            </h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 15, textAlign: 'center', lineHeight: 1.5 }}>
                {isPadMode
                  ? <>{t('karaokeManager.padHint', 'Hit notes with keys or pad!')}<br/>{t('karaokeManager.padDiffHint', 'Higher difficulty = more keys.')}</>
                  : <>{t('karaokeManager.micHint', 'Browser requires a click to unlock')}<br/>{t('karaokeManager.micHint2', 'microphone and audio playback.')}</>
                }
            </p>
            <Focusable id="activate-audio-btn">
                <button
                    ref={activateBtnRef}
                    onClick={safeActivate}
                    style={{
                        padding: '14px 40px',
                        fontSize: 18,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                        transition: 'transform 0.1s',
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    🎶 Kliknij, aby rozpocząć
                </button>
            </Focusable>
            <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>
                Możesz też nacisnąć Enter, Spację lub przycisk gamepada
            </p>
        </div>
    </div>
    );
};

export default AudioActivationOverlay;
