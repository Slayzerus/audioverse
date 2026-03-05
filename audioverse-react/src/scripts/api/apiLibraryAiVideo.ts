import { apiClient, apiPath } from "./audioverseApiClient";
import {
    PoseDetectionResult,
    Pose2DSequenceResult,
    Pose3DSequenceResult,
    Pose2DSequencePayload,
    PoseEngine,
    toFormDataImage,
    toFormDataVideo,
    MIME,
} from "../../models/modelsAiVideo";

/// Base path for AI Video endpoints.
export const AI_VIDEO_BASE = "/api/ai/video";

/* ============================================================================
   Low-level API (fetchers)
   ========================================================================== */

/// Runs single-image 2D dance detection for a chosen engine.
/** @internal */
export const postPoseImage = async (
    engine: PoseEngine,
    file: File
): Promise<PoseDetectionResult> => {
    const { data } = await apiClient.post<PoseDetectionResult>(
        apiPath(AI_VIDEO_BASE, `/pose/${encodeURIComponent(engine)}/image`),
        toFormDataImage(file)
    );
    return data;
};

/// Runs full-video 2D tracking for a chosen engine.
/** @internal */
export const postPoseVideo = async (
    engine: PoseEngine,
    file: File
): Promise<Pose2DSequenceResult> => {
    const { data } = await apiClient.post<Pose2DSequenceResult>(
        apiPath(AI_VIDEO_BASE, `/pose/${encodeURIComponent(engine)}/video`),
        toFormDataVideo(file)
    );
    return data;
};

/// Runs PoseFormer 3D lifting from a raw 2D sequence (JSON).
/** @internal */
export const postPose3dFromSequence = async (
    payload: Pose2DSequencePayload
): Promise<Pose3DSequenceResult> => {
    const { data } = await apiClient.post<Pose3DSequenceResult>(
        apiPath(AI_VIDEO_BASE, "/pose3d"),
        payload,
        { headers: { "Content-Type": MIME.json } }
    );
    return data;
};

/// Runs PoseFormer 3D lifting directly from a video file (MP4).
/** @internal */
export const postPose3dFromVideo = async (
    file: File
): Promise<Pose3DSequenceResult> => {
    const { data } = await apiClient.post<Pose3DSequenceResult>(
        apiPath(AI_VIDEO_BASE, "/pose3d"),
        toFormDataVideo(file)
    );
    return data;
};

/* ============================================================================
   (Opcjonalnie) Helpery UI
   ========================================================================== */

/// Maps engine value to a friendly label for UI.
export const labelForEngine = (engine: PoseEngine): string => {
    /// Human-readable engine label.
    const labels: Record<PoseEngine, string> = {
        mediapipe: "MediaPipe",
        openpose: "OpenPose",
        alphapose: "AlphaPose",
        vitpose: "ViTPose",
    };
    return labels[engine] ?? engine;
};
