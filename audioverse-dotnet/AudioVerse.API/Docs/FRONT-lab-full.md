# AudioVerse — Modul Laboratoryjny (`/api/karaoke/lab`)

> **Autoryzacja:** rola `Admin` (Bearer token) — wyjatki: `/health` i `/report/pdf` sa `AllowAnonymous`.
> **Format zadan:** `multipart/form-data` (pliki audio). Format odpowiedzi: `application/json` lub `application/pdf`.

---

## Szybki start

```bash
# Sprawdz serwisy AI (bez tokenu)
GET /api/karaoke/lab/health

# Porownaj CREPE vs pYIN
POST /api/karaoke/lab/pitch/compare
  file: vocal.wav   (multipart)

# Wygeneruj raport PDF (bez tokenu)
POST /api/karaoke/lab/report/pdf
  audioFiles: a.wav
  audioFiles: b.wav
  reportTitle: "Moj eksperyment"
```

---

## 1. `GET /api/karaoke/lab/health`

Odpytuje `/health` kazdego mikroserwisu AI. Nie wymaga autoryzacji.

```json
{
  "audio_pitch":    { "status": "ok",            "latencyMs": 12 },
  "sing_score":     { "status": "ok",            "latencyMs": 18 },
  "audio_separate": { "status": "unreachable",   "error": "Connection refused" },
  "audio_rhythm":   { "status": "not_configured" }
}
```

---

## 2. `POST /api/karaoke/lab/pitch/crepe`

Detekcja F0 algorytmem CREPE (torchcrepe + dekoder Viterbi). Auto-resample do 16 kHz.

**Body:** `file` — WAV / FLAC / MP3.

```json
{
  "algorithm":  "CREPE",
  "latencyMs":  340,
  "medianHz":   220.5,
  "noteName":   "A3",
  "frameCount": 512,
  "track": [
    { "t": 0.000, "hz": 218.3 },
    { "t": 0.020, "hz": 221.1 }
  ]
}
```

---

## 3. `POST /api/karaoke/lab/pitch/pyin`

Detekcja F0 algorytmem pYIN (probabilistyczny YIN, librosa). Szybszy, nie wymaga GPU.
Identyczny format odpowiedzi jak `/pitch/crepe` z `"algorithm": "pYIN"`.

---

## 4. `POST /api/karaoke/lab/pitch/compare`

**Glowny endpoint pomiarowy** — uruchamia CREPE i pYIN na tym samym pliku, oblicza metryki porownawcze.

**Body:** `file` — WAV.

```json
{
  "crepe": {
    "algorithm": "CREPE", "latencyMs": 340, "medianHz": 220.5,
    "frameCount": 512, "track": [...]
  },
  "pyin": {
    "algorithm": "pYIN", "latencyMs": 85, "medianHz": 219.8,
    "frameCount": 510, "track": [...]
  },
  "comparison": {
    "rmseHz":        3.21,
    "rmseCents":    18.4,
    "accuracy50c":   0.923,
    "pearsonR":      0.981,
    "comparedFrames": 510
  }
}
```

**Opis metryk:**

| Metryka | Opis |
|---------|------|
| `rmseCents` | RMSE miedzy trajektoriami w centach (1 polton = 100 ct). Im mniej, tym lepiej. |
| `accuracy50c` | Odsetek ramek z bledem F0 < 50 ct. Zakres 0–1. |
| `pearsonR` | Korelacja Pearsona trajektorii. Blizej 1.0 = bardziej zgodne. |
| `rmseHz` | RMSE w Hz (pomocniczo). |

---

## 5. `POST /api/karaoke/lab/pitch/separation-effect`

Pipeline: `CREPE(oryginal)` vs `Demucs → wokal → CREPE`. Pokazuje wplyw separacji zrodel na jakosc detekcji F0.

**Body:** `file` — plik z pelnym miksem (wokal + akompaniament).

> **Uwaga:** Demucs trwa 3–8 s nawet na GPU — nie nadaje sie do realtime.

```json
{
  "original":         { "latencyMs": 340,  "medianHz": 198.0, "frameCount": 500 },
  "separation":       { "latencyMs": 4200, "error": null },
  "afterSeparation":  { "latencyMs": 310,  "medianHz": 220.5, "frameCount": 498 },
  "comparison": {
    "rmseHz": 8.1, "rmseCents": 42.3, "accuracy50c": 0.74, "pearsonR": 0.91
  }
}
```

---

## 6. `POST /api/karaoke/lab/score/dtw`

Ocena spiewu metoda Dynamic Time Warping (mikroserwis `sing_score`).

**Body:** `vocal` (nagranie uzytkownika) + `reference` (oryginalna sciezka wokalna).

```json
{
  "latencyMs":      520,
  "score":          74.3,
  "pitchAccuracy":  0.81,
  "rhythmAccuracy": 0.68
}
```

---

## 7. `POST /api/karaoke/lab/batch/pitch`

Wsadowa analiza CREPE — do **20 plikow** jednoczesnie. Wynik gotowy do eksportu jako CSV.

**Body:** `files` — lista plikow WAV.

```json
{
  "count": 2,
  "rows": [
    {
      "fileName":    "vocal_01.wav",
      "medianHz":    220.5,
      "noteName":    "A3",
      "voicedFrames": 480,
      "totalFrames":  512,
      "voicedRatio":  0.937,
      "latencyMs":    330
    }
  ]
}
```

---

## 8. `POST /api/karaoke/lab/benchmark/latency`

Odpytuje kazdy serwis AI N razy i raportuje statystyki czasowe.

**Query:** `?runs=10` (zakres 1–20, domyslnie 5).
**Body:** `file` — krotki fragment audio (2–5 s).

```json
{
  "runs": 10,
  "fileSizeKb": 142.3,
  "results": {
    "CREPE (audio_pitch)":       { "avgMs": 310.4, "minMs": 295, "maxMs": 340, "stdDevMs": 12.1, "available": true },
    "pYIN (audio_pitch)":        { "avgMs":  78.2, "minMs":  71, "maxMs":  91, "stdDevMs":  5.8, "available": true },
    "Rhythm (audio_rhythm)":     { "avgMs":  45.1, "minMs":  41, "maxMs":  52, "stdDevMs":  3.2, "available": true },
    "VAD (audio_vad)":           { "avgMs":  28.7, "minMs":  25, "maxMs":  34, "stdDevMs":  2.4, "available": true },
    "Analysis (audio_analysis)": { "avgMs": 190.0, "minMs": 180, "maxMs": 210, "stdDevMs":  9.0, "available": true }
  }
}
```

---

## 9. `POST /api/karaoke/lab/report/pdf` — Raport naukowy PDF

Uruchamia caly pipeline i generuje **gotowy PDF z brandingiem AudioVerse**.
Odpowiedz: `application/pdf` — plik `AudioVerse_Lab_Report_YYYYMMDD_HHmmss.pdf`.
Nie wymaga autoryzacji.

### Body (`multipart/form-data`)

| Pole | Wymagane | Typ | Opis |
|------|----------|-----|------|
| `audioFiles` | tak | File[] (1–10) | Pliki WAV do analizy CREPE vs pYIN |
| `vocalFile` | nie | File | Nagranie wokalu do oceny DTW |
| `referenceFile` | nie | File | Referencja do oceny DTW |
| `reportTitle` | nie | string | Tytul raportu w PDF |
| `operatorName` | nie | string | Autor (domyslnie: login zalogowanego usera) |
| `benchmarkRuns` | nie | int | Liczba powtorzen benchmarku (1–10, domyslnie 3) |

### Zawartosc PDF

| # | Sekcja |
|---|--------|
| 1 | Naglowek z logo **AudioVerse** (granat `#1a1a2e` + akcent `#e94560`) i data UTC |
| 2 | Tabela parametrow eksperymentu |
| 3 | Podsumowanie wykonawcze z **KPI boxami** (najnizszy RMSE, najwyzszy Accuracy@50c, liczba plikow) |
| 4 | Status mikroserwisow AI |
| 5 | Benchmark latencji — tabela + **wykres slupkowy** z oznaczeniem progu 150 ms |
| 6 | Porownanie CREPE vs pYIN — tabela per plik + **tabela zbiorcza** (avg RMSE Hz/ct, Acc@50c, Pearson r, latencja) |
| 7 | Wplyw separacji Demucs — RMSE przed/po, delta (zielony = poprawa, pomaranczowy = pogorszenie) |
| 8 | Ocena DTW — score 0–100, pitchAccuracy, rhythmAccuracy |
| 9 | Wnioski wygenerowane automatycznie na podstawie danych + skrocone zrodla naukowe |
| 10 | Stopka: numer strony / total, data UTC |

### Przyklad — curl

```bash
curl -X POST https://audioverse.local/api/karaoke/lab/report/pdf \
  -F "audioFiles=@vocal_clean.wav" \
  -F "audioFiles=@vocal_mix.wav" \
  -F "vocalFile=@user_recording.wav" \
  -F "referenceFile=@reference_vocal.wav" \
  -F "reportTitle=Eksperyment CREPE vs pYIN" \
  -F "benchmarkRuns=5" \
  --output raport.pdf
```

### Przyklad — React / TypeScript

```ts
const formData = new FormData();
audioFiles.forEach(f => formData.append('audioFiles', f));
if (vocalFile)     formData.append('vocalFile',     vocalFile);
if (referenceFile) formData.append('referenceFile', referenceFile);
formData.append('reportTitle',   'Eksperyment karaoke');
formData.append('benchmarkRuns', '5');

const res  = await fetch('/api/karaoke/lab/report/pdf', {
  method: 'POST',
  // brak Authorization - endpoint jest AllowAnonymous
  body: formData,
});
const blob = await res.blob();
const url  = URL.createObjectURL(blob);
window.open(url);                        // otwiera PDF w nowej karcie
// lub:  a.href = url; a.download = 'raport.pdf'; a.click();
```

---

## Kody bledow

| Kod | Znaczenie |
|-----|-----------|
| `400` | Brak wymaganego pliku lub nieprawidlowe parametry (np. `runs > 20`) |
| `401` | Brak / niewalny token JWT (endpointy wymagajace roli Admin) |
| `403` | Brak roli `Admin` |
| `503` | Mikroserwis AI niedostepny lub nie skonfigurowany w `AiAudioOptions` |

---

## Formaty plikow audio

Akceptowane: **WAV PCM16** (preferowany), FLAC, MP3.
Serwisy AI wykonuja auto-resample do **16 kHz mono** wewnetrznie.
Optymalna dlugosc dla benchmarku: **2–5 sekund** (krotszy fragment = szybszy benchmark, mniej danych do analizy).

---

## Konfiguracja (`appsettings.json`)

```json
"AiAudio": {
  "PitchBaseUrl":         "http://audio-pitch:8001",
  "SingingScoreBaseUrl":  "http://sing-score:8082",
  "SeparateBaseUrl":      "http://audio-separate:8003",
  "RhythmBaseUrl":        "http://audio-rhythm:8004",
  "VadBaseUrl":           "http://audio-vad:8005",
  "AudioAnalysisBaseUrl": "http://audio-analysis:8006"
}
```

Serwisy z pustym URL sa pomijane — status `not_configured`, brak bledu aplikacji.

---

## Wymagania serwisow AI (GPU / CPU)

| Serwis | GPU wymagane? | Obraz ~size | Czas/plik | Opis |
|--------|:------------:|:-----------:|:---------:|------|
| `audio_pitch` | ❌ CPU | ~1.2 GB | ~300 ms | CREPE (torchcrepe) + pYIN (librosa), PyTorch CPU |
| `audio_separate` | ❌ CPU (GPU zalecane) | ~2 GB | 3–8 s | Demucs HTDemucs, PyTorch CPU. Na GPU ~1 s |
| `sing_score` | ❌ CPU | ~200 MB | ~500 ms | DTW alignment, czysty Python/numpy |
| `audio_rhythm` | ❌ CPU | ~200 MB | ~50 ms | Rhythm features, librosa |
| `audio_vad` | ❌ CPU | ~200 MB | ~30 ms | Voice Activity Detection |
| `audio_analysis` | ❌ CPU | ~300 MB | ~200 ms | Audio features, librosa |

**Zaden serwis AI nie wymaga GPU do dzialania.** Wszystkie Dockerfile uzywaja CPU-only PyTorch wheels:
```dockerfile
RUN pip install torch==2.2.2 --index-url https://download.pytorch.org/whl/cpu
```

GPU przyspiesza glownie `audio_separate` (Demucs) — z ~5s do ~1s na plik. CREPE na CPU dziala ok. 300 ms.

### Uruchomienie w instalacji Minimal

```bash
# Start wszystkich AI serwisow (profil "ai"):
cd AudioVerse.API/Env
docker compose -f docker-compose.minimal.yaml --profile ai up -d

# Lub tylko serwisy potrzebne do laboratorium:
docker compose -f docker-compose.minimal.yaml up -d audio_pitch sing_score
```

### Dlaczego `audio_pitch` i `audio_separate` nie startuja domyslnie?

Oba maja `profiles: ["ai"]` w docker-compose — wymagaja jawnego `--profile ai`.
W instalacji Minimal domyslnie startuje tylko PostgreSQL + Adminer (lekkie srodowisko dev).

---

## Konfiguracja portow (localhost)

Jezeli serwisy AI dzialaja na localhost (nie w Dockerze obok API), ustaw porty:

```json
"AiAudio": {
  "PitchBaseUrl":         "http://localhost:8084",
  "SingingScoreBaseUrl":  "http://localhost:8082",
  "SeparateBaseUrl":      "http://localhost:8086",
  "RhythmBaseUrl":        "http://localhost:8083",
  "VadBaseUrl":           "http://localhost:8085",
  "AudioAnalysisBaseUrl": "http://localhost:8081"
}
```

---

## 10. Historia eksperymentow

Kazdy wygenerowany raport PDF jest automatycznie zapisywany w bazie danych z unikalnym identyfikatorem GUID (widocznym rowniez w kodzie QR na raporcie).

### `GET /api/karaoke/lab/experiments?take=20`

Lista ostatnich eksperymentow (najnowsze pierwsze). Wymaga roli Admin.

```json
[
  {
    "id": 5,
    "experimentGuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "CREPE vs pYIN — vocal set A",
    "operator": "admin",
    "executedAt": "2026-02-26T12:34:56Z",
    "fileCount": 3,
    "crepeAvgRmseCents": 18.4,
    "pyinAvgRmseCents": 22.1,
    "dtwScore": 74.3
  }
]
```

### `GET /api/karaoke/lab/experiments/{guid}`

Szczegoly eksperymentu z probkami (samples) — pelne metryki per plik.

### `GET /api/karaoke/lab/experiments/{guid}/pdf`

Ponownie generuje raport PDF z zapisanych danych. Nie wymaga autoryzacji.
Moze byc uzywany do pobrania raportu po fakcie (np. link z kodu QR).

---

## 11. Probki audio w MinIO

Kazdy plik audio uploadowany do raportu PDF jest automatycznie zapisywany w MinIO bucket `lab-experiments` pod kluczem `{experimentGuid}/{fileName}`. Jezeli MinIO jest niedostepne, eksperyment zapisuje sie normalnie — tylko bez plikow.

### `GET /api/karaoke/lab/experiments/{guid}/samples`

Lista probek z informacja czy plik jest zapisany w storage.

```json
[
  {
    "fileName": "vocal_clean.wav",
    "fileSizeBytes": 1024000,
    "stored": true,
    "storagePath": "a1b2c3d4-.../vocal_clean.wav"
  }
]
```

### `GET /api/karaoke/lab/experiments/{guid}/samples/{fileName}`

Zwraca presigned URL do pobrania pliku audio (wazny 30 minut).

```json
{
  "downloadUrl": "https://minio.audioverse.local/lab-experiments/a1b2.../vocal_clean.wav?X-Amz-...",
  "expiresInMinutes": 30
}
```
