FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends wget libsndfile1 && rm -rf /var/lib/apt/lists/*
COPY main.py app.py
RUN pip install --no-cache-dir fastapi uvicorn python-multipart soundfile numpy panns-inference
RUN pip install --no-cache-dir torch==2.3.1+cpu torchaudio==2.3.1+cpu --index-url https://download.pytorch.org/whl/cpu
RUN mkdir -p /root/panns_data && wget -O /root/panns_data/Cnn14_mAP=0.431.pth "https://zenodo.org/record/3987831/files/Cnn14_mAP%3D0.431.pth?download=1" && wget -O /root/panns_data/class_labels_indices.csv https://raw.githubusercontent.com/qiuqiangkong/audioset_tagging_cnn/master/metadata/class_labels_indices.csv
ENV PANN_DATA=/root/panns_data
ENV PYTHONUNBUFFERED=1
EXPOSE 8087
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8087"]
