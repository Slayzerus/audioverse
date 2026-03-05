from fastapi import FastAPI, UploadFile, File, Request, HTTPException
from pydantic import BaseModel
from typing import List
import json, os

app = FastAPI(title="PoseFormer API")

class PoseKeypoint3D(BaseModel):
    name: str
    x: float
    y: float
    z: float
    confidence: float

class PosePerson3D(BaseModel):
    id: int
    keypoints: List[PoseKeypoint3D]

class Pose3DFrame(BaseModel):
    frame_index: int
    timestamp_sec: float
    persons: List[PosePerson3D]

class Pose3DSequenceResult(BaseModel):
    model: str
    fps: int
    frame_count: int
    frames: List[Pose3DFrame]

def _have_checkpoint():
    ckpt = os.getenv("POSEFORMER_CHECKPOINT")
    return ckpt and os.path.exists(ckpt)

def _lift_2d_to_3d_stub(seq):
    # Placeholder lifting: copy 2D to 3D (z=0). Replace with real PoseFormer inference.
    frames: List[Pose3DFrame] = []
    for fr in seq.get("frames", []):
        persons3d: List[PosePerson3D] = []
        for p in fr.get("persons", []):
            kps3 = []
            for kp in p.get("keypoints", []):
                kps3.append(PoseKeypoint3D(
                    name=kp.get("name",""),
                    x=float(kp.get("x",0.0)),
                    y=float(kp.get("y",0.0)),
                    z=0.0,
                    confidence=float(kp.get("confidence",0.0))
                ))
            persons3d.append(PosePerson3D(id=int(p.get("id",0)), keypoints=kps3))
        frames.append(Pose3DFrame(
            frame_index=int(fr.get("frame_index",0)),
            timestamp_sec=float(fr.get("timestamp_sec",0.0)),
            persons=persons3d
        ))
    return Pose3DSequenceResult(model="poseformer", fps=int(seq.get("fps",25)), frame_count=len(frames), frames=frames)

@app.post("/pose3d", response_model=Pose3DSequenceResult)
async def pose3d(request: Request, file: UploadFile = File(None)):
    if request.headers.get("content-type","").startswith("application/json"):
        seq = await request.json()
        # TODO: integrate real PoseFormer lifting here (requires checkpoint and preprocessing)
        return _lift_2d_to_3d_stub(seq)

    if file is not None:
        # TODO: add video->2D->3D pipeline (detector + 2D model + PoseFormer)
        raise HTTPException(status_code=501, detail="Video-to-3D pipeline not implemented in this minimal wrapper.")
    raise HTTPException(status_code=400, detail="Provide JSON sequence (application/json) or an MP4 file.")


@app.get('/health')
async def health():
    return {'status': 'ok', 'service': 'poseformer'}
