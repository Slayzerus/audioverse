/* PartyQRCode — Slide-out QR panel triggered from navbar icon.
   Three sizes: small (160px) → 2x (320px) → fullscreen (viewport-fitted). */
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

type QRSize = 'closed' | 'small' | 'medium' | 'full';

interface PartyQRCodeProps {
    partyId: number;
    partyName?: string | null;
    open: boolean;
    onClose: () => void;
}

const PartyQRCode: React.FC<PartyQRCodeProps> = ({ partyId, partyName, open, onClose }) => {
    const { t } = useTranslation();
    const [size, setSize] = useState<QRSize>('small');
    const panelRef = useRef<HTMLDivElement>(null);

    const joinLink = useMemo(
        () => `${window.location.origin}/join/${partyId}`,
        [partyId],
    );

    // Reset size when opening
    useEffect(() => {
        if (open) setSize('small');
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
        };
        // delay to avoid the same click that opened it
        const id = setTimeout(() => document.addEventListener('mousedown', handler), 50);
        return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
    }, [open, onClose]);

    const cycle = useCallback(() => {
        setSize(prev => prev === 'small' ? 'medium' : prev === 'medium' ? 'full' : 'small');
    }, []);

    if (!open) return null;

    const isFull = size === 'full';
    const qrPx = size === 'small' ? 160 : size === 'medium' ? 320 : Math.min(window.innerWidth, window.innerHeight) - 120;
    const sizeLabel = size === 'small' ? '×2' : size === 'medium' ? '⛶' : '×1';
    const sizeTitle = size === 'small'
        ? t('party.qrEnlarge', 'Powiększ ×2')
        : size === 'medium'
            ? t('party.qrFullscreen', 'Pełny ekran')
            : t('party.qrShrink', 'Zmniejsz');

    // Fullscreen: centered overlay; otherwise: slide-out panel beneath navbar
    const containerStyle: React.CSSProperties = isFull
        ? {
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'qrFadeIn .2s ease',
        }
        : {
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1050,
            background: '#1a1a1a', border: '1px solid #333', borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            padding: 16, marginTop: 8,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'qrSlideDown .2s ease',
        };

    return (
        <>
            <style>{`
                @keyframes qrSlideDown { from { opacity: 0; transform: translateX(-50%) translateY(-12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
                @keyframes qrFadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
            <div ref={panelRef} style={containerStyle}>
                {/* Header row */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                    color: '#ccc', fontSize: 13, width: '100%', justifyContent: 'center',
                }}>
                    {partyName && <span style={{ fontWeight: 600, color: '#fff' }}>{partyName}</span>}
                    <button
                        onClick={cycle}
                        title={sizeTitle}
                        style={{
                            background: 'rgba(255,255,255,0.1)', border: '1px solid #555',
                            borderRadius: 6, color: '#fff', padding: '2px 10px', cursor: 'pointer',
                            fontSize: 14, lineHeight: 1.4,
                        }}
                    >
                        {sizeLabel}
                    </button>
                    <button
                        onClick={onClose}
                        title={t('common.close', 'Zamknij')}
                        style={{
                            background: 'transparent', border: 'none', color: '#888',
                            fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* QR */}
                <div
                    style={{
                        display: 'inline-block', padding: isFull ? 24 : 10,
                        background: '#fff', borderRadius: isFull ? 20 : 10,
                        cursor: 'pointer',
                    }}
                    onClick={cycle}
                    title={sizeTitle}
                >
                    <QRCodeSVG value={joinLink} size={qrPx} level={isFull ? 'H' : 'M'} />
                </div>

                {/* Link */}
                <div style={{
                    marginTop: 8, fontSize: isFull ? 16 : 11,
                    color: '#888', fontFamily: 'monospace', wordBreak: 'break-all',
                    textAlign: 'center', maxWidth: isFull ? '90vw' : 280,
                }}>
                    {joinLink}
                </div>
            </div>
        </>
    );
};

export default PartyQRCode;
