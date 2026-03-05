from fastapi import FastAPI, UploadFile, File, Response
from fastapi.responses import PlainTextResponse
import demucs.separate, tempfile, os, shutil, io, zipfile, torch, time
import soundfile as sf, numpy as np
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

app = FastAPI(title="Audio Separate")

REQUEST_COUNT = Counter(
    "audio_separate_requests_total",
    "Total requests",
    ["path", "method", "status"],
)
REQUEST_LATENCY = Histogram(
    "audio_separate_request_duration_seconds",
    "Request duration seconds",
    ["path", "method", "status"],
)

@app.post("/separate")
async def separate(file: UploadFile = File(...), stems: int = 2):
    start = time.perf_counter()
    raw = await file.read()
    # zapisz tymczasowo plik (Demucs chce ścieżkę)
    with tempfile.TemporaryDirectory() as tmp:
        inp = os.path.join(tmp, "input.wav")
        data, sr = sf.read(io.BytesIO(raw), dtype='float32')
        if data.ndim == 1:
            data = np.stack([data, data], axis=1)
        sf.write(inp, data, sr)

        outdir = os.path.join(tmp, "out")
        model = "htdemucs" if stems == 4 else "mdx_extra_q"  # 2 stems: vocals+other
        demucs.separate.main([
            "-n", model,
            "-o", outdir,
            inp
        ])

        # spakuj do ZIP
        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(outdir):
                for f in files:
                    path = os.path.join(root, f)
                    zf.write(path, arcname=os.path.relpath(path, outdir))
        memory_file.seek(0)
        payload = Response(memory_file.read(),
                        media_type="application/zip",
                        headers={"Content-Disposition": 'attachment; filename="stems.zip"'})

        elapsed = time.perf_counter() - start
        labels = {"path": "/separate", "method": "POST", "status": "200"}
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
