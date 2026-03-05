# ai/audio_rhythm/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# System deps do I/O audio
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# Kod
COPY . .

# Py deps (dodany python-multipart)
RUN pip install --no-cache-dir fastapi uvicorn numpy soundfile librosa python-multipart
RUN pip install --no-cache-dir \
    prometheus-client \
    opentelemetry-instrumentation-fastapi \
    opentelemetry-sdk \
    opentelemetry-exporter-otlp

EXPOSE 8083
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8083"]
