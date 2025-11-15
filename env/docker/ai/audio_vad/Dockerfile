FROM python:3.11-slim

WORKDIR /app

# System deps (audio + kompilacja webrtcvad, jeśli używasz natywnego pakietu)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libsndfile1 ffmpeg build-essential python3-dev && \
    rm -rf /var/lib/apt/lists/*

COPY . .

# Py deps
RUN pip install --no-cache-dir fastapi uvicorn numpy soundfile librosa webrtcvad python-multipart

# (opcjonalnie) odchudzenie obrazu po buildzie webrtcvad
RUN apt-get purge -y --auto-remove build-essential python3-dev || true

EXPOSE 8085
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8085"]
