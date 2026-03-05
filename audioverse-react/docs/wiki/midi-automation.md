# MIDI i system automatyki

Kompletny system MIDI: dostęp do Web MIDI API, MIDI learn, nagrywanie/odtwarzanie automatyki CC, step sequencer, arpeggiator, LFO, draw tool, envelope follower, system makr, silnik artykulacji i interpolacja krzywych Beziera.

## Architektura

```
scripts/midi/
 ├─ useWebMidi.ts         — dostęp do Web MIDI API (102 linii)
 ├─ useMidiLearn.ts       — MIDI learn bindings (381 linii)
 ├─ useOxygen25.ts        — profil kontrolera Oxygen25
 ├─ oxygen25Profile.ts    — mapowanie CC dla Oxygen25
 └─ midiSeedGenerator.ts  — generator podkładów MIDI

utils/
 ├─ ccAutomation.ts       — silnik automatyki CC (203 linii)
 ├─ stepSequencer.ts      — step sequencer (228 linii)
 ├─ arpeggiator.ts        — arpeggiator (189 linii)
 ├─ lfoEngine.ts          — silnik LFO (199 linii)
 ├─ drawTool.ts           — narzędzie rysowania (198 linii, 5 trybów)
 ├─ envelopeFollower.ts   — follower obwiedni (144 linii)
 ├─ macroSystem.ts        — system makr/modulacji (341 linii)
 ├─ articulationEngine.ts — silnik artykulacji (309 linii)
 ├─ bezierCurve.ts        — krzywe Beziera (186 linii)
 ├─ chordScale.ts         — detekcja akordów/skal (237 linii)
 ├─ grooveTemplates.ts    — szablony groove
 └─ audioMidiUtils.ts     — narzędzia konwersji MIDI

hooks/
 ├─ useCCAutomation.ts    — hook automatyki CC (275 linii)
 └─ useStepSequencer.ts   — hook step sequencera
```

## Web MIDI API

`useWebMidi.ts` (102 linii) zapewnia dostęp do Web MIDI API:
- Enumeracja podłączonych urządzeń MIDI
- Nasłuchiwanie wiadomości MIDI (Note On/Off, CC, Pitch Bend, Aftertouch)
- Dynamiczne odświeżanie po podłączeniu/odłączeniu urządzenia

## MIDI Learn

`useMidiLearn.ts` (381 linii) — system przypisywania kontrolerów MIDI do parametrów:
- **Typy bindingów**: CC, Note, Pitch Bend, Aftertouch
- **Tryb nauki**: kliknij parametr → przesuń kontroler → binding zapisany
- **Persystencja**: bindingi zapisywane w localStorage
- **Multi-binding**: wiele kontrolerów do jednego parametru

```typescript
interface MidiBinding {
  type: 'cc' | 'note' | 'pitchBend' | 'aftertouch';
  channel: number;
  ccNumber?: number;
  noteNumber?: number;
  paramId: string;
  min: number;
  max: number;
}
```

## Automatyka CC

### Nagrywanie i odtwarzanie

`ccAutomation.ts` (203 linii) + `useCCAutomation.ts` (275 linii):
- `recordCCEvent()` — nagrywanie zdarzeń CC w czasie rzeczywistym
- `copyCCEvents()` / `pasteCCEvents()` / `cutCCEvents()` — schowek
- `exportCCLane()` / `importCCLane()` — JSON I/O
- Historia undo/redo (`CCHistoryState` z pushCCState/undoCC/redoCC)

### Typy uchwytów interpolacji

`MidiCCEvent.handleType`:
- **linear** — interpolacja liniowa między punktami
- **step** — skok wartości
- **exp** — krzywa wykładnicza

### Odtwarzanie w silniku

`audioPlaybackEngine.ts` harmonogramuje zdarzenia CC podczas odtwarzania:
- Interpolacja 20 Hz (co 50 ms)
- Obsługa Pitch Bend i Aftertouch
- Multi-lane (wiele ścieżek CC równocześnie)

## Step Sequencer

`stepSequencer.ts` (228 linii) + `StepSequencerPanel.tsx`:
- Siatka kroków z velocity per krok
- Operacje na wzorcach: shift, reverse, transpose, randomize
- Transport: play/pause/stop/reset
- Integracja z LFO (modulacja parametrów)
- Hook `useStepSequencer.ts` z harmonogramowaniem odtwarzania

## Arpeggiator

`arpeggiator.ts` (189 linii) + `ArpeggiatorPanel.tsx`:

7 trybów arpeggiatora:
1. **Up** — w górę
2. **Down** — w dół
3. **UpDown** — w górę i w dół
4. **DownUp** — w dół i w górę
5. **Random** — losowo
6. **Order** — w kolejności naciśnięcia
7. **Chord** — jako akord

Parametry: oktawy, rate, gate, swing, latch.

## LFO (Low Frequency Oscillator)

`lfoEngine.ts` (199 linii) + `LFOPanel.tsx`:

6 kształtów fali:
- Sine, Triangle, Square, Sawtooth, Random (S&H), Custom

Parametry: częstotliwość, głębokość, faza, sync z BPM.
Canvas preview wizualizuje aktualny kształt fali.

## Draw Tool

`drawTool.ts` (198 linii) — 5 trybów rysowania automatyki:
1. **Pencil** — rysowanie odręczne
2. **Line** — segmenty liniowe
3. **Curve** — krzywe Beziera
4. **Step** — schody (skok wartości)
5. **Ramp** — rampa liniowa

Zintegrowane w `CCAutomationLaneEditor.tsx`.

## Envelope Follower

`envelopeFollower.ts` (144 linii):
- Analyse sygnału audio w czasie rzeczywistym
- Generowanie obwiedni (attack/release)
- Mapowanie obwiedni na parametry CC

## System makr i modulacji

`macroSystem.ts` (341 linii):
- **Matryca modulacji** — dowolne źródło → dowolny cel z głębokością
- **Modulator LFO** — LFO jako źródło modulacji
- **Macro knobs** — konfigurowalne pokrętła mapujące na wiele parametrów
- Routing: LFO → CC, Envelope → CC, Macro → wiele CC

## Silnik artykulacji

`articulationEngine.ts` (309 linii) — 6 typów artykulacji:
1. **Legato** — płynne przejścia między nutami
2. **Staccato** — krótkie, oderwane nuty
3. **Accent** — podkreślenie ataków
4. **Glide** — portamento między nutami
5. **Portamento** — pełne przesunięcie pitch
6. **Tremolo** — szybka powtarzalność

Każdy typ generuje odpowiednie zdarzenia CC.

## Krzywe Beziera

`bezierCurve.ts` (186 linii):
- `cubicBezier()` — ewaluacja punktu na krzywej
- `sampleBezierCurve()` — próbkowanie krzywej na N punktów
- `bezierToSVGPath()` — konwersja do ścieżki SVG
- `buildBezierSegments()` — budowanie segmentów z punktów kontrolnych
- `interpolateBezierCC()` — interpolacja wartości CC po krzywej Beziera

## Akordy i skale

`chordScale.ts` (237 linii):
- Detekcja akordów z zestawu nut
- Identyfikacja skali
- Generowanie progresji harmonicznych
- Transpozycja do dowolnej tonacji

## Panele UI w edytorze

Widoczne w trybach **Expert** i **Master** (flaga `showMidiAutomation`):

| Panel | Opis |
|---|---|
| `CCAutomationLaneEditor.tsx` | Canvas editor lane CC z 5 trybami rysowania, LFO, undo/redo, export/import |
| `StepSequencerPanel.tsx` | Siatka kroków z velocity, operacje na wzorcach, transport |
| `ArpeggiatorPanel.tsx` | 7 trybów, octave/rate/gate/swing/latch |
| `LFOPanel.tsx` | 6 kształtów fali, canvas preview, sync BPM |

## Profil Oxygen25

`oxygen25Profile.ts` — predefiniowane mapowanie kontrolera M-Audio Oxygen25:
- Pokrętła → CC parametrów
- Klawisze → nuty
- Fader → volume/expression
