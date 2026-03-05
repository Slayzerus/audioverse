import librosa
import numpy as np
import crepe
import asyncio
import json
import time
from fastapi import FastAPI, WebSocket, UploadFile, File
from fastapi.responses import JSONResponse, PlainTextResponse
from dtaidistance import dtw
import uvicorn
import io
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

app = FastAPI(title="Singing Score API")

# Prometheus metrics
REQUEST_COUNT = Counter(
    "sing_score_requests_total",
    "Total requests",
    ["path", "method", "status"],
)
REQUEST_LATENCY = Histogram(
    "sing_score_request_duration_seconds",
    "Request duration seconds",
    ["path", "method", "status"],
)

class SingingScorer:
    def __init__(self):
        self.sr = 16000
    
    def extract_pitch_crepe(self, audio):
        """Ekstraktuj pitch z CREPE (ultra-dokładny)"""
        # audio: numpy array (float32, -1..1)
        time, frequency, confidence, _ = crepe.predict(
            audio, 
            sr=self.sr, 
            viterbi=True,
            step_size=10
        )
        # Filtruj niskie confidence scores
        valid = confidence > 0.1
        return frequency[valid], confidence[valid]
    
    def extract_pitch_librosa(self, audio):
        """Backup: PYIN z librosa (szybszy)"""
        f0, voiced_flag, voiced_probs = librosa.pyin(
            audio, 
            fmin=50, 
            fmax=400, 
            sr=self.sr,
            frame_length=2048
        )
        # Filtruj NaN values
        valid = ~np.isnan(f0)
        return f0[valid], voiced_probs[valid]
    
    def score_singing(self, user_audio, reference_audio, use_crepe=True):
        """
        Porównaj pitch użytkownika z referencją
        
        Args:
            user_audio: numpy array (float32)
            reference_audio: numpy array (float32)
            use_crepe: bool - użyj CREPE (True) czy librosa (False)
        
        Returns:
            dict z score (0-100), distance, confidence
        """
        try:
            # Ekstraktuj pitch
            if use_crepe:
                user_pitch, user_conf = self.extract_pitch_crepe(user_audio)
                ref_pitch, ref_conf = self.extract_pitch_crepe(reference_audio)
            else:
                user_pitch, user_conf = self.extract_pitch_librosa(user_audio)
                ref_pitch, ref_conf = self.extract_pitch_librosa(reference_audio)
            
            # Validacja
            if len(user_pitch) < 10 or len(ref_pitch) < 10:
                return {
                    "score": 0,
                    "distance": 999,
                    "message": "Niewystarczająca długość audio"
                }
            
            # DTW alignment - znormalizuj pitch do 0-1 range
            user_norm = (user_pitch - user_pitch.min()) / (user_pitch.max() - user_pitch.min() + 1e-6)
            ref_norm = (ref_pitch - ref_pitch.min()) / (ref_pitch.max() - ref_pitch.min() + 1e-6)
            
            # Oblicz DTW distance
            distance = dtw.distance(user_norm, ref_norm)
            
            # Konwertuj na score (0-100)
            # Distance ~0-1, mapuj: 0 -> 100, 1 -> 0
            score = max(0, min(100, 100 * (1 - distance)))
            
            # Średnia confidence
            avg_confidence = float(np.mean(user_conf))
            
            return {
                "score": round(score, 1),
                "distance": round(distance, 4),
                "confidence": round(avg_confidence, 3),
                "pitch_points": len(user_pitch)
            }
        
        except Exception as e:
            return {
                "score": 0,
                "error": str(e)
            }


def instrument_app(app: FastAPI):
    FastAPIInstrumentor.instrument_app(app)

    @app.middleware("http")
    async def metrics_middleware(request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - start
        labels = {
            "path": request.url.path,
            "method": request.method,
            "status": str(response.status_code),
        }
        REQUEST_COUNT.labels(**labels).inc()
        REQUEST_LATENCY.labels(**labels).observe(elapsed)
        return response


instrument_app(app)

# Globalna instancja scorer'a
scorer = SingingScorer()

# ==================== REST API ====================

@app.post("/score")
async def score_singing(vocal: UploadFile = File(...), reference: UploadFile = File(...)):
    """
    Offline ocena śpiewu
    
    Request:
        - vocal: WAV/MP3 plik użytkownika
        - reference: WAV/MP3 plik referencji (karaoke/oryginał)
    
    Response:
        {
            "score": 75.5,
            "distance": 0.245,
            "confidence": 0.92,
            "pitch_points": 1024
        }
    """
    try:
        # Wczytaj audio
        vocal_data = await vocal.read()
        ref_data = await reference.read()
        
        vocal_audio, sr_v = librosa.load(io.BytesIO(vocal_data), sr=16000)
        ref_audio, sr_r = librosa.load(io.BytesIO(ref_data), sr=16000)
        
        # Score
        result = scorer.score_singing(vocal_audio, ref_audio, use_crepe=True)
        return JSONResponse(result)
    
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

@app.get("/health")
async def health():
    return {"status": "healthy", "model": "CREPE+DTW"}


@app.get("/metrics")
async def metrics():
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# ==================== WEBSOCKET API ====================

@app.websocket("/score/live")
async def websocket_live_score(websocket: WebSocket):
    """
    Real-time ocena śpiewu over WebSocket
    
    Protocol:
        1. Klient wysyła: {"reference_url": "path_to_reference.wav", "sample_rate": 16000}
        2. Klient wysyła binarne frames PCM (s16le, 16kHz, mono)
        3. Server odsyła: {"score": 75.5, "confidence": 0.92}
        4. Klient wysyła: {"command": "end"} -> server kończy
    """
    await websocket.accept()
    
    try:
        # 1. Otrzymaj konfigurację
        config_msg = await websocket.receive_text()
        config = json.loads(config_msg)
        sr = int(config.get("sample_rate", 16000))
        reference_path = config.get("reference_path", "")
        
        # Wczytaj referencję
        if reference_path:
            try:
                ref_audio, _ = librosa.load(reference_path, sr=sr)
            except Exception as e:
                await websocket.send_text(json.dumps({"error": f"Nie mogę wczytać referencji: {str(e)}"}))
                await websocket.close()
                return
        else:
            await websocket.send_text(json.dumps({"error": "reference_path wymagana"}))
            await websocket.close()
            return
        
        # 2. Odbieraj audio frames i oceniaj
        user_audio_buffer = np.array([], dtype=np.float32)
        frame_count = 0
        
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive(), timeout=60)
            except asyncio.TimeoutError:
                break
            
            # Text message - commands
            if "text" in msg:
                text_data = json.loads(msg["text"])
                if text_data.get("command") == "end":
                    break
                continue
            
            # Binary message - audio data
            if "bytes" in msg:
                data = msg["bytes"]
                if not data:
                    continue
                
                # Konwertuj s16le do float32
                audio = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
                user_audio_buffer = np.concatenate([user_audio_buffer, audio])
                
                frame_count += 1
                
                # Co 10 frames (ok 160ms), oblicz score
                if frame_count % 10 == 0 and len(user_audio_buffer) > sr * 0.5:  # min 0.5s
                    result = scorer.score_singing(
                        user_audio_buffer, 
                        ref_audio, 
                        use_crepe=False  # librosa szybszy dla real-time
                    )
                    
                    await websocket.send_text(json.dumps({
                        "score": result.get("score", 0),
                        "confidence": result.get("confidence", 0),
                        "distance": result.get("distance", 0)
                    }))
    
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"error": str(e)}))
        except:
            pass
    
    finally:
        try:
            await websocket.close()
        except:
            pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082)