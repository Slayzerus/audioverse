/**
 * FFTCanvas — FFT frequency chart + scrolling note timeline canvases.
 */
import React, { useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';

interface FFTCanvasProps {
    fftData: Uint8Array | null;
    noteHistory: { note: string; time: number; hz: number }[];
}

/** Maps a pitch frequency (Hz) to a red→yellow→green colour. */
function pitchToColor(hz: number): string {
    if (hz <= 0) return 'transparent';
    const logMin = Math.log2(80);   // ~C2
    const logMax = Math.log2(1047); // ~C6
    const t = Math.max(0, Math.min(1, (Math.log2(hz) - logMin) / (logMax - logMin)));
    const hue = Math.round(t * 120); // 0=red, 60=yellow, 120=green
    return `hsl(${hue}, 100%, 52%)`;
}

const FFTCanvas: React.FC<FFTCanvasProps> = ({ fftData, noteHistory }) => {
    const { t } = useTranslation();
    const fftCanvasRef = useRef<HTMLCanvasElement>(null);
    const timelineCanvasRef = useRef<HTMLCanvasElement>(null);

    // Draw FFT spectrum
    useEffect(() => {
        if (!fftData || !fftCanvasRef.current) return;
        const ctx = fftCanvasRef.current.getContext("2d");
        if (!ctx) return;
        const cs = getComputedStyle(document.documentElement);
        const bgColor = cs.getPropertyValue('--surface-dark').trim() || '#222';
        const lineColor = cs.getPropertyValue('--accent-success').trim() || '#4CAF50';
        ctx.clearRect(0, 0, 300, 80);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 300, 80);
        ctx.strokeStyle = lineColor;
        ctx.beginPath();
        for (let i = 0; i < fftData.length; i++) {
            const x = (i / fftData.length) * 300;
            const y = 80 - (fftData[i] / 255) * 80;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }, [fftData]);

    // Draw scrolling note timeline
    useEffect(() => {
        if (!timelineCanvasRef.current) return;
        const ctx = timelineCanvasRef.current.getContext("2d");
        if (!ctx) return;
        const cs = getComputedStyle(document.documentElement);
        const bgColor = cs.getPropertyValue('--surface-dark').trim() || '#222';
        const mutedColor = cs.getPropertyValue('--text-muted').trim() || '#444';
        ctx.clearRect(0, 0, 300, 40);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 300, 40);
        const now = Date.now();
        noteHistory.forEach(({ note, time, hz }) => {
            const dt = now - time;
            if (dt < 0 || dt > 5000) return;
            const x = 300 - (dt / 5000) * 300;
            ctx.fillStyle = note === "-" ? mutedColor : pitchToColor(hz);
            ctx.fillRect(x - 2, 0, 4, 40);
        });
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(299, 0);
        ctx.lineTo(299, 40);
        ctx.stroke();
    }, [noteHistory]);

    return (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
                <canvas ref={fftCanvasRef} width={300} height={80} style={{ background: 'var(--surface-dark, #222)', borderRadius: 4 }} role="img" aria-label="Frequency chart" />
                <div style={{ fontSize: 10, color: 'var(--text-muted, #888)' }}>{t('pitch.fftChart')}</div>
            </div>
            <div>
                <canvas ref={timelineCanvasRef} width={300} height={40} style={{ background: 'var(--surface-dark, #222)', borderRadius: 4 }} role="img" aria-label="Note timeline" />
                <div style={{ fontSize: 10, color: 'var(--text-muted, #888)' }}>{t('pitch.noteTimeline')}</div>
            </div>
        </div>
    );
};

export default React.memo(FFTCanvas);
