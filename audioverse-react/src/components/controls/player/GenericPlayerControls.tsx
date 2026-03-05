import React from "react";
import { useTranslation } from 'react-i18next';
import { formatTime } from "../../../scripts/musicPlayer/musicPlayerUtils";

type Props = {
    isPlaying: boolean;
    index: number;
    count: number;
    currentTime: number;
    duration: number;
    volume: number;
    onPrev: () => void;
    onNext: () => void;
    onToggle: () => void;
    onSeek: (sec: number) => void;
    onVolume: (v: number) => void;
};

const btn: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 10px", background: "#fff", cursor: "pointer" };

const GenericPlayerControls: React.FC<Props> = ({
                                       isPlaying, index, count, currentTime, duration, volume,
                                       onPrev, onNext, onToggle, onSeek, onVolume
                                   }) => {
    const { t } = useTranslation();
    return (
    <>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "space-between" }}>
            <div />
            <div style={{ fontSize: 12, color: "#64748b" }}>{formatTime(currentTime)} / {formatTime(duration)}</div>
        </div>

        <div className="gp-controls" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8 }}>
                <button onClick={onPrev} disabled={index <= 0} title={t('playerControls.prev', 'Prev')} aria-label={t('playerControls.previousTrack', 'Previous track')} style={btn}>⏮</button>
                <button onClick={onToggle} title={isPlaying ? t('playerControls.pause', 'Pause') : t('playerControls.play', 'Play')} aria-label={isPlaying ? t('playerControls.pause', 'Pause') : t('playerControls.play', 'Play')} style={btn}>{isPlaying ? "⏸" : "▶"}</button>
                <button onClick={onNext} disabled={index >= count - 1} title={t('playerControls.next', 'Next')} aria-label={t('playerControls.nextTrack', 'Next track')} style={btn}>⏭</button>
            </div>

            <input type="range" min={0} max={Math.max(1, duration)} step={0.1} value={currentTime} aria-label={t('playerControls.seekPosition', 'Seek position')} onChange={(e) => onSeek(parseFloat(e.target.value))} />

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>🔊</span>
                <input type="range" min={0} max={1} step={0.01} value={volume} aria-label={t('playerControls.volume', 'Volume')} onChange={(e) => onVolume(parseFloat(e.target.value))} />
            </div>
        </div>
    </>
    );
};

export default React.memo(GenericPlayerControls);
