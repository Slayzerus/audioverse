import { PoseDetectionResult, PoseEngine } from "../../../models/modelsAiVideo";

/// Props for PoseDetector component.
export interface PoseDetectorProps {
    /// Optional initial engine selection.
    initialEngine?: PoseEngine;
    /// Optional callback with latest result.
    onResult?: (res: PoseDetectionResult) => void;
}
