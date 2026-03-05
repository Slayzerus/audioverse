# Playlist Manager i integracje serwisów

Zaawansowane zarządzanie playlistami z 4 trybami widoku, dynamicznym edytorem reguł, multi-format import/export, systemem tagów, konektorami serwisów (Spotify/Tidal/YouTube), układem dual-pane "Norton Commander" i dispatching odtwarzania.

## Architektura

```
pages/enjoy/
 ├─ PlaylistManagerPage.tsx     — główna strona managera
 ├─ PlaylistsPage.tsx           — lista playlist
 └─ PlaylistDetailsPage.tsx     — szczegóły playlisty

components/playlist/
 ├─ DynamicRuleEditor.tsx       — wizualny edytor reguł dynamicznych
 ├─ PlaylistDualPane.tsx        — widok Norton Commander
 ├─ PlaylistSearchBar.tsx       — wyszukiwanie
 ├─ PlaylistSidebar.tsx         — sidebar z folderami
 ├─ PlaylistTagEditor.tsx       — edycja tagów
 ├─ PlaylistTrackList.tsx       — lista utworów
 └─ ServiceConnectorPanel.tsx   — konektory serwisów

components/controls/playlist/
 ├─ GenericPlaylist.tsx          — generyczny komponent playlisty
 ├─ GenericPlaylistItem.tsx      — element playlisty
 ├─ PlaylistBrowser.tsx          — przeglądarka
 ├─ PlaylistList.tsx             — lista
 └─ useLocalPlaylists.ts         — hook lokalnych playlist

scripts/playlist/
 └─ playlistFormatUtils.ts       — import/export formatów

scripts/api/
 ├─ apiPlaylists.ts              — API playlist
 └─ apiPlaylistManager.ts        — API managera

models/
 ├─ modelsPlaylists.ts           — typy PlaylistDto, PlaylistItemDto, etc.
 └─ modelsPlaylistManager.ts     — typy managera
```

## Tryby widoku (4)

| Tryb | Opis |
|---|---|
| **List** | Klasyczna lista tabelaryczna |
| **Grid** | Siatka z okładkami |
| **Compact** | Kompaktowa lista minimalna |
| **DualPane** | Norton Commander — dwa panele obok siebie z drag & drop |

## Edytor reguł dynamicznych

`DynamicRuleEditor.tsx` — wizualny edytor reguł do tworzenia dynamicznych playlist:

```typescript
// Struktura reguły
interface DynamicRule {
  field: string;     // 11 pól (title, artist, genre, year, bpm, duration, ...)
  operator: string;  // 10 operatorów (equals, contains, gt, lt, between, ...)
  value: string | number;
}
```

- Zagnieżdżone grupy z operatorami **AND/OR**
- 11 pól do filtrowania
- 10 operatorów porównania
- Limit max wyników
- Podgląd na żywo pasujących utworów

## Import/Export (3 formaty)

`playlistFormatUtils.ts`:

| Format | Import | Export |
|---|---|---|
| **JSON** | ✅ | ✅ |
| **M3U** | ✅ | ✅ |
| **CSV** | ✅ | ✅ |

## Konektory serwisów

`ServiceConnectorPanel.tsx` — panel łączenia z zewnętrznymi serwisami:

| Serwis | Import | Odtwarzanie | Status |
|---|---|---|---|
| **Spotify** | Playlisty, ulubione | Embed player | OAuth2 |
| **Tidal** | Playlisty, albumy | Streaming API | OAuth2 |
| **YouTube** | Playlisty | YouTube embed | OAuth2 |

### Playback dispatch

`handlePlay()` w PlaylistManagerPage — routing odtwarzania:
1. Sprawdź źródło utworu (YouTube/Spotify/Tidal/URL)
2. Przekieruj do odpowiedniego playera
3. Przekaż kontekst playlisty (kolejka, shuffle, repeat)

## Sidebar

`PlaylistSidebar.tsx`:
- Drzewo folderów/playlist
- CRUD inline (tworzenie, rename)
- Drag & drop między folderami
- Filtrowanie po serwisie

## Tagi

`PlaylistTagEditor.tsx`:
- Dodawanie/usuwanie tagów per utwór
- Autocomplete istniejących tagów
- Filtrowanie playlisty po tagach

## Kolekcje gier planszowych i wideo

### Board Game Collection

`BoardGameCollectionPage.tsx` (575 linii):
- **BGG API integration** — `BggSearchPanel`, `fetchBggSearch`, `fetchBggDetail`
- Grid/list view, sortowanie, filtrowanie
- Import/export JSON
- Pełny CRUD kolekcji

### Video Game Collection

`VideoGamesCollectionPage.tsx`:
- **Steam API integration** — `SteamSearchPanel`
- Grid/list view
- Sortowanie i filtrowanie
- Import/export

## Modele danych

```typescript
interface PlaylistDto {
  id: number;
  name: string;
  description?: string;
  items: PlaylistItemDto[];
  access: PlaylistAccess;
  tags: string[];
  source?: string;
}

interface PlaylistItemDto {
  id: number;
  title: string;
  artist?: string;
  duration?: number;
  sourceUrl?: string;
  sourceType?: string; // 'youtube' | 'spotify' | 'tidal' | 'url'
  coverUrl?: string;
  tags: string[];
}
```

## Routing

| Ścieżka | Komponent |
|---|---|
| `/playlists` | `PlaylistsPage.tsx` |
| `/playlists/:id` | `PlaylistDetailsPage.tsx` |
| `/playlist-manager` | `PlaylistManagerPage.tsx` |
| `/board-games` | `BoardGameCollectionPage.tsx` |
| `/video-games` | `VideoGamesCollectionPage.tsx` |
