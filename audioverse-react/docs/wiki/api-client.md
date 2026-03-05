# Warstwa API — Klient Frontend

## Konfiguracja

### Klient HTTP (`scripts/api/audioverseApiClient.ts`)
Bazowy klient Axios z interceptorami:
- Automatyczne dołączanie tokenu JWT (`Authorization: Bearer ...`)
- Obsługa odświeżania tokenów (refresh token flow)
- Bazowy URL z konfiguracji Vite

### React Query
Wszystkie zapytania API używają TanStack React-Query z cache'owaniem:
```typescript
const { data, isLoading, error } = useQuery({
    queryKey: ['karaoke', 'songs'],
    queryFn: () => fetchSongs()
});
```

## Moduły API

### apiUser (`scripts/api/apiUser.ts`)
Zarządzanie użytkownikami i urządzeniami:
- `getUserMicrophones()` — lista mikrofonów z ustawieniami
- `createMicrophone(payload)` — rejestracja nowego mikrofonu
- `updateMicrophone(id, payload)` — aktualizacja ustawień
- `getUserDevices()` — lista urządzeń
- `createDevice(payload)` / `updateDevice(id, payload)`

**MicrophoneDto:**
```typescript
interface MicrophoneDto {
    id: number;
    userId: number;
    deviceId: string;
    micGain?: number;
    pitchThreshold?: number;
    pitchDetectionMethod?: PitchDetectionMethod;
    offsetMs?: number;
    rmsThreshold?: number;
    smoothingWindow?: number;
    useHanning?: boolean;
    monitorEnabled?: boolean;
    monitorVolume?: number;
    hysteresisFrames?: number;
    volume: number;
    threshold: number;
}
```

### apiKaraoke (`scripts/api/apiKaraoke.ts`)
System karaoke:
- `fetchSongs()` / `fetchSongById(id)` — piosenki
- `postCreateParty(payload)` — tworzenie imprezy karaoke
- `postAddRound(partyId, payload)` — dodanie rundy
- `postSaveResults(roundId, payload)` — zapis wyników
- `fetchTopSingings(songId)` — ranking najlepszych wykonań

### apiLibraryAiAudio (`scripts/api/apiLibraryAiAudio.ts`)
Integracja z AI audio:
- `postTranscribe(file, req)` — transkrypcja mowy → tekst
- `postTts(body)` — synteza mowy (Text-to-Speech)
- `postSeparate(file)` — separacja Demucs
- `postPitchAnalysis(file)` — analiza pitchu
- `postSingingScore(file, songId)` — scoring offline
- `getSingingScoreLiveWsUrl()` — URL do live scoring WS

### apiLibraryExternal (`scripts/api/apiLibraryExternal.ts`)
Zewnętrzne serwisy muzyczne:
- `fetchSpotifySearch(q, limit)` — wyszukiwanie Spotify
- `fetchSpotifyTrack(trackId)` — szczegóły utworu
- `fetchSpotifyArtist(artistId)` / `fetchSpotifyAlbum(albumId)`
- `fetchExternalYoutubeSearch(q)` — wyszukiwanie YouTube
- `fetchTidalSearch(q)` — wyszukiwanie Tidal
- `fetchMusicBrainzSearch(q, type)` — MusicBrainz

### apiLibrary (`scripts/api/apiLibrary.ts`)
Biblioteka mediów:
- `uploadMediaFile(file)` — upload pliku
- `searchYouTubeByArtistTitle(artist, title)` — szukanie YouTube

### apiWiki (`scripts/api/apiWiki.ts`)
Wiki:
- `fetchWikiPages()` — lista stron
- `fetchWikiPage(slug)` — strona po slug
- `fetchWikiNav()` — drzewo nawigacji
- `searchWiki(q)` — wyszukiwanie pełnotekstowe

## Komunikacja w czasie rzeczywistym

### WebSocket — Pitch Streaming
- **Librosa pYIN**: `wss://host/api/librosa/pyin/ws`
- **CREPE**: `wss://host/api/ai/audio/pitch/ws/server`
- **ASR stream**: `wss://host/api/ai/audio/asr/stream`

### WebSocket — Live Scoring
- `wss://host/api/ai/audio/singing/live` — scoring w czasie rzeczywistym

### WebRTC (rtcService)
Peer-to-peer streaming audio/wideo między graczami:
- `rtcService.connect()` / `rtcService.disconnect()`
- Przesyłanie pitchu i wyników między graczami

### SignalR
Powiadomienia serwerowe w czasie rzeczywistym:
- Aktualizacje statusu imprezy karaoke
- Powiadomienia o nowych graczach
- Synchronizacja stanu gry

## Obsługa błędów

1. **Retry** — React-Query automatycznie ponawia nieudane zapytania (3 próby)
2. **Fallback** — Streaming CREPE automatycznie przechodzi na lokalny pitchy
3. **Toast** — Błędy wyświetlane jako powiadomienia toast
4. **Offline** — Ustawienia mikrofonu cache'owane w localStorage
