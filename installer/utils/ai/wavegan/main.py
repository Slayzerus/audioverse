from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
import uvicorn, time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

app = FastAPI(title="WaveGAN")

REQUEST_COUNT = Counter(
    "wavegan_requests_total",
    "Total requests",
    ["path", "method", "status"],
)
REQUEST_LATENCY = Histogram(
    "wavegan_request_duration_seconds",
    "Request duration seconds",
    ["path", "method", "status"],
)

@app.post("/api/generate")
async def generate(category: str, duration: int = 5):
    start = time.perf_counter()
    payload = {"status": "ok", "message": f"WaveGAN generating {category} for {duration}s"}
    elapsed = time.perf_counter() - start
    labels = {"path": "/api/generate", "method": "POST", "status": "200"}
    REQUEST_COUNT.labels(**labels).inc()
    REQUEST_LATENCY.labels(**labels).observe(elapsed)
    return payload

@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/metrics")
async def metrics():
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)


FastAPIInstrumentor.instrument_app(app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8088)
