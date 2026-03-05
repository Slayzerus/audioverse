"""
MotionGPT text-to-motion sidecar.
Wraps https://github.com/OpenMotionLab/MotionGPT in a FastAPI service.

Build:
  docker build -t audioverse/motion-gpt -f Dockerfile .

Run:
  docker run -p 8300:8300 --gpus all audioverse/motion-gpt
"""

import os
import json
import time
import logging
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="MotionGPT Sidecar", version="1.0.0")
logger = logging.getLogger("motiongpt")

# ── Lazy model loading ──
_model = None
_cfg = None

JOINT_NAMES = [
    "pelvis", "left_hip", "right_hip", "spine1", "left_knee", "right_knee",
    "spine2", "left_ankle", "right_ankle", "spine3", "left_foot", "right_foot",
    "neck", "left_collar", "right_collar", "head", "left_shoulder", "right_shoulder",
    "left_elbow", "right_elbow", "left_wrist", "right_wrist"
]


def get_model():
    global _model, _cfg
    if _model is not None:
        return _model, _cfg

    logger.info("Loading MotionGPT model...")

    try:
        from motiongpt.config import get_config
        from motiongpt.models import build_model
        import torch

        config_path = os.environ.get("MOTIONGPT_CONFIG", "configs/default.yaml")
        checkpoint = os.environ.get("MOTIONGPT_CHECKPOINT", "checkpoints/motiongpt.pth")

        _cfg = get_config(config_path)
        _model = build_model(_cfg)

        state = torch.load(checkpoint, map_location="cpu", weights_only=False)
        _model.load_state_dict(state["model"], strict=False)
        _model.eval()
        if torch.cuda.is_available():
            _model = _model.cuda()

        logger.info("MotionGPT model loaded successfully")
    except ImportError:
        logger.warning("MotionGPT not installed — running in DEMO mode (random motion)")
        _model = "demo"
        _cfg = None

    return _model, _cfg


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500)
    duration_sec: float = Field(default=4.0, ge=0.5, le=10.0)
    fps: float = Field(default=20.0, ge=1.0, le=60.0)


class GenerateBvhRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500)
    duration_sec: float = Field(default=4.0, ge=0.5, le=10.0)
    format: str = Field(default="bvh")


@app.get("/health")
def health():
    return {"status": "ok", "engine": "motiongpt"}


@app.post("/generate")
def generate(req: GenerateRequest):
    model, cfg = get_model()
    t0 = time.time()
    total_frames = int(req.duration_sec * req.fps)

    if model == "demo":
        motion = _demo_motion(total_frames, len(JOINT_NAMES))
    else:
        motion = _infer(model, cfg, req.prompt, total_frames, req.fps)

    frames = []
    for i in range(motion.shape[0]):
        joints = []
        for j in range(min(motion.shape[1], len(JOINT_NAMES))):
            joints.append({
                "name": JOINT_NAMES[j],
                "x": round(float(motion[i, j, 0]), 4),
                "y": round(float(motion[i, j, 1]), 4),
                "z": round(float(motion[i, j, 2]), 4),
            })
        frames.append({"joints": joints})

    return {
        "duration_sec": req.duration_sec,
        "fps": req.fps,
        "bvh": None,
        "frames": frames,
    }


@app.post("/generate/bvh")
def generate_bvh(req: GenerateBvhRequest):
    model, cfg = get_model()
    total_frames = int(req.duration_sec * 20.0)

    if model == "demo":
        motion = _demo_motion(total_frames, len(JOINT_NAMES))
    else:
        motion = _infer(model, cfg, req.prompt, total_frames, 20.0)

    bvh_str = _motion_to_bvh(motion, fps=20.0)
    return bvh_str.encode("utf-8")


def _infer(model, cfg, prompt: str, total_frames: int, fps: float) -> np.ndarray:
    """Run MotionGPT inference — returns (frames, joints, 3) numpy array."""
    import torch
    device = next(model.parameters()).device

    with torch.no_grad():
        result = model.generate(prompt, num_frames=total_frames)

    if isinstance(result, torch.Tensor):
        motion = result.cpu().numpy()
    else:
        motion = np.array(result)

    if motion.ndim == 4:
        motion = motion[0]

    return motion[:total_frames]


def _demo_motion(total_frames: int, num_joints: int) -> np.ndarray:
    """Generate plausible-looking demo motion (sine waves) for testing without GPU."""
    t = np.linspace(0, 2 * np.pi, total_frames)
    motion = np.zeros((total_frames, num_joints, 3))
    for j in range(num_joints):
        phase = j * 0.3
        motion[:, j, 0] = np.sin(t + phase) * 0.3
        motion[:, j, 1] = j * 0.15 + np.sin(t * 2 + phase) * 0.05
        motion[:, j, 2] = np.cos(t + phase) * 0.2
    return motion


def _motion_to_bvh(motion: np.ndarray, fps: float = 20.0) -> str:
    """Convert motion array to minimal BVH string."""
    num_frames, num_joints, _ = motion.shape
    lines = ["HIERARCHY", "ROOT Hips", "{"]
    lines.append(f"  OFFSET 0.0 0.0 0.0")
    lines.append(f"  CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation")
    for j in range(1, min(num_joints, len(JOINT_NAMES))):
        lines.append(f"  JOINT {JOINT_NAMES[j]}")
        lines.append("  {")
        lines.append(f"    OFFSET 0.0 {0.15 * j:.2f} 0.0")
        lines.append("    CHANNELS 3 Zrotation Xrotation Yrotation")
        lines.append("    End Site")
        lines.append("    {")
        lines.append("      OFFSET 0.0 0.1 0.0")
        lines.append("    }")
        lines.append("  }")
    lines.append("}")
    lines.append("MOTION")
    lines.append(f"Frames: {num_frames}")
    lines.append(f"Frame Time: {1.0/fps:.6f}")
    for i in range(num_frames):
        vals = []
        vals.extend([f"{motion[i, 0, c]:.4f}" for c in range(3)])
        vals.extend(["0.0000"] * 3)
        for j in range(1, min(num_joints, len(JOINT_NAMES))):
            vals.extend(["0.0000"] * 3)
        lines.append(" ".join(vals))
    return "\n".join(lines)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8300)
