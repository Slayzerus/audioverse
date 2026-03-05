from fastapi import FastAPI, UploadFile, File
from fastapi.responses import PlainTextResponse
import librosa, numpy as np, io, soundfile as sf, time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

app = FastAPI(title="Audio Rhythm")

REQUEST_COUNT = Counter(
    "audio_rhythm_requests_total",
    "Total requests",
    ["path", "method", "status"],
)
REQUEST_LATENCY = Histogram(
    "audio_rhythm_request_duration_seconds",
    "Request duration seconds",
    ["path", "method", "status"],
)

@app.post("/rhythm")
async def rhythm(file: UploadFile = File(...)):
    start = time.perf_counter()
    raw = await file.read()
    y, sr = sf.read(io.BytesIO(raw), dtype='float32')
    if y.ndim > 1: y = np.mean(y, axis=1)
    y = librosa.util.normalize(y)

    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, units='time')

    payload = {
        "tempo_bpm": float(tempo),
        "beats_s": [float(t) for t in beats],
        "onsets_s": [float(t) for t in onsets],
        "duration_s": round(len(y)/sr, 3)
    }

    elapsed = time.perf_counter() - start
    labels = {"path": "/rhythm", "method": "POST", "status": "200"}
    REQUEST_COUNT.labels(**labels).inc()
    REQUEST_LATENCY.labels(**labels).observe(elapsed)
    return payload


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/metrics")
async def metrics():
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)


FastAPIInstrumentor.instrument_app(app)
