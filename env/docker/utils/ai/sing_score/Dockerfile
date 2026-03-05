FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY . .

# Python dependencies
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    numpy \
    librosa \
    crepe \
    dtaidistance \
    scipy \
    pydantic \
    python-multipart \
    prometheus-client \
    opentelemetry-instrumentation-fastapi \
    opentelemetry-sdk \
    opentelemetry-exporter-otlp

EXPOSE 8082

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8082"]
