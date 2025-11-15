# ai/audio_tags/Dockerfile  (panns / CPU)
FROM python:3.11-slim

WORKDIR /app

# system deps (audio + pobieranie wag)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget libsndfile1 \
 && rm -rf /var/lib/apt/lists/*

# kod
# jeśli Twój plik nazywa się main.py, to skopiuj i nazwij jako app.py
COPY app.py .  # albo: COPY main.py app.py

# python deps (CPU)
RUN pip install --no-cache-dir \
    fastapi uvicorn python-multipart soundfile numpy \
    torch==2.3.1+cpu torchaudio==2.3.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    panns-inference

# wagi + etykiety PANNs
RUN mkdir -p /root/panns_data && \
    wget -O /root/panns_data/Cnn14_mAP=0.431.pth \
      "https://zenodo.org/record/3987831/files/Cnn14_mAP%3D0.431.pth?download=1" && \
    wget -O /root/panns_data/class_labels_indices.csv \
      https://raw.githubusercontent.com/qiuqiangkong/audioset_tagging_cnn/master/metadata/class_labels_indices.csv

ENV PANN_DATA=/root/panns_data
ENV PYTHONUNBUFFERED=1

EXPOSE 8087
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "]()
