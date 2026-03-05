FROM pytorch/pytorch:2.2.2-cuda12.1-cudnn8-runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 ffmpeg git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies first (better layer cache)
COPY requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt

# App sources
COPY . /app

EXPOSE 8080
# ✅ Point Uvicorn to main.py (module:file -> main:app)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
