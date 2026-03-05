FROM pytorch/pytorch:2.2.2-cuda12.1-cudnn8-runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 ffmpeg git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Zależności Pythona (dopisz python-multipart)
RUN pip install --no-cache-dir \
    fastapi uvicorn[standard] numpy opencv-python-headless python-multipart

COPY . /app

EXPOSE 8103

# Upewnij się, że celujesz w plik main.py zawierający "app = FastAPI(...)"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8103"]
