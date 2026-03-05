# AudioVerse — backend dla gry wokalnej (Karaoke) z AI

## Opis

Ten serwis jest backendem dla projektu dyplomowego "Gra wokalna / karaoke z wykorzystaniem sztucznej inteligencji". Zawiera zestaw mikroserwisów i endpointów wykorzystywanych przez frontend do analizy i przetwarzania audio. Dokumentacja opisuje tylko funkcjonalno?ci ju? zaimplementowane i u?ywane w repozytorium: detekcj? pitchu, ocen? ?piewu (scoring), separacj? ?róde? (separate) oraz wyszukiwanie w YouTube.

## Funkcje i endpointy

### 1) Pitch detection

- File mode
  - Endpoint (API): `POST /api/AiAudio/pitch`
  - Request: `multipart/form-data` z polem `File` (plik audio: WAV/FLAC/MP3)
  - Response: JSON z polami:
    - `median_hz` — mediana wykrytych cz?stotliwo?ci (Hz)
    - `track` — lista punktów `{ t: <sekundy>, hz: <Hz> }`
    - `voiced_mask` — tablica 0/1 okre?laj?ca ramki z d?wi?kiem
  - Model: CREPE (`torchcrepe`) — serwis resampluje wej?cie do 16 kHz w razie potrzeby.

- Live mode (WebSocket)
  - Server-side detection (serwer liczy pitch):
    - URL (API proxy): `wss://{API_HOST}/api/AiAudio/pitch/ws/server`
    - Klient wysy?a: binary frames = PCM s16le, 16000 Hz, mono (ArrayBuffer z int16)
    - Serwer odpowiada: tekstowe JSONy `{ "hz": <float>, "confidence": <float> }`
    - Implementacja: `torchcrepe` (wysoka dok?adno??, wi?ksze wymagania CPU/GPU)

  - Client-side detection (klient liczy lokalnie):
    - URL (API proxy): `wss://{API_HOST}/api/AiAudio/pitch/ws/client`
    - Klient wysy?a: JSON `{ "hz": <float>, "confidence": <float>, "ts": <timestamp> }`
    - Serwer zwraca: wyg?adzone warto?ci (EMA)
    - Implementacja klienta: `crepe-wasm`, `pitchfinder` lub inny ONNX/WASM model (zalecane przy du?ej skali)

### 2) Singing score

- Offline scoring
  - Endpoint (API): `POST /api/AiAudio/score`
  - Request: `multipart/form-data` z polami `Vocal` i `Reference` (pliki audio)
  - Response: JSON `SingingOfflineScoreDto` zawieraj?cy m.in. `score` (0..100) oraz `pitchTrackHz` (tablica cz?stotliwo?ci)
  - Metoda: ekstrakcja pitch (CREPE lub librosa.pyin jako fallback) + porównanie sekwencji pitch (DTW — Dynamic Time Warping). Realizacja w microservice `sing_score`.

- Live scoring
  - Endpoint (API): `GET /api/AiAudio/score/live` (WebSocket upgrade)
  - Klient wysy?a: binary PCM s16le 16k mono
  - Serwer odsy?a: JSON-y z aktualizacjami (np. `{ "instantScore": 72.3, "confidence": 0.9, "partialText": "..." }`)

### 3) Separate (source separation)

- Endpoint (API): `POST /api/AiAudio/separate`
  - Request: `multipart/form-data` z polem `File` (plik audio). Opcjonalny query-param `stems` (domy?lnie `2`).
  - Response: `application/zip` (plik `stems.zip`) zawieraj?cy rozdzielone ?cie?ki (WAV).
  - Microservice: `ai/audio_separate` uruchamia Demucs. Modele u?ywane:
    - `mdx_extra_q` — dla `stems=2` (vocals + accompaniment)
    - `htdemucs` — dla `stems=4` (szczegó?owa separacja)
  - Uwaga: Demucs jest zasobo?erny — operacja mo?e trwa?; frontend powinien obs?ugiwa? timeout/UX.

### 4) YouTube search

- Implementacja: `YouTubeService` (serwis pomocniczy) korzysta z YouTube Data API v3 do wyszukiwania video/playlist/channel.
- Konfiguracja: `YouTube:ApiKey` w `appsettings.json` (konfigurowane przez user-secrets/CI secrets).
- U?ycie: wyszukiwanie oficjalnych teledysków / uzyskanie `videoId` i embed URL (`GetEmbedUrl(videoId)`).

## Modele AI i zale?no?ci

- CREPE: g?ówny model do detekcji pitchu (`torchcrepe` na serwerze). Wersje klienta: `crepe-wasm` lub ONNX dla uruchomienia w przegl?darce.
- DeepF0 (opcjonalnie): eksperymentalny endpoint korzysta z modelu ONNX uruchamianego przez `onnxruntime`.
- Demucs: u?ywany do separacji ?róde? w `audio_separate`.
- sing_score: algorytm oceny oparty na ekstrakcji pitch i dopasowaniu (DTW) oraz prostym przeliczeniu na 0..100.

## Integracja frontendu — praktyczne wskazówki

- Preferuj wywo?ania przez g?ówne API `/api/AiAudio/*` (obs?uga autoryzacji i routing). Je?li frontend ma bezpo?redni dost?p do sieci kontenerów, mo?na u?ywa? mikroserwisów bezpo?rednio (adresy w `appsettings.json`).
- Dla WebSocketów (server-side pitch / score): u?ywaj `wss://` je?li frontend dzia?a pod HTTPS.
- PCM format: 16-bit signed little-endian (s16le), sample rate 16000 Hz, mono.
- Capture w przegl?darce: `AudioWorklet` (zalecane) lub `ScriptProcessor` (prostsze).
- Konwersja Float32 -> Int16 LE: clamp([-1,1]) ? *32767 ? zapisz jako Int16 LE do ArrayBuffer.

## Przyk?ady wywo?a?

- Pitch (file):
```bash
curl -v -F "File=@audio.wav" https://api-host/api/AiAudio/pitch
```

- Pitch live (server): capture -> konwersja PCM -> wysy?aj binarne ramki do `wss://{API_HOST}/api/AiAudio/pitch/ws/server`, odbieraj JSON z `{hz,confidence}`.

- Score (offline):
```bash
curl -v -F "Vocal=@vocal.wav" -F "Reference=@ref.wav" https://api-host/api/AiAudio/score
```

- Separate:
```bash
curl -v -F "File=@mix.wav" "https://api-host/api/AiAudio/separate?stems=2" --output stems.zip
```

## Monitoring i dalsze kroki

- Ka?dy mikroserwis wystawia `/health` i `/metrics` (Prometheus) do monitoringu.
- W `TODO.md` znajduj? si? zadania operacyjne: CI/CD, limity zasobów, zabezpieczenia uploadów, polityka logów.

## Uwagi ko?cowe

Dla potrzeb pracy dyplomowej mog? doda? diagram architektury, przyk?adowe klienty demo (AudioWorklet + WebSocket) oraz pomiary wydajno?ci (latency/CPU) — daj zna?, co doda? dalej.

Reu?ywalno?? i zakres zastosowa?

Warto zaznaczy?, ?e opisane tu komponenty (detekcja pitchu, scoring, separacja ?róde?, integracja z YouTube) zosta?y zaprojektowane jako uniwersalne modu?y AI. Mog? by? wykorzystane w innych projektach wymagaj?cych analizy audio — np. aplikacjach edukacyjnych, narz?dziach do transkrypcji muzycznej czy systemach rekomendacji opartych na zawarto?ci audio. W odró?nieniu od tego, `AudioVerse.API` zawiera dodatkowe rozwi?zania i integracje specyficzne dla aplikacji karaoke (formaty formularzy, DTO, ?cie?ki routingu, oraz integracja z mediami i interfejsem u?ytkownika), dlatego przy ponownym u?yciu modu?ów w innym kontek?cie warto wyodr?bni? warstw? AI (microservices) i ponownie zaimplementowa? warstw? API dostosowan? do docelowej aplikacji.
