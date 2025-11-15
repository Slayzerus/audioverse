from fastapi import FastAPI, UploadFile, File
from panns_inference import AudioTagging
import soundfile as sf, numpy as np, io, os

app = FastAPI()
checkpoint = os.path.join(os.getenv("PANN_DATA", "/root/panns_data"), "Cnn14_mAP=0.431.pth")
tagger = AudioTagging(checkpoint_path=checkpoint, device='cpu')

def infer(raw: bytes):
    y, sr = sf.read(io.BytesIO(raw), dtype='float32')
    if y.ndim > 1:
        y = y.mean(axis=1)
    clipwise, _ = tagger.inference(y, sr)  # (1, classes)
    scores = clipwise[0]
    idx = np.argsort(scores)[-10:][::-1]
    return [{"tag": tagger.labels[i], "score": float(scores[i])} for i in idx]

@app.post("/tags")
@app.post("/api/tags")
async def tags(file: UploadFile = File(...)):
    raw = await file.read()
    return infer(raw)
