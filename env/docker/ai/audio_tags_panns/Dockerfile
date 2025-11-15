FROM python:3.11-slim

WORKDIR /app
# system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget libsndfile1 && rm -rf /var/lib/apt/lists/*

# PyPI – standardowy indeks (FastAPI, itp.)
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir \
      fastapi uvicorn python-multipart soundfile numpy panns-inference

# TYLKO torch z indeksu PyTorch
RUN pip install --no-cache-dir \
      torch==2.3.1+cpu --index-url https://download.pytorch.org/whl/cpu

# (opcjonalnie) prefetch wag i etykiet PANNs, by uniknąć ściągania przy starcie
ENV PANN_HOME=/root/panns_data
RUN mkdir -p ${PANN_HOME} && \
    wget -O ${PANN_HOME}/Cnn14_mAP=0.431.pth \
      "https://zenodo.org/record/3987831/files/Cnn14_mAP%3D0.431.pth?download=1" && \
    wget -O ${PANN_HOME}/class_labels_indices.csv \
      "https://raw.githubusercontent.com/qiuqiangkong/audioset_tagging_cnn/master/metadata/class_labels_indices.csv"

# aplikacja
COPY app.py .

EXPOSE 8000
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","8000"]
