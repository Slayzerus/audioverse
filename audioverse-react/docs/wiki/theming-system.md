# System motywów i personalizacji

Silnik motywów z pełnymi/seeded typami, rejestr i katalog motywów, przełącznik jasny/ciemny, ustawienia wyświetlania karaoke (presety gradientów, wybór czcionek, tryby animacji), renderer Glossy Bar (kształty czapek, wzory overlay, katalog tekstur), persystencja styli per-player i zarządzanie skinami.

## Architektura

```
themes/
 ├─ themeTypes.ts        — typy motywów (FullTheme, SeededTheme)
 ├─ fullThemes.ts        — kompletne definicje motywów
 ├─ seededThemes.ts      — motywy generowane z seedów
 ├─ themeRegistry.ts     — rejestr motywów
 ├─ themeCatalog.ts      — katalog motywów z metadanymi
 └─ index.ts             — barrel export

contexts/
 └─ ThemeContext.tsx      — kontekst React (dark/light toggle, persist)

scripts/karaoke/
 ├─ karaokeDisplaySettings.ts  — ustawienia wyświetlania (localStorage + CSS vars)
 ├─ glossyBarRenderer.ts       — 822 linii, renderer glossy barów
 ├─ textureCatalog.ts          — 17 kategorii × ~280 tekstur
 ├─ textureCache.ts            — async loader + CanvasPattern cache
 └─ fontCatalog.ts             — katalog czcionek

constants/
 ├─ playerColors.ts      — kolory graczy
 └─ audioColors.ts       — kolory audio UI

utils/
 └─ colorResolver.ts     — resolver kolorów

pages/settings/
 └─ DisplaySettingsPage.tsx   — strona ustawień wyświetlania

pages/admin/
 └─ AdminSkinsPage.tsx        — zarządzanie skinami (admin)

AppTheme.css             — globalne zmienne CSS motywu
```

## ThemeContext

`ThemeContext.tsx` zarządza trybem jasnym/ciemnym:
- `theme: 'light' | 'dark'`
- `toggleTheme()` — przełączanie
- Persystencja w localStorage
- Ustawianie atrybutu `data-bs-theme` na `<html>` (Bootstrap 5 dark mode)

7 testów: default state, toggle, persistence, DOM attributes.

## Typy motywów

### FullTheme

Kompletna definicja kolorów, typografii i spacing:
- Kolory: primary, secondary, background, surface, text, accent
- Typografia: font family, sizes, weights
- Spacing: paddings, margins, gaps
- Cienie i obramowania

### SeededTheme

Motywy generowane algorytmicznie z seedu:
- Seed → paleta kolorów (teoria barw)
- Automatyczne obliczanie kontrastów
- Warianty jasne/ciemne

## Ustawienia wyświetlania karaoke

`karaokeDisplaySettings.ts` — persystencja w localStorage + CSS custom properties:

### Presety gradientów kolorów (6)

| Preset | Kolory |
|---|---|
| Cyan→Yellow→Amber | #00BCD4 → #FFD700 → #FF8F00 |
| Neon Pink | #FF1493 → #FF69B4 → #FFB6C1 |
| Fire | #FF0000 → #FF6600 → #FFCC00 |
| Ocean | #006994 → #0099CC → #66CCFF |
| Forest | #228B22 → #32CD32 → #90EE90 |
| Retro | #8B4513 → #CD853F → #DEB887 |

+ Custom picker z dowolnymi kolorami.

### Czcionki

Wybór czcionki w `fontCatalog.ts`:
- CSS zmienna `--karaoke-font-family`
- Używana w `drawTimeline()` (6 miejsc) i `KaraokeLyrics` (CSS var)
- Selektor w `/settings/display`

### Tryby animacji

Wybór jednego z 4 trybów animacji timeline:
- Ball & Trail (domyślny)
- Wipe
- Pulse
- Bounce

## Glossy Bar Renderer

`glossyBarRenderer.ts` (822 linii) — zaawansowany renderer pasków nut karaoke:

### Kształty czapek (24 funkcje)

12 typów × lewy/prawy:
- Pill, Sharp, Soft, Chamfer, Arrow, Shield
- Bracket, Tab, Wave, Ornate, SkewTL, SkewTR

### Rejestry stylów (40 kombinacji)

| Rejestr | Typy | Ilość |
|---|---|---|
| SYMMETRIC_CAPS | Lewy = Prawy | 10 |
| ASYMMETRIC_CAPS | Lewy ≠ Prawy | 20 |
| SKEW_CAPS | Skośne | 10 |

### Wzory overlay (30)

30 wzorów nakładki z obsługą `color2`:
- Paski, kropki, romby, siatki, fale, zygzaki, spirale, gwiazdy, itd.

### Tryb patternOnly

Płaski kolor bez efektów 3D — przydatny dla czystego wyglądu.

### API renderowania

```typescript
// SVG
renderGlossyBarSvg(x, y, w, h, style: PlayerBarStyle): SVGElement

// Canvas
drawGlossyBarOnCanvas(ctx, x, y, w, h, style: PlayerBarStyle): void
```

## Katalog tekstur

`textureCatalog.ts` — 17 kategorii × 8-24 tekstury = ~280 tekstur:

Kategorie: Metal, Wood, Stone, Fabric, Paper, Leather, Crystal, Carbon, Neon, Galaxy, Lava, Ice, Grass, Sand, Water, Circuit, Fantasy.

### Cache tekstur

`textureCache.ts`:
- Asynchroniczne ładowanie obrazów
- Cache `CanvasPattern` z skalowaniem `DOMMatrix`
- Preload w `KaraokeManager.tsx`

## Styl pasków per-player

```typescript
interface PlayerBarStyle {
  capLeft: string;
  capRight: string;
  pattern: string;
  patternColor?: string;
  patternColor2?: string;
  highlight: number;      // 0-100
  glow: number;           // 0-100
  emptyGlass: number;     // 0-100
  patternOnly: boolean;
  textureId?: string;
  emptyTextureId?: string;
  textureScale?: number;
}
```

### Persystencja

- `loadPlayerBarStyle(playerId?)` / `savePlayerBarStyle(style, playerId?)`
- Klucze localStorage: `audioverse-player-bar-style-{id}`
- Fallback do globalnego stylu
- `loadPlayerBarStyles(ids)` — ładowanie mapy per-player

## Konfigurator w PlayerForm

`PlayerForm.tsx` (450 linii) — rozwijalna sekcja "Bar style":
- Wizualny selektor kształtów czapek (SVG preview grid)
- Selektor wzorów overlay (30 + None)
- Toggle `patternOnly`
- Picker koloru wzoru (auto/custom)
- Slidery highlight/glow/emptyGlass (0-100)
- Reset do domyślnych
- Live preview w nagłówku sekcji

Osobna sekcja "⭐ Gold bar style" dla złotych nut:
- Osobne patterny/tekstury (unhit + hit)
- Domyślnie Stars pattern
- Konfigurowalne kolory patternów

## Kolory graczy

`playerColors.ts` — predefiniowane kolory per-player:
- 8+ kolorów (red, blue, green, yellow, purple, orange, cyan, pink)
- Warianty: główny, jasny, ciemny, przezroczysty

## Routing

| Ścieżka | Komponent |
|---|---|
| `/settings/display` | `DisplaySettingsPage.tsx` |
| `/admin/skins` | `AdminSkinsPage.tsx` |
