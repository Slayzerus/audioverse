from fastapi import FastAPI, UploadFile, File, HTTPException
import io, soundfile as sf, numpy as np
from panns_inference import AudioTagging, labels

app = FastAPI(title="Audio Tags (PANNs)", version="1.0.0")
_at = AudioTagging(checkpoint_path="/root/panns_data/Cnn14_mAP=0.431.pth", device="cpu")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/tags")
async def get_tags(file: UploadFile = File(...), top_k: int = 10):
    if top_k <= 0 or top_k > 50:
        raise HTTPException(status_code=400, detail="top_k must be in 1..50")
    data = await file.read()
    try:
        audio, sr = sf.read(io.BytesIO(data), dtype="float32", always_2d=False)
        if audio.ndim == 2:
            audio = np.mean(audio, axis=1)
    except Exception as ex:
        raise HTTPException(status_code=400, detail=f"Cannot decode audio: {ex}")
    clip = _at.infer(audio, sr)["clipwise_output"].squeeze()
    idx = np.argsort(-clip)[:top_k]
    return {"tags": [{"label": labels[i], "score": float(clip[i])} for i in idx]}
