import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MIME, PoseDetectionResult, PoseEngine } from "../../../../models/modelsAiVideo";
import { postPoseImage, labelForEngine } from "../../../../scripts/api/apiLibraryAiVideo";
import { PoseCamGameProps } from "./PoseCamGame.types";
import { comparePoses, drawPose, drawSavedPose, normalizePose, toSimplePose } from "./PoseCamGame.logic";

/// Camera-based mini-game: capture a target pose and match it with your live pose.
export const PoseCamGame: React.FC<PoseCamGameProps> = ({
                                                            engine = "mediapipe",
                                                            targetFps = 5,
                                                            distanceScale = 0.4,
                                                            onScore,
                                                        }) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [running, setRunning] = useState(false);
    const [engineSel, setEngineSel] = useState<PoseEngine>(engine);
    const [error, setError] = useState<string | null>(null);
    const [score, setScore] = useState<number>(0);
    const [lastDet, setLastDet] = useState<PoseDetectionResult | null>(null);

    const targetDetRef = useRef<PoseDetectionResult | null>(null);
    const targetNormRef = useRef<ReturnType<typeof normalizePose> | null>(null);

    const rafRef = useRef<number | null>(null);
    const lastTickRef = useRef<number>(0);

    /// Starts the webcam stream.
    const startCam = useCallback(async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setRunning(true);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    /// Stops webcam and loop.
    const stopCam = useCallback(() => {
        setRunning(false);
        const v = videoRef.current;
        const s = v?.srcObject as MediaStream | null;
        s?.getTracks().forEach(t => t.stop());
        if (v) v.srcObject = null;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }, []);

    /// Captures current live frame and saves it as the target pose on the left.
    const captureTarget = useCallback(async () => {
        if (!videoRef.current || !leftCanvasRef.current) return;
        const det = await inferFromVideo(videoRef.current, engineSel);
        targetDetRef.current = det;
        targetNormRef.current = normalizePose(det);

        const ctxL = leftCanvasRef.current.getContext("2d");
        if (ctxL && det) {
            // Draw target pose only (clean background).
            drawSavedPose(ctxL, toSimplePose(det)!);
        }
    }, [engineSel]);

    /// Main loop: throttled inference from video, drawing live frame and scoring against target.
    const tick = useCallback(async (ts: number) => {
        if (!running || !videoRef.current || !rightCanvasRef.current) return;

        const deltaMs = ts - (lastTickRef.current || 0);
        const interval = 1000 / Math.max(1, targetFps);

        const ctxR = rightCanvasRef.current.getContext("2d");
        if (!ctxR) return;

        if (deltaMs >= interval) {
            lastTickRef.current = ts;
            try {
                const det = await inferFromVideo(videoRef.current, engineSel);
                setLastDet(det);
                drawPose(ctxR, videoRef.current, det);

                const liveNorm = normalizePose(det);
                const sim = comparePoses(targetNormRef.current, liveNorm, distanceScale);
                setScore(sim.score);
                onScore?.(sim.score);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : String(e));
            }
        }
        rafRef.current = requestAnimationFrame(tick);
    }, [running, engineSel, targetFps, distanceScale, onScore]);

    /// Starts or restarts the RAF loop when running.
    useEffect(() => {
        if (!running) return;
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [running, tick]);

    /// Cleanup on unmount.
    useEffect(() => stopCam, [stopCam]);

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <fieldset style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <legend>{t('poseCamGame.controls', 'Controls')}</legend>

                <select value={engineSel} onChange={(e) => setEngineSel(e.target.value as PoseEngine)} disabled={running}>
                    <option value="mediapipe">{labelForEngine("mediapipe")}</option>
                    <option value="openpose">{labelForEngine("openpose")}</option>
                    <option value="alphapose">{labelForEngine("alphapose")}</option>
                    <option value="vitpose">{labelForEngine("vitpose")}</option>
                </select>

                {!running ? (
                    <button onClick={startCam}>{t('poseCamGame.startCamera', 'Start camera')}</button>
                ) : (
                    <button onClick={stopCam}>{t('poseCamGame.stopCamera', 'Stop camera')}</button>
                )}
                <button onClick={captureTarget} disabled={!running}>{t('poseCamGame.savePose', 'Save current pose')}</button>

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{t('poseCamGame.score', 'Score')}</span>
                    <div style={{ width: 160, height: 10, border: "1px solid #999", position: "relative" }}>
                        <div style={{ width: `${score}%`, height: "100%", background: "#29b06f" }} />
                    </div>
                    <span style={{ width: 40, textAlign: "right" }}>{score}</span>
                </div>
            </fieldset>

            {error && <div style={{ color: "crimson" }}>{error}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                    <div style={{ marginBottom: 6 }}>{t('poseCamGame.targetPose', 'Target pose')}</div>
                    <canvas ref={leftCanvasRef} style={{ width: "100%", border: "1px solid #ddd", background: "#000" }}  role="img" aria-label="Pose Cam canvas"/>
                </div>
                <div>
                    <div style={{ marginBottom: 6 }}>{t('poseCamGame.liveCamera', 'Live camera')}</div>
                    <div style={{ position: "relative" }}>
                        <video
                            ref={videoRef}
                            muted
                            playsInline
                            style={{ width: "100%", border: "1px solid #ddd", background: "#000", display: "block" }}
                        />
                        <canvas
                            ref={rightCanvasRef}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: "100%",
                                pointerEvents: "none",
                            }}
                            role="img"
                            aria-label="Pose detection overlay canvas"
                        />
                    </div>
                </div>
            </div>

            <details>
                <summary>{t('poseCamGame.lastDetection', 'Last detection (live) JSON')}</summary>
                <pre style={{ margin: 0, maxHeight: 240, overflow: "auto", background: "#0b0b0b", color: "#d6ffd6", padding: 8, border: "1px solid #222" }}>
                    {lastDet ? JSON.stringify(lastDet, null, 2) : "{}"}
                </pre>
            </details>
        </div>
    );
};

/// Grabs current video frame, encodes to JPEG and calls backend image pose endpoint.
const inferFromVideo = async (video: HTMLVideoElement, engine: PoseEngine): Promise<PoseDetectionResult> => {
    const off = document.createElement("canvas");
    off.width = video.videoWidth || 640;
    off.height = video.videoHeight || 480;
    const ctx = off.getContext("2d")!;
    ctx.drawImage(video, 0, 0, off.width, off.height);
    const blob = await new Promise<Blob>((resolve) => off.toBlob(b => resolve(b!), MIME.imageJpeg, 0.85));
    const file = new File([blob], "frame.jpg", { type: MIME.imageJpeg });
    return await postPoseImage(engine, file);
};
