# ai/audio_separate/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# System deps: ffmpeg + libsndfile (I/O audio)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libsndfile1 \
 && rm -rf /var/lib/apt/lists/*

# App code
COPY . .

# 1) CPU-only PyTorch stack (unikamy CUDA): torchaudio musi pasować do torch
RUN pip install --no-cache-dir \
    "torch==2.2.2" "torchaudio==2.2.2" --index-url https://download.pytorch.org/whl/cpu

# 2) Reszta zależności: demucs + FastAPI + I/O + multipart
RUN pip install --no-cache-dir \
    demucs fastapi uvicorn numpy soundfile python-multipart

EXPOSE 8086
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8086"]
