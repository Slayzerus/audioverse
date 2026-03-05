# Karaoke Timeline — pipeline renderowania

Deep-dive w canvas-based pipeline renderowania timeline karaoke: rysowanie pasków nut, paint trails, animacje kulki (4 tryby), złote cząsteczki, warstwy per-player, exponential smoothing, integracja glossy bar, renderowanie tekstur/wzorów, hit flash overlays i pełny pipeline `drawTimeline()`.

## Architektura

```
scripts/karaoke/
 ├─ karaokeTimeline.ts         — ~1037 linii, pipeline renderowania
 ├─ karaokeAnimations.ts       — 4 strategie animacji
 ├─ glossyBarRenderer.ts       — 822 linii, renderer pasków
 ├─ textureCatalog.ts          — katalog 280 tekstur
 ├─ textureCache.ts            — async cache CanvasPattern
 └─ fontCatalog.ts             — katalog czcionek

components/controls/karaoke/
 └─ KaraokeTimeline.tsx         — 283 linii, komponent React
```

## Pipeline `drawTimeline()`

Główna funkcja renderowania wywoływana w `requestAnimationFrame` loop:

### Parametry

```typescript
function drawTimeline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  notes: UltraStarNote[],
  currentTime: number,
  pitchPoints: PitchPoint[],
  playerBgColor: string,
  playerId: string,
  score: number,
  combo: number,
  hitSegments: HitSegment[],
  animationMode: AnimationMode,
  barStyle?: PlayerBarStyle,
  fontFamily?: string
): void
```

### Kolejność renderowania

1. **Clear canvas** — czyszczenie tła
2. **Oblicz mapowanie czasu→piksele** — zakres widoczny + marginesy
3. **Exponential smoothing** — `panSmooth += (panTarget - panSmooth) * 0.12`
4. **Rysuj puste paski nut** — szare/przezroczyste prostokąty
5. **Rysuj złote nuty** — `#B8860B` fill + `#FFD700` stroke (lub glossy bar)
6. **Rysuj trafione segmenty** — kolory per-accuracy + hit flash overlay
7. **Rysuj paint trail** — ślad kulki z `globalAlpha` fading
8. **Rysuj kulkę** — w `playerBgColor`, ciągły ruch
9. **Rysuj cząsteczki** — gold particle bursts przy trafieniach
10. **Rysuj pitch overlay** — linia pitch gracza (jeśli aktywne)
11. **Rysuj wynik i combo** — tekst z cieniem

## Exponential Smoothing

Płynne przewijanie timeline:

```typescript
// W każdej klatce
panSmooth += (panTarget - panSmooth) * smoothingFactor;
// smoothingFactor = 0.12 — kompromis między responsywnością a płynnością
```

- `panTarget` — aktualna pozycja czasu
- `panSmooth` — wygładzona pozycja (renderowana)
- Eliminuje skoki przy aktualizacji czasu

## Mapowanie czasu→piksele

```typescript
const pixelsPerBeat = width / visibleBeats;
const noteX = (noteStart - viewStart) * pixelsPerBeat;
const noteW = noteDuration * pixelsPerBeat;
const noteY = pitchToY(notePitch, height);
```

`widthMultiplier = 2 / Math.max(1, playerCount)` — dla 1 gracza timeline jest 2× szerszy.

## Warstwy per-player

Każdy gracz ma własną warstwę na jednym canvas:
- `playerBgColor` — unikalny kolor tła/elementów
- Osobne pitch points i hit segments
- Kulka w kolorze gracza

## Animacja kulki (4 strategie)

`karaokeAnimations.ts` — strategy pattern z 4 trybami:

### Ball & Trail (domyślny)
- Kulka podąża za aktualną pozycją czasu
- Zostawia ślad (paint trail) z malejącym `globalAlpha`
- Zamalowuje szare paski i zostawia kolor

### Wipe
- Efekt „ścierania" od lewej do prawej
- Gradient przenikania na krawędzi

### Pulse
- Kulka pulsuje w rytm muzyki
- Rozmiar zależy od RMS audio
- Efekt glow

### Bounce
- Kulka odbija się między nutami
- Fizyka: grawitacja + elastic bounce
- Trailing particles

## Animacja trafień

Segmenty trafione kolorowane wg dokładności:
- **Perfect** — jasny kolor gracza + sparkle
- **Good** — standardowy kolor gracza
- **Bad** — przytłumiony kolor

Hit flash overlay — krótki biały flash na trafionej nucie.

## Złote cząsteczki

`drawParticles()` — system particle effects:
- Burst przy trafieniu złotej nuty
- Kolor: złoty (#FFD700)
- Fizyka: velocity + gravity + fade
- Limit: max N aktywnych cząsteczek

## Integracja Glossy Bar

Zastąpienie standardowego `create3dGradient + roundRect` przez `drawGlossyBarOnCanvas`:
- Złote nuty → glossy bar z PlayerBarStyle
- Trafione segmenty → glossy bar z kolorem gracza
- Puste belki → glossy bar z empty style
- `barStyle?: PlayerBarStyle` param w `drawTimeline()`

### Renderowanie glossy bar na canvas

```typescript
drawGlossyBarOnCanvas(
  ctx,
  x, y, width, height,
  {
    capLeft, capRight,      // kształty czapek
    pattern,                // wzór overlay
    patternColor,           // kolor wzoru
    highlight, glow,        // intensywność efektów
    emptyGlass,             // przezroczystość pustego bara
    patternOnly,            // flat mode bez 3D
    textureId,              // ID tekstury
    textureScale            // skala tekstury
  }
);
```

## Renderowanie tekstur

Tekstury z `textureCatalog.ts`:
- Ładowane asynchronicznie przez `textureCache.ts`
- Konwertowane na `CanvasPattern`
- Skalowane z `DOMMatrix`
- Oddzielne tekstury dla filled/empty barów
- Preload w `KaraokeManager.tsx`

## Wynik i combo

Tekst renderowany z cieniem na canvas:
- **Score** — prawy górny róg
- **Combo** — pod score, z mnożnikiem
- Font z `fontCatalog.ts` (parametryzowany, 6 miejsc w kodzie)

## KaraokeTimeline.tsx

Komponent React (283 linii):
- Zarządza canvas ref i RAF loop
- Odbiera props z `KaraokeManager.tsx`
- Przekazuje `barStyle`, `animationMode`, `fontFamily` do `drawTimeline()`
- HiDPI support (`devicePixelRatio`)
- Resize observer
- `aria-label` + `role="img"` (a11y)
