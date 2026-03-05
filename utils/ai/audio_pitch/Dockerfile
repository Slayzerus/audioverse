FROM python:3.11-slim

WORKDIR /app

# System deps do audio I/O
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# Kod
COPY . .

# Upgrade pip and wheel
RUN python -m pip install --upgrade pip setuptools wheel

# 1) Pinowane torch + torchaudio (CPU wheels) - dopasuj wersję do używanej torchcrepe
RUN pip install --no-cache-dir \
    torch==2.2.2 \
    torchaudio==2.2.2 \
    --index-url https://download.pytorch.org/whl/cpu

# 2) Reszta zależności (w tym torchcrepe)
RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    websockets \
    wsproto \
    httptools \
    torchcrepe \
    "numpy<2" \
    soundfile \
    librosa \
    python-multipart \
    prometheus-client \
    opentelemetry-instrumentation-fastapi \
    opentelemetry-sdk \
    opentelemetry-exporter-otlp

# Optional: install onnxruntime (CPU) or onnxruntime-gpu if building with GPU support.
# Set build arg ONNXRUNTIME_GPU=1 to install GPU package.
ARG ONNXRUNTIME_GPU=0
RUN if [ "$ONNXRUNTIME_GPU" = "1" ] ; then \
      pip install --no-cache-dir onnxruntime-gpu || pip install --no-cache-dir onnxruntime ; \
    else \
      pip install --no-cache-dir onnxruntime ; \
    fi

EXPOSE 8084
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8084"]
