# DMX Lighting Control

Edytor oświetlenia DMX-512 do sterowania światłami scenicznymi podczas sesji karaoke i muzycznych. Obsługuje urządzenia FTDI USB, sceny, sekwencje, tryb beat-reactive i polling stanu co 500 ms.

## Architektura

```
components/controls/dmx/
 ├─ DmxEditor.tsx              — 259 linii, główny panel kontrolny
 └─ DmxChannelControls.tsx     — 211 linii, kontrolki per-kanał

scripts/api/
 └─ apiDmx.ts                  — 338 linii, warstwa API z React Query

models/
 └─ modelsDmx.ts               — 92 linii, typy i interfejsy

pages/dmx/
 ├─ DmxEditorPage.tsx           — strona edytora
 └─ DmxProjectsPage.tsx         — lista projektów DMX
```

## Modele danych

```typescript
interface DmxStateDto {
  fps: number;
  startCode: number;
  frontSnapshot: number[];  // 513 wartości (start code + 512 kanałów)
}

enum DmxChannelType {
  Unknown,
  Dimmer,
  DimmerWithOff,
  RotationWithOff,
  RotationWithOffAndCcw,
  Options
}

interface DmxDeviceChannelInfo {
  name: string;
  type: DmxChannelType;
  segments?: DmxSegment[];
  groups?: string[];
  invert?: boolean;
}

interface DmxDeviceInfo {
  manufacturer: string;
  model: string;
  modeName: string;
  footprint: number;           // liczba kanałów urządzenia
  channels: DmxDeviceChannelInfo[];
}

interface FtdiDeviceDto {
  serialNumber: string;
  description: string;
  deviceInfo?: DmxDeviceInfo;  // embedded metadata urządzenia
}
```

### Sceny i sekwencje

```typescript
interface DmxScene {
  id: number;
  name: string;
  values: number[];    // snapshot 512 kanałów
}

interface DmxSceneStep {
  sceneId: number;
  holdTime: number;    // ms trzymania sceny
  fadeTime: number;     // ms przejścia do następnej
}

interface DmxSceneSequence {
  id: number;
  name: string;
  steps: DmxSceneStep[];
  loop: boolean;
}
```

## DmxEditor

`DmxEditor.tsx` (259 linii) — główny panel kontrolny:
- **Selektor urządzeń** — lista wykrytych interfejsów USB FTDI
- **Port open/close** — otwieranie/zamykanie połączenia
- **FPS / Start Code** — konfiguracja parametrów DMX
- **Kanały** — per-kanał `DmxChannelControl` widgety
- **Blackout** — natychmiastowe wyłączenie wszystkich kanałów

## DmxChannelControls

`DmxChannelControls.tsx` (211 linii) — kontrolki kanałów:

| Typ kanału | Kontrolka |
|---|---|
| Dimmer | Slider 0-255 |
| DimmerWithOff | Slider + przycisk Off |
| RotationWithOff | Slider prędkości + kierunek + Off |
| RotationWithOffAndCcw | jw + przeciwny ruch |
| Options | Selektor segmentów |

Segmenty definiują zakresy wartości (np. 0-10 = Off, 11-100 = Gobo1, 101-200 = Gobo2).

## API z React Query

| Operacja | Fetcher | Hook |
|---|---|---|
| Stan DMX | `fetchDmxState` | `useDmxStateQuery` (polling 500ms) |
| Urządzenia | `fetchFtdiDevices` | `useFtdiDevicesQuery` (staleTime 5min) |
| Port open | `postOpenDmxPort` | `useOpenDmxPortMutation` |
| Port close | `postCloseDmxPort` | `useCloseDmxPortMutation` |
| Konfiguracja | `postConfigureDmx(fps, startCode)` | `useConfigureDmxMutation` |
| Kanał | `putDmxChannel(ch, value)` | `useSetDmxChannelMutation` |
| Universe | `putDmxUniverse(values[512])` | `useLoadDmxUniverseMutation` |
| Blackout | `postBlackout` | `useBlackoutDmxMutation` |
| Sceny CRUD | `fetchScenes`, `postCreateScene`, `deleteScene` | odpowiednie hooks |
| Apply sceny | `postApplyScene` | `useApplySceneMutation` |
| Sekwencje | `fetchSequences`, `postCreateSequence`, `deleteSequence` | hooks |
| Run sekwencji | `postRunSequence` | `useRunSequenceMutation` |
| Beat start | `postBeatReactiveStart` | `useBeatReactiveStartMutation` |
| Beat tap | `postBeatTap` | `useBeatTapMutation` |

### Optimistic updates

Mutacje kanału, universe, konfiguracji i blackout optymistycznie aktualizują cache React Query i robią rollback w razie błędu.

## Tryb Beat-Reactive

Synchronizacja oświetlenia z muzyką:

```typescript
interface BeatReactiveRequest {
  bpm: number;
  channels: number[];
  intensity: number;
}

interface BeatTapRequest {
  timestamp: number;
}
```

- **BPM** — ręczne ustawienie lub tap-tempo
- **Kanały** — które kanały reagują na beat
- **Intensywność** — siła efektu

## Scene/Sequence system

1. **Zapisz scenę** — snapshot aktualnych wartości 512 kanałów
2. **Apply scenę** — wgraj zapisaną scenę
3. **Twórz sekwencje** — łącz sceny z hold/fade timingami
4. **Uruchom sekwencję** — automatyczne przejścia między scenami
5. **Loop** — opcjonalne zapętlenie sekwencji

## FTDI Auto-Detect

Zapytanie hardware o podłączone interfejsy USB DMX:
- Serial number, opis
- Embedded fixture metadata (producent, model, tryb, footprint)
- Automatyczne mapowanie kanałów na kontrolki

## Routing

| Ścieżka | Komponent |
|---|---|
| `/dmx-editor` | `DmxEditorPage.tsx` |
| `/dmx-projects` | `DmxProjectsPage.tsx` |
