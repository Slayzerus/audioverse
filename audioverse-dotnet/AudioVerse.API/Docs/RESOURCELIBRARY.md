# AudioVersee → AudioVerse — Plan scalenia

> Źródło: `c:\Users\Radko\source\repos\AudioVersee\AudioVersee-dotnet\`  


---

## 0. Analiza AudioVersee — co zawiera

### Domain (encje)
| Encja | Pola kluczowe | Odpowiednik w AudioVerse |
|-------|---------------|----------------------|
| `Song` | Id(int), Title, AlbumId, ISRC, PrimaryArtistId | ❌ Brak |
| `SongDetail` | SongId, Type(enum), Value(JSON) | ❌ Brak |
| `Artist` | Id(int), Name, NormalizedName | ❌ Brak |
| `ArtistDetail` | ArtistId, Bio, ImageUrl, Country, etc. | ❌ Brak |
| `ArtistFact` | ArtistId, Type(enum), Value | ❌ Brak |
| `Album` | Id(int), Title, ReleaseYear, CoverUrl, MusicBrainzIds | ❌ Brak |
| `AlbumArtist` | AlbumId, ArtistId, Role(enum) | ❌ Brak |
| `AudioFile` | Id(int), FilePath, FileName, Duration, SampleRate, Channels, BitDepth, SongId, AlbumId | ❌ Brak (AudioVerse ma `Document` ale to jest ogólne) |
| `MediaFile` | Id(int), FilePath, FileName, FileSizeBytes, MimeType, Codec, SongId, AlbumId | ❌ Brak |
| `KaraokeSongFile` | Id(int), SongId, Title, Artist, Genre, Language, Format(enum), Notes[] | ❌ Brak |
| `KaraokeNote` | Id(int), KaraokeSongFileId, Type, StartBeat, Length, Pitch, Text | ❌ Brak |

### Domain (enums)
| Enum | Wartości |
|------|---------|
| `AlbumArtistRole` | PrimaryArtist, FeaturedArtist, Producer, Composer, etc. |
| `ArtistFactType` | Biography, Discography, Award, Genre, etc. |
| `KaraokeFormat` | UltraStar, MidiKar, CDG, LRC, etc. |
| `SongDetailType` | Lyrics, Chords, Tabs, SheetMusic, etc. |

### Domain (interfejsy repo)
| Interface | Metody |
|-----------|--------|
| `ISongRepository` | GetAll, GetById, Search, Create, Update, Delete + paging |
| `IArtistRepository` | GetAll, GetById, Search, Create, Update, Delete |
| `IAlbumRepository` | GetAll, GetById, Create, Update, Delete |
| `IFileRepository` | GetById, GetBySongId, Add, Update, Delete |
| `IKaraokeRepository` | GetAll, GetById, Add, Update, Delete |
| `IUnitOfWork` | SaveChangesAsync |

### Application (serwisy) — UNIKALNE
| Serwis | Rola | W AudioVerse |
|--------|------|-----------|
| `SpotifyService` | Integracja z Spotify API (search, metadata) | ❌ Brak |
| `TidalService` | Integracja z Tidal API (auth, search, stream) | ❌ Brak |
| `YouTubeService` | Integracja z YouTube API (search, download) | ❌ Brak |
| `AudioFilesService` | Skanowanie katalogów, odczyt tagów (TagLib), auto-import | ❌ Brak |
| `UltrastarFileService` | Parsowanie/zapis plików UltraStar (.txt karaoke) | ❌ Brak |
| `UltrastarConverterService` | Konwersja formatów karaoke | ❌ Brak |
| `PlaylistService` | Tworzenie/zarządzanie playlistami | ❌ Brak |
| `SongInformationService` | Pobieranie info z MusicBrainz/Last.fm | ❌ Brak |
| `SongLicenseService` | Sprawdzanie licencji utworów | ❌ Brak |
| `AudioDownloadService` | Pobieranie audio z zewnętrznych źródeł | ❌ Brak |
| `AiAudioService` | AI: synteza mowy, separacja audio, RVC, DiffSinger, etc. | ❌ Brak |
| `AiVideoService` | AI: pose estimation, tracking 2D/3D | ❌ Brak |

### Application (CQRS) — 45+ commands, 40+ queries
Pełny CQRS z MediatR, FluentValidation — **zgodne z wzorcem AudioVerse**.

### Infrastructure
| Komponent | Opis |
|-----------|------|
| `LibraryDbContext` | EF Core DbContext (PostgreSQL) |
| 5 repozytoriów | Song, Artist, Album, File, Karaoke |
| `UnitOfWork` | Wrapper na SaveChanges |
| 10 EF Configurations | Fluent API konfiguracje |

### API (kontrolery)
| Controller | Endpointy |
|------------|-----------|
| `SongsController` | CRUD songs + search |
| `ArtistsController` | CRUD artists |
| `AlbumsController` | CRUD albums |
| `FilesController` | Upload/download/manage media files |
| `AudioController` | Audio-specific operations |
| `KaraokeController` | CRUD karaoke files + notes |
| `UltrastarController` | UltraStar file parsing/export |
| `PlaylistController` | Playlist management |
| `YouTubeController` | YouTube search/download |
| `DownloadController` | Generic download operations |
| `AiAudioController` | AI audio: TTS, separation, RVC, DiffSinger |
| `AiVideoController` | AI video: pose estimation, tracking |
| `AuthController` | Tidal OAuth2 auth |
| `LibrosaController` | Python librosa integration |

### Pokrywające się elementy (AudioVerse wygrywa)
- **MediatR** — oba używają. AudioVerse ma już konfigurację ✅
- **FluentValidation** — oba używają. AudioVerse ma już ✅
- **EF Core + PostgreSQL** — oba używają. AudioVerse ma `ApplicationDbContext` ✅
- **Swagger** — oba. AudioVerse ma + JWT security ✅
- **Health checks** — oba. AudioVerse ma bogatsze ✅
- **Prometheus** — oba. AudioVerse ma już ✅
- **API versioning** — oba Asp.Versioning.Mvc 8.1.1 ✅
- **Serilog** — oba. AudioVerse ma + Elasticsearch ✅
- **Mapster vs AutoMapper** — AudioVersee nie używa żadnego (ręczne mappowanie) → użyjemy Mapster ✅

---

## 1. Plan scalenia — etapy

### Etap 1: Domain — Encje i Enumy ✏️
Skopiować do `AudioVerse.Domain/Entities/MediaLibrary/`:
- [ ] `Song.cs`, `SongDetail.cs`
- [ ] `Artist.cs`, `ArtistDetail.cs`, `ArtistFact.cs`
- [ ] `Album.cs`, `AlbumArtist.cs`
- [ ] `AudioFile.cs`, `MediaFile.cs`
- [ ] `KaraokeSongFile.cs`, `KaraokeNote.cs`
- [ ] Enumy → `AudioVerse.Domain/Enums/MediaLibrary/`
- [ ] Dostosować: `int Id` → `Guid Id` (zgodnie z `BaseEntity`), dodać `BaseEntity` inheritance
- [ ] Interfejsy repo → `AudioVerse.Domain/Interfaces/MediaLibrary/`

### Etap 2: Infrastructure — DbContext + Repo
- [ ] Dodać DbSety do `ApplicationDbContext`
- [ ] Skopiować EF Configurations → `AudioVerse.Infrastructure/Data/Configurations/MediaLibrary/`
- [ ] Zmigrować repozytoria → `AudioVerse.Infrastructure/Repositories/MediaLibrary/`
- [ ] Zastąpić `LibraryDbContext` → `ApplicationDbContext`

### Etap 3: Application — DTOs + Commands + Queries + Handlers
- [ ] DTOs → `AudioVerse.Application/DTOs/MediaLibrary/`
- [ ] Commands → `AudioVerse.Application/Commands/MediaLibrary/`
- [ ] Queries → `AudioVerse.Application/Queries/MediaLibrary/`
- [ ] Handlers → `AudioVerse.Application/Handlers/MediaLibrary/`
- [ ] Validators → `AudioVerse.Application/Validation/MediaLibrary/`
- [ ] Zamienić ręczne mapowanie na Mapster

### Etap 4: Application — Serwisy
- [ ] `AudioVerse.Application/Services/MediaLibrary/` — AudioFilesService, UltrastarFileService, etc.
- [ ] `AudioVerse.Application/Services/MediaLibrary/Spotify/` — SpotifyService
- [ ] `AudioVerse.Application/Services/MediaLibrary/Tidal/` — TidalService
- [ ] `AudioVerse.Application/Services/MediaLibrary/YouTube/` — YouTubeService
- [ ] `AudioVerse.Application/Services/MediaLibrary/Ai/` — AiAudioService, AiVideoService
- [ ] `AudioVerse.Application/Services/MediaLibrary/Download/` — AudioDownloadService, etc.
- [ ] Przenieść Options classes → `AudioVerse.Application/Services/MediaLibrary/*/`

### Etap 5: API — Kontrolery
- [ ] `AudioVerse.API/Controllers/MediaLibrary/` — wszystkie kontrolery
- [ ] Zintegrować z istniejącym auth (JWT + [Authorize])
- [ ] Swagger automatycznie wykryje nowe endpointy
- [ ] Dodać FileUploadOperationFilter do Swagger config

### Etap 6: DI Registration
- [ ] `AudioVerse.Application/DependencyInjection.cs` — zarejestrować nowe serwisy
- [ ] `AudioVerse.Infrastructure/DependencyInjection.cs` — zarejestrować nowe repo
- [ ] Dodać konfigurację Options: Spotify, Tidal, YouTube, AudioFiles, Ultrastar, AI
- [ ] Dodać pakiety NuGet (jeśli brakuje): TagLib#, NAudio, etc.

### Etap 7: Testy
- [ ] Przenieść testy z `AudioVersee.*.Tests` → `AudioVerse.Tests/Unit/MediaLibrary/`
- [ ] Dostosować do `DbContextHelper` i `ApiTestFactory`

### Etap 8: Docker/utils (opcjonalnie)
- [ ] AI utils (Python: wavegan, librosa) → osobny kontener, AudioVerse wywołuje przez HTTP
- [ ] docker-compose merge (jeśli potrzebne)

---

## 2. Zasady migracji

1. **Namespace**: `AudioVersee.*` → `AudioVerse.*.MediaLibrary.*`
2. **Id type**: `int` → `Guid` (zgodnie z `BaseEntity`)
3. **Base class**: Wszystkie encje dziedziczą z `BaseEntity` (soft delete, audit, IsDeleted)
4. **Mapping**: Ręczne → Mapster (zgodnie z copilot-instructions)
5. **DbContext**: `LibraryDbContext` → `ApplicationDbContext`
6. **Auth**: Dodać `[Authorize]` tam gdzie brak (AudioVersee nie miał pełnego auth)
7. **Multi-tenancy**: Encje które powinny być per-tenant → dodać `ITenantEntity`
8. **Paging**: `PageResult<T>` z AudioVersee → użyć istniejącego z AudioVerse (jeśli jest) lub zachować

---

## 3. Postęp

| Etap | Status | Uwagi |
|------|--------|-------|
| 1. Domain | ✅ | 10 encji (Song, SongDetail, Artist, ArtistDetail, ArtistFact, Album, AlbumArtist, LibraryAudioFile, LibraryMediaFile, PageResult). 3 enumy (AlbumArtistRole, ArtistFactType, SongDetailType). Każdy typ w osobnym pliku. |
| 2. Infrastructure | ✅ | 9 DbSetów w AudioVerseDbContext. Pełna EF Fluent config: tabele Library*, FK, indeksy. |
| 3. Application CQRS | ✅ | Kontrolery bezpośrednio na DbContext (inline CRUD). |
| 4. Application Services | ✅ | 15 serwisów: SpotifyService, TidalService, YouTubeSearchService, AiAudioService, AiVideoService, SongInformationService, SongLicenseService, PlaylistService, AudioFilesService, UltrastarFileService, UltrastarConverterService, DownloadService. Każdy interface + klasa + opcje w osobnym pliku. |
| 5. API Controllers | ✅ | 12 kontrolerów: Songs, Artists, Albums, MediaFiles, ExternalSearch, AiAudio, AiVideo, AudioScan, Playlist, SongLookup, SongLicense, Ultrastar, Download. Wszystko pod /api/media/. [Authorize]. Każdy w osobnym pliku. |
| 6. DI Registration | ✅ | Program.cs: Options (Spotify, Tidal, YouTube, AiAudio, AiVideo, AudioFiles, Ultrastar) + HttpClient + singleton registrations (15 serwisów). |
| 7. Testy | ✅ | 14 testów MediaLibrary: Song CRUD+Update+Delete, Album CRUD+Delete, Artist CRUD+Update+Facts+Detail, AudioFile, MediaFile, SongDetail, External import, Ultrastar LRC convert, Download, License, Playlist. 142 total passed. |
| 8. Docker/AI | ✅ | AI services call external Python containers via HTTP (configurable BaseUrl). |