import { Pose2DSequenceResult, PoseEngine } from "../../../models/modelsAiVideo";

/// Props for PoseTracker component.
export interface PoseTrackerProps {
    /// Optional initial engine selection.
    initialEngine?: PoseEngine;
    /// Optional callback with latest result.
    onResult?: (res: Pose2DSequenceResult) => void;
}
