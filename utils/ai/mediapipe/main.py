from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel, Field
from typing import List
import numpy as np
import cv2
import mediapipe as mp

app = FastAPI(title="MediaPipe Pose API")

class PoseKeypoint2D(BaseModel):
    """Keypoint in 2D image coordinates."""
    name: str = Field(..., description="Name of the keypoint")
    x: float = Field(..., description="X coordinate in pixels")
    y: float = Field(..., description="Y coordinate in pixels")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score [0..1]")

class PosePerson2D(BaseModel):
    """Person with pose keypoints."""
    id: int = Field(..., ge=0, description="Person id (0..N-1)")
    keypoints: List[PoseKeypoint2D] = Field(default_factory=list, description="Keypoints for the person")

class PoseDetectionResult(BaseModel):
    """Single-image 2D pose detection result."""
    model: str = Field(..., description="Model label")
    image_width: int = Field(..., description="Image width in pixels")
    image_height: int = Field(..., description="Image height in pixels")
    persons: List[PosePerson2D] = Field(default_factory=list, description="Detected persons")

class Pose2DFrame(BaseModel):
    """One frame of a 2D pose sequence."""
    frame_index: int
    timestamp_sec: float
    persons: List[PosePerson2D]

class Pose2DSequenceResult(BaseModel):
    """Video 2D pose detection result."""
    model: str
    fps: int
    frame_count: int
    frames: List[Pose2DFrame]

mp_pose = mp.solutions.pose

LANDMARK_NAMES = [
    "nose","left_eye_inner","left_eye","left_eye_outer","right_eye_inner","right_eye","right_eye_outer",
    "left_ear","right_ear","mouth_left","mouth_right",
    "left_shoulder","right_shoulder","left_elbow","right_elbow","left_wrist","right_wrist",
    "left_pinky","right_pinky","left_index","right_index","left_thumb","right_thumb",
    "left_hip","right_hip","left_knee","right_knee","left_ankle","right_ankle",
    "left_heel","right_heel","left_foot_index","right_foot_index"
]

def _bytes_to_bgr(data: bytes):
    """Decode image bytes to a BGR numpy array using OpenCV."""
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img

@app.post("/pose/image", response_model=PoseDetectionResult)
async def pose_image(file: UploadFile = File(...)):
    """Detect 2D human pose on a single image."""
    data = await file.read()
    img_bgr = _bytes_to_bgr(data)
    h, w = img_bgr.shape[:2]
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    with mp_pose.Pose(static_image_mode=True) as pose:
        res = pose.process(img_rgb)

    persons: List[PosePerson2D] = []
    if res.pose_landmarks:
        kps: List[PoseKeypoint2D] = []
        for i, lm in enumerate(res.pose_landmarks.landmark):
            name = LANDMARK_NAMES[i] if i < len(LANDMARK_NAMES) else f"kp{i}"
            kps.append(PoseKeypoint2D(name=name, x=lm.x * w, y=lm.y * h, confidence=float(lm.visibility)))
        persons.append(PosePerson2D(id=0, keypoints=kps))

    return PoseDetectionResult(model="mediapipe", image_width=w, image_height=h, persons=persons)

@app.post("/pose/video", response_model=Pose2DSequenceResult)
async def pose_video(file: UploadFile = File(...)):
    """Detect 2D human pose on a video stream (processed offline)."""
    data = await file.read()
    tmp = "/tmp/in.mp4"
    with open(tmp, "wb") as f:
        f.write(data)

    cap = cv2.VideoCapture(tmp)
    fps = int(cap.get(cv2.CAP_PROP_FPS)) or 25
    frames: List[Pose2DFrame] = []
    idx = 0

    with mp_pose.Pose(static_image_mode=False) as pose:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            h, w = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = pose.process(rgb)

            persons: List[PosePerson2D] = []
            if res.pose_landmarks:
                kps: List[PoseKeypoint2D] = []
                for i, lm in enumerate(res.pose_landmarks.landmark):
                    name = LANDMARK_NAMES[i] if i < len(LANDMARK_NAMES) else f"kp{i}"
                    kps.append(PoseKeypoint2D(name=name, x=lm.x * w, y=lm.y * h, confidence=float(lm.visibility)))
                persons.append(PosePerson2D(id=0, keypoints=kps))

            frames.append(Pose2DFrame(frame_index=idx, timestamp_sec=idx / max(1, fps), persons=persons))
            idx += 1

    cap.release()
    return Pose2DSequenceResult(model="mediapipe", fps=fps, frame_count=len(frames), frames=frames)


@app.get('/health')
async def health():
    return {'status': 'ok', 'service': 'mediapipe'}
