// LiveScoreMonitor.tsx — Real-time singing score monitor component.
// Connects to the live score WS endpoint, captures mic audio,
// and shows instant score + partial text as a visual overlay.

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getSingingScoreLiveWsUrl } from "../../../scripts/api/apiLibraryAiAudio";
import { LiveScoreStreamClient, type LiveScoreMessage } from "../../../utils/liveScoreStreaming";

interface LiveScoreMonitorProps {
    /** External MediaStream to use (skip getUserMedia). */
    mediaStream?: MediaStream;
    /** Audio device ID for mic capture (reserved for future use). */
    _deviceId?: string;
    /** Compact mode — smaller UI. */
    compact?: boolean;
    /** Callback on each score update. */
    onScoreUpdate?: (msg: LiveScoreMessage) => void;
}

// Color based on score (0-100)
function scoreColor(score: number): string {
    if (score >= 80) return "#4caf50";
    if (score >= 60) return "#8bc34a";
    if (score >= 40) return "#ffeb3b";
    if (score >= 20) return "#ff9800";
    return "#f44336";
}

function scoreLabel(score: number, tFn: (k: string, d?: string) => string): string {
    if (score >= 90) return tFn("liveScore.perfect", "Perfect!");
    if (score >= 75) return tFn("liveScore.great", "Great");
    if (score >= 50) return tFn("liveScore.good", "Good");
    if (score >= 25) return tFn("liveScore.ok", "OK");
    return tFn("liveScore.miss", "Miss");
}

const LiveScoreMonitor: React.FC<LiveScoreMonitorProps> = ({
    mediaStream,
    compact = false,
    onScoreUpdate,
}) => {
    const { t } = useTranslation();
    const clientRef = useRef<LiveScoreStreamClient | null>(null);
    const [connected, setConnected] = useState(false);
    const [running, setRunning] = useState(false);
    const [instantScore, setInstantScore] = useState<number | null>(null);
    const [partialText, setPartialText] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<number[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Handle score messages
    const handleScore = useCallback((msg: LiveScoreMessage) => {
        if (msg.error) {
            setError(msg.error);
            return;
        }
        if (msg.instantScore != null) {
            setInstantScore(msg.instantScore);
            setHistory(h => {
                const next = [...h, msg.instantScore!];
                return next.length > 100 ? next.slice(-100) : next;
            });
        }
        if (msg.partialText != null) {
            setPartialText(msg.partialText);
        }
        onScoreUpdate?.(msg);
    }, [onScoreUpdate]);

    // Draw score graph
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || history.length === 0) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        ctx.fillRect(0, 0, w, h);

        // Grid lines at 25, 50, 75
        ctx.strokeStyle = "rgba(128,128,128,0.2)";
        ctx.lineWidth = 1;
        for (const pct of [25, 50, 75]) {
            const y = h - (pct / 100) * h;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Score line
        ctx.beginPath();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        const step = w / Math.max(history.length - 1, 1);
        history.forEach((score, i) => {
            const x = i * step;
            const y = h - (Math.min(100, Math.max(0, score)) / 100) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill gradient
        const lastX = (history.length - 1) * step;
        ctx.lineTo(lastX, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "rgba(59,130,246,0.3)");
        grad.addColorStop(1, "rgba(59,130,246,0.02)");
        ctx.fillStyle = grad;
        ctx.fill();
    }, [history]);

    // Start / stop
    const start = useCallback(async () => {
        setError(null);
        setHistory([]);
        setInstantScore(null);
        setPartialText("");

        const wsUrl = getSingingScoreLiveWsUrl();
        const client = new LiveScoreStreamClient({
            wsUrl,
            onScore: handleScore,
            onOpen: () => setConnected(true),
            onClose: () => setConnected(false),
            onError: (err) => setError(String(err)),
            onFallback: () => {
                setError(t("liveScore.connectionLost", "Connection lost — retries exhausted"));
                setRunning(false);
            },
        });
        clientRef.current = client;

        try {
            if (mediaStream) {
                await client.startWithMediaStream(mediaStream);
            } else {
                await client.start();
            }
            setRunning(true);
        } catch (err: unknown) {
            setError(String(err));
        }
    }, [handleScore, mediaStream, t]);

    const stop = useCallback(() => {
        clientRef.current?.stop();
        clientRef.current = null;
        setRunning(false);
        setConnected(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clientRef.current?.stop();
            clientRef.current = null;
        };
    }, []);

    const avgScore = history.length > 0
        ? Math.round(history.reduce((a, b) => a + b, 0) / history.length)
        : null;

    return (
        <div style={{
            border: "1px solid var(--border-subtle, #e2e8f0)",
            borderRadius: 12,
            padding: compact ? 12 : 20,
            background: "var(--card-bg, #fff)",
            minWidth: compact ? 260 : 340,
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: compact ? 16 : 20 }}>
                    🎤 {t("liveScore.title", "Live Score")}
                </h3>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {connected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4caf50", display: "inline-block" }} />}
                    {!running ? (
                        <button
                            onClick={start}
                            style={{
                                background: "var(--accent, #3b82f6)", color: "#fff",
                                border: "none", borderRadius: 6, padding: "6px 16px",
                                cursor: "pointer", fontWeight: 600,
                            }}
                        >
                            {t("liveScore.start", "Start")}
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
                            {t("liveScore.stop", "Stop")}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{error}</div>
            )}

            {/* Score display */}
            <div style={{
                display: "flex", alignItems: "center", gap: 16,
                marginBottom: 12,
            }}>
                <div style={{
                    fontSize: compact ? 36 : 52,
                    fontWeight: 800,
                    color: instantScore != null ? scoreColor(instantScore) : "var(--text-secondary, #94a3b8)",
                    fontVariantNumeric: "tabular-nums",
                    minWidth: 80,
                    textAlign: "center",
                }}>
                    {instantScore != null ? Math.round(instantScore) : "—"}
                </div>
                <div style={{ flex: 1 }}>
                    {instantScore != null && (
                        <div style={{
                            fontSize: compact ? 14 : 18,
                            fontWeight: 700,
                            color: scoreColor(instantScore),
                            marginBottom: 4,
                        }}>
                            {scoreLabel(instantScore, (k, d) => t(k, d ?? k))}
                        </div>
                    )}
                    {avgScore != null && (
                        <div style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)" }}>
                            {t("liveScore.average", "Average")}: {avgScore}
                        </div>
                    )}
                </div>
            </div>

            {/* Partial text recognition */}
            {partialText && (
                <div style={{
                    padding: "8px 12px",
                    background: "var(--bg-secondary, #f8fafc)",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "var(--text-primary, #1e293b)",
                    marginBottom: 12,
                    fontStyle: "italic",
                    minHeight: 32,
                }}>
                    🗣️ {partialText}
                </div>
            )}

            {/* Score graph */}
            <canvas
                ref={canvasRef}
                width={compact ? 240 : 300}
                height={compact ? 60 : 80}
                style={{
                    width: "100%",
                    height: compact ? 60 : 80,
                    borderRadius: 6,
                    border: "1px solid var(--border-subtle, #e2e8f0)",
                }}
                role="img"
                aria-label="Live score graph canvas"
            />

            {/* Score bar */}
            {instantScore != null && (
                <div style={{
                    marginTop: 8,
                    height: 6,
                    borderRadius: 3,
                    background: "var(--bg-secondary, #e2e8f0)",
                    overflow: "hidden",
                }}>
                    <div style={{
                        height: "100%",
                        width: `${Math.min(100, Math.max(0, instantScore))}%`,
                        background: scoreColor(instantScore),
                        borderRadius: 3,
                        transition: "width 0.15s ease-out",
                    }} />
                </div>
            )}
        </div>
    );
};

export default LiveScoreMonitor;
