"""
MDM (Motion Diffusion Model) text-to-motion sidecar.
Wraps https://github.com/GuyTevet/motion-diffusion-model in a FastAPI service.

Build:
  docker build -t audioverse/motion-mdm -f Dockerfile .

Run:
  docker run -p 8301:8301 --gpus all audioverse/motion-mdm
"""

import os
import time
import logging
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="MDM Sidecar", version="1.0.0")
logger = logging.getLogger("mdm")

_model = None

JOINT_NAMES = [
    "pelvis", "left_hip", "right_hip", "spine1", "left_knee", "right_knee",
    "spine2", "left_ankle", "right_ankle", "spine3", "left_foot", "right_foot",
    "neck", "left_collar", "right_collar", "head", "left_shoulder", "right_shoulder",
    "left_elbow", "right_elbow", "left_wrist", "right_wrist"
]


def get_model():
    global _model
    if _model is not None:
        return _model

    logger.info("Loading MDM model...")

    try:
        from utils.parser_util import generate_args
        from utils.model_util import create_model_and_diffusion, load_model_wo_clip
        from model.cfg_sampler import ClassifierFreeSampleModel
        import torch

        model_path = os.environ.get("MDM_CHECKPOINT", "save/humanml_trans_enc_512/model000200000.pt")
        args = generate_args()
        args.model_path = model_path

        model, diffusion = create_model_and_diffusion(args, None)
        state = torch.load(model_path, map_location="cpu", weights_only=False)
        load_model_wo_clip(model, state)
        model.eval()
        if torch.cuda.is_available():
            model = model.cuda()

        _model = {"model": model, "diffusion": diffusion, "args": args}
        logger.info("MDM model loaded successfully")
    except ImportError:
        logger.warning("MDM not installed — running in DEMO mode")
        _model = "demo"

    return _model


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
    return {"status": "ok", "engine": "mdm"}


@app.post("/generate")
def generate(req: GenerateRequest):
    model_data = get_model()
    total_frames = int(req.duration_sec * req.fps)

    if model_data == "demo":
        motion = _demo_motion(total_frames, len(JOINT_NAMES))
    else:
        motion = _infer(model_data, req.prompt, total_frames, req.fps)

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
    model_data = get_model()
    total_frames = int(req.duration_sec * 20.0)

    if model_data == "demo":
        motion = _demo_motion(total_frames, len(JOINT_NAMES))
    else:
        motion = _infer(model_data, req.prompt, total_frames, 20.0)

    bvh_str = _motion_to_bvh(motion, fps=20.0)
    return bvh_str.encode("utf-8")


def _infer(model_data: dict, prompt: str, total_frames: int, fps: float) -> np.ndarray:
    """Run MDM diffusion inference."""
    import torch
    from data_loaders.humanml.scripts.motion_process import recover_from_ric

    model = model_data["model"]
    diffusion = model_data["diffusion"]

    model_kwargs = {"y": {"text": [prompt], "lengths": torch.tensor([total_frames])}}
    if torch.cuda.is_available():
        model_kwargs["y"]["lengths"] = model_kwargs["y"]["lengths"].cuda()

    sample_fn = diffusion.p_sample_loop
    sample = sample_fn(
        model,
        (1, model.njoints, model.nfeats, total_frames),
        clip_denoised=False,
        model_kwargs=model_kwargs,
        skip_timesteps=0,
        init_image=None,
        progress=False,
    )

    sample = sample.squeeze().permute(1, 0).cpu().numpy()
    n_joints = sample.shape[1] // 3
    motion = sample.reshape(total_frames, n_joints, 3)
    return motion[:total_frames]


def _demo_motion(total_frames: int, num_joints: int) -> np.ndarray:
    """Generate demo motion for testing without GPU."""
    t = np.linspace(0, 2 * np.pi, total_frames)
    motion = np.zeros((total_frames, num_joints, 3))
    for j in range(num_joints):
        phase = j * 0.4
        motion[:, j, 0] = np.cos(t + phase) * 0.25
        motion[:, j, 1] = j * 0.15 + np.sin(t * 1.5 + phase) * 0.08
        motion[:, j, 2] = np.sin(t * 0.7 + phase) * 0.2
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
    uvicorn.run(app, host="0.0.0.0", port=8301)
