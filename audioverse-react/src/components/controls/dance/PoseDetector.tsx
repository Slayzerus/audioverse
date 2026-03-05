import React, { useMemo, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { labelForEngine, postPoseImage } from "../../../scripts/api/apiLibraryAiVideo";
import { MIME, PoseDetectionResult, PoseEngine } from "../../../models/modelsAiVideo";
import { drawPoseOnCanvas } from "./PoseDetector.logic";
import { PoseDetectorProps } from "./PoseDetector.types";

/// Simple test harness for single-image 2D dance detection.
export const PoseDetector: React.FC<PoseDetectorProps> = ({ initialEngine = "mediapipe", onResult }) => {
    const { t } = useTranslation();
    const [engine, setEngine] = useState<PoseEngine>(initialEngine);
    const [file, setFile] = useState<File | null>(null);
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PoseDetectionResult | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        return () => {
            if (imgUrl) URL.revokeObjectURL(imgUrl);
        };
    }, [imgUrl]);

    /// Handles file selection from input.
    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.currentTarget.files?.[0] ?? null;
        setResult(null);
        setError(null);
        if (imgUrl) {
            URL.revokeObjectURL(imgUrl);
            setImgUrl(null);
        }
        if (f) {
            const mimeOk = f.type === MIME.imageJpeg || f.type === MIME.imagePng;
            if (!mimeOk) {
                setError(t('poseDetector.acceptedJpegPng', 'Accepted: JPEG/PNG.'));
                setFile(null);
                return;
            }
            setFile(f);
            setImgUrl(URL.createObjectURL(f));
        } else {
            setFile(null);
        }
    };

    /// Executes detection using current engine and file.
    const onRun = async () => {
        if (!file) {
            setError(t('poseDetector.selectImage', 'Select an image first.'));
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const res = await postPoseImage(engine, file);
            setResult(res);
            onResult?.(res);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    };

    /// Draw overlay when result or image changes.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imgUrl || !result) return;
        drawPoseOnCanvas(canvas, imgUrl, result).catch(() => { /* Expected: canvas draw may fail for invalid image data */ });
    }, [imgUrl, result]);

    const engines = useMemo<PoseEngine[]>(() => ["mediapipe", "openpose", "alphapose", "vitpose"], []);

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <fieldset style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <legend>{t('poseDetector.engine', 'Engine')}</legend>
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
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
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
                    <div style={{ marginBottom: 6 }}>{t('poseDetector.preview', 'Preview')}</div>
                    <canvas
                        ref={canvasRef}
                        style={{ width: "100%", border: "1px solid #ddd", background: "#000" }}
                        role="img"
                        aria-label="Pose detection preview canvas"
                    />
                </div>
                <div>
                    <div style={{ marginBottom: 6 }}>{t('poseDetector.responseJson', 'Response JSON')}</div>
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
