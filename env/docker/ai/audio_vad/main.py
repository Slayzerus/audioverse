from fastapi import FastAPI, UploadFile, File
import webrtcvad, numpy as np, io, soundfile as sf, librosa

app = FastAPI()

@app.post("/vad")
async def vad(file: UploadFile = File(...), aggressiveness: int = 2):
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

    return {"segments": segments, "duration_s": round(len(y)/sr,3)}
