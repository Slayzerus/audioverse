from fastapi import FastAPI, UploadFile, File, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import numpy as np
import soundfile as sf
import io
import os
import json
import asyncio

try:
    import librosa
except Exception:
    librosa = None

app = FastAPI(title="Librosa Microservice")

# helper to read uploaded audio
def _read_audio(raw: bytes):
    wav, sr = sf.read(io.BytesIO(raw), dtype='float32')
    if wav.ndim > 1:
        wav = np.mean(wav, axis=1)
    return wav, sr


def _check_librosa():
    if librosa is None:
        return JSONResponse({"error": "librosa not installed in image. Install librosa to enable endpoints."}, status_code=501)
    return None


@app.post('/load')
async def load_audio(file: UploadFile = File(...), resample_sr: int | None = Query(None)):
    """Load audio and optionally resample. Returns basic metadata and a short waveform preview."""
    if (resp := _check_librosa()) is not None:
        return resp
    raw = await file.read()
    wav, sr = _read_audio(raw)
    if resample_sr is not None and sr != resample_sr:
        wav = librosa.resample(wav, orig_sr=sr, target_sr=resample_sr)
        sr = resample_sr
    duration = float(len(wav) / sr)
    # send only a preview of waveform to avoid huge payloads
    preview_len = min(len(wav), 2000)
    return {
        "sr": int(sr),
        "duration": duration,
        "samples": len(wav),
        "waveform_preview": np.round(wav[:preview_len].tolist(), 6),
    }


@app.post('/resample')
async def resample_audio(file: UploadFile = File(...), target_sr: int = Query(16000)):
    if (resp := _check_librosa()) is not None:
        return resp
    raw = await file.read()
    wav, sr = _read_audio(raw)
    if sr == target_sr:
        return {"sr": sr, "samples": len(wav), "waveform_preview": np.round(wav[:2000].tolist(), 6)}
    out = librosa.resample(wav, orig_sr=sr, target_sr=target_sr)
    return {"sr": int(target_sr), "samples": len(out), "waveform_preview": np.round(out[:2000].tolist(), 6)}


@app.post('/stft')
async def stft(file: UploadFile = File(...), n_fft: int = Query(2048), hop_length: int | None = Query(None)):
    if (resp := _check_librosa()) is not None:
        return resp
    raw = await file.read()
    wav, sr = _read_audio(raw)
    hop = hop_length or int(n_fft // 4)
    S = librosa.stft(wav, n_fft=n_fft, hop_length=hop)
    mag = np.abs(S)
    # return shape and a small slice to avoid huge payloads
    return {"shape": mag.shape, "slice": np.round(mag[:, :min(10, mag.shape[1])].tolist(), 6)}


@app.post('/melspectrogram')
async def melspectrogram(file: UploadFile = File(...), n_fft: int = Query(2048), hop_length: int | None = Query(None), n_mels: int = Query(128)):
    if (resp := _check_librosa()) is not None:
        return resp
    raw = await file.read()
    wav, sr = _read_audio(raw)
    hop = hop_length or int(n_fft // 4)
    mel = librosa.feature.melspectrogram(y=wav, sr=sr, n_fft=n_fft, hop_length=hop, n_mels=n_mels)
    log_mel = np.log1p(mel)
    return {"shape": log_mel.shape, "slice": np.round(log_mel[:, :min(10, log_mel.shape[1])].tolist(), 6)}


@app.post('/mfcc')
async def mfcc(file: UploadFile = File(...), n_mfcc: int = Query(13), n_fft: int = Query(2048), hop_length: int | None = Query(None)):
    if (resp := _check_librosa()) is not None:
        return resp
    raw = await file.read()
    wav, sr = _read_audio(raw)
    hop = hop_length or int(n_fft // 4)
    mf = librosa.feature.mfcc(y=wav, sr=sr, n_mfcc=n_mfcc, n_fft=n_fft, hop_length=hop)
    return {"shape": mf.shape, "slice": np.round(mf[:, :min(10, mf.shape[1])].tolist(), 6)}


@app.post('/chroma')
async def chroma(file: UploadFile = File(...), n_fft: int = Query(2048), hop_length: int | None = Query(None)):
    if (resp := _check_librosa()) is not None:
        return resp
    raw = await file.read()
    wav, sr = _read_audio(raw)
    hop = hop_length or int(n_fft // 4)
    C = librosa.feature.chroma_stft(y=wav, sr=sr, n_fft=n_fft, hop_length=hop)
    return {"shape": C.shape, "slice": np.round(C[:, :min(10, C.shape[1])].tolist(), 6)}


@app.post('/tempo')
async def tempo(file: UploadFile = File(...), hop_length: int | None = Query(None)):
    if (resp := _check_librosa()) is not None:
        return resp
    raw = await file.read()
    wav, sr = _read_audio(raw)
    hop = hop_length or 512
    onset_env = librosa.onset.onset_strength(y=wav, sr=sr, hop_length=hop)
    tempo = librosa.beat.tempo(onset_envelope=onset_env, sr=sr, hop_length=hop)
    return {"tempo": float(tempo[0])}


@app.post('/beats')
async def beats(file: UploadFile = File(...), hop_length: int | None = Query(None)):
    if (resp := _check_librosa()) is not None:
        return resp
    raw = await file.read()
    wav, sr = _read_audio(raw)
    hop = hop_length or 512
    tempo, beats = librosa.beat.beat_track(y=wav, sr=sr, hop_length=hop)
    beat_times = librosa.frames_to_time(beats, sr=sr, hop_length=hop).tolist()
    return {"tempo": float(tempo), "beat_times": beat_times}


@app.post('/onsets')
async def onsets(file: UploadFile = File(...), hop_length: int | None = Query(None)):
    if (resp := _check_librosa()) is not None:
        return resp
    raw = await file.read()
    wav, sr = _read_audio(raw)
    hop = hop_length or 512
    onsets = librosa.onset.onset_detect(y=wav, sr=sr, hop_length=hop)
    times = librosa.frames_to_time(onsets, sr=sr, hop_length=hop).tolist()
    return {"onset_frames": onsets.tolist(), "onset_times": times}


@app.post('/pyin')
async def pyin_file(
    file: UploadFile = File(...),
    fmin: float = Query(50.0),
    fmax: float = Query(1100.0),
    target_sr: int = Query(16000),
    hop_length: int = Query(320)
):
    """Run PYIN on an uploaded audio file and return a pitch track.
    Accepts the same audio containers as other endpoints. Results mirror the websocket output.
    """
    if (resp := _check_librosa()) is not None:
        return resp

    raw = await file.read()
    wav, sr = _read_audio(raw)
    if sr != target_sr:
        wav = librosa.resample(wav, orig_sr=sr, target_sr=target_sr)
        sr = target_sr

    try:
        # run pyin in thread to avoid blocking the event loop
        f0_vo = await asyncio.to_thread(lambda: librosa.pyin(wav, fmin=fmin, fmax=fmax, sr=sr, hop_length=hop_length))
        if isinstance(f0_vo, tuple) and len(f0_vo) >= 1:
            f0 = f0_vo[0]
            voiced_flag = f0_vo[1] if len(f0_vo) > 1 else None
            voiced_prob = f0_vo[2] if len(f0_vo) > 2 else None
        else:
            f0 = np.asarray(f0_vo)
            voiced_flag = None
            voiced_prob = None
    except Exception as ex:
        return JSONResponse({"error": str(ex)}, status_code=500)

    f0 = np.nan_to_num(np.asarray(f0), nan=0.0)
    voiced_mask = (f0 > 0).astype(int).tolist()
    times = (np.arange(len(f0)) * hop_length / sr).tolist()
    median = float(np.median(f0[f0 > 0])) if np.any(f0 > 0) else None

    track = [{"t": float(t), "hz": float(h)} for t, h in zip(times, f0)]

    return {
        "median_hz": median,
        "track": track,
        "voiced_mask": voiced_mask
    }


@app.websocket('/ws/pyin')
async def websocket_pyin(ws: WebSocket):
    """Real-time PYIN over WebSocket.
    Client must send binary frames containing PCM s16le 16k mono samples.
    Server responds with JSON text messages: {"hz": float, "confidence": float}.

    Uses a decoupled recv/infer architecture to prevent queue buildup:
      - recv_loop continuously drains incoming WS frames into a ring buffer.
      - infer_loop runs pYIN on a fixed-size snapshot at a capped rate (~6/sec).
    This eliminates the growing latency caused by sequential receive-infer pairing.
    """
    await ws.accept()
    sr          = 16000
    hop_length  = 320
    min_samples = int(sr * 0.3)    # need ≥300 ms before first inference
    snap_len    = int(sr * 0.5)    # analyse last 500 ms per cycle
    overlap_len = int(sr * 0.05)   # keep 50 ms context after snap
    max_buf     = sr * 3           # ring buffer: keep at most 3 s

    buf: np.ndarray = np.array([], dtype=np.float32)
    buf_lock = asyncio.Lock()

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
            await asyncio.sleep(0.15)        # ≤ ~6-7 inferences / sec
            async with buf_lock:
                if buf.shape[0] < min_samples:
                    continue
                snap = buf[-snap_len:].copy() if buf.shape[0] >= snap_len else buf.copy()
                buf  = buf[-overlap_len:] if buf.shape[0] > overlap_len else buf
            try:
                f0_vo = await asyncio.to_thread(
                    lambda s=snap: librosa.pyin(s, fmin=50.0, fmax=1100.0, sr=sr, hop_length=hop_length)
                )
                if isinstance(f0_vo, tuple) and len(f0_vo) >= 1:
                    f0          = f0_vo[0]
                    voiced_flag = f0_vo[1] if len(f0_vo) > 1 else None
                    voiced_prob = f0_vo[2] if len(f0_vo) > 2 else None
                else:
                    f0          = np.asarray(f0_vo)
                    voiced_flag = None
                    voiced_prob = None
                f0        = np.nan_to_num(np.asarray(f0), nan=0.0)
                voiced_hz = f0[f0 > 0]
                last_hz   = float(np.median(voiced_hz)) if voiced_hz.size else 0.0
                if voiced_prob is not None:
                    conf = float(np.nanmean(voiced_prob))
                elif voiced_flag is not None:
                    conf = float(np.nanmean(
                        voiced_flag.astype(float) if hasattr(voiced_flag, 'astype') else voiced_flag
                    ))
                else:
                    conf = float((f0 > 0).mean())
                await ws.send_text(json.dumps({"hz": round(last_hz, 3), "confidence": round(conf, 3)}))
            except WebSocketDisconnect:
                raise
            except Exception as ex:
                try:
                    await ws.send_text(json.dumps({"error": str(ex)}))
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


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))
