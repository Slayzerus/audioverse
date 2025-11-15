from fastapi import FastAPI, UploadFile, File
import librosa, numpy as np, io, soundfile as sf

app = FastAPI()

@app.post("/rhythm")
async def rhythm(file: UploadFile = File(...)):
    raw = await file.read()
    y, sr = sf.read(io.BytesIO(raw), dtype='float32')
    if y.ndim > 1: y = np.mean(y, axis=1)
    y = librosa.util.normalize(y)

    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, units='time')

    return {
        "tempo_bpm": float(tempo),
        "beats_s": [float(t) for t in beats],
        "onsets_s": [float(t) for t in onsets],
        "duration_s": round(len(y)/sr, 3)
    }
