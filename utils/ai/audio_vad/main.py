from fastapi import FastAPI, UploadFile, File
from fastapi.responses import PlainTextResponse
import webrtcvad, numpy as np, io, soundfile as sf, librosa, time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

app = FastAPI(title="Audio VAD")

REQUEST_COUNT = Counter(
    "audio_vad_requests_total",
    "Total requests",
    ["path", "method", "status"],
)
REQUEST_LATENCY = Histogram(
    "audio_vad_request_duration_seconds",
    "Request duration seconds",
    ["path", "method", "status"],
)

@app.post("/vad")
async def vad(file: UploadFile = File(...), aggressiveness: int = 2):
    start = time.perf_counter()
    raw = await file.read()
    y, sr = sf.read(io.BytesIO(raw), dtype='float32')
    if y.ndim > 1: y = np.mean(y, axis=1)

    # VAD wymaga 16k, 16-bit PCM i ramki 10/20/30 ms:
    target_sr = 16000
    if sr != target_sr:
        y = librosa.resample(y, sr, target_sr)
        sr = target_sr

    # 30 ms ramki:
    frame_size = int(0.03 * sr)
    vad = webrtcvad.Vad(aggressiveness)
    voiced = []
    for i in range(0, len(y) - frame_size, frame_size):
        frame = y[i:i+frame_size]
        pcm16 = np.clip(frame * 32768, -32768, 32767).astype('<i2').tobytes()
        is_speech = vad.is_speech(pcm16, sr)
        t0 = i / sr; t1 = (i+frame_size) / sr
        voiced.append({"start": t0, "end": t1, "speech": bool(is_speech)})

    # scal odcinki mowy:
    segments, cur = [], None
    for f in voiced:
        if f["speech"]:
            if cur is None: cur = {"start": f["start"], "end": f["end"]}
            else: cur["end"] = f["end"]
        else:
            if cur is not None: segments.append(cur); cur = None
    if cur is not None: segments.append(cur)

    payload = {"segments": segments, "duration_s": round(len(y)/sr,3)}

    elapsed = time.perf_counter() - start
    labels = {"path": "/vad", "method": "POST", "status": "200"}
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
