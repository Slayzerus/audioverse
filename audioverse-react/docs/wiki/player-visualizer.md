# Odtwarzacz muzyki i wizualizery

Uniwersalny odtwarzacz muzyki z obsługą YouTube, HLS i plików audio, 22 trybami wizualizacji opartymi na Canvas, przełącznikiem trybów, nakładką VU metera, wyświetlaniem okładek i listami utworów.

## Architektura

```
components/controls/player/
 ├─ GenericPlayer.tsx              — 727 linii, główny komponent
 ├─ GenericPlayerControls.tsx      — kontrolki (play/pause, volume, time)
 ├─ GenericPlayerStage.tsx         — scena (video/canvas/cover)
 ├─ GenericPlayerStageVisualizer.tsx — integracja wizualizera ze sceną
 ├─ GenericPlayerTrackList.tsx     — lista utworów
 ├─ YouTubePlayer.tsx             — wrapper react-youtube
 └─ visualizer/
     ├─ StageVisualizer.tsx        — 292 linii, canvas + AnalyserNode
     ├─ ModeSwitcher.tsx           — przełącznik trybów
     ├─ VuOverlay.tsx              — nakładka VU metera
     ├─ types.ts                   — typy trybów
     ├─ useLocalStorageState.ts    — persystencja trybu
     └─ modes/                     — 21 plików draw functions
         ├─ BarsMode.ts
         ├─ WaveformMode.ts
         ├─ SpectrumMode.ts
         ├─ StarfieldMode.ts
         ├─ LavaLampMode.ts
         ├─ ParticlesMode.ts
         ├─ PlasmaBallMode.ts
         ├─ RingsMode.ts
         ├─ NeonTrianglesMode.ts
         ├─ BlobFlowMode.ts
         ├─ ColorRipplesMode.ts
         ├─ CozyFireplaceMode.ts
         ├─ CoverMode.tsx
         ├─ EqualizerCircleMode.ts
         ├─ GridMode.ts
         ├─ ImageTornadoMode.ts
         ├─ OrbitalsMode.ts
         ├─ PaletteMode.ts
         ├─ RadialMode.ts
         ├─ RaysMode.ts
         └─ RiftMode.ts
```

## GenericPlayer

`GenericPlayer.tsx` (727 linii) — główny komponent odtwarzacza:

### Typy źródeł

```typescript
type PlayerSourceKind = 'youtube' | 'hls' | 'audio';

interface PlayerSource {
  kind: PlayerSourceKind;
  url: string;
}
```

Priorytet wyboru źródła (`pickBestSource()`): YouTube → HLS → plik audio.

### Tryby UI

5 trybów interfejsu:
- **progressOnly** — tylko pasek postępu
- **minimal** — pasek + volume
- **compact** — kompaktowy z miniaturą
- **full** — pełny widok ze sceną i wizualizerem
- **nobuttons** — tylko wizualizacja bez kontrolek

### API imperatywne

```typescript
interface GenericPlayerExternal {
  play(): void;
  pause(): void;
  toggle(): void;
  seekTo(seconds: number): void;
  setVolume(value: number): void;
}
```

### Funkcje
- **CountdownOverlay** — odliczanie 3..2..1 przed auto-play (`countdownSeconds` prop)
- **AudioActivationOverlay** — wymuszenie interakcji użytkownika dla AudioContext
- **HLS.js** — streaming audio/video przez HTTP Live Streaming
- **Lista utworów** — multi-track playlist z `GenericPlayerTrackList`

## Wizualizery (22 tryby)

`StageVisualizer.tsx` (292 linii) — silnik wizualizacji:
- Tworzy `AnalyserNode` z Web Audio API
- `requestAnimationFrame` loop kierujący do aktywnego trybu
- HiDPI support (skalowanie `devicePixelRatio`)
- Dane: FFT częstotliwości (`getByteFrequencyData`) lub domena czasu (`getByteTimeDomainData`)

### Dostępne tryby

| Tryb | Opis |
|---|---|
| `video` | Natywne video/YouTube |
| `cover` | Wyświetlanie okładki albumu |
| `bars` | Klasyczne słupki częstotliwości |
| `waveform` | Przebieg fali w czasie |
| `spectrum` | Widmo częstotliwości z gradientem |
| `palette` | Animowana paleta kolorów |
| `radial` | Okrągły wizualizer |
| `rays` | Promienie z centrum |
| `particles` | System cząsteczek reagujących na muzykę |
| `rings` | Koncentryczne pierścienie |
| `grid` | Siatka 3D z perspektywą |
| `imageTornado` | Tornado z obrazków (okładki) |
| `colorRipples` | Fale kolorów |
| `starfield` | Pole gwiazd z prędkością zależną od głośności |
| `orbitals` | Orbitale atomowe |
| `eqcircle` | Equalizer kołowy |
| `triangles` | Neonowe trójkąty |
| `blob` | Organiczna masa reagująca na dźwięk |
| `plasma` | Kula plazmy |
| `lavaLamp` | Lampa lawowa |
| `cozyFire` | Przytulny kominek |
| `rift` | Ryft czasoprzestrzenny |

### Tryby stanowe

Złożone tryby (ImageTornado, Starfield, LavaLamp, CozyFireplace, NeonTriangles, BlobFlow) utrzymują per-mode refs z tablicami cząsteczek/stanu.

### VU Meter

`VuOverlay.tsx` — nakładka VU metera:
- Obliczanie RMS z danych audio
- Analogowy wskaźnik poziomu
- Stereo L/R
- Responsywne renderowanie

## Serwisy odtwarzania

| Serwis | Opis |
|---|---|
| `PlayerService.ts` | Kolejka odtwarzania, shuffle, repeat |
| `ProfilePlayerService.ts` | Profil użytkownika — ulubione, historia |

## Routing

| Ścieżka | Komponent |
|---|---|
| `/music-player` | `MusicPlayerPage.tsx` |
