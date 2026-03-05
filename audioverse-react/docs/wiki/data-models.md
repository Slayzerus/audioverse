# Data Models — referencja

Kompletna referencja TypeScript modeli danych projektu AudioVerse React. **26 plików**, ~3310 linii, ~50 enumów, ~190 interfejsów, ~15 type aliasów, 13 helper functions.

## Katalog plików

```
src/models/
 ├─ modelsAudio.ts               — 167 linii, Player, Song, SongRecord
 ├─ modelsEditor.ts              — 114 linii, AudioProject, Layers, Effects
 ├─ modelsKaraoke.ts             — 4 linii (barrel → ./karaoke/)
 ├─ modelsLibrary.ts             — 125 linii, Song, Album, Artist CRUD
 ├─ modelsPlaylists.ts           — 101 linii, Playlist, Descriptors
 ├─ modelsDmx.ts                 — 81 linii, DMX scenes/sequences
 ├─ modelsContacts.ts            — 213 linii, Contact CRM
 ├─ modelsAdmin.ts               — 83 linii, User admin, OTP, config
 ├─ modelsAiAudio.ts             — 214 linii, ASR/TTS/SVS/SVC/Gen
 ├─ modelsAiVideo.ts             — 142 linii, Pose 2D/3D detekcja
 ├─ modelsAuth.ts                — 53 linii, Login/Refresh/OAuth
 ├─ modelsMusicPlatform.ts       — 8 linii, MusicPlatform enum
 ├─ modelsLibrosa.ts             — 59 linii, Librosa analysis
 ├─ modelsPlayerLinks.ts         — 105 linii, Player links + karaoke bar settings
 ├─ modelsPlaylistManager.ts     — 235 linii, Managed playlists + DualPane
 ├─ modelsWiki.ts                — 105 linii, Wiki CRUD
 ├─ editor/
 │   ├─ audioTypes.ts            — 35 linii, ClipRegion, EffectSlot, LayerSettings
 │   ├─ fxTypes.ts               — 9 linii, MasterEQPreset
 │   ├─ midiTypes.ts             — 15 linii, MidiNote, MidiCCEvent
 │   └─ timelineTypes.ts         — 11 linii, SnapMode, TimelineConfig
 ├─ karaoke/
 │   ├─ index.ts                 — 6 linii (barrel)
 │   ├─ modelsKaraokeCore.ts     — 542 linii, Party/Player/Session/Round/Singing
 │   ├─ modelsEvent.ts           — 536 linii, Event/Schedule/Poll/Expenses
 │   ├─ modelsGames.ts           — 258 linii, Board/Video games + collections
 │   └─ modelsCommon.ts          — 207 linii, shared enums + generics
 └─ game/
     └─ modelsGame.ts            — 12 linii, Player/GameState (Phaser)
```

## modelsAudio.ts — Audio & Player

Typy do odtwarzania audio i informacji o piosenkach.

### Kluczowe interfejsy

| Interface | Rola |
|-----------|------|
| `PlayerSource` | Źródło audio: `kind: "youtube" \| "hls" \| "audio"`, URL, headers, proxy |
| `PlayerTrack` | Track do odtwarzania: id, title, artist, coverUrl, sources[] |
| `SongInformation` | Pełne metadane piosenki z Spotify/MusicBrainz |
| `SongRecord` | Rekord audio w bibliotece: 40+ pól (metadata, MusicBrainz IDs, analysis, streaming links) |
| `SongFileInformation` | Informacje o pliku audio: format, bitrate, channels, embedded tags, cover art |
| `SongFileDetails` | Dane analysis: RMS, peak, BPM, pitch, loudness hint |
| `ArtistInformation` | Bio artysty: nationality, birthDate, social media |
| `AlbumInformation` | Dane albumu: UPC, label, release date |

## modelsEditor.ts — Audio Editor / DAW

### Enumy

```typescript
enum AudioEffectType {
  Equalizer = 0, Compressor = 1, Reverb = 2, Delay = 3,
  Distortion = 4, Chorus = 5, Flanger = 6, Phaser = 7
}
enum CollaboratorPermission { ReadOnly = 0, Edit = 1, Owner = 2 }
```

### Hierarchia encji

```
AudioProject
  └─ AudioSection[]
       └─ AudioLayer[]  (+ AudioLayerEffect[])
            └─ AudioLayerItem[]
```

Dodatkowe: `AudioClip` (binary dane), `AudioInputPreset`, `AudioSamplePack` → `AudioSample[]`.

## editor/ — sub-moduły

### audioTypes.ts

```typescript
type EffectType = 'eq3' | 'compressor' | 'delay' | 'reverb' | 'distortion';
interface ClipRegion { id, label, start, duration, fadeIn, fadeOut, reverse, stretchFactor, color?, blob?, audioBuffer? }
interface EffectSlot { id, type: EffectType, bypass, params: Record<string, number> }
interface LayerSettings { mute, solo, volume, pan, color, locked, group, effectChain: EffectSlot[], trackType: 'audio' | 'midi', instrument? }
```

### midiTypes.ts

```typescript
interface MidiNote { id, pitch, start, duration, velocity }
interface MidiCCEvent { id, cc, value, time, handleType?: 'linear' | 'step' | 'exp' }
```

### timelineTypes.ts

```typescript
type SnapMode = 'bar' | 'beat' | 'sub-beat' | 'second';
type TimelineConfig = { zoom, duration, bpm, snapEnabled, snapMode: SnapMode }
```

## modelsKaraokeCore.ts — Karaoke (542 linii, 42 interfejsy)

Największy plik modeli — Party, Player, Session, Round, Singing.

### Kluczowe enumy

| Enum | Wartości |
|------|---------|
| `KaraokeSessionMode` | Classic, Tournament, Knockout, Casual |
| `KaraokeRoundMode` | Normal, Demo, NoLyrics, NoTimeline, Blind, SpeedRun, Duet, FreeStyle |
| `SongQueueStatus` | Pending, Playing, Done, Skipped |
| `FilterOperator` | In, Between, Contains, Gte, Lte, Equals |
| `SongSelectionMode` | freeForAll, roundRobin, hostOnly, firstCome |
| `KaraokeGameMode` | classic, blind, elimination, relay, freestyle |

### Hierarchia encji

```
KaraokeParty
  ├─ KaraokePlayer[]
  ├─ KaraokeGame[] (mode, status, theme, rounds)
  ├─ KaraokeSession[]
  │    └─ KaraokePartyRound[]
  │         ├─ KaraokeRoundPart[] → KaraokeSinging[]
  │         └─ KaraokeRoundPlayer[]
  ├─ PartyAttraction[] (karaoke / videoGame / boardGame)
  ├─ KaraokeSongQueueItem[]
  └─ KaraokeTeam[] → KaraokeTeamPlayer[]
```

Dodatkowe: `KaraokePlaylist` → `KaraokePlaylistSong[]`, `KaraokeSongFile` (z `KaraokeNote[]`), `KaraokeSinging` (+`KaraokeSingingRecording[]`), `PlayerFavorite`.

## modelsEvent.ts — Events (536 linii, 30 interfejsów)

### Kluczowe enumy (17)

| Enum | Wartości |
|------|---------|
| `EventType` | Unknown, Event, Meeting, Conference, Workshop, GameNight, Screening |
| `EventStatus` | Created, Planned, ItsOn, Finished |
| `EventAccessType` | Public, Private, Code, Link |
| `EventPermission` | Flags: None, Invite, ManageMusic, Admit, Moderate, Bouncer, All=31 |
| `ScheduleCategory` | Karaoke, Food, Game, Break, Custom |
| `MenuItemCategory` | Food, Drink, Snack, Dessert |
| `ExpenseCategory` | Food, Drink, Attraction, Rental, Equipment, Transport, Custom |
| `SplitMethod` | Equal, PerCapita, Custom, ByPollResponse |
| `PaymentMethod` | Cash, BankTransfer, Blik, PayPal, Card, Other |
| `PaymentStatus` | Pending, Confirmed, Rejected, Refunded |
| `PollType` | SingleChoice, MultiChoice, YesNo |
| `DateVoteStatus` | Available, Maybe, Unavailable |

### Subsystemy

- **Event** — title, type, status, location, visibility, poster
- **Schedule** — EventScheduleItem (ScheduleCategory, startTime, endTime)
- **Menu** — EventMenuItem (category, price, allergens, vegan/vegetarian)
- **Attractions** — EventAttraction (PhotoBooth, DanceFloor, KaraokeBooth, DJSet)
- **Expenses** — EventExpense + EventExpenseShare (split methods)
- **Payments** — EventPayment (6 metod, statusy)
- **Polls** — EventPoll + EventPollOption + EventPollResponse (3 typy)
- **Date Voting** — EventDateProposal + EventDateVote → DateBestResult
- **Photos** — EventPhoto (objectKey, caption)
- **Comments** — EventComment (threaded: parentId + replies)
- **Location** — EventLocation (address, lat/lng, virtual URL)
- **Game Picks** — EventSessionGamePick + Vote → GamePickRankedResult
- **Song Picks** — EventSessionSongPick + Signup → SongPickRankedResult

## modelsGames.ts — Board & Video Games (258 linii, 24 interfejsy)

### Enumy

```typescript
enum GameStatus { Available = 0, InUse = 1, Reserved = 2 }
enum GamePlatform { PC = 0, PS5 = 1, Xbox = 2, Switch = 3, Mobile = 4, Other = 5 }
```

### Hierarchia

```
BoardGame (BGG integration: bggId, bggRating, bggImageUrl)
  ├─ BoardGameGenre
  ├─ BoardGameTag[]
  ├─ BoardGameCollection → BoardGameCollectionItem[]
  └─ BoardGameSession → BoardGameSessionRound → Part → Player (score)

VideoGame (Steam/IGDB: steamAppId, igdbId)
  ├─ VideoGameGenre
  ├─ VideoGameCollection → VideoGameCollectionItem[]
  └─ VideoGameSession → VideoGameSessionRound → Part → Player (score)
```

BGG (BoardGameGeek) search: `BggSearchResult`, `BggGameDetails`, `BggHotGame`, `BggCollectionItem`.

## modelsCommon.ts — Shared (207 linii)

### Kluczowe enumy

| Enum | Wartości |
|------|---------|
| `NotificationType` | General, EventInvite, EventUpdate, KaraokeScore, PollCreated, CommentReply, SystemAlert |
| `ExternalPlatform` | Spotify=1, Tidal=2, YouTube=3, Google=4, Steam=5, BGG=6, Discord=7, Twitch=8, Apple=9, Facebook=10, Microsoft=11 |
| `DeviceType` | Unknown, Microphone, Gamepad, Keyboard, Mouse, Speaker, Camera |
| `ExportStatus` | Pending, Processing, Completed, Failed |

### Generics

```typescript
interface PagedResult<T> { items: T[]; totalCount; page; pageSize }
interface PaginatedResponse<T> { items: T[]; page; pageSize; totalCount; totalPages }
```

## modelsContacts.ts — CRM kontaktów (213 linii)

### Enumy

```typescript
enum ContactImportSource { Manual=0, Google=1, Microsoft=2, Apple=3, Csv=4, VCard=5, Phone=6, Facebook=7, LinkedIn=8, CardDav=9 }
enum ContactEmailType { Personal=0, Work=1, Other=2 }
enum ContactPhoneType { Mobile=0, Home=1, Work=2, Fax=3, Other=4 }
enum ContactAddressType { Home=0, Work=1, Billing=2, Shipping=3, Other=4 }
```

### Encje

`ContactListDto` → `ContactDetailDto` (emails, phones, addresses, groups) + CRUD requests. `ContactGroupListDto` + `GroupMembersRequest`. Import: `ContactImportRequest` → `ContactImportResultDto`.

## modelsDmx.ts — DMX-512 (81 linii)

```typescript
enum DmxChannelType { Unknown, Dimmer, DimmerWithOff, RotationWithOff, RotationWithOffAndCcw, Options }
```

Hierarchia: `DmxDeviceInfo` → `DmxDeviceChannelInfo[]` → `DmxChannelSegment[]`. Sceny: `DmxScene` → `DmxSceneSequence` → `DmxSceneStep[]`. Hardware: `FtdiDeviceDto`. Live: `BeatReactiveRequest`, `BeatTapRequest`.

## modelsAiAudio.ts — AI Audio (214 linii)

18 interfejsów obejmujących:
- **ASR**: TranscribeRequest/Response
- **TTS**: SynthesizeRequest, TtsEngineRequest
- **Analysis**: AudioAnalysisResponse, RhythmResponse, PitchResponse, VadSegment
- **Tags**: MusicTag (tag + score)
- **Singing**: SingingOfflineScoreResponse, SingingLiveUpdate
- **SVS**: DiffSingerRequest, ViSingerRequest
- **SVC**: SoVitsConvertRequest, RvcConvertRequest
- **Generation**: MusicGenRequest, RiffusionRequest, AudioCraftRequest, WaveGanRequest

8 helper functions: `toFormData*` (Transcribe, Analyze, Vad, Separate, DiffSinger, ViSinger, SoVits, Rvc).

## modelsAiVideo.ts — Pose Detection (142 linii)

```typescript
type PoseEngine = "mediapipe" | "openpose" | "alphapose" | "vitpose";
```

2D: `PoseKeypoint2D` → `PosePerson2D` → `PoseDetectionResult` (single image), `Pose2DFrame` → `Pose2DSequenceResult` (video).

3D: `PoseKeypoint3D` → `PosePerson3D` → `Pose3DFrame` → `Pose3DSequenceResult`.

## modelsAuth.ts — Autentykacja (53 linii)

`LoginResponse` (success, tokenPair, requirePasswordChange), `RefreshRequest`, `SetTokenRequest`, `TidalAuthTokens`, `BuildUrlResponse` (OAuth), `RecaptchaVerifyRequest/Response`, `ChangePasswordWithRecaptchaRequest`.

## modelsPlayerLinks.ts — Player Links (105 linii)

```typescript
enum PlayerLinkScope { Progress=1, Appearance=2, KaraokeSettings=4, All=7 }
enum PlayerLinkStatus { Active=0, Revoked=1 }
```

`KaraokeBarFill` (cap, pattern, highlight, glow, glass, texture), `KaraokeFontSettings`, `KaraokeSettings` (filled/empty/gold bars + font). `PlayerLinkDto`, `PlayerLinkSearchResponse`.

## modelsPlaylistManager.ts — Playlist Manager (235 linii)

```typescript
enum PlaylistType { Static = "static", Dynamic = "dynamic" }
enum ViewMode { List, Grid, Compact, DualPane = "dual" }
enum DynamicRuleField { Artist, Title, Album, Genre, Year, Duration, Rating, PlayCount, Tag, Source, AddedDate }
enum DynamicRuleOperator { Equals, NotEquals, Contains, NotContains, StartsWith, GreaterThan, LessThan, Between, In, NotIn }
enum TrackSource { Library, Spotify, Tidal, YouTube, MusicBrainz, Import, Manual }
```

Key: `ManagedPlaylist` (tracks, dynamic rules, source platform sync), `PlaylistFolder` (hierarchia), `PlaylistTrack` (multi-source: spotifyId, tidalId, youtubeId, libraryFileId). DualPane: `PaneState`, `ClipboardState`. Import/Export: `PlaylistExportFormat`, `PlaylistImportOptions`.

## modelsWiki.ts — Wiki CMS (105 linii)

CRUD: `WikiPageCreateRequest` → `WikiPageFullDto` / `WikiPageListDto`. Navigation: `WikiNavCategoryDto` → `WikiNavItemDto[]` (drzewo). Search: `WikiSearchResultDto`. History: `WikiRevisionListDto` → `WikiRevisionDto`. Reorder: `WikiReorderItem[]`.

## modelsMusicPlatform.ts — Platformy (8 linii)

```typescript
enum MusicPlatform { None = 0, Spotify = 1, Tidal = 2, YouTube = 4, All = 7 }
```

Flagowy enum (bitwise OR) — `All = Spotify | Tidal | YouTube`.

## modelsLibrosa.ts — Librosa (59 linii)

13 interfejsów odpowiedzi Librosa: analyze, tempo, onsets, beatTrack, chromagram, MFCC, spectral centroid, HPSS, mel spectrogram, pitch track, VAD.

## game/modelsGame.ts — Phaser (12 linii)

```typescript
interface Player { id: number; name: string; micId?: string; volume: number; color?: string }
interface GameState { players: Player[]; mics: MediaDeviceInfo[] }
```

## Statystyki

| Kategoria | Ilość |
|-----------|------:|
| Pliki | 26 |
| Enumy | ~50 |
| Interfejsy | ~190 |
| Type aliases | ~15 |
| Stałe | 4 |
| Helper functions | 13 |
| Łącznie linii | ~3310 |
