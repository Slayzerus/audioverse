from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.responses import PlainTextResponse, JSONResponse
import asyncio
from concurrent.futures import ThreadPoolExecutor
import torch, torchcrepe, numpy as np, soundfile as sf, io, time, json, os
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

app = FastAPI(title="Audio Pitch")
_pitch_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="crepe")

# ── GPU / CPU autodetekcja ──
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[audio_pitch] Using device: {DEVICE}", flush=True)

# ── Warmup: run a dummy inference so CUDA kernels are JIT-compiled at startup ──
def _warmup():
    t0 = time.perf_counter()
    dummy = torch.zeros(1, 4000, dtype=torch.float32, device=DEVICE)
    for m in ('tiny', 'full'):
        with torch.no_grad():
            torchcrepe.predict(
                dummy, 16000, hop_length=640, fmin=50, fmax=1100,
                model=m, decoder=torchcrepe.decode.weighted_argmax,
                return_periodicity=True, device=DEVICE,
            )
    elapsed = (time.perf_counter() - t0) * 1000
    print(f"[audio_pitch] CREPE warmup done in {elapsed:.0f} ms", flush=True)

_warmup()

REQUEST_COUNT = Counter(
    "audio_pitch_requests_total",
    "Total requests",
    ["path", "method", "status"],
)
REQUEST_LATENCY = Histogram(
    "audio_pitch_request_duration_seconds",
    "Request duration seconds",
    ["path", "method", "status"],
)

@app.post("/pitch")
async def pitch(file: UploadFile = File(...)):
    start = time.perf_counter()
    raw = await file.read()
    wav, sr = sf.read(io.BytesIO(raw), dtype='float32')
    if wav.ndim > 1: wav = np.mean(wav, axis=1)
    # model torchcrepe używa 16k lub 44.1k. Zostawmy auto-resample do 16000:
    target_sr = 16000
    if sr != target_sr:
        import librosa
        wav = librosa.resample(wav, orig_sr=sr, target_sr=target_sr)
        sr = target_sr

    x = torch.tensor(wav)[None].to(torch.float32).to(DEVICE)
    f0 = torchcrepe.predict(
        x, sr, hop_length=320, fmin=50, fmax=1100, model='full',
        decoder=torchcrepe.decode.viterbi, device=DEVICE
    )[0]  # Hz
    # zamień NaN na 0
    f0 = torch.nan_to_num(f0, nan=0.0).cpu().numpy()
    voiced = (f0 > 1.0).astype(int).tolist()
    times = (np.arange(len(f0)) * 320 / sr).tolist()
    median = float(np.median(f0[f0>0])) if np.any(f0>0) else None

    payload = {
        "median_hz": median,
        "track": [{"t": float(t), "hz": float(h)} for t, h in zip(times, f0)],
        "voiced_mask": voiced
    }

    elapsed = time.perf_counter() - start
    labels = {"path": "/pitch", "method": "POST", "status": "200"}
    REQUEST_COUNT.labels(**labels).inc()
    REQUEST_LATENCY.labels(**labels).observe(elapsed)
    return payload


@app.post("/pitch/deepf0")
async def pitch_deepf0(file: UploadFile = File(...), model_path: str | None = None):
    """Optional AI alternative endpoint that runs an ONNX DeepF0-style model if provided.
    Upload audio file (WAV/FLAC/MP3). If an ONNX model is available at env DEEPF0_ONNX_PATH or
    provided via `model_path`, the endpoint will preprocess audio to log-mel and attempt to run the model.
    If no model is configured, returns 501 with instructions where to mount the model.
    """
    start = time.perf_counter()
    raw = await file.read()
    wav, sr = sf.read(io.BytesIO(raw), dtype='float32')
    if wav.ndim > 1: wav = np.mean(wav, axis=1)
    target_sr = 16000
    if sr != target_sr:
        import librosa
        wav = librosa.resample(wav, orig_sr=sr, target_sr=target_sr)
        sr = target_sr

    # resolve model path
    cfg_path = model_path or os.environ.get('DEEPF0_ONNX_PATH') or './models/deepf0.onnx'
    if not os.path.exists(cfg_path):
        return JSONResponse({"error": "DeepF0 ONNX model not found", "expected_path": cfg_path}, status_code=501)

    try:
        import onnxruntime as ort
    except Exception:
        return JSONResponse({"error": "onnxruntime not installed in image. Install onnxruntime to enable deepf0 endpoint."}, status_code=501)

    try:
        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] if DEVICE.type == 'cuda' else ['CPUExecutionProvider']
        sess = ort.InferenceSession(cfg_path, providers=providers)
    except Exception as ex:
        return JSONResponse({"error": "failed to load ONNX model", "detail": str(ex)}, status_code=500)

    # Preprocess: compute log-mel spectrogram
    try:
        import librosa
        mel = librosa.feature.melspectrogram(y=wav, sr=sr, n_fft=2048, hop_length=320, n_mels=128)
        log_mel = np.log1p(mel).astype(np.float32)
        # common ONNX inputs expect (1, frames, mels) or (1, mels, frames) — try (1, frames, mels)
        inp = np.expand_dims(log_mel.T, axis=0)
        input_name = sess.get_inputs()[0].name
        result = sess.run(None, {input_name: inp})
        f0 = np.asarray(result[0]).squeeze()
    except Exception as ex:
        return JSONResponse({"error": "model inference failed", "detail": str(ex)}, status_code=500)

    # normalize/format
    f0 = np.nan_to_num(f0, nan=0.0)
    voiced = (f0 > 1.0).astype(int).tolist()
    times = (np.arange(len(f0)) * 320 / sr).tolist()
    median = float(np.median(f0[f0>0])) if np.any(f0>0) else None

    payload = {
        "method": "deepf0",
        "median_hz": median,
        "track": [{"t": float(t), "hz": float(h)} for t, h in zip(times, f0)],
        "voiced_mask": voiced
    }

    elapsed = time.perf_counter() - start
    labels = {"path": "/pitch/deepf0", "method": "POST", "status": "200"}
    REQUEST_COUNT.labels(**labels).inc()
    REQUEST_LATENCY.labels(**labels).observe(elapsed)
    return JSONResponse(payload)




@app.post("/pitch/pyin")
async def pitch_pyin(file: UploadFile = File(...)):
    """Pitch detection using pYIN (probabilistic YIN) from librosa.
    Faster than CREPE, no GPU required. Good for real-time scenarios."""
    import librosa
    start = time.perf_counter()
    raw = await file.read()
    wav, sr = sf.read(io.BytesIO(raw), dtype='float32')
    if wav.ndim > 1:
        wav = np.mean(wav, axis=1)
    target_sr = 16000
    if sr != target_sr:
        wav = librosa.resample(wav, orig_sr=sr, target_sr=target_sr)
        sr = target_sr

    f0, voiced_flag, voiced_prob = librosa.pyin(
        wav, fmin=50, fmax=1100, sr=sr, frame_length=2048, hop_length=320
    )
    f0 = np.nan_to_num(f0, nan=0.0)
    times = (np.arange(len(f0)) * 320 / sr).tolist()
    median = float(np.median(f0[f0 > 0])) if np.any(f0 > 0) else None

    payload = {
        "method": "pyin",
        "median_hz": median,
        "track": [{"t": float(t), "hz": float(h)} for t, h in zip(times, f0)],
        "voiced_mask": voiced_flag.astype(int).tolist() if voiced_flag is not None else [],
    }

    elapsed = time.perf_counter() - start
    labels = {"path": "/pitch/pyin", "method": "POST", "status": "200"}
    REQUEST_COUNT.labels(**labels).inc()
    REQUEST_LATENCY.labels(**labels).observe(elapsed)
    return payload

@app.get("/health")
async def health():
    gpu_name = torch.cuda.get_device_name(0) if DEVICE.type == 'cuda' else None
    return {"status": "healthy", "device": str(DEVICE), "gpu": gpu_name}


@app.get("/metrics")
async def metrics():
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)


FastAPIInstrumentor.instrument_app(app)


@app.websocket('/ws/pitch_server')
async def websocket_pitch_server(ws: WebSocket):
    """Server-side live pitch detection using torchcrepe (tiny model for real-time).
    Client sends binary PCM s16le 16k mono frames as WebSocket binary messages.
    Server responds with JSON text messages: {"hz": float, "confidence": float}.

    Uses a decoupled recv/infer architecture to prevent queue buildup:
      - recv_loop continuously drains incoming WS frames into a ring buffer.
      - infer_loop fires as fast as the model allows on a 0.25 s snapshot.
    """
    await ws.accept()
    sr          = 16000
    hop_length  = int(sr * 0.04)   # 40 ms — only ~6 frames per 0.25 s window
    min_samples = sr // 4           # need ≥0.25 s before first inference
    snap_len    = sr // 4           # analyse last 0.25 s — tiny model handles this in ~20-50 ms
    overlap_len = int(sr * 0.05)    # keep 50 ms context after snap
    max_buf     = sr * 3            # ring buffer: keep at most 3 s

    buf: np.ndarray = np.array([], dtype=np.float32)
    buf_lock = asyncio.Lock()

    def _run_crepe(b: np.ndarray) -> tuple:
        t0 = time.perf_counter()
        x = torch.tensor(b, dtype=torch.float32)[None].to(DEVICE)
        with torch.no_grad():
            f0, periodicity = torchcrepe.predict(
                x,
                sr,
                hop_length=hop_length,
                fmin=50,
                fmax=1100,
                model='tiny',
                decoder=torchcrepe.decode.weighted_argmax,
                return_periodicity=True,
                device=DEVICE,
            )
        f0  = torch.nan_to_num(f0[0],          nan=0.0).cpu().numpy()
        per = torch.nan_to_num(periodicity[0],  nan=0.0).cpu().numpy()
        elapsed = (time.perf_counter() - t0) * 1000
        print(f"[pitch_server] crepe infer: {elapsed:.0f} ms  samples={b.shape[0]}  frames={f0.shape[0]}  device={DEVICE}", flush=True)
        return f0, per

    async def recv_loop() -> None:
        nonlocal buf
        while True:
            data = await ws.receive_bytes()
            if not data:
                continue
            pcm = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
            async with buf_lock:
                buf = np.concatenate([buf, pcm]) if buf.size else pcm
                if buf.shape[0] > max_buf:
                    buf = buf[-max_buf:]

    async def infer_loop() -> None:
        nonlocal buf
        while True:
            await asyncio.sleep(0.10)        # ≤ 10 inferences/sec (was 0.25 = 4/sec)
            async with buf_lock:
                if buf.shape[0] < min_samples:
                    continue
                snap = buf[-snap_len:].copy() if buf.shape[0] >= snap_len else buf.copy()
                buf  = buf[-overlap_len:] if buf.shape[0] > overlap_len else buf
            loop = asyncio.get_event_loop()
            try:
                f0, per = await loop.run_in_executor(_pitch_executor, _run_crepe, snap)
            except Exception as ex:
                try:
                    await ws.send_text(json.dumps({"error": str(ex)}))
                except Exception:
                    pass
                continue
            # Use mean periodicity of the latest frames as the confidence value.
            confidence = float(per[-max(1, len(per) // 4):].mean())
            # Median hz of the most recent quarter-window where periodicity > 0.5
            recent_f0  = f0[-max(1, len(f0) // 4):]
            recent_per = per[-max(1, len(per) // 4):]
            voiced_hz  = recent_f0[recent_per > 0.5]
            last_hz    = float(np.median(voiced_hz)) if voiced_hz.size else 0.0
            try:
                await ws.send_text(json.dumps({"hz": round(last_hz, 3), "confidence": round(confidence, 3)}))
            except Exception:
                pass

    recv_task  = asyncio.create_task(recv_loop())
    infer_task = asyncio.create_task(infer_loop())
    try:
        await asyncio.gather(recv_task, infer_task)
    except WebSocketDisconnect:
        pass
    except Exception as ex:
        try:
            await ws.send_text(json.dumps({"error": str(ex)}))
        except Exception:
            pass
    finally:
        recv_task.cancel()
        infer_task.cancel()
        try:
            await ws.close()
        except Exception:
            pass


@app.websocket('/ws/pitch_client')
async def websocket_pitch_client(ws: WebSocket):
    """Client-side live pitch reporting.
    Client computes pitch locally (e.g. crepe-wasm / pitchfinder) and sends JSON text messages:
      { "hz": 220.0, "confidence": 0.8, "ts": 123456 }
    Server applies light smoothing (EMA) and returns smoothed values.
    """
    await ws.accept()
    ema = None
    alpha = 0.25
    try:
        while True:
            msg = await ws.receive_text()
            try:
                d = json.loads(msg)
                hz = d.get('hz')
                conf = d.get('confidence')
                if hz is None:
                    continue
                if ema is None:
                    ema = float(hz)
                else:
                    ema = alpha * float(hz) + (1 - alpha) * ema
                await ws.send_text(json.dumps({"hz": round(ema, 3), "confidence": conf, "source": "server_smoothed"}))
            except json.JSONDecodeError:
                # ignore non-json
                continue
    except WebSocketDisconnect:
        return
    except Exception:
        try:
            await ws.close()
        except:
            pass
