FROM python:3.10-slim

WORKDIR /app

# Zainstaluj system dependencies - AudioCraft wymaga PyAV i ffmpeg
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    pkg-config \
    libavformat-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    libavfilter-dev \
    libsndfile1 \
    sox \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Skopiuj pliki
COPY . .

# Zainstaluj Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Zainstaluj PyTorch CPU version
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# Zainstaluj AudioCraft i zale?no?ci
RUN pip install --no-cache-dir -e .
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    pydantic \
    python-multipart \
    numpy \
    scipy

# Otwórz port
EXPOSE 7861

# Uruchom serwer - u?yj prostego wrapper'a
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7861"]
