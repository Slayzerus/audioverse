from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np, cv2, os

app = FastAPI(title="ViTPose (MMpose) API")

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

def _get_model():
    cfg = os.getenv("MMPOSE_CONFIG")
    ckpt = os.getenv("MMPOSE_CHECKPOINT")
    if not cfg or not ckpt or not os.path.exists(cfg) or not os.path.exists(ckpt):
        raise HTTPException(status_code=503, detail="MMpose config/checkpoint not found (env MMPOSE_CONFIG / MMPOSE_CHECKPOINT).")
    from mmpose.apis import init_model
    return init_model(cfg, ckpt, device='cuda:0' if os.getenv("CUDA_VISIBLE_DEVICES") else 'cpu')

def _infer_single(model, img_bgr):
    from mmpose.apis import inference_topdown
    from mmpose.structures import PoseDataSample
    # Assume person bbox covers full image (or integrate detector separately)
    h, w = img_bgr.shape[:2]
    results = inference_topdown(model, img_bgr, bboxes=[[0,0,w,h]])
    persons = []
    for pid, r in enumerate(results):
        data: PoseDataSample = r
        kps_xyc = data.pred_instances.keypoints.squeeze(0) # [K,2]
        scores = data.pred_instances.keypoint_scores.squeeze(0) # [K]
        kps = []
        for i in range(kps_xyc.shape[0]):
            x, y = float(kps_xyc[i,0]), float(kps_xyc[i,1])
            c = float(scores[i]) if i < scores.shape[0] else 0.0
            kps.append(PoseKeypoint2D(name=f"kp{i}", x=x, y=y, confidence=c))
        persons.append(PosePerson2D(id=pid, keypoints=kps))
    return persons

@app.post("/pose/image", response_model=PoseDetectionResult)
async def pose_image(file: UploadFile = File(...)):
    model = _get_model()
    data = await file.read()
    img = _bytes_to_bgr(data)
    h, w = img.shape[:2]
    persons = _infer_single(model, img)
    return PoseDetectionResult(model="vitpose", image_width=w, image_height=h, persons=persons)

@app.post("/pose/video", response_model=Pose2DSequenceResult)
async def pose_video(file: UploadFile = File(...)):
    model = _get_model()
    data = await file.read()
    tmp = "/tmp/in.mp4"
    with open(tmp, "wb") as f:
        f.write(data)

    cap = cv2.VideoCapture(tmp)
    fps = int(cap.get(cv2.CAP_PROP_FPS)) or 25
    frames: List[Pose2DFrame] = []
    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        persons = _infer_single(model, frame)
        frames.append(Pose2DFrame(frame_index=idx, timestamp_sec=idx/max(1,fps), persons=persons))
        idx += 1
    cap.release()
    return Pose2DSequenceResult(model="vitpose", fps=fps, frame_count=len(frames), frames=frames)
