# Tuning Harness — narzędzie kalibracji scoringu

Narzędzie deweloperskie/QA do kalibracji scoringu karaoke: import fixture JSON, interaktywne slidery parametrów, natychmiastowe re-scoring, tabele sweep presetów trudności, heatmapa segmentacji (canvas pitch×time), eksport CSV/JSON, historia telemetrii z podświetlaniem najlepszego wyniku i eksport fixture z sesji live.

## Architektura

```
pages/
 └─ TuningHarnessPage.tsx     — główna strona narzędzia

utils/
 └─ karaokeScoring.ts          — silnik scoringu

constants/
 └─ karaokeScoringConfig.ts    — konfiguracja presetów
```

## Ekran główny

`TuningHarnessPage.tsx` — kompleksowe narzędzie z wieloma sekcjami:

### 1. Import fixture

Wczytywanie danych testowych w formacie JSON:

```typescript
interface ScoringFixture {
  notes: UltraStarNote[];        // nuty z pliku UltraStar
  pitchPoints: PitchPoint[];     // punkty pitch z nagrywania
  metadata?: {
    songTitle?: string;
    bpm?: number;
    gap?: number;
  };
}
```

Wbudowany generator demo fixture (10 nut, auto pitch points).

### 2. Interaktywne slidery parametrów

| Parametr | Zakres | Opis |
|---|---|---|
| `semitoneTolerance` | 0–12 | Tolerancja w półtonach |
| `preWindow` | 0–5 s | Okno przed nutą |
| `postExtra` | 0–5 s | Dodatkowy czas po nucie |
| `difficultyMult` | 0.5–2 | Mnożnik trudności |
| `completionBonus` | 0–100% | Bonus za ukończenie |
| `goldFullBonus` | 0–200% | Bonus za pełne złote nuty |

Instant re-score — zmiana slidera natychmiast przelicza wynik.

### 3. Preset sweep

Tabela porównawcza 3 presetów trudności:

| Preset | Tolerance | PreWindow | DiffMult |
|---|---|---|---|
| Easy | 3 | 0.3 s | 0.7 |
| Normal | 2 | 0.15 s | 1.0 |
| Hard | 1 | 0.05 s | 1.3 |

Automatyczny sweep: każdy preset obliczny z tymi samymi danymi.
Eksport sweep CSV — porównanie wyników wszystkich presetów.

### 4. Heatmapa segmentacji

Canvas-based wizualizacja pitch×time:
- Oś X: czas (sekundy)
- Oś Y: pitch (MIDI note number)
- Kolor: stosunek trafienia (czerwony→żółty→zielony)
- Złote nuty: glow effect
- Pitch points: kropki na heatmapie
- Legenda kolorów

### 5. Tabela per-note

Szczegółowa tabela dla każdej nuty:
- Numer, typ (normal/golden/freestyle)
- Pitch oczekiwany vs. trafiony
- Frakcja trafienia (progress bar)
- Wynik cząstkowy
- Status (hit/miss/partial)

### 6. Wyniki

Sekcja wyników:
- **Total score** — łączny wynik (0-10000)
- **Combo stats** — max combo, current combo, combo multiplier
- **Verse ratings** — ocena per wers (Awful/Poor/OK/Good/Great/Perfect)
- **Gold note stats** — ile złotych nut trafionych
- **Accuracy** — % trafień

## Offset slider

Slider -500..+500 ms (krok 5 ms):
- `shiftedPoints` — useMemo przesuwający `PitchPoint.t` o `offsetMs/1000`
- Stosowany w interactive scoring, preset sweep i heatmap pitch dots
- Symulacja różnych opóźnień mikrofonu

### Auto-find best offset

Przycisk "Auto-find best offset":
1. Coarse sweep: -500..+500 ms co 10 ms
2. Znajdź najlepszy wynik
3. Fine sweep: ±50 ms wokół najlepszego co 1 ms
4. Ustaw offset na maksymalny total score

## Historia telemetrii

localStorage history z tabelą porównawczą:
- Zapisywanie wyników z parametrami
- Tabela: data, parametry, wynik, accuracy
- Podświetlanie najlepszego wyniku
- Save/delete/clear

## Eksport

### Z TuningHarnessPage

| Format | Zawartość |
|---|---|
| JSON | Pełny wynik + parametry |
| CSV | Per-note detail (note, pitch, fraction, score) |
| Sweep CSV | Porównanie wszystkich presetów |

### Z live sesji karaoke

`exportFixtureBundle()` w `useKaraokeManager`:
- Download notes + pitch points z aktualnej sesji
- Format fixture JSON kompatybilny z harnessem
- Pozwala na offline replay i kalibrację

## Testy

### karaokeScoring.comprehensive.spec.ts (48 testów)

| Moduł | Testy | Opis |
|---|---|---|
| `getVerseRatingLabel` | 14 | Mapowanie score→label |
| `getComboMultiplier` | 12 | Mnożnik combo |
| `scoreNotesWithPitchPoints` | 12 | Główna funkcja scoringu |
| `buildNoteDescriptors` | 3 | Budowanie deskryptorów nut |
| `buildSegmentScores` | 2 | Budowanie wyników segmentów |
| `downsampleAndQuantizePitchPoints` | 4 | Downsampling pitch points |

### karaokeScoring.regression.test.ts (11 testów)

- Determinizm (te same dane → ten sam wynik)
- Combo poprawność
- Verse ratings
- Offset degradation (gorszy wynik przy większym offset)
- Difficulty presets (easy > normal > hard)

### Fixture bundles

- `simple-scale.fixture.json` — 8 nut, pełne pokrycie
- `partial-hits.fixture.json` — 6 nut, 2 bez pitch (test partial scoring)

## Routing

| Ścieżka | Komponent |
|---|---|
| `/tuning-harness` | `TuningHarnessPage.tsx` |
