import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { postPose3dFromSequence, postPose3dFromVideo } from "../../../scripts/api/apiLibraryAiVideo";
import { MIME, Pose3DSequenceResult, Pose2DSequencePayload } from "../../../models/modelsAiVideo";
import { Pose3DLifterProps } from "./Pose3DLifter.types";

/// Simple test harness for PoseFormer 3D lifting (JSON sequence or MP4).
export const Pose3DLifter: React.FC<Pose3DLifterProps> = ({ onResult }) => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<"json" | "video">("json");
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<Pose3DSequenceResult | null>(null);

    /// Handles file selection per mode.
    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.currentTarget.files?.[0] ?? null;
        setResult(null);
        setError(null);
        if (!f) {
            setFile(null);
            return;
        }
        if (mode === "json" && f.type !== MIME.json) {
            setError(t('pose3d.acceptedJson', 'Accepted JSON for sequence.'));
            setFile(null);
            return;
        }
        if (mode === "video" && f.type !== MIME.videoMp4) {
            setError(t('pose3d.acceptedMp4', 'Accepted: MP4.'));
            setFile(null);
            return;
        }
        setFile(f);
    };

    /// Executes lifting depending on mode.
    const onRun = async () => {
        if (!file) {
            setError(t('pose3d.selectFile', 'Select a file first.'));
            return;
        }
        setBusy(true);
        setError(null);
        try {
            if (mode === "json") {
                const txt = await file.text();
                const payload = JSON.parse(txt) as Pose2DSequencePayload;
                const res = await postPose3dFromSequence(payload);
                setResult(res);
                onResult?.(res);
            } else {
                const res = await postPose3dFromVideo(file);
                setResult(res);
                onResult?.(res);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <fieldset style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <legend>{t('pose3d.input', 'Input')}</legend>
                <label>
                    <input
                        type="radio"
                        name="mode"
                        value="json"
                        checked={mode === "json"}
                        onChange={() => { setMode("json"); setFile(null); setResult(null); setError(null); }}
                    />
                    JSON sequence
                </label>
                <label>
                    <input
                        type="radio"
                        name="mode"
                        value="video"
                        checked={mode === "video"}
                        onChange={() => { setMode("video"); setFile(null); setResult(null); setError(null); }}
                    />
                    MP4 video
                </label>

                <input
                    type="file"
                    accept={mode === "json" ? MIME.json : MIME.videoMp4}
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
                    <div style={{ marginBottom: 6 }}>{t('pose3d.summary', 'Summary')}</div>
                    <div style={{ border: "1px solid #ddd", padding: 8 }}>
                        <div>Model: {result?.model ?? "-"}</div>
                        <div>FPS: {result?.fps ?? "-"}</div>
                        <div>Frames: {result?.frame_count ?? "-"}</div>
                        <div>First frame persons: {result?.frames?.[0]?.persons?.length ?? "-"}</div>
                    </div>
                </div>
                <div>
                    <div style={{ marginBottom: 6 }}>{t('pose3d.responseJson', 'Response JSON')}</div>
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
