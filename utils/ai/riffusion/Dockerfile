FROM python:3.9-slim

WORKDIR /app

# Zainstaluj system dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Klonuj repo je?li nie istnieje
COPY . .

# Zainstaluj Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir \
    diffusers \
    transformers \
    numpy \
    scipy \
    librosa \
    fastapi \
    uvicorn \
    pydantic \
    python-multipart

# Otwórz port
EXPOSE 7860

# Runbook - uruchom serwer FastAPI
CMD ["python", "-m", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]
