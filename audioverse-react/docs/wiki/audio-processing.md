# Przetwarzanie Audio — Frontend

## Web Audio API

AudioVerse intensywnie wykorzystuje Web Audio API przeglądarki do przetwarzania dźwięku
w czasie rzeczywistym.

### Łańcuch audio (Audio Graph)

```
getUserMedia (mikrofon)
    → MediaStreamSource
        → GainNode (wzmocnienie mikrofonu)
            → AnalyserNode (FFT / dane czasowe)
            → [opcjonalnie] GainNode (monitor) → AudioContext.destination (głośniki)
```

### AudioRecorder (`scripts/recording.ts`)

Klasa zarządzająca nagrywaniem audio z mikrofonu:

```typescript
interface RecorderStartOptions {
    deviceId?: string;           // ID urządzenia
    mimeType?: string;           // domyślnie 'audio/webm'
    onLevel?: (level: number) => void;  // callback poziomu RMS
    gain?: number;               // wzmocnienie (0–3, 1 = jedność)
    monitorEnabled?: boolean;    // odsłuch przez głośniki
    monitorVolume?: number;      // głośność odsłuchu (0–100)
}
```

**Funkcje:**
- `startRecording(options)` — rozpoczęcie nagrywania
- `stopRecording()` — zatrzymanie, zwraca Blob
- `getStream()` — dostęp do MediaStream (dla detekcji pitchu)
- Level monitoring — ciągłe obliczanie RMS w pętli RAF

**Constrainty getUserMedia:**
```typescript
{
    audio: {
        deviceId: selectedDeviceId,
        echoCancellation: false,     // wyłączone — zakłóca detekcję
        noiseSuppression: false,     // wyłączone — zmienia barwę
        autoGainControl: false       // wyłączone — ręczne wzmocnienie
    }
}
```

## Algorytmy detekcji pitchu

### Autokorelacja (UltrastarWP)
Implementacja z UltraStar WorldParty — analiza autokorelacji sygnału czasowego.
- Szybka, niskoopóźnieniowa
- Działa dobrze dla czystego wokalu
- Wykorzystywana jako fallback

### Pitchy
Biblioteka npm `pitchy` — szybka detekcja oparta o FFT:
```typescript
const detector = PitchDetector.forFloat32Array(fftSize);
const [frequency, clarity] = detector.findPitch(buffer, sampleRate);
```
- `clarity` > pitchThreshold → akceptacja wyniku
- Zakres: 50–3000 Hz

### CREPE (sieć neuronowa)
Streaming przez WebSocket do serwera Python:
- URL: `wss://host/api/ai/audio/pitch/ws/server`
- Wysyłanie surowych fragmentów audio
- Odbiór: `{ hz: number }`
- Auto-fallback do pitchy przy błędach WS

### Librosa (pYIN)
Streaming przez WebSocket:
- URL: `wss://host/api/librosa/pyin/ws`
- Algorytm probabilistyczny pYIN
- Lepszy dla szumnych nagrań

## Przetwarzanie sygnału

### Okno Hanninga
Stosowane opcjonalnie przed analizą FFT. Redukuje artefakty spectral leakage:
```
w[i] = 0.5 × (1 − cos(2πi / (N−1)))
```

### Wygładzanie (Smoothing)
Rolling average z ostatnich N detekcji pitchu.
Wygładza skoki i chwilowe błędy detekcji.

### Histereza
Zapobiega „migotaniu" — gdy mikrofon chwilowo nie wykrywa pitchu (np. oddech),
kontynuuje emisję ostatniego znanego pitchu przez N ramek zanim wyzeruje.

### Bramka ciszy (RMS Gate)
Sygnał poniżej progu RMS jest ignorowany — zapobiega wykrywaniu szumu tła jako pitchu.

## Separacja źródeł (Demucs)

AI rozdzielenie nagrania na 4 ścieżki:
- **vocals** — wokal
- **drums** — perkusja
- **bass** — bas
- **other** — inne instrumenty

Endpoint: `POST /api/ai/audio/separate` (multipart file upload)
Odpowiedź: ZIP z 4 plikami WAV.

## Transkrypcja (ASR)

### Tryb plikowy
`POST /api/ai/audio/asr` — przesyłanie pliku audio, zwraca tekst.

### Tryb streamingowy
WebSocket: `wss://host/api/ai/audio/asr/stream` — transkrypcja w czasie rzeczywistym.

### Live Comparison (podczas karaoke)
Co ~10 sekund fragment nagrania jest wysyłany do ASR.
Transkrybowany tekst porównywany z oczekiwanym tekstem piosenek.
Wynik (word overlap ratio) wyświetlany dyskretnie w UI.
