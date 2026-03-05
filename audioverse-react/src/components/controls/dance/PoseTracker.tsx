import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { postPoseVideo, labelForEngine } from "../../../scripts/api/apiLibraryAiVideo";
import { Pose2DSequenceResult, PoseEngine, MIME } from "../../../models/modelsAiVideo";
import { PoseTrackerProps } from "./PoseTracker.types";

/// Simple test harness for full-video 2D pose tracking.
export const PoseTracker: React.FC<PoseTrackerProps> = ({ initialEngine = "mediapipe", onResult }) => {
    const { t } = useTranslation();
    const [engine, setEngine] = useState<PoseEngine>(initialEngine);
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<Pose2DSequenceResult | null>(null);

    /// Handles video selection from input.
    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.currentTarget.files?.[0] ?? null;
        setResult(null);
        setError(null);
        if (f) {
            if (f.type !== MIME.videoMp4) {
                setError(t('poseTracker.acceptedMp4', 'Accepted: MP4.'));
                setFile(null);
                return;
            }
            setFile(f);
        } else {
            setFile(null);
        }
    };

    /// Executes tracking using current engine and file.
    const onRun = async () => {
        if (!file) {
            setError(t('poseTracker.selectVideo', 'Select a video first.'));
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const res = await postPoseVideo(engine, file);
            setResult(res);
            onResult?.(res);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    };

    const engines = useMemo<PoseEngine[]>(() => ["mediapipe", "openpose", "alphapose", "vitpose"], []);

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <fieldset style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <legend>{t('poseTracker.engine', 'Engine')}</legend>
                <select
                    value={engine}
                    onChange={(e) => setEngine(e.target.value as PoseEngine)}
                    disabled={busy}
                >
                    {engines.map((en) => (
                        <option key={en} value={en}>
                            {labelForEngine(en)}
                        </option>
                    ))}
                </select>

                <input
                    type="file"
                    accept="video/mp4"
                    onChange={onPickFile}
                    disabled={busy}
                />
                <button onClick={onRun} disabled={busy || !file}>
                    Run
                </button>
                {busy && <span>Processing…</span>}
            </fieldset>

            {error && (
                <div style={{ color: "crimson" }}>
                    {error}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                    <div style={{ marginBottom: 6 }}>{t('poseTracker.summary', 'Summary')}</div>
                    <div style={{ border: "1px solid #ddd", padding: 8 }}>
                        <div>Model: {result?.model ?? "-"}</div>
                        <div>FPS: {result?.fps ?? "-"}</div>
                        <div>Frames: {result?.frame_count ?? "-"}</div>
                        <div>First frame persons: {result?.frames?.[0]?.persons?.length ?? "-"}</div>
                    </div>
                </div>
                <div>
                    <div style={{ marginBottom: 6 }}>{t('poseTracker.responseJson', 'Response JSON')}</div>
                    <pre
                        style={{
                            margin: 0,
                            maxHeight: 420,
                            overflow: "auto",
                            background: "#0b0b0b",
                            color: "#d6ffd6",
                            padding: 8,
                            border: "1px solid #222",
                        }}
                    >
                        {result ? JSON.stringify(result, null, 2) : "{}"}
                    </pre>
                </div>
            </div>
        </div>
    );
};
