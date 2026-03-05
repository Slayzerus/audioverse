from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from typing import List
import numpy as np
import cv2
import os

app = FastAPI(title="OpenPose API")

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
    model: str
    image_width: int
    image_height: int
    persons: List[PosePerson2D]

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

def _ensure_openpose():
    """Ensure pyopenpose is importable; otherwise raise 503."""
    try:
        import pyopenpose as op  # type: ignore
        return op
    except Exception as ex:
        raise HTTPException(
            status_code=503,
            detail="pyopenpose not available in container. Provide OpenPose build with Python API."
        ) from ex

def _bytes_to_bgr(data: bytes):
    """Decode image bytes to a BGR numpy array using OpenCV."""
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image data")
    return img

def _models_dir() -> str:
    """Resolve models directory from env vars."""
    return os.getenv("MODELS_DIR") or os.getenv("OPENPOSE_MODELS", "/models")

@app.post("/pose/image", response_model=PoseDetectionResult)
async def pose_image(file: UploadFile = File(...)):
    """Detect 2D human pose on a single image using OpenPose."""
    op = _ensure_openpose()
    data = await file.read()
    img = _bytes_to_bgr(data)
    h, w = img.shape[:2]

    params = {"model_folder": _models_dir()}
    wrapper = op.WrapperPython()
    wrapper.configure(params)
    wrapper.start()

    datum = op.Datum()
    datum.cvInputData = img
    wrapper.emplaceAndPop([datum])

    persons: List[PosePerson2D] = []
    if datum.poseKeypoints is not None and len(datum.poseKeypoints.shape) == 3:
        for pid, arr in enumerate(datum.poseKeypoints):
            kps: List[PoseKeypoint2D] = []
            for i in range(arr.shape[0]):
                x, y, c = float(arr[i, 0]), float(arr[i, 1]), float(arr[i, 2])
                kps.append(PoseKeypoint2D(name=f"kp{i}", x=x, y=y, confidence=c))
            persons.append(PosePerson2D(id=pid, keypoints=kps))

    return PoseDetectionResult(model="openpose", image_width=w, image_height=h, persons=persons)

@app.post("/pose/video", response_model=Pose2DSequenceResult)
async def pose_video(file: UploadFile = File(...)):
    """Detect 2D human pose on a video stream (processed offline) using OpenPose."""
    op = _ensure_openpose()
    data = await file.read()
    tmp = "/tmp/in.mp4"
    with open(tmp, "wb") as f:
        f.write(data)

    params = {"model_folder": _models_dir()}
    wrapper = op.WrapperPython()
    wrapper.configure(params)
    wrapper.start()

    cap = cv2.VideoCapture(tmp)
    fps = int(cap.get(cv2.CAP_PROP_FPS)) or 25
    idx = 0
    frames: List[Pose2DFrame] = []

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        datum = op.Datum()
        datum.cvInputData = frame
        wrapper.emplaceAndPop([datum])

        persons: List[PosePerson2D] = []
        if datum.poseKeypoints is not None and len(datum.poseKeypoints.shape) == 3:
            for pid, arr in enumerate(datum.poseKeypoints):
                kps = [
                    PoseKeypoint2D(
                        name=f"kp{i}",
                        x=float(arr[i, 0]),
                        y=float(arr[i, 1]),
                        confidence=float(arr[i, 2]),
                    )
                    for i in range(arr.shape[0])
                ]
                persons.append(PosePerson2D(id=pid, keypoints=kps))

        frames.append(Pose2DFrame(frame_index=idx, timestamp_sec=idx / max(1, fps), persons=persons))
        idx += 1

    cap.release()
    return Pose2DSequenceResult(model="openpose", fps=fps, frame_count=len(frames), frames=frames)


@app.get('/health')
async def health():
    return {'status': 'ok', 'service': 'openpose'}
