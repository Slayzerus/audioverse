import { Pose3DSequenceResult } from "../../../models/modelsAiVideo";

/// Props for Pose3DLifter component.
export interface Pose3DLifterProps {
    /// Optional callback with latest result.
    onResult?: (res: Pose3DSequenceResult) => void;
}
