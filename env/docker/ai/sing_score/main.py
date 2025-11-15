from fastapi import FastAPI, WebSocket
import uvicorn, json, asyncio, numpy as np

app = FastAPI()

@app.websocket("/score/live")
async def ws_score(websocket: WebSocket):
    await websocket.accept()
    # 1) config od klienta (text frame)
    cfg_msg = await websocket.receive_text()
    try:
        cfg = json.loads(cfg_msg)
    except Exception:
        cfg = {}
    sr = int(cfg.get("sample_rate", 16000))

    # Stan prostej “metryki” – średnia amplituda -> pseudo-score 0..1
    while True:
        msg = await websocket.receive()
        if msg["type"] == "websocket.disconnect":
            break
        if "text" in msg:
            # ignorujemy dodatkowe tekstowe wiadomości
            continue
        if "bytes" in msg:
            data = msg["bytes"]
            if not data:
                await asyncio.sleep(0)
                continue
            # surowy PCM s16le mono -> wektor int16
            audio = np.frombuffer(data, dtype=np.int16)
            # prosty “score”: znormalizowane RMS
            rms = float(np.sqrt(np.mean((audio.astype(np.float32) / 32768.0) ** 2)))
            score = min(max(rms * 2.0, 0.0), 1.0)  # trochę podbite
            await websocket.send_text(json.dumps({
                "score": round(score, 3),
                "partial_text": None
            }))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082)
