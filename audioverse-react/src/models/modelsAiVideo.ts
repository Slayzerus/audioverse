/// 2D keypoint with confidence.
export interface PoseKeypoint2D {
    /// Keypoint name.
    name: string;
    /// X coordinate in pixels.
    x: number;
    /// Y coordinate in pixels.
    y: number;
    /// Confidence [0..1].
    confidence: number;
}

/// One detected person in a 2D frame.
export interface PosePerson2D {
    /// Person id.
    id: number;
    /// Keypoints list.
    keypoints: PoseKeypoint2D[];
}

/// 2D dance detection result for a single image.
export interface PoseDetectionResult {
    /// Model label.
    model: string;
    /// Image width in px.
    image_width: number;
    /// Image height in px.
    image_height: number;
    /// Detected persons.
    persons: PosePerson2D[];
}

/// One 2D frame result.
export interface Pose2DFrame {
    /// Zero-based frame index.
    frame_index: number;
    /// Timestamp (seconds).
    timestamp_sec: number;
    /// Persons in this frame.
    persons: PosePerson2D[];
}

/// 2D sequence result for a full video.
export interface Pose2DSequenceResult {
    /// Model label.
    model: string;
    /// Frames per second.
    fps: number;
    /// Total frame count.
    frame_count: number;
    /// Frames collection.
    frames: Pose2DFrame[];
}

/// 3D keypoint with confidence.
export interface PoseKeypoint3D {
    /// Keypoint name.
    name: string;
    /// X coordinate.
    x: number;
    /// Y coordinate.
    y: number;
    /// Z coordinate.
    z: number;
    /// Confidence [0..1].
    confidence: number;
}

/// One detected person in a 3D frame.
export interface PosePerson3D {
    /// Person id.
    id: number;
    /// Keypoints list.
    keypoints: PoseKeypoint3D[];
}

/// One 3D frame result.
export interface Pose3DFrame {
    /// Zero-based frame index.
    frame_index: number;
    /// Timestamp (seconds).
    timestamp_sec: number;
    /// Persons in this frame.
    persons: PosePerson3D[];
}

/// 3D sequence result returned by PoseFormer.
export interface Pose3DSequenceResult {
    /// Model label.
    model: string;
    /// Frames per second.
    fps: number;
    /// Total frame count.
    frame_count: number;
    /// Frames collection.
    frames: Pose3DFrame[];
}

/// Engine id supported by backend.
export type PoseEngine = "mediapipe" | "openpose" | "alphapose" | "vitpose";

/// Minimal JSON payload schema for PoseFormer lifting from 2D (engine-agnostic).
export interface Pose2DSequencePayload {
    /// Frames per second.
    fps: number;
    /// Frames collection.
    frames: Array<{
        /// Zero-based frame index.
        frame_index: number;
        /// Timestamp (seconds).
        timestamp_sec: number;
        /// Persons with 2D keypoints.
        persons: Array<{
            /// Person id.
            id: number;
            /// Keypoints list.
            keypoints: Array<{
                /// Keypoint name.
                name: string;
                /// X coordinate in px.
                x: number;
                /// Y coordinate in px.
                y: number;
                /// Confidence [0..1].
                confidence: number;
            }>;
        }>;
    }>;
}

/// Common MIME strings for convenience.
export const MIME = {
    /// Image JPEG MIME.
    imageJpeg: "image/jpeg",
    /// Image PNG MIME.
    imagePng: "image/png",
    /// Video MP4 MIME.
    videoMp4: "video/mp4",
    /// JSON MIME.
    json: "application/json",
};

/// Builds FormData with image under "file".
export const toFormDataImage = (file: File): FormData => {
    const fd = new FormData();
    fd.append("file", file, file.name || "image.jpg");
    return fd;
};

/// Builds FormData with video under "file".
export const toFormDataVideo = (file: File): FormData => {
    const fd = new FormData();
    fd.append("file", file, file.name || "video.mp4");
    return fd;
};
