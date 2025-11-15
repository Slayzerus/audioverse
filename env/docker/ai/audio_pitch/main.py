from fastapi import FastAPI, UploadFile, File
import torch, torchcrepe, numpy as np, soundfile as sf, io

app = FastAPI()

@app.post("/pitch")
async def pitch(file: UploadFile = File(...)):
    raw = await file.read()
    wav, sr = sf.read(io.BytesIO(raw), dtype='float32')
    if wav.ndim > 1: wav = np.mean(wav, axis=1)
    # model torchcrepe używa 16k lub 44.1k. Zostawmy auto-resample do 16000:
    target_sr = 16000
    if sr != target_sr:
        import librosa
        wav = librosa.resample(wav, orig_sr=sr, target_sr=target_sr)
        sr = target_sr

    x = torch.tensor(wav)[None].to(torch.float32)
    f0 = torchcrepe.predict(
        x, sr, hop_length=320, fmin=50, fmax=1100, model='full',
        decoder=torchcrepe.decode.viterbi
    )[0]  # Hz
    # zamień NaN na 0
    f0 = torch.nan_to_num(f0, nan=0.0).cpu().numpy()
    voiced = (f0 > 1.0).astype(int).tolist()
    times = (np.arange(len(f0)) * 320 / sr).tolist()
    median = float(np.median(f0[f0>0])) if np.any(f0>0) else None

    return {
        "median_hz": median,
        "track": [{"t": float(t), "hz": float(h)} for t, h in zip(times, f0)],
        "voiced_mask": voiced
    }
