# Dance & Pose Detection

System detekcji pozy i tańca: 4 silniki AI (MediaPipe, OpenPose, AlphaPose, ViTPose), podnoszenie 2D→3D przez PoseFormer, gra kamerowa z oceną dopasowania pozy w czasie rzeczywistym, klasyfikacja styli tanecznych piosenek, choreografia DSL i animacje sprite.

## Architektura

System obejmuje **21 plików** (~2450 linii) w 5 warstwach:

```
src/
 ├─ models/
 │   ├─ modelsAiVideo.ts              — 142 linii, typy 2D/3D detekcji
 │   └─ karaoke/modelsCommon.ts       — DanceStyle, SongDanceMatch
 │
 ├─ scripts/api/
 │   ├─ apiLibraryAiVideo.ts          — 73 linii, REST client (pose image/video/3D)
 │   └─ apiDance.ts                   — 99 linii, REST client + React Query hooks
 │
 ├─ components/controls/dance/
 │   ├─ PoseDetector.tsx              — 127 linii, harness detekcji na obrazie
 │   ├─ PoseTracker.tsx               — 109 linii, śledzenie pozy na wideo
 │   ├─ Pose3DLifter.tsx              — 130 linii, podnoszenie 2D→3D
 │   ├─ DanceClassificationPanel.tsx  — 210 linii, klasyfikacja styli tanecznych
 │   ├─ PoseCamGame/
 │   │   ├─ PoseCamGame.tsx           — 166 linii, gra kamerowa
 │   │   ├─ PoseCamGame.logic.ts      — 101 linii, normalizacja + porównanie
 │   │   └─ PoseCamGame.types.ts      — 34 linii
 │   └─ index.ts                      — 9 linii, barrel export
 │
 ├─ components/animations/
 │   ├─ choreoDSL.ts                  — 213 linii, choreography DSL
 │   ├─ animationHelper.ts            — 321 linii, 26 póz + animacje
 │   └─ rig/poseOps.ts               — 44 linii, blending/tweening
 │
 ├─ pages/party/
 │   └─ DancePage.tsx                 — 88 linii, tabbed UI (5 zakładek)
 │
 └─ __tests__/
     ├─ choreoDSL.test.ts            — 216 linii
     └─ animationHelper.test.ts      — 163 linii
```

## Silniki detekcji

```typescript
type PoseEngine = "mediapipe" | "openpose" | "alphapose" | "vitpose";
```

Wszystkie silniki działają po stronie serwera (.NET + Python). Frontend wysyła obraz/wideo, otrzymuje wynik z keypointami.

### API Endpoints

| Endpoint | Metoda | Wejście | Wynik |
|----------|--------|---------|-------|
| `/api/ai/video/pose/{engine}/image` | POST | JPEG/PNG (FormData) | `PoseDetectionResult` |
| `/api/ai/video/pose/{engine}/video` | POST | MP4 (FormData) | `Pose2DSequenceResult` |
| `/api/ai/video/pose3d` | POST | JSON sequence lub MP4 | `Pose3DSequenceResult` |
| `/api/dance/styles` | GET | — | `DanceStyle[]` |
| `/api/dance/song/{id}` | GET | — | `SongDanceMatch[]` |
| `/api/dance/classify?songId=` | GET | — | klasyf. wyniki |
| `/api/dance/analyze/{id}` | GET | — | `AudioAnalysisResult` |

## Modele danych

### PoseDetectionResult (single image)

```typescript
interface PoseDetectionResult {
  model: string;
  imageWidth: number;
  imageHeight: number;
  persons: PosePerson2D[];
}

interface PosePerson2D {
  keypointCount: number;
  keypoints: PoseKeypoint2D[];
}

interface PoseKeypoint2D {
  name: string;        // "nose", "left_shoulder", ...
  x: number;           // pixel coordinates
  y: number;
  confidence: number;  // 0–1
}
```

### Pose2DSequenceResult (video)

Wieloklatkowe dane: FPS, frame count, tablica `Pose2DFrame[]` (each z arrayem persons).

### Pose3DSequenceResult (3D lifting)

PoseFormer podnosi sekwencję 2D do 3D keypointów (x, y, z) — per frame per person.

### DanceStyle

```typescript
interface DanceStyle {
  id: number;
  name: string;
  bpmMin: number;
  bpmMax: number;
  timeSignature: string;
  energyMin: number;
  energyMax: number;
  valenceMin: number;
  valenceMax: number;
  rhythmPattern: string;
}
```

## Komponenty UI

### DancePage (route: `/party/dance`)

5 zakładek Bootstrap Tabs:
1. **Pose Game** — PoseCamGame
2. **Detect (2D)** — PoseDetector
3. **Track (Video)** — PoseTracker
4. **3D Lift** — Pose3DLifter
5. **Classify** — DanceClassificationPanel

### PoseDetector

- File picker: JPEG/PNG
- Selector silnika (4 opcje)
- Wywołanie `postPoseImage()` → rysowanie keypointów na canvas
- Split-panel: obraz + surowy JSON

### PoseTracker

- File picker: MP4
- Selector silnika
- Wywołanie `postPoseVideo()` → podsumowanie (model, FPS, klatki, osoby)
- Surowy JSON wyników

### Pose3DLifter

- Radio toggle: JSON sequence vs MP4
- Wywołanie `postPose3dFromSequence()` lub `postPose3dFromVideo()`
- Podsumowanie wyniku 3D

### DanceClassificationPanel

3 tryby:
- **Match** — istniejące dopasowania song↔dance
- **Classify** — ML klasyfikacja → style taneczne z pewność %
- **Analyze** — analiza audio (BPM, key, energy, danceability, valence)
- Rozwijalna lista referencji stylów z zakresami BPM

## PoseCamGame — gra kamerowa

Flagowy komponent interaktywny:

### Flow

1. Start kamery: `getUserMedia({ video: { width: 640, height: 480 } })`
2. Gracz zapisuje pozę docelową (klatka → backend inference → normalizacja → stored)
3. Pętla RAF z `targetFps` (domyślnie 5 FPS):
   - Przechwycenie klatki video → JPEG blob
   - `postPoseImage(engine, blob)` → `PoseDetectionResult`
   - `normalizePose(det)` → centered, unit-scale
   - `comparePoses(target, current)` → score 0–100
4. Lewy canvas: szkielet pozy docelowej
5. Prawy canvas: szkielet na żywo na wideo

### Algorytm porównania

```typescript
function comparePoses(a: NormalizedPose, b: NormalizedPose, distanceScale = 0.4): PoseSimilarity
```

Similarity scoring z exponential falloff:

$$\text{score} = 100 \cdot e^{-\bar{d}/s}$$

gdzie $\bar{d}$ = średnia znormalizowana odległość L2 wspólnych keypointów, $s$ = distanceScale.

### Normalizacja

`normalizePose(det)` — centruje na centroidzie bounding boxa, skaluje do unit-space. Niezależna od silnika.

### Rysowanie

- `drawPose(ctx, simplePose)` — cyan kółka keypointów na canvas
- `drawSavedPose(ctx, simplePose)` — styl dla zapisanej pozy
- `drawPoseOnCanvas(ctx, det)` — prosta wizualizacja

## Choreography DSL

System skryptowania animacji dla sprite (SVG AnimatedPerson):

### ChoreoBuilder — fluent API

```typescript
const dance = new ChoreoBuilder()
  .idle(500)
  .danceA(800)
  .danceB(800)
  .celebrate(1000)
  .compile(ctx);
```

Metody:
- `.pose(name, holdMs, options)` — krok animacji
- `.wait(ms)` — pauza
- `.label(name)` / `.goto(name)` / `.gotoIf(name, pred)` — kontrola przepływu
- `.tempo(multiplier)` — skalowanie czasów
- `.repeat(n)` / `.loop(n | Infinity)` — powtarzanie
- 20+ skrótów matching named poses

### Wzorce wykonania

| Funkcja | Opis |
|---------|------|
| `runSeq(fx, choreo, ctx)` | Sekwencyjne odtwarzanie (opcjonalnie w pętli) |
| `runWave(actors[], choreo, staggerMs)` | Równoległo z opóźnieniem stagger |
| `runCannon(actors[], choreo, staggerMs)` | Wave tam i z powrotem |
| `runRounds(actors[], programs[], staggerMs)` | Cykliczne przydzielanie programów |

### 26 nazwanych póz

`idle`, `raiseCard`, `happy`, `angry`, `disappointed`, `swearing`, `shouting`, `rock`, `danceA`, `danceB`, `danceC`, `hideDown`, `exitLeft`, `exitRight`, `enterFromLeft`, `enterFromRight`, `waveHand`, `facepalm`, `shrug`, `nodYes`, `shakeNo`, `pointRight`, `leanBack`, `jump`, `spin`, `celebrate`

### Rig Operations (poseOps.ts)

- `blendPose(a, b, t)` — interpolacja RigPose z `lerpAngle`
- `tweenPose(from, to, duration, easing)` — RAF-based interpolation
- Easing: `inOut`, `outCubic`, `inCubic`

## Testy

| Plik | Testy | Pokrycie |
|------|------:|----------|
| `choreoDSL.test.ts` | 216 linii | ChoreoBuilder API, compile, labels, goto/gotoIf, runSeq (loops + infinite), runWave, runCannon, runRounds |
| `animationHelper.test.ts` | 163 linii | Wszystkie 26 wariantów playPose, runChoreo multi-step |

## Zależności

| Biblioteka | Użycie |
|------------|--------|
| MediaPipe / OpenPose / AlphaPose / ViTPose | Backend AI engines |
| PoseFormer | Backend 3D lifting |
| framer-motion | Animacje sprite (AnimationControls) |
| @tanstack/react-query | React Query hooks (apiDance.ts) |
| Canvas 2D API | Wizualizacja keypointów |
| getUserMedia | Dostęp do webcam |

## Przepływ danych

```
DancePage.tsx (5 tabbed views)
       │
  ┌────┼────┬────────┬──────────┬──────────────┐
  ▼    ▼    ▼        ▼          ▼              ▼
PoseCam PoseDet PoseTrack Pose3DLifter DanceClassPanel
  │      │       │         │            │
  ▼      ▼       ▼         ▼            ▼
PoseCamGame   apiLibraryAiVideo.ts   apiDance.ts
  .logic.ts        │                    │
       │           ▼                    ▼
       └───► Backend REST API ◄────────┘
              /api/ai/video/*    /api/dance/*
                    │
           ┌───────┴───────┐
           │ AI Engine Pool│       Osobny subsystem:
           │ + PoseFormer  │       choreoDSL → animationHelper
           └───────────────┘             → framer-motion
```
