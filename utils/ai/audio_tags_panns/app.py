from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import PlainTextResponse
import io, soundfile as sf, numpy as np, time
from panns_inference import AudioTagging, labels
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

app = FastAPI(title="Audio Tags (PANNs)", version="1.0.0")
REQUEST_COUNT = Counter(
    "audio_tags_requests_total",
    "Total requests",
    ["path", "method", "status"],
)
REQUEST_LATENCY = Histogram(
    "audio_tags_request_duration_seconds",
    "Request duration seconds",
    ["path", "method", "status"],
)
_at = AudioTagging(checkpoint_path="/root/panns_data/Cnn14_mAP=0.431.pth", device="cpu")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/tags")
async def get_tags(file: UploadFile = File(...), top_k: int = 10):
    start = time.perf_counter()
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
    payload = {"tags": [{"label": labels[i], "score": float(clip[i])} for i in idx]}

    elapsed = time.perf_counter() - start
    labels_map = {"path": "/api/tags", "method": "POST", "status": "200"}
    REQUEST_COUNT.labels(**labels_map).inc()
    REQUEST_LATENCY.labels(**labels_map).observe(elapsed)
    return payload


@app.get("/metrics")
async def metrics():
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)


FastAPIInstrumentor.instrument_app(app)
