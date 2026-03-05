// VocalEffectsPanel.tsx — UI panel for live configurable vocal effects on microphone.
// Allows toggling/stacking multiple effects, adjusting intensity, and monitoring output.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    VocalEffectsEngine,
    ALL_EFFECTS,
    type VocalEffectConfig,
    type VocalEffectType,
} from "../../../utils/vocalEffectsEngine";
import { logger } from "../../../utils/logger";
const log = logger.scoped('VocalEffectsPanel');

interface VocalEffectsPanelProps {
    /** Mic device ID. If omitted, uses default device. */
    deviceId?: string;
    /** Existing MediaStream (skip getUserMedia). */
    mediaStream?: MediaStream;
    /** Compact layout */
    compact?: boolean;
}

const VocalEffectsPanel: React.FC<VocalEffectsPanelProps> = ({
    deviceId,
    mediaStream,
    compact = false,
}) => {
    const { t } = useTranslation();
    const engineRef = useRef<VocalEffectsEngine | null>(null);
    const [running, setRunning] = useState(false);
    const [effects, setEffects] = useState<VocalEffectConfig[]>(() =>
        ALL_EFFECTS.map((e: VocalEffectConfig) => ({ ...e }))
    );
    const [monitoring, setMonitoring] = useState(true);
    const [volume, setVolume] = useState(80);
    const [inputGain, setInputGain] = useState(100);
    const [level, setLevel] = useState(0);
    const levelRaf = useRef<number>(0);

    // Level metering
    const startMeter = useCallback(() => {
        const tick = () => {
            if (engineRef.current?.isStarted) {
                setLevel(engineRef.current.getLevel());
                levelRaf.current = requestAnimationFrame(tick);
            }
        };
        levelRaf.current = requestAnimationFrame(tick);
    }, []);

    const stopMeter = useCallback(() => {
        if (levelRaf.current) cancelAnimationFrame(levelRaf.current);
    }, []);

    // Start engine
    const start = useCallback(async () => {
        const engine = new VocalEffectsEngine();
        engineRef.current = engine;
        try {
            if (mediaStream) {
                await engine.startWithStream(mediaStream);
            } else {
                await engine.start(deviceId);
            }
            engine.setMonitoring(monitoring);
            engine.setVolume(volume / 100);
            engine.setInputGain(inputGain / 100);

            // Apply already-enabled effects
            for (const fx of effects) {
                if (fx.enabled) {
                    engine.addEffect(fx.type, fx.intensity);
                }
            }

            setRunning(true);
            startMeter();
        } catch (err) {
            log.error("start error", err);
        }
    }, [deviceId, mediaStream, monitoring, volume, inputGain, effects, startMeter]);

    // Stop engine
    const stop = useCallback(() => {
        stopMeter();
        engineRef.current?.stop();
        engineRef.current = null;
        setRunning(false);
        setLevel(0);
    }, [stopMeter]);

    // Cleanup
    useEffect(() => {
        return () => {
            stopMeter();
            engineRef.current?.stop();
            engineRef.current = null;
        };
    }, [stopMeter]);

    // Toggle effect
    const toggleEffect = useCallback((type: VocalEffectType) => {
        setEffects((prev: VocalEffectConfig[]) => prev.map((fx: VocalEffectConfig) => {
            if (fx.type !== type) return fx;
            const next = { ...fx, enabled: !fx.enabled };
            if (engineRef.current?.isStarted) {
                if (next.enabled) {
                    engineRef.current.addEffect(type, next.intensity);
                } else {
                    engineRef.current.removeEffect(type);
                }
            }
            return next;
        }));
    }, []);

    // Update intensity
    const changeIntensity = useCallback((type: VocalEffectType, val: number) => {
        setEffects((prev: VocalEffectConfig[]) => prev.map((fx: VocalEffectConfig) => {
            if (fx.type !== type) return fx;
            const next = { ...fx, intensity: val };
            if (fx.enabled && engineRef.current?.isStarted) {
                engineRef.current.updateIntensity(type, val);
            }
            return next;
        }));
    }, []);

    // Volume / gain changes
    useEffect(() => {
        engineRef.current?.setVolume(volume / 100);
    }, [volume]);

    useEffect(() => {
        engineRef.current?.setInputGain(inputGain / 100);
    }, [inputGain]);

    useEffect(() => {
        engineRef.current?.setMonitoring(monitoring);
    }, [monitoring]);

    // Clear all
    const clearAll = useCallback(() => {
        engineRef.current?.clearAllEffects();
        setEffects((prev: VocalEffectConfig[]) => prev.map((fx: VocalEffectConfig) => ({ ...fx, enabled: false })));
    }, []);

    const enabledCount = effects.filter(e => e.enabled).length;

    return (
        <div style={{
            border: "1px solid var(--border-subtle, #e2e8f0)",
            borderRadius: 12,
            padding: compact ? 12 : 20,
            background: "var(--card-bg, #fff)",
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: compact ? 16 : 20 }}>
                    🎙️ {t("vocalEffects.title", "Vocal Effects")}
                </h3>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {enabledCount > 0 && (
                        <span style={{
                            background: "var(--accent, #3b82f6)", color: "#fff",
                            borderRadius: 12, padding: "2px 10px", fontSize: 12, fontWeight: 700,
                        }}>
                            {enabledCount} {t("vocalEffects.active", "active")}
                        </span>
                    )}
                    {!running ? (
                        <button
                            onClick={start}
                            style={{
                                background: "var(--accent, #3b82f6)", color: "#fff",
                                border: "none", borderRadius: 6, padding: "6px 16px",
                                cursor: "pointer", fontWeight: 600,
                            }}
                        >
                            {t("vocalEffects.start", "Start Mic")}
                        </button>
                    ) : (
                        <button
                            onClick={stop}
                            style={{
                                background: "#ef4444", color: "#fff",
                                border: "none", borderRadius: 6, padding: "6px 16px",
                                cursor: "pointer", fontWeight: 600,
                            }}
                        >
                            {t("vocalEffects.stop", "Stop")}
                        </button>
                    )}
                </div>
            </div>

            {/* Controls row */}
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                {/* Monitor toggle */}
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={monitoring}
                        onChange={e => setMonitoring(e.target.checked)}
                    />
                    🔊 {t("vocalEffects.monitor", "Monitor")}
                </label>

                {/* Volume */}
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    {t("vocalEffects.volume", "Vol")}:
                    <input
                        type="range" min={0} max={200} value={volume}
                        onChange={e => setVolume(Number(e.target.value))}
                        style={{ width: 80 }}
                    />
                    <span style={{ minWidth: 32, fontSize: 12 }}>{volume}%</span>
                </label>

                {/* Input gain */}
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    {t("vocalEffects.gain", "Gain")}:
                    <input
                        type="range" min={0} max={300} value={inputGain}
                        onChange={e => setInputGain(Number(e.target.value))}
                        style={{ width: 80 }}
                    />
                    <span style={{ minWidth: 32, fontSize: 12 }}>{inputGain}%</span>
                </label>

                {/* Level meter */}
                {running && (
                    <div style={{
                        width: 80, height: 8, borderRadius: 4,
                        background: "var(--bg-secondary, #e2e8f0)",
                        overflow: "hidden",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${Math.min(100, level * 300)}%`,
                            background: level > 0.5 ? "#ef4444" : level > 0.2 ? "#f59e0b" : "#4caf50",
                            transition: "width 0.05s",
                        }} />
                    </div>
                )}

                {/* Clear all */}
                {enabledCount > 0 && (
                    <button onClick={clearAll} style={{
                        fontSize: 12, padding: "4px 10px", borderRadius: 4,
                        border: "1px solid var(--border-color, #d1d5db)",
                        background: "var(--card-bg, #fff)", cursor: "pointer",
                    }}>
                        {t("vocalEffects.clearAll", "Clear All")}
                    </button>
                )}
            </div>

            {/* Effects grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: compact ? "repeat(auto-fill, minmax(130px, 1fr))" : "repeat(auto-fill, minmax(160px, 1fr))",
                gap: compact ? 6 : 10,
            }}>
                {effects.map(fx => (
                    <div
                        key={fx.type}
                        style={{
                            border: fx.enabled
                                ? "2px solid var(--accent, #3b82f6)"
                                : "1px solid var(--border-subtle, #e2e8f0)",
                            borderRadius: 10,
                            padding: compact ? "6px 8px" : "10px 12px",
                            background: fx.enabled
                                ? "var(--accent-light, #eff6ff)"
                                : "var(--card-bg, #fff)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            userSelect: "none",
                        }}
                    >
                        {/* Effect button */}
                        <div
                            onClick={() => toggleEffect(fx.type)}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                marginBottom: fx.enabled ? 6 : 0,
                            }}
                        >
                            <span style={{ fontSize: compact ? 18 : 22 }}>{fx.icon}</span>
                            <span style={{
                                fontSize: compact ? 12 : 14,
                                fontWeight: fx.enabled ? 700 : 500,
                                color: fx.enabled ? "var(--accent, #3b82f6)" : "var(--text-primary, #1e293b)",
                            }}>
                                {fx.label}
                            </span>
                        </div>

                        {/* Intensity slider (visible when enabled) */}
                        {fx.enabled && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <input
                                    type="range"
                                    min={0} max={100}
                                    value={fx.intensity}
                                    onChange={e => {
                                        e.stopPropagation();
                                        changeIntensity(fx.type, Number(e.target.value));
                                    }}
                                    onClick={e => e.stopPropagation()}
                                    style={{ flex: 1, height: 4 }}
                                    aria-label={t("vocalEffects.intensity", "Effect intensity")}
                                />
                                <span style={{ fontSize: 11, minWidth: 24, color: "var(--text-secondary, #64748b)" }}>
                                    {fx.intensity}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Hint */}
            <div style={{
                marginTop: 12, fontSize: 12,
                color: "var(--text-secondary, #94a3b8)",
                textAlign: "center",
            }}>
                {t("vocalEffects.hint", "Click effects to toggle. Multiple effects can be active simultaneously. Adjust intensity with the slider.")}
            </div>
        </div>
    );
};

export default VocalEffectsPanel;
