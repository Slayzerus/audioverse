FROM pytorch/pytorch:2.2.2-cuda12.1-cudnn8-runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 ffmpeg git wget build-essential cmake && \
    rm -rf /var/lib/apt/lists/*

# Expect pyopenpose available or mount OpenPose install to /opt/openpose
# You can bake your own layer here if needed.
ENV OPENPOSE_ROOT=/opt/openpose

WORKDIR /app
RUN python -m pip install --no-cache-dir fastapi uvicorn[standard] numpy opencv-python-headless python-multipart

COPY . /app
EXPOSE 8092
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8092"]
