FROM python:3.7-slim

WORKDIR /app

# Zainstaluj system dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Skopiuj pliki
COPY . .

# Zainstaluj Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# WaveGAN wymaga starszej wersji TensorFlow
RUN pip install --no-cache-dir \
    tensorflow==1.15 \
    "numpy<1.19" \
    scipy \
    librosa \
    fastapi \
    uvicorn \
    pydantic \
    python-multipart \
    prometheus-client \
    opentelemetry-instrumentation-fastapi \
    opentelemetry-sdk \
    opentelemetry-exporter-otlp

# Otwórz port
EXPOSE 8088

# Uruchom serwer API
CMD ["python", "main.py"]
