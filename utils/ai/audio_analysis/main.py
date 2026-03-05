from fastapi import FastAPI, UploadFile, File
from fastapi.responses import PlainTextResponse
import soundfile as sf
import numpy as np
import io, json, time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

app = FastAPI(title="Audio Analysis")

# Prometheus metrics
REQUEST_COUNT = Counter(
    "audio_analysis_requests_total",
    "Total requests",
    ["path", "method", "status"],
)
REQUEST_LATENCY = Histogram(
    "audio_analysis_request_duration_seconds",
    "Request duration seconds",
    ["path", "method", "status"],
)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    start = time.perf_counter()
    raw = await file.read()
    data, sr = sf.read(io.BytesIO(raw))  # obsługuje WAV/FLAC/OGG
    if data.ndim > 1:
        data = np.mean(data, axis=1)
    duration = len(data) / sr
    rms = float(np.sqrt(np.mean(data**2)))
    # proste “pitch” – miejsce maksimum w autokorelacji (bardzo prymitywne)
    min_f, max_f = 80, 1000
    min_lag, max_lag = int(sr/max_f), int(sr/min_f)
    ac = np.correlate(data, data, mode='full')[len(data)-1:len(data)-1+max_lag+1]
    ac[:min_lag] = 0
    lag = int(np.argmax(ac)) if len(ac) else 0
    pitch_hz = (sr/lag) if lag > 0 else None
    payload = {
        "DurationSeconds": round(duration, 3),
        "Rms": round(rms, 6),
        "TempoBpm": None,
        "PitchMedianHz": round(pitch_hz, 2) if pitch_hz else None
    }

    elapsed = time.perf_counter() - start
    labels = {"path": "/analyze", "method": "POST", "status": "200"}
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
