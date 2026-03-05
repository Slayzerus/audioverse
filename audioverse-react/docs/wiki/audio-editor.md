# Audio Editor (DAW)

Wielościeżkowy edytor audio z timeline'em, warstwami, piano rollem, edycją klipów, wyświetlaniem waveform, minimapą, zarządzaniem projektami/sekcjami, trybami wyświetlania i łańcuchem FX. Główna funkcja DAW w AudioVerse.

## Architektura

```
components/controls/editor/
 ├─ AudioEditor.tsx              — główny komponent edytora (252 linii po dekompozycji)
 ├─ useAudioEditor.ts            — hook z całą logiką (1016 linii)
 ├─ AudioTimeline.tsx            — canvas timeline
 ├─ AudioTimelineContainer.tsx   — kontener z scroll/zoom
 ├─ PianoRoll.tsx                — piano roll MIDI
 ├─ AudioEditorPianoRoll.tsx     — integracja piano roll z edytorem
 ├─ AudioLayerDetails.tsx        — szczegóły warstwy
 ├─ AudioMiniMap.tsx             — nawigacyjna minimapa
 ├─ Waveform.tsx                 — wizualizacja fali audio
 ├─ editorDisplayModes.ts        — 17 flag widoczności × 5 trybów
 ├─ panels/                      — panele boczne
 │   ├─ ProjectPanel.tsx         — zarządzanie projektem
 │   ├─ SectionPanel.tsx         — sekcje utworu
 │   ├─ AdvancedEditingPanel.tsx — zaawansowana edycja
 │   ├─ ClipOperationsPanel.tsx  — operacje na klipach
 │   ├─ LayerTrack.tsx           — ścieżka warstwy
 │   ├─ EditorPanels.tsx         — AutoSave, UndoRedo, ZoomSnap, MasterFX, Recording
 │   ├─ DisplayModeSelector.tsx  — przełącznik trybów
 │   ├─ CCAutomationLaneEditor.tsx — automatyka CC
 │   ├─ StepSequencerPanel.tsx   — step sequencer
 │   ├─ ArpeggiatorPanel.tsx     — arpeggiator
 │   └─ LFOPanel.tsx             — LFO
 ├─ hooks/
 │   ├─ useAutoSave.ts           — automatyczny zapis
 │   ├─ usePlaybackEngine.ts     — silnik odtwarzania
 │   ├─ useProjectCRUD.ts        — CRUD projektów
 │   └─ useRecording.ts          — nagrywanie audio
 └─ nav/
     ├─ AudioLayersNav.tsx       — nawigacja warstw
     ├─ AudioProjectSectionNav.tsx — nawigacja sekcji
     ├─ AudioTimelineNav.tsx     — nawigacja timeline
     └─ SaveLoadControls.tsx     — zapis/odczyt
```

## Tryby wyświetlania (5 poziomów)

`editorDisplayModes.ts` definiuje 17 flag widoczności zarządzanych przez 5 trybów:

| Tryb | Widoczne elementy |
|---|---|
| **Fun** | Tylko odtwarzanie, timeline, podstawowe kontrolki |
| **Beginner** | + warstwy, zoom, minimapa |
| **Mid** | + sekcje, efekty, nagrywanie |
| **Expert** | + piano roll, zaawansowana edycja, MIDI automatyka |
| **Master** | Wszystko: pełna automatyka CC, step sequencer, arpeggiator, LFO |

Flagi: `showTimeline`, `showLayers`, `showZoom`, `showMiniMap`, `showSections`, `showFx`, `showRecording`, `showPianoRoll`, `showAdvancedEditing`, `showClipOps`, `showAutoSave`, `showUndoRedo`, `showMasterFx`, `showProject`, `showSaveLoad`, `showMidiAutomation`, `showDisplayMode`.

## Hook `useAudioEditor` (1016 linii)

Centralny hook zawierający pełną logikę edytora:
- **Stan projektu** — warstwy, klipy, zaznaczenie, pozycja odtwarzania
- **Operacje na klipach** — wycinanie, kopiowanie, wklejanie, przesuwanie, resize
- **Timeline** — zoom, scroll, snap, markery, loop region
- **Odtwarzanie** — play/pause/stop, pozycja, tempo, loop
- **Nagrywanie** — arm track, input monitoring, punch-in/out
- **Undo/Redo** — historia operacji z snapshot'ami stanu
- **Efekty** — łańcuch FX per warstwa, master FX bus

## Silnik odtwarzania

`audioPlaybackEngine.ts` zarządza odtwarzaniem multitrack z Web Audio API:
- Harmonogramowanie klipów audio na timeline
- Automatyka CC z interpolacją 20 Hz (linear/step/exp)
- Obsługa Pitch Bend, Aftertouch
- Sync z timeline edytora

## Tutorial

8-krokowy guided tour (`tutorialDefinitions.ts`):
1. Powitanie
2. Tryb wyświetlania
3. Transport
4. Warstwy
5. Zoom
6. Nagrywanie
7. Zapis
8. Skróty klawiszowe

Auto-launch przy pierwszej wizycie. Przycisk `?` w prawym dolnym rogu. `TutorialOverlay.tsx` ze spotlight i nawigacją klawiaturową.

## Karaoke Editor

Osobny edytor plików UltraStar (szczegóły na stronie [karaoke-editor.md](karaoke-editor.md)):
- `EditorShell.tsx` — 4 zakładki (Audio, Notes, Text, Export)
- Ekstrakcja metadanych + Spotify lookup
- Separacja stemów (Demucs)
- Piano roll z drag/resize/snap
- Monaco Editor z walidacją UltraStar

## Seed podkładów demo

`MidiSeedDemo.tsx` + `midiSeedGenerator.ts`:
- Generowanie wielowarstwowych podkładów (melodia, bas, akordy, perkusja)
- Konfigurowalna skala, progresja harmoniczna, wzorce
- Mini piano-roll preview
- Import do edytora via `handleSeedImport`

## Routing

- `/audio-editor` — `AudioEditorPage.tsx`
- `/karaoke-editor` — `KaraokeEditorPage.tsx`
- `/karaoke-editor/:songIdParam` — edycja istniejącej piosenki
