from fastapi import FastAPI, UploadFile, File
import soundfile as sf
import numpy as np
import io, json

app = FastAPI()

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
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
    return {
        "DurationSeconds": round(duration, 3),
        "Rms": round(rms, 6),
        "TempoBpm": None,
        "PitchMedianHz": round(pitch_hz, 2) if pitch_hz else None
    }
