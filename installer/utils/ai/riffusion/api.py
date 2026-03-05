from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Riffusion API")


class InferenceRequest(BaseModel):
    prompt: str
    seed: int = 42
    num_inference_steps: int = 50
    guidance: float = 7.0


@app.post("/api/riffusion")
async def run_inference(request: InferenceRequest):
    try:
        from riffusion.server import run_inference as _infer

        result = _infer(request.dict())
        return result
    except Exception as e:
        return {"error": str(e)}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "riffusion"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
