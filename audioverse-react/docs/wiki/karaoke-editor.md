# Edytor Karaoke

## Przegląd
Edytor karaoke pozwala na tworzenie i edycję piosenek w formacie UltraStar.
Składa się z 4 zakładek: Audio, Notes, Text, Export.

## Komponenty

### EditorShell (`components/editor/EditorShell.tsx`)
Główny kontener edytora — zarządza stanem i przełączaniem między zakładkami.

### AudioTab
Zakładka audio — upload pliku, podgląd waveformu, analiza pitchu.

**Funkcje:**
- Upload pliku audio (do 50 MB, format audio/*)
- Dekodowanie i wizualizacja waveformu na canvas
- **Ekstrakcja metadanych** — automatyczne parsowanie ID3/Vorbis tagów:
  - Tytuł, artysta, album, gatunek, rok, BPM
  - Okładka albumu (embedded cover art)
  - Fallback: parsowanie nazwy pliku (`Artysta - Tytuł.mp3`)
- **Wyszukiwanie Spotify** — po ekstrakcji metadanych automatyczne wyszukiwanie na Spotify:
  - Wybór pasującego utworu
  - Import tytułu, artysty, albumu, okładki, ISRC
  - Kliknięcie "Apply to Song" wstawia dane do nagłówków UltraStar
- Separacja ścieżek (Demucs) — AI rozdzielenie na wokal/perkusję/bas/inne
- Analiza pitchu algorytmami: Pitchy, Crepe, Librosa, UltrastarWP
- Wybór ustawień mikrofonu (z localStorage) do analizy

### NotesTab
Zakładka z wizualizacją nut na piano-roll (canvas).

### TextTab
Edytor tekstowy UltraStar z podświetlaniem składni (Monaco Editor).

### ExportTab
Eksport piosenki w formacie UltraStar, podgląd w Phaserze.

### SongMetadataLookup (`components/editor/SongMetadataLookup.tsx`)
Komponent ekstrakcji metadanych i wyszukiwania Spotify:

```typescript
interface SongMetadata {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    year?: number;
    bpm?: number;
    coverDataUrl?: string;      // z embedded cover art
    spotifyId?: string;         // ze Spotify
    spotifyCoverUrl?: string;   // okładka ze Spotify
    isrc?: string;              // International Standard Recording Code
}
```

**Biblioteka:** `music-metadata-browser` — parsuje ID3v1/v2, Vorbis, FLAC, MP4 i inne formaty.

## Przepływ edycji

1. Upload pliku audio → waveform + metadane
2. *(opcjonalnie)* Wyszukanie na Spotify → uzupełnienie danych
3. *(opcjonalnie)* Separacja Demucs → izolacja wokalu
4. Analiza pitchu → generowanie nut UltraStar
5. Edycja nut na piano-roll lub w edytorze tekstowym
6. Eksport / zapis piosenki

## Integracja z API

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/library/external/spotify/search` | GET | Wyszukiwanie Spotify |
| `/api/library/external/spotify/track/{id}` | GET | Szczegóły utworu Spotify |
| `/api/ai/audio/separate` | POST | Separacja Demucs |
| `/api/ai/audio/pitch` | POST | Analiza pitchu (serwer) |
| `/api/karaoke/songs/{id}` | GET | Pobranie piosenki z bazy |
| `/api/karaoke/songs` | POST/PUT | Zapis piosenki |
