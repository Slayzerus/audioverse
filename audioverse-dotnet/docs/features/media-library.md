# ?? Biblioteka Muzyczna (MediaLibrary)

Modu? MediaLibrary zarz?dza bibliotek? muzyczn? z integracj? zewn?trznych serwisów (Spotify, Tidal).

---

## Przegl?d funkcji

| Funkcja | Opis |
|---------|------|
| **Utwory** | Katalog piosenek z metadanymi |
| **Arty?ci** | Baza artystów z biografiami |
| **Albumy** | Albumy z ok?adkami |
| **Pliki audio** | Zarz?dzanie plikami lokalnymi |
| **Zewn?trzne wyszukiwanie** | Integracja Spotify, Tidal |
| **Pobieranie** | Download z YouTube, Spotify |

---

## Encje

### Song (Utwór)

```
Song
??? Id: int
??? Title: string
??? AlbumId: int?
??? PrimaryArtistId: int?
??? Duration: TimeSpan
??? TrackNumber: int?
??? DiscNumber: int?
??? Genre: string
??? ReleaseDate: DateTime?
??? SpotifyId: string?
??? TidalId: string?
??? Details: ICollection<SongDetail>
??? CreatedAt: DateTime
```

### SongDetail (Szczegó?y utworu)

```
SongDetail
??? Id: int
??? SongId: int
??? Type: SongDetailType (Lyrics, Credits, BPM, Key)
??? Value: string
??? Source: string
```

### Artist (Artysta)

```
Artist
??? Id: int
??? Name: string
??? NormalizedName: string
??? SpotifyId: string?
??? TidalId: string?
??? Detail: ArtistDetail?
??? Facts: ICollection<ArtistFact>
??? CreatedAt: DateTime
```

### ArtistDetail (Biografia)

```
ArtistDetail
??? Id: int
??? ArtistId: int
??? Biography: string
??? BirthDate: DateTime?
??? Country: string
??? ImageUrl: string?
??? Genres: string (JSON array)
```

### Album

```
Album
??? Id: int
??? Title: string
??? ReleaseDate: DateTime?
??? CoverUrl: string?
??? SpotifyId: string?
??? TidalId: string?
??? AlbumArtists: ICollection<AlbumArtist>
??? Songs: ICollection<Song>
??? CreatedAt: DateTime
```

### LibraryAudioFile (Plik audio)

```
LibraryAudioFile
??? Id: int
??? SongId: int?
??? AlbumId: int?
??? FilePath: string
??? FileName: string
??? FileSize: long
??? MimeType: string
??? BitRate: int
??? SampleRate: int
??? Duration: TimeSpan
??? Checksum: string
??? ImportedAt: DateTime
```

---

## API Endpoints

### Utwory

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/media/songs` | Lista utworów |
| `GET` | `/api/media/songs/{id}` | Szczegó?y utworu |
| `POST` | `/api/media/songs` | Dodaj utwór |
| `PUT` | `/api/media/songs/{id}` | Edytuj |
| `DELETE` | `/api/media/songs/{id}` | Usu? |
| `GET` | `/api/media/songs/search?q={query}` | Wyszukaj |

### Arty?ci

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/media/artists` | Lista artystów |
| `GET` | `/api/media/artists/{id}` | Szczegó?y artysty |
| `GET` | `/api/media/artists/{id}/songs` | Utwory artysty |
| `GET` | `/api/media/artists/{id}/albums` | Albumy artysty |
| `POST` | `/api/media/artists` | Dodaj artyst? |

### Albumy

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/media/albums` | Lista albumów |
| `GET` | `/api/media/albums/{id}` | Szczegó?y albumu |
| `GET` | `/api/media/albums/{id}/tracks` | Lista utworów |
| `POST` | `/api/media/albums` | Dodaj album |

### Pliki

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/media/files` | Lista plików |
| `POST` | `/api/media/files/upload` | Upload pliku |
| `GET` | `/api/media/files/{id}/stream` | Stream audio |
| `DELETE` | `/api/media/files/{id}` | Usu? plik |

### Playlisty

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/media/playlists` | Lista playlist |
| `POST` | `/api/media/playlists` | Utwórz playlist? |
| `POST` | `/api/media/playlists/{id}/songs` | Dodaj utwór |
| `DELETE` | `/api/media/playlists/{id}/songs/{songId}` | Usu? utwór |

---

## Zewn?trzne wyszukiwanie

### Spotify

```json
GET /api/media/external/spotify/search?q=Queen&type=artist

Response:
{
  "artists": [
    {
      "id": "1dfeR4HaWDbWqFHLkxsg1d",
      "name": "Queen",
      "imageUrl": "https://...",
      "genres": ["rock", "classic rock"],
      "popularity": 85
    }
  ]
}
```

### Tidal

```json
GET /api/media/external/tidal/search?q=Bohemian+Rhapsody&type=track

Response:
{
  "tracks": [
    {
      "id": "77814751",
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "album": "A Night at the Opera",
      "duration": 354,
      "hasLyrics": true
    }
  ]
}
```

---

## Pobieranie utworów

### YouTube Download

```json
POST /api/media/download/youtube
{
  "url": "https://youtube.com/watch?v=...",
  "format": "mp3",
  "quality": "320kbps"
}

Response:
{
  "taskId": "abc123",
  "status": "Queued",
  "estimatedTime": 30
}
```

### Status pobierania

```json
GET /api/media/download/status/{taskId}

Response:
{
  "taskId": "abc123",
  "status": "Completed",
  "fileId": 456,
  "fileName": "song.mp3",
  "fileSize": 5242880
}
```

---

## Skanowanie biblioteki

### Skan folderu

```json
POST /api/media/scan
{
  "path": "/music",
  "recursive": true,
  "autoMatch": true
}
```

Skanuje folder, odczytuje tagi ID3 i automatycznie dopasowuje do istniej?cych artystów/albumów.

### Status skanu

```json
GET /api/media/scan/status

Response:
{
  "isRunning": true,
  "filesScanned": 150,
  "filesTotal": 500,
  "newSongs": 45,
  "matchedSongs": 100,
  "errors": 5
}
```

---

## Integracja AI

### Rozpoznawanie utworu

```json
POST /api/ai/audio/recognize
Content-Type: multipart/form-data

file: [audio_sample.mp3]

Response:
{
  "recognized": true,
  "song": {
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "album": "A Night at the Opera",
    "confidence": 0.95
  }
}
```

### Generowanie tekstów

```json
POST /api/ai/audio/lyrics
{
  "songId": 123
}

Response:
{
  "lyrics": "[Verse 1]\nIs this the real life...",
  "source": "Tidal",
  "synced": true
}
```

---

## Storage (MinIO)

Pliki audio przechowywane s? w MinIO:

| Bucket | Zawarto?? |
|--------|-----------|
| `audioverse-songs` | Pliki piosenek (*.mp3, *.flac) |
| `audioverse-covers` | Ok?adki albumów |
| `audioverse-temp` | Pliki tymczasowe (pobieranie) |

### Konfiguracja

```json
// appsettings.json
{
  "MinIO": {
    "Endpoint": "localhost:9000",
    "AccessKey": "minioadmin",
    "SecretKey": "minioadmin",
    "UseSSL": false
  }
}
```

---

## Przyk?ad u?ycia

### Import albumu z Spotify

```json
POST /api/media/external/spotify/import
{
  "albumId": "0lw68yx3MhKflWFqCsGkIs",
  "downloadArt": true,
  "fetchLyrics": true
}

Response:
{
  "albumId": 42,
  "songsImported": 11,
  "artists": ["Queen"],
  "coverUrl": "https://minio.../covers/42.jpg"
}
```

---

*Ostatnia aktualizacja: Luty 2026*
