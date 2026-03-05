from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np, cv2

app = FastAPI(title="AlphaPose API")

class PoseKeypoint2D(BaseModel):
    name: str
    x: float
    y: float
    confidence: float

class PosePerson2D(BaseModel):
    id: int
    keypoints: List[PoseKeypoint2D]

class PoseDetectionResult(BaseModel):
    model: str
    image_width: int
    image_height: int
    persons: List[PosePerson2D]

class Pose2DFrame(BaseModel):
    frame_index: int
    timestamp_sec: float
    persons: List[PosePerson2D]

class Pose2DSequenceResult(BaseModel):
    model: str
    fps: int
    frame_count: int
    frames: List[Pose2DFrame]

def _bytes_to_bgr(data: bytes):
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img

# TODO: Wire actual AlphaPose inference (load model + run). Placeholder returns 501 if not wired.
def _inference_placeholder():
    raise HTTPException(status_code=503, detail="AlphaPose model not configured in this image. Mount weights and add loader.")

@app.post("/pose/image", response_model=PoseDetectionResult)
async def pose_image(file: UploadFile = File(...)):
    data = await file.read()
    img = _bytes_to_bgr(data)
    h, w = img.shape[:2]
    _inference_placeholder()
    return PoseDetectionResult(model="alphapose", image_width=w, image_height=h, persons=[])

@app.post("/pose/video", response_model=Pose2DSequenceResult)
async def pose_video(file: UploadFile = File(...)):
    data = await file.read()
    tmp = "/tmp/in.mp4"
    with open(tmp, "wb") as f:
        f.write(data)
    _inference_placeholder()
    return Pose2DSequenceResult(model="alphapose", fps=25, frame_count=0, frames=[])


@app.get('/health')
async def health():
    return {'status': 'ok', 'service': 'alphapose'}
