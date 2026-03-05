# Library Explorer & Song Browser

Przeglądarka biblioteki muzycznej: tabbed Audio / Ultrastar listy, file explorer z drzewem katalogów, autocomplete search z fuzzy scoring, SongBrowserSidebar z CRUD playlist, 9 modułów API (~87 funkcji, 46 React Query hooks), integracja Spotify/Tidal/YouTube/MusicBrainz.

## Architektura

System obejmuje **31 plików** (~3300 linii) w 3 warstwach:

```
Pages                  LibraryPage
                            │
Components     ┌────────────┼──────────────────────┐
               │            │                      │
          LibraryList   LibraryExplorer    LibrarySearch / SearchResult
          (tabbed)      (file-tree +       (autocomplete)
               │         streaming)
        ┌──────┴──────┐
     AudioList    UltrastarList
        │              │
   AudioRowItem   UltrastarRowItem
                           │
                  SongBrowserSidebar  (karaoke playlist nav)
                           │
API Layer    apiLibraryStream / apiLibraryUltrastar / apiLibraryCatalog / ...
                           │
Models        modelsAudio  /  modelsKaraoke  /  modelsLibrary
```

## LibraryPage

Strona główna (`/explore/library`, 69 linii):
- Renderuje `LibraryList`
- `onPlayNow` → otwiera `GenericPlayer` modal
- `onAddToQueue` → dołącza tracki do kolejki

## LibraryList (124 linii)

Główny komponent z dwiema zakładkami:

### Audio tab
- `useAudioRecordsQuery()` → `SongRecord[]`
- Filtrowany przez `useFilteredAudio` (tekst w title/artist)
- `AudioList` → `AudioRowItem` (okładka, tytuł, artyści, format)

### Ultrastar tab
- `useUltrastarSongsQuery()` → `KaraokeSongFile[]`
- Filtrowany przez `useFilteredUltrastar`
- `UltrastarList` → `UltrastarRowItem` (tytuł, artysta, ścieżka, link do edytora)

### Selekcja i akcje

Obie zakładki używają niezależnych `useSelection()` (`{ map, set, toggle, clear }`).

Action bar:
- **Play now** → `onPlayNow(PlayerTrack[])`
- **Add to queue** → `onAddToQueue(PlayerTrack[])`
- **Add to playlist** → `onAddDescriptors(SongDescriptorDto[])`

Mapery: `toTrack()` (SongRecord → PlayerTrack), `toDescAudio()`, `toDescUltrastar()` (→ SongDescriptorDto).

## LibraryExplorer (379 linii)

Multi-variant file explorer z 3 layoutami:

| Wariant | Zachowanie |
|---------|------------|
| `"minimal"` | Flat search + połączone wyniki plików/stream |
| `"onlyFiles"` | Search + tabela plików (bez streaming) |
| `"full"` | Dwa panele: sidebar z drzewem katalogów + streaming toggles; prawy panel z tabelą plików |

### Kluczowe funkcje

- `buildTree()` — buduje `DirNode` z `FileWithPath[]` parsując ścieżki `/`
- `flattenFiles()` — sortowanie alfabetyczne
- Search: `includes()` na lowercased file names + types + stream metadata

### Streaming Providers

```typescript
type StreamProvider = "tidal" | "spotify" | "youtube";
```

Toggles per-provider w sidebarze (wariant `"full"`).

### Callbacks

- `onOpenInEditor(File)` — otwiera plik w edytorze karaoke
- `onPlayFile(File)` — odtwarza plik
- `onPlayStream(StreamItem)` — odtwarza ze streaming

## LibrarySearch (245 linii)

Autocomplete z dropdown:
- Tabbed wyniki (Audio + Ultrastar)
- Fuzzy scoring (`scoreRecord` / `scoreUltrastar`)
- Keyboard navigation (↑↓ Enter Escape)
- Callbacks: `onPick(SongRecord)`, `onPickUltrastar(KaraokeSongFile)`

## LibrarySearchResult (141 linii)

Inline panel wyników — przyjmuje `query` prop, wyświetla przefiltrowane wyniki w dwóch zakładkach. Bez autocomplete dropdown.

## SongBrowserSidebar (346 linii)

Sidebar nawigacji karaoke z CRUD playlist:

### Drzewo węzłów

```typescript
type BrowserNode =
  | { type: "all" }
  | { type: "genre" }
  | { type: "year" }
  | { type: "myPlaylist"; id: number; name: string }
  | { type: "onlinePlaylist"; id: number; name: string };
```

### Sekcje

- **All Songs** — wszystkie
- **By Genre** — filtr po gatunku
- **By Year** — filtr po roku
- **My Playlists** — CRUD + rename + publish + duplicate + share link + delete
- **Online Playlists** — przeglądanie + duplicate (save to mine) + share link

Mutacje React Query przez `apiKaraoke`.

## 9 modułów API

| Moduł | Domena | Base route | Funkcje | Hooks |
|-------|--------|------------|--------:|------:|
| `apiLibrary` | YouTube search | `/api/karaoke/songs/youtube` | 1 | 1 |
| `apiLibraryStream` | Audio streaming | `/api/audio` | 4 | 4 |
| `apiLibraryUltrastar` | Ultrastar songs | `/api/karaoke/ultrastar` | 3 | 3 |
| `apiLibraryCatalog` | CRUD Songs/Albums/Artists/Files | `/api/library` | 30 | 25 |
| `apiLibraryExternal` | Spotify/Tidal/YouTube/MusicBrainz | `/api/library/external` | 14 | 13 |
| `apiLibraryFiles` | Audio file visibility | `/api/library/files/audio` | 3 | 0 |
| `apiLibraryLibrosa` | Librosa audio analysis | `/api/library/librosa` | 10 | 0 |
| `apiLibraryAiAudio` | AI audio (ASR/TTS/gen) | `/api/ai/audio` | 18 | 0 |
| `apiLibraryAiVideo` | AI video (pose) | `/api/ai/video` | 4 | 0 |
| **Razem** | | | **87** | **46** |

### apiLibraryCatalog (460 linii) — największy moduł

Pełny CRUD dla encji biblioteki:

```
Songs:    fetch / fetchDetail / create / update / delete / search
Albums:   fetch / fetchDetail / create / update / delete
Artists:  fetch / fetchDetail / create / update / delete / fetchFacts
Files:    fetchAudio / fetchMedia / create / update / delete / uploadArt
Scan:     postScanAudio / postScanMedia / fetchScanStatus
```

35 fetcher functions + 25 React Query hooks/mutations. Query keys: `LIBRARY_QK`.

### apiLibraryExternal (165 linii)

Integracja z zewnętrznymi serwisami:

- **Spotify**: search / track / artist / album
- **YouTube**: search
- **Tidal**: search / track
- **MusicBrainz**: search / recording / artist / release / ISRC lookup
- `fetchExternalSearch` — unified multi-provider search
- `postExternalImport` — import do lokalnej biblioteki

13 React Query hooks. Query keys: `EXTERNAL_QK`.

### apiLibraryLibrosa (154 linii)

10 endpointów analizy Librosa z multi-URL fallback:

| Endpoint | Funkcja |
|----------|---------|
| `postLibrosaAnalyze` | Pełna analiza (BPM, key, duration) |
| `postLibrosaTempo` | Estymacja tempa |
| `postLibrosaOnsets` | Detekcja onsetów |
| `postLibrosaBeatTrack` | Śledzenie beatów |
| `postLibrosaChromagram` | Chromagram (pitch classes) |
| `postLibrosaMfcc` | MFCC coefficients |
| `postLibrosaSpectralCentroid` | Centroid spektralny |
| `postLibrosaHpss` | Harmonic-percussive separation |
| `postLibrosaMelSpectrogram` | Mel spectrogram |
| `postLibrosaPitchTrack` | Śledzenie pitcha |

WebSocket: `LIBROSA_PYIN_WS` — streaming pitch tracking.

### apiLibraryAiAudio (244 linii)

AI audio processing:

| Grupa | Funkcje |
|-------|---------|
| **ASR** | `postTranscribe` |
| **TTS** | `postTts`, `postTtsCoqui`, `postTtsOpenTts` |
| **Analysis** | `postAnalyze`, `postRhythm`, `postPitch`, `postVad` |
| **Separation** | `postSeparate` |
| **Tagging** | `postTags` |
| **Singing Score** | `postSingingScore` + live WS |
| **SVS** | `postDiffSinger`, `postViSinger` |
| **SVC** | `postSoVits`, `postRvc` |
| **Generation** | `postMusicGen`, `postRiffusion`, `postAudioCraft`, `postWaveGan` |
| **Utility** | `bufferToBlobUrl` |

## Modele danych

### modelsLibrary.ts (125 linii)

```typescript
interface Song {
  id?: number; title?: string; albumId?: number;
  album?: Album; isrc?: string;
  primaryArtistId?: number; primaryArtist?: Artist;
  details?: SongDetail[];
}

interface Album {
  id?: number; title?: string; releaseYear?: number;
  coverUrl?: string; albumArtists?: AlbumArtist[];
  songs?: Song[];
}

interface Artist {
  id?: number; name?: string; normalizedName?: string;
  detail?: ArtistDetail; facts?: ArtistFact[];
}

interface LibraryAudioFile {
  id?: number; filePath?: string; fileName?: string;
  duration?: number; sampleRate?: number; channels?: number;
  /* ... */
}
```

Enumy: `ArtistFactType`, `AlbumArtistRole`, `SongDetailType`.

## Cover Art

Okładki albumów wyświetlane w `AudioRowItem`:
- URL z `SongRecord.albumCoverUrl`
- Fallback placeholder icon
- Lazy loading (img loading="lazy")
- Rozmiar: 40×40px w liście, 200×200px w detalu

## Storybook

`UltrastarRowItem.stories.tsx` — 54 linii ze stories dla row item karaoke.
