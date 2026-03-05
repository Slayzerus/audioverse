# CPU
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      libgl1 libglib2.0-0 git && \
    rm -rf /var/lib/apt/lists/*

RUN python -m pip install -U pip "setuptools<82" wheel --no-cache-dir

RUN pip install --no-cache-dir "numpy<2" torch==2.2.2+cpu torchvision==0.17.2+cpu --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir "mmengine==0.10.4"

RUN pip install --no-cache-dir --no-build-isolation "mmcv==2.1.0" \
      -f https://download.openmmlab.com/mmcv/dist/cpu/torch2.2/index.html

RUN pip install --no-cache-dir "mmpose==1.3.1" \
      fastapi "uvicorn[standard]" opencv-python-headless==4.8.1.78 \
      python-multipart

WORKDIR /app
COPY . /app
ENV HOST=0.0.0.0 PORT=8000
EXPOSE 8000
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000"]
