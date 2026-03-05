from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import io
import numpy as np
from fastapi.responses import StreamingResponse

app = FastAPI(title="AudioCraft API")


class MusicGenRequest(BaseModel):
    prompt: str
    duration_sec: int = 10
    model_name: str = "facebook/musicgen-small"


@app.post("/api/musicgen")
async def musicgen(request: MusicGenRequest):
    try:
        from audiocraft.models import MusicGen
        import soundfile as sf

        model = MusicGen.get_pretrained(request.model_name)
        model.set_generation_params(duration=request.duration_sec)
        wav = model.generate([request.prompt])
        audio = wav[0].cpu().numpy()
        buf = io.BytesIO()
        sf.write(buf, audio.T, samplerate=32000, format="WAV")
        buf.seek(0)
        return StreamingResponse(buf, media_type="audio/wav")
    except Exception as e:
        return {"error": str(e)}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "audiocraft"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7861)
