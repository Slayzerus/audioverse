FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libsndfile1 ffmpeg && rm -rf /var/lib/apt/lists/*
COPY . .
RUN pip install --no-cache-dir fastapi uvicorn numpy
EXPOSE 8082
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8082"]
