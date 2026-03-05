
## 6. Media Library API (`/api/media/...`) — zaimplementowane endpointy dla frontu

Uwaga: wszystkie poniższe endpointy są chronione — wymagają nagłówka `Authorization: Bearer {token}` (kontrolery mają `[Authorize]`). Kontrolery znajdują się w `AudioVerse.API\Controllers\MediaLibrary\`.

6.1 Piosenki (Songs)
- GET `/api/media/songs?q={q}&page={page}&pageSize={pageSize}` — przeszukiwanie katalogu piosenek.
  - Response 200: `{ items: [Song], totalCount: int, page: int, pageSize: int }`
  - Przykład filtrów: `q` przeszukuje `title` oraz nazwę `primaryArtist`.

- GET `/api/media/songs/{id}` — pobierz piosenkę z include `details`, `primaryArtist`, `album`.
  - Response 200: `Song` JSON lub 404 jeśli brak.

- POST `/api/media/songs` — utwórz piosenkę.
  - Request JSON: `{ "title": "Test Song ML", "albumId": 1, "primaryArtistId": 2, "isrc": "USRC12345678" }`
  - Response 201 Created: `{ "id": 123 }` (CreatedAtAction)

- PUT `/api/media/songs/{id}` — zaktualizuj piosenkę.
  - Request JSON: `{ "title": "New Title", "albumId": 2, "primaryArtistId": 3, "isrc": "..." }`
  - Response 200: `{ "success": true }` lub 404

- DELETE `/api/media/songs/{id}` — usuń piosenkę.
  - Response 204 No Content lub 404

6.2 Szczegóły piosenki (Song Details)
- POST `/api/media/songs/{songId}/details` — dodaj detail (lyrics, tabs, etc.).
  - Request JSON: `{ "type": 4, "value": "Lyrics here..." }` (typy `SongDetailType` w `AudioVerse.Domain.Enums.MediaLibrary`)
  - Response 200/Created: `{ "id": 555 }`

- GET `/api/media/songs/{songId}/details` — lista detaili.
  - Response 200: array of SongDetail

- DELETE `/api/media/songs/details/{detailId}` — usuń detail.
  - Response 204 No Content

6.3 Artyści (Artists)
- GET `/api/media/artists?q={q}` — wyszukaj artystów.
- GET `/api/media/artists/{id}` — pobierz artystę wraz z detail i facts.

- POST `/api/media/artists` — utwórz artystę.
  - Request: `{ "name": "Artist Name" }`
  - Response 201: `{ "id": 10 }`

- PUT `/api/media/artists/{id}` — aktualizuj artystę.
  - Request: `{ "name": "Renamed" }` → Response 200

- POST `/api/media/artists/{id}/facts` — dodaj fakt.
  - Request: `{ "type": 5, "value": "Some value" }` → Response 200

- GET `/api/media/artists/{id}/facts` — lista faktów (200)

- PUT `/api/media/artists/{id}/detail` — upsert detail (bio, country, imageUrl).
  - Request: `{ "bio": "...", "country": "PL", "imageUrl": "https://..." }` → Response 200

6.4 Albumy (Albums)
- GET `/api/media/albums?q={q}` — wyszukaj albumy.
- GET `/api/media/albums/{id}` — szczegóły albumu (z `albumArtists`, `songs`).

- POST `/api/media/albums` — utwórz album.
  - Request: `{ "title": "My Album", "releaseYear": 2025, "primaryArtistId": 2 }`
  - Response 201: `{ "id": 21 }`

- PUT `/api/media/albums/{id}` — aktualizuj album.
  - Response 200

- POST `/api/media/albums/{albumId}/artists` — dodaj artystę do albumu (join).
  - Request: `{ "artistId": 5, "role": 1, "order": 0 }` (`AlbumArtistRole` enum as int)
  - Response 200

- DELETE `/api/media/albums/{id}` — usuń album (204)

6.5 Pliki audio i media (Files)
- POST `/api/media/files/audio` — zarejestruj plik audio w bibliotece.
  - Request: `{ "filePath": "/music/test.flac", "fileName": "test.flac", "sampleRate": 44100, "channels": 2, "size": 5000000 }`
  - Response 200/201: nowy rekord

- GET `/api/media/files/audio` — lista plików audio (200)

- POST `/api/media/files/media` — zarejestruj plik multimedialny (video/document).
  - Request: `{ "filePath":"/video/test.mp4","fileName":"test.mp4","fileSizeBytes":12000000,"mimeType":"video/mp4" }`
  - Response 200/201

- GET `/api/media/files/media` — lista media files (200)

6.6 External import / search
- POST `/api/media/external/import` — import z zewnętrznego źródła (Spotify/Tidal/YouTube metadata).
  - Request: `{ "externalId":"abc123","source":"Spotify","title":"Imported Track","artist":"Imported Artist","isrc":"USRC99999999" }`
  - Response 200: `{ "songId": 12, "artistId": 34 }`

- GET `/api/media/external/search?source=Spotify&q=...` — wyszukiwanie zewnętrzne (zwraca typ `ExternalTrackResult`)

6.7 Ultrastar / LRC conversion
- POST `/api/media/ultrastar/convert/lrc` — konwersja LRC → Ultrastar (przykład użyty w testach).
  - Request: `{ "artist": "Test Artist", "title": "Test Song", "lrcContent": "[00:01.00]Hello world\n[00:05.00]Second line" }`
  - Response 200: `{ "success": true, "path": "/tmp/ultrastar/xyz.txt" }` (path optional)

6.8 Download (audio/video)
- POST `/api/media/download/audio` — pobierz audio z URL (asynchroniczne/utility).
  - Request: `{ "url": "https://..." }`
  - Response 200 OK (or 400 BadRequest on invalid input). Implementation currently validates URL and may return 200 even if download not performed in tests.

6.9 Song license lookup
- GET `/api/media/license?title={title}&artist={artist}` — wyszukiwanie licencji/źródeł.
  - Response 200: array (possibly empty)

6.10 Playlisty (MediaLibrary playlists)
- POST `/api/media/playlists` — tworzy playlistę lokalną.
  - Request: `{ "platform": "local", "name": "Test Playlist", "trackIds": ["track1","track2"] }`
  - Response 200: `{ "tracksAdded": 2 }`

6.11 Notes / conventions
- W odpowiedziach używany jest camelCase (przykłady w testach). Kontrolery zwracają proste DTO/encje bez Mapster w większości endpointów (bezpośredni CRUD na DbContext).
- Status codes: POST -> 201 Created (z { id }), GET -> 200 or 404, PUT -> 200, DELETE -> 204.

Jeśli chcesz, mogę dodać dokładne JSON Schema (DTO) dla każdej encji (`Song`, `Artist`, `Album`, `LibraryAudioFile`, `LibraryMediaFile`, `SongDetail`) albo wygenerować OpenAPI/Swagger fragmenty dla tych endpointów.

```
