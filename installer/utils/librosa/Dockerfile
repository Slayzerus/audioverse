FROM python:3.11-slim

# Install system deps for librosa and soundfile
RUN apt-get update && apt-get install -y \
    build-essential \
    libsndfile1 \
    libsndfile1-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY main.py /app/

# Install Python deps (include python-multipart for form uploads)
RUN pip install --no-cache-dir fastapi uvicorn[standard] soundfile numpy librosa python-multipart

EXPOSE 8000
CMD ["python", "main.py"]
