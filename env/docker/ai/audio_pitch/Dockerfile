FROM python:3.11-slim

WORKDIR /app

# System deps do audio I/O
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# Kod
COPY . .

# 1) TYLKO torch + torchaudio z CPU indexu PyTorch (sparowane wersje CPU)
RUN pip install --no-cache-dir \
    torch \
    torchaudio \
    --index-url https://download.pytorch.org/whl/cpu

# 2) Reszta z domyślnego PyPI
RUN pip install --no-cache-dir \
    fastapi uvicorn torchcrepe numpy soundfile librosa python-multipart

EXPOSE 8084
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8084"]
