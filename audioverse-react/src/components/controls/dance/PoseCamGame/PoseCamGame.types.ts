import { PoseDetectionResult, PoseEngine } from "../../../../models/modelsAiVideo.ts";

/// Props for PoseCamGame.
export interface PoseCamGameProps {
    /// Engine used for pose detection: mediapipe|openpose|alphapose|vitpose.
    engine?: PoseEngine;
    /// Target FPS for inference (throttled HTTP calls).
    targetFps?: number;
    /// Distance scaling factor for score mapping (lower => stricter).
    distanceScale?: number;
    /// Optional callback fired on each score update.
    onScore?: (score: number) => void;
}

/// A flat vector of normalized keypoints keyed by name.
export type NormalizedPose = Record<string, { x: number; y: number; c: number }>;

/// Result of similarity comparison.
export interface PoseSimilarity {
    /// Score 0..100 (100 == perfect match).
    score: number;
    /// Average normalized L2 distance across common keypoints.
    avgDistance: number;
    /// Number of common keypoints used for scoring.
    commonCount: number;
    /// Names of compared keypoints.
    names: string[];
}

/// Minimal subset of a pose needed for display.
export interface SimplePoseForDraw {
    /// Image width.
    w: number;
    /// Image height.
    h: number;
    /// Persons list from detection.
    persons: PoseDetectionResult["persons"];
}
