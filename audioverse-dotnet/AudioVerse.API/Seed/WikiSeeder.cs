using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AudioVerse.API.Seed;

/// <summary>
/// Seeduje strony wiki z dokumentacją backendową.
/// Kategorie „Frontend" i „Mobile" są tworzone jako puste placeholdery — do uzupełnienia przez zespoły.
/// </summary>
public static class WikiSeeder
{
    public static async Task SeedWikiPages(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

        if (await db.WikiPages.AnyAsync())
            return;

        var pages = new List<WikiPage>();
        var now = DateTime.UtcNow;

        // ────────────────────────────────────────────────
        //  Kategoria: Wprowadzenie
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "home",
            Title = "AudioVerse — Wiki",
            Category = "Wprowadzenie",
            SortOrder = 0,
            IsPublished = true,
            Tags = "home,start,index",
            ContentMarkdown = """
                # AudioVerse — Wiki

                Witaj w dokumentacji projektu **AudioVerse**.

                ## Nawigacja

                | Kategoria | Opis |
                |---|---|
                | **Wprowadzenie** | Opis projektu, architektura, quick start |
                | **API — Backend** | Endpointy, CQRS, konfiguracja, serwisy zewnętrzne |
                | **Karaoke** | Moduł karaoke — sesje, scoring, Ultrastar |
                | **Integracje** | Spotify, Tidal, YouTube, IGDB, TMDB, Steam |
                | **Infrastruktura** | Docker, MinIO, PostgreSQL, Redis |
                | **Admin** | Panel admina, moderacja, wiki |
                | **Frontend** | Pełna dokumentacja frontendu React (30 stron) |
                | **Tech Stack** | Użyte technologie — backend, frontend, AI, integracje |
                | **Mobile** | *(do uzupełnienia przez zespół mobile)* |

                ## Metryki projektu

                > .NET 10 · 1441 plików C# · 55k+ LOC · 49 kontrolerów · 587 endpointów · 162 encje · 243 handlery · 5 SignalR Hubs · 254+ testów

                ## Linki

                - Swagger UI: `http://localhost:5000/swagger`
                - Azure DevOps: `https://dev.azure.com/audioverse/AudioVerse`
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "architecture",
            Title = "Architektura",
            Category = "Wprowadzenie",
            SortOrder = 1,
            IsPublished = true,
            Tags = "architektura,cqrs,layers,clean",
            ContentMarkdown = """
                # Architektura

                ## Warstwy

                ```
                ┌──────────────────────────────────────────────────────────────┐
                │  AudioVerse.API  (.NET 10 Web API)                           │
                │  49 Controllers · 5 Hubs (SignalR) · Middleware · Program.cs │
                ├──────────────────────────────────────────────────────────────┤
                │  AudioVerse.Application  (CQRS: Commands / Queries)          │
                │  243 MediatR Handlers · Models · DTOs · Services · Validators│
                ├──────────────────────────────────────────────────────────────┤
                │  AudioVerse.Domain  (Entities · Enums · Repository contracts)│
                │  162 encje w 12 obszarach domenowych                         │
                ├──────────────────────────────────────────────────────────────┤
                │  AudioVerse.Infrastructure  (EF Core · Dapper · External)    │
                │  Persistence · Repositories · Email · External APIs          │
                ├──────────────────────────────────────────────────────────────┤
                │  AudioVerse.Tests  (xUnit · Moq · Integration + Unit)        │
                └──────────────────────────────────────────────────────────────┘
                ```

                ## CQRS (Command Query Responsibility Segregation)

                - Każda operacja to **Command** (zapis) lub **Query** (odczyt).
                - Handlery MediatR w `AudioVerse.Application/Handlers/`.
                - Walidacja przez FluentValidation w `Validators/`.
                - Kontrolery tylko delegują do MediatR — zero logiki biznesowej.

                ## Repository Pattern

                - Kontrakty w `AudioVerse.Domain/Repositories/`.
                - Dwie implementacje: **EF Core** (domyślna) i **Dapper** (raw SQL, wydajność).
                - DI rejestracja w `AudioVerse.Infrastructure/DependencyInjection.cs`.

                ## Error Handling

                - `ExceptionHandlingMiddleware` — mapuje wyjątki na RFC 7807 Problem Details.
                - Wyjątki: `NotFoundException`, `BadRequestException`, `NotAuthorizedException`.
                - Korelacja: `X-Correlation-ID` header (auto-generowany).

                ## Encje domenowe (162)

                | Obszar | Liczba | Przykłady |
                |---|---|---|
                | Events | 35 | Event, Participant, Comment, Photo, Poll, Billing |
                | Karaoke | 25 | KaraokeSongFile, KaraokeSession, KaraokeRound |
                | Audio | 20 | AudioFile, AudioTag, AudioScan |
                | Games | 18 | BoardGame, VideoGame, GameSession |
                | Media | 18 | Song, Album, Artist, Playlist, Soundfont |
                | Editor | 15 | EditorProject, EditorLayer, AudioClip |
                | UserProfiles | 8 | UserProfile, UserProfilePlayer, UserDevice |
                | Admin | 7 | AuditLog, SystemConfiguration, WikiPage |
                | Auth | 6 | PasswordHistory, OneTimePassword |
                | DMX | 6 | DmxScene, DmxSequence |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "getting-started",
            Title = "Pierwsze kroki",
            Category = "Wprowadzenie",
            SortOrder = 2,
            IsPublished = true,
            Tags = "setup,install,docker,start",
            ContentMarkdown = """
                # Pierwsze kroki

                ## Wymagania

                - .NET 10 SDK
                - PostgreSQL 16+ (lub SQLite do dev)
                - MinIO (object storage)
                - Redis (opcjonalny)
                - Docker Desktop (do infrastruktury)

                ## Quick start

                ```bash
                # 1. Klonowanie
                git clone https://dev.azure.com/audioverse/AudioVerse/_git/AudioVerse
                cd audioverse-dotnet

                # 2. Przywrócenie pakietów
                dotnet restore

                # 3. User secrets (klucze API)
                cd AudioVerse.API
                dotnet user-secrets set "Spotify:ClientId" "YOUR_ID"
                dotnet user-secrets set "Spotify:ClientSecret" "YOUR_SECRET"
                dotnet user-secrets set "YouTube:ApiKey" "YOUR_KEY"
                dotnet user-secrets set "Igdb:ClientId" "YOUR_TWITCH_CLIENT_ID"
                dotnet user-secrets set "Igdb:ClientSecret" "YOUR_TWITCH_CLIENT_SECRET"
                dotnet user-secrets set "Tmdb:ApiKey" "YOUR_TMDB_KEY"
                dotnet user-secrets set "Tidal:ClientId" "YOUR_ID"
                dotnet user-secrets set "Tidal:ClientSecret" "YOUR_SECRET"

                # 4. Infrastruktura
                cd Env
                docker-compose up -d

                # 5. Migracje
                cd ..
                dotnet ef database update --project AudioVerse.API --startup-project AudioVerse.API

                # 6. Uruchomienie
                dotnet run --project AudioVerse.API
                # → http://localhost:5000/swagger
                ```

                ## Seedowane dane

                Przy pierwszym uruchomieniu automatycznie seedowane są:

                | Dane | Źródło | Opis |
                |---|---|---|
                | Admin user | `IdentitySeeder` | admin@audioverse.local / Admin123! |
                | Piosenki karaoke | `Seed/Ultrastar/` | Ultrastar TXT + audio |
                | Soundfonty (5 banków) | `Seed/Soundfonts/` | SF2 → MinIO |
                | Pliki audio (prywatne) | `Seed/Music/` | Prywatne pliki admina |
                | Sample (publiczne) | `Seed/Samples/` | CC0 sample do edytora |
                | Gatunki muzyczne | `SeedRunner` | ~20 gatunków |
                | Wiki | `WikiSeeder` | Dokumentacja backendowa |

                ## Testy

                ```bash
                dotnet test AudioVerse.Tests
                # Passed! — Failed: 0, Passed: 269, Skipped: 0
                ```

                > ⚠️ Nie uruchamiaj `dotnet test` z terminala Copilot — może się zawiesić.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/endpoints",
            Title = "Endpointy API — przegląd",
            Category = "API — Backend",
            SortOrder = 0,
            IsPublished = true,
            Tags = "api,endpoints,swagger,rest",
            ContentMarkdown = """
                # Endpointy API — przegląd

                > 587 endpointów w 49 kontrolerach, 8 grup Swagger

                ## Swagger Groups

                | Grupa | Prefix | Kontrolery |
                |---|---|---|
                | **Auth & User** | `/api/user` | UserController, ExternalConnectionsController |
                | **Events** | `/api/events`, `/api/invites`, `/api/leagues`, `/api/betting` | EventsController, PollsController, BillingController, LeaguesController, FantasyController, BettingController |
                | **Karaoke** | `/api/karaoke` | KaraokeController, KaraokeChannelController, UltrastarController |
                | **Games** | `/api/games` | BoardGamesController, VideoGamesController |
                | **Media Library** | `/api/library` | SongsController, AlbumsController, ArtistsController, SoundfontsController, MoviesController, BooksController |
                | **Editor & DMX** | `/api/editor`, `/api/dmx` | EditorController, DmxController |
                | **AI** | `/api/ai` | AiAudioController, AiVideoController |
                | **Admin** | `/api/admin`, `/api/wiki` | AdminController, WikiController, ModerationController |

                ## Autoryzacja

                - JWT Bearer Token: `Authorization: Bearer <token>`
                - Endpointy z `[Authorize]` wymagają tokena
                - Endpointy z `[Authorize(Roles = "Admin")]` wymagają roli Admin
                - Endpointy z `[AllowAnonymous]` są publiczne

                ## Konwencje

                - Error format: RFC 7807 Problem Details (`application/problem+json`)
                - Korelacja: `X-Correlation-ID` header
                - Paginacja: `?page=1&pageSize=20`
                - Sortowanie: `?sortBy=name&descending=false`

                ## SignalR Hubs

                | Hub | Path | Opis |
                |---|---|---|
                | KaraokeHub | `/hubs/karaoke` | Lobby, czat, WebRTC, scoring |
                | EditorHub | `/hubs/editor` | Kolaboracja real-time |
                | NotificationHub | `/hubs/notifications` | Push notifications |
                | AdminHub | `/hubs/admin` | Audit log, config changes |
                | ModerationHub | `/hubs/moderation` | Abuse reports |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/auth",
            Title = "Autoryzacja i użytkownicy",
            Category = "API — Backend",
            SortOrder = 1,
            IsPublished = true,
            Tags = "auth,jwt,login,register,totp,2fa",
            ContentMarkdown = """
                # Autoryzacja i użytkownicy

                ## Rejestracja i logowanie

                | Metoda | URL | Opis |
                |---|---|---|
                | `POST` | `/api/user/register` | Rejestracja (rate limited: 10/min) |
                | `POST` | `/api/user/login` | Logowanie → JWT token |
                | `POST` | `/api/user/refresh-token` | Odświeżenie tokena |
                | `GET` | `/api/user/profile` | Profil zalogowanego |
                | `PUT` | `/api/user/profile` | Aktualizacja profilu |

                ## 2FA (TOTP)

                | Metoda | URL | Opis |
                |---|---|---|
                | `POST` | `/api/user/totp/enable` | Włączenie 2FA |
                | `POST` | `/api/user/totp/verify` | Weryfikacja kodu |

                ## Połączenia zewnętrzne (OAuth)

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/user/connections` | Lista połączonych platform |
                | `GET` | `/api/user/connections/{platform}/auth-url` | URL autoryzacji OAuth |
                | `POST` | `/api/user/connections/{platform}/callback` | Wymiana kodu na token |
                | `POST` | `/api/user/connections/{platform}/refresh` | Odświeżenie tokena |
                | `DELETE` | `/api/user/connections/{platform}` | Odłączenie konta |

                Obsługiwane platformy: `spotify`, `tidal`, `google`, `youtube`, `discord`, `twitch`, `microsoft`, `steam`, `bgg`

                ## Powiadomienia

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/user/notifications` | Lista (`?unreadOnly=true`) |
                | `GET` | `/api/user/notifications/unread-count` | Liczba nieprzeczytanych |
                | `POST` | `/api/user/notifications/{id}/read` | Oznacz jako przeczytane |
                | `POST` | `/api/user/notifications/read-all` | Oznacz wszystkie |

                ## Gracze (Players)

                Każdy profil może mieć wielu graczy (np. do karaoke).

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/user/profiles/{id}/players` | Lista graczy |
                | `POST` | `/api/user/profiles/{id}/players` | Tworzenie gracza |
                | `PUT` | `/api/user/profiles/{id}/players/{playerId}` | Aktualizacja |
                | `DELETE` | `/api/user/profiles/{id}/players/{playerId}` | Usunięcie |

                Pola gracza: `Name`, `PreferredColors` (CSV hex), `FillPattern` (domyślnie „Pill"), `IsPrimary`.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/events",
            Title = "Eventy",
            Category = "API — Backend",
            SortOrder = 2,
            IsPublished = true,
            Tags = "events,party,billing,polls,recurrence",
            ContentMarkdown = """
                # Eventy

                ## CRUD

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events` | Lista z filtrowaniem i paginacją |
                | `GET` | `/api/events/{id}` | Szczegóły eventu |
                | `POST` | `/api/events` | Tworzenie |
                | `PUT` | `/api/events/{id}` | Aktualizacja |
                | `DELETE` | `/api/events/{id}` | Hard delete |
                | `DELETE` | `/api/events/{id}/soft` | Soft delete |
                | `POST` | `/api/events/{id}/restore` | Przywrócenie (admin) |
                | `GET` | `/api/events/{id}/export/pdf` | Export do PDF |

                **Filtrowanie:** `?query=&types=&statuses=&startFrom=&startTo=&page=1&pageSize=20&sortBy=startTime`

                ## Sub-zasoby

                - Zdjęcia: `POST/GET /api/events/{id}/photos`
                - Komentarze: `POST/GET /api/events/{id}/comments`
                - Uczestnicy: `POST/GET /api/events/{id}/participants`
                - Propozycje dat: `GET/POST /api/events/{id}/date-proposals`
                - Propozycje gier/piosenek: `GET/POST /api/events/{id}/game-picks`, `song-picks`

                ## Billing (podział kosztów)

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events/{id}/billing/expenses` | Lista wydatków |
                | `POST` | `/api/events/{id}/billing/expenses` | Dodaj wydatek |
                | `POST` | `/api/events/{id}/billing/split` | Podział kosztów |
                | `GET` | `/api/events/{id}/billing/settlement` | Kto komu ile |

                ## Ankiety (Polls)

                | Metoda | URL | Opis |
                |---|---|---|
                | `POST` | `/api/events/{id}/polls` | Tworzenie ankiety |
                | `POST` | `/api/events/polls/{pollId}/vote` | Głosowanie |
                | `GET` | `/api/events/polls/{pollId}/results` | Wyniki |

                ## EventType enum

                `Event=0, Party=1, Meeting=2, GameNight=3, KaraokeNight=4, MovieNight=5, BookClub=6, SportWatch=7, SportPlay=8, TvShowWatch=9, Custom=99`
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/media-library",
            Title = "Biblioteka mediów",
            Category = "API — Backend",
            SortOrder = 3,
            IsPublished = true,
            Tags = "songs,albums,artists,playlists,soundfonts,movies,books",
            ContentMarkdown = """
                # Biblioteka mediów

                ## Songs, Albums, Artists

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET/POST` | `/api/library/songs` | CRUD piosenek |
                | `GET/POST` | `/api/library/albums` | CRUD albumów |
                | `GET/POST` | `/api/library/artists` | CRUD artystów |
                | `GET/POST` | `/api/library/playlists` | CRUD playlist |
                | `GET` | `/api/library/external/search?provider=&query=` | Wyszukiwanie Spotify/YouTube |

                ## Soundfonts (SF2/SFZ/DLS)

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/library/soundfonts` | Lista (`?query=&format=&page=&pageSize=`) |
                | `POST` | `/api/library/soundfonts` | Tworzenie (metadata JSON) |
                | `POST` | `/api/library/soundfonts/{id}/files` | Upload (multipart, max 500MB) |
                | `GET` | `/api/library/soundfonts/files/{fileId}/download` | Presigned URL (1h) |

                **Format enum:** `SF2=0, SF3=1, SFZ=2, DLS=3, GIG=4, Single=5, Other=99`

                ## Filmy, Książki, Seriale, Sport

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET/POST` | `/api/library/movies` | CRUD filmów (TMDB import) |
                | `GET/POST` | `/api/library/books` | CRUD książek (Google Books) |
                | `GET/POST` | `/api/library/tv-shows` | CRUD seriali (TMDB import) |
                | `GET/POST` | `/api/library/sports` | CRUD sportów (TheSportsDB) |

                ## Pliki audio — widoczność

                - `GET /api/library/files/audio` — publiczne + własne prywatne
                - Pliki z `Seed/Music` → prywatne admina (`IsPrivate=true, OwnerId=1`)
                - Pliki z `Seed/Samples` → publiczne (`IsPrivate=false`)
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/games",
            Title = "Gry planszowe i wideo",
            Category = "API — Backend",
            SortOrder = 4,
            IsPublished = true,
            Tags = "games,board,video,bgg,igdb,steam",
            ContentMarkdown = """
                # Gry planszowe i wideo

                ## Board Games

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/games/board` | Lista (paginacja + filtrowanie) |
                | `POST` | `/api/games/board` | Dodanie |
                | `GET` | `/api/games/board/bgg/search?query=` | Szukanie na BGG |
                | `POST` | `/api/games/board/bgg/import/{bggId}` | Import z BGG |
                | `GET` | `/api/games/board/bgg/hot` | Hot z BGG (cache 15min) |
                | `GET` | `/api/games/board/stats/player/{playerId}` | Statystyki gracza |

                ## Video Games

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/games/video` | Lista (paginacja) |
                | `POST` | `/api/games/video` | Dodanie |
                | `GET` | `/api/games/video/igdb/search?query=` | Szukanie na IGDB |
                | `POST` | `/api/games/video/igdb/import/{igdbId}` | Import z IGDB |

                ## Integracje

                - **BGG** — BoardGameGeek XML API (bez klucza, rate limiting)
                - **IGDB** — Twitch OAuth2 client credentials → `Igdb:ClientId` + `Igdb:ClientSecret`
                - **Steam** — Steam Web API → `Steam:ApiKey` (import kolekcji użytkownika)
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/editor-dmx",
            Title = "Audio Editor i DMX",
            Category = "API — Backend",
            SortOrder = 5,
            IsPublished = true,
            Tags = "editor,dmx,audio,effects,layers,collaboration",
            ContentMarkdown = """
                # Audio Editor i DMX

                ## Audio Editor (44 endpointy)

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET/POST` | `/api/editor/projects` | CRUD projektów |
                | `POST/PUT/DELETE` | `/api/editor/layer` | Warstwy |
                | `POST` | `/api/editor/audioclip` | Upload klipu |
                | `GET/POST/PUT/DELETE` | `/api/editor/effects` | Efekty audio |
                | `POST` | `/api/editor/project/{id}/export` | Export → taskId |
                | `GET` | `/api/editor/export/{taskId}/status` | Status exportu |
                | `GET/POST/DELETE` | `/api/editor/sample-packs` | Paczki sampli |

                ### Kolaboracja (EditorHub)

                - `JoinProject(projectId)` / `LeaveProject(projectId)`
                - `SendItemChange(change)` — OT/CRDT
                - `SendCursorPosition(pos)` — pozycja kursora
                - `LockSection(sectionId)` / `UnlockSection(sectionId)`

                ## DMX (18 endpointów)

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/dmx/state` | Stan DMX |
                | `POST` | `/api/dmx/port/open` | Otwarcie portu |
                | `PUT` | `/api/dmx/channel/{ch}` | Kanał (0–255) |
                | `POST` | `/api/dmx/blackout` | Blackout |
                | `POST` | `/api/dmx/scenes/{id}/apply` | Scena |
                | `POST` | `/api/dmx/sequences/{id}/run` | Sekwencja |
                | `POST` | `/api/dmx/beat-reactive/start` | Beat-reactive mode |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/ai",
            Title = "AI — Audio i Video",
            Category = "API — Backend",
            SortOrder = 6,
            IsPublished = true,
            Tags = "ai,whisper,tts,demucs,musicgen,pose",
            ContentMarkdown = """
                # AI — Audio i Video

                > Wszystkie serwisy AI to self-hosted Docker containers. Endpointy zwracają 503 jeśli serwis jest niedostępny.

                ## Audio AI

                | Metoda | URL | Serwis | Opis |
                |---|---|---|---|
                | `POST` | `/api/ai/audio/transcribe` | Faster Whisper | Speech-to-text |
                | `POST` | `/api/ai/audio/synthesize` | Piper / Coqui | Text-to-speech |
                | `POST` | `/api/ai/audio/analyze` | Audio Analysis | Analiza audio |
                | `POST` | `/api/ai/audio/separate` | Demucs | Separacja vocals/instrumental |
                | `POST` | `/api/ai/audio/rvc` | RVC | Voice conversion |
                | `POST` | `/api/ai/audio/musicgen` | AudioCraft | Generowanie muzyki |

                ## Video AI

                | Metoda | URL | Serwis | Opis |
                |---|---|---|---|
                | `POST` | `/api/ai/video/pose` | MediaPipe/OpenPose | Pose estimation |

                ## Konfiguracja (appsettings.json)

                ```json
                "AiAudio": {
                  "FasterWhisperBaseUrl": "http://asr_fw:8000/v1",
                  "PiperBaseUrl": "http://tts_piper:5000",
                  "SeparateBaseUrl": "http://audio_separate:8086",
                  "AudioCraftBaseUrl": "http://audiocraft:7861"
                }
                ```
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Karaoke
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "karaoke/overview",
            Title = "Karaoke — przegląd",
            Category = "Karaoke",
            SortOrder = 0,
            IsPublished = true,
            Tags = "karaoke,sessions,rounds,scoring,ultrastar",
            ContentMarkdown = """
                # Karaoke — przegląd

                ## Endpointy

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/karaoke/events/{eventId}` | Status eventu karaoke |
                | `POST` | `/api/karaoke/events/{eventId}/join` | Dołączenie |
                | `POST` | `/api/karaoke/sessions` | Tworzenie sesji |
                | `GET` | `/api/karaoke/rounds/{roundId}` | Szczegóły rundy |
                | `POST` | `/api/karaoke/events/{eventId}/tournament` | Auto-generowanie turnieju |
                | `GET` | `/api/karaoke/queue/{eventId}` | Kolejka piosenek |

                ## Tryby sesji (KaraokeSessionMode)

                `Classic=0, Tournament=1, Knockout=2, Casual=3`

                ## Tryby rundy (KaraokeRoundMode)

                `Normal=0, Demo=1, NoLyrics=2, NoTimeline=3, Blindfold=4, SpeedUp=5, SlowDown=6`

                ## Kolaboracja i wersjonowanie piosenek

                - `GET /api/karaoke/songs/{songId}/collaborators`
                - `POST /api/karaoke/songs/{songId}/collaborators` — dodanie z uprawnieniem
                - `GET /api/karaoke/songs/{songId}/versions` — historia wersji
                - `POST /api/karaoke/songs/{songId}/versions/{ver}/revert` — przywrócenie

                ## KaraokeHub (`/hubs/karaoke`)

                | Metoda | Kierunek | Opis |
                |---|---|---|
                | `JoinLobby(eventId)` | Client → Server | Dołączenie do lobby |
                | `SendChatMessage(eventId, msg)` | Client → Server | Czat |
                | `SendOffer/Answer/IceCandidate` | Client → Server | WebRTC signaling |
                | `StartRound(roundId)` | Client → Server | Start rundy |
                | `UpdateScore(data)` | Client → Server | Aktualizacja wyniku |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Integracje
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "integrations/overview",
            Title = "Integracje — przegląd",
            Category = "Integracje",
            SortOrder = 0,
            IsPublished = true,
            Tags = "spotify,tidal,youtube,igdb,tmdb,steam,bgg",
            ContentMarkdown = """
                # Integracje z serwisami zewnętrznymi

                ## Status kluczy API

                | Serwis | Konfiguracja | Wymagany | Jak zdobyć |
                |---|---|---|---|
                | **Spotify** | `Spotify:ClientId` + `ClientSecret` | ✅ | [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) |
                | **Tidal** | `Tidal:ClientId` + `ClientSecret` | Opcjonalny | [developer.tidal.com](https://developer.tidal.com/) |
                | **YouTube** | `YouTube:ApiKey` | ✅ | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) → YouTube Data API v3 |
                | **IGDB** | `Igdb:ClientId` + `ClientSecret` | ✅ | [dev.twitch.tv/console](https://dev.twitch.tv/console/apps) → Client Credentials |
                | **TMDB** | `Tmdb:ApiKey` | ✅ | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |
                | **Steam** | `Steam:ApiKey` | Ustawiony | [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey) |
                | **Google Books** | `GoogleBooks:ApiKey` | Opcjonalny | Działa bez klucza (niższy limit) |
                | **TheSportsDB** | `TheSportsDb:ApiKey` | Opcjonalny | Free tier klucz `"3"` |
                | **BGG** | — | ✅ (bez klucza) | XML API, rate limited |
                | **reCAPTCHA** | `RecaptchaSettings:SecretKey` | Ustawiony | [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) |

                ## OAuth — łączenie kont użytkowników

                Użytkownicy mogą podłączyć konta zewnętrzne przez OAuth:

                1. Frontend: `GET /api/user/connections/{platform}/auth-url?redirectUri=...`
                2. Redirect użytkownika na URL
                3. Po autoryzacji: `POST /api/user/connections/{platform}/callback` z `{ code, redirectUri }`
                4. Backend wymienia code, pobiera profil, zapisuje `UserExternalAccount`

                Obsługiwane: `spotify`, `tidal`, `google`, `youtube`, `discord`, `twitch`, `microsoft`, `steam`, `bgg`
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Infrastruktura
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "infra/docker",
            Title = "Docker i docker-compose",
            Category = "Infrastruktura",
            SortOrder = 0,
            IsPublished = true,
            Tags = "docker,compose,postgresql,minio,redis,mailhog",
            ContentMarkdown = """
                # Docker i docker-compose

                ## Pełny stack

                ```bash
                cd AudioVerse.API/Env
                docker-compose up -d
                ```

                Uruchamia:
                - **PostgreSQL 16** — port 5433
                - **MinIO** — port 9000 (konsola: 9001), credentials: minioadmin/minioadmin
                - **Redis** — port 6379
                - **MailHog** — SMTP port 1025, web UI port 8025

                ## Budowanie obrazu API

                ```bash
                docker build -t audioverse-api:latest -f AudioVerse.API/Dockerfile .
                docker run -e ASPNETCORE_ENVIRONMENT=Production -p 5000:80 audioverse-api:latest
                ```

                ## Konfiguracja appsettings.json

                ```json
                "ConnectionStrings": {
                  "PostgresConnection": "Host=localhost;Port=5433;Database=audioverse;Username=postgres;Password=haslo123",
                  "Redis": "localhost:6379",
                  "Minio": "http://localhost:9000"
                },
                "Minio": {
                  "AccessKey": "minioadmin",
                  "SecretKey": "minioadmin"
                },
                "Smtp": {
                  "Host": "localhost",
                  "Port": 1025,
                  "From": "no-reply@audioverse.local"
                }
                ```
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "infra/minio",
            Title = "MinIO — Object Storage",
            Category = "Infrastruktura",
            SortOrder = 1,
            IsPublished = true,
            Tags = "minio,storage,s3,buckets,presigned",
            ContentMarkdown = """
                # MinIO — Object Storage

                ## Buckety

                | Bucket | Opis |
                |---|---|
                | `audio-files` | Pliki audio (prywatne + publiczne) |
                | `karaoke-recordings` | Nagrania karaoke |
                | `party-posters` | Plakaty eventów (publiczny bucket) |
                | `soundfonts` | Pliki SF2/SFZ/DLS |

                ## Presigned URLs

                - Pliki pobierane przez presigned URL (1h ważności)
                - Cache presigned URLs: 500 pozycji, odświeżanie 60s przed wygaśnięciem
                - Endpointy download zwracają presigned URL, NIE streaming

                ## Upload

                - Pliki soundfont: `POST /api/library/soundfonts/{id}/files` (multipart, max 500MB)
                - Pliki audio: upload przez kontroler MediaFiles
                - SHA-256 hash zapisywany przy uploadzie

                ## Konsola MinIO

                Dostępna na `http://localhost:9001` (login: minioadmin/minioadmin)
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Admin
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "admin/overview",
            Title = "Panel admina",
            Category = "Admin",
            SortOrder = 0,
            IsPublished = true,
            Tags = "admin,dashboard,users,audit,moderation",
            ContentMarkdown = """
                # Panel admina

                ## Dashboard

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/admin/dashboard` | Statystyki zbiorcze |
                | `GET` | `/api/admin/users/list` | Lista użytkowników |
                | `POST` | `/api/admin/users/{userId}/ban` | Ban (tymczasowy/stały) |
                | `GET` | `/api/admin/audit` | Audit log |
                | `GET` | `/api/admin/login-attempts` | Logi logowań |
                | `GET` | `/api/admin/system-config` | Konfiguracja systemowa |
                | `PUT` | `/api/admin/system-config` | Aktualizacja konfiguracji |

                ## Moderacja

                | Metoda | URL | Opis |
                |---|---|---|
                | `POST` | `/api/moderation/report` | Zgłoszenie nadużycia |
                | `GET` | `/api/moderation/reports` | Lista zgłoszeń (admin) |
                | `POST` | `/api/moderation/reports/{id}/resolve` | Rozstrzygnięcie |

                ## Real-time (AdminHub)

                - `BroadcastNewAuditLog` — nowy wpis audit log
                - `BroadcastSystemConfigChanged` — zmiana konfiguracji
                - `BroadcastLogEntry` — real-time logi aplikacji

                ## Wiki

                Dokumentacja przechowywana w bazie. Endpointy: `/api/wiki/*`.
                Admin może tworzyć, edytować i usuwać strony.
                Frontend renderuje markdown z `contentMarkdown`.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Frontend (placeholder)
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "frontend/home",
            Title = "Frontend — dokumentacja",
            Category = "Frontend — React",
            SortOrder = 0,
            IsPublished = true,
            Tags = "frontend,react,typescript,vite",
            Icon = "layout",
            ContentMarkdown = """
                # Frontend — dokumentacja

                > Strony w tej sekcji są automatycznie seedowane z plików markdown w `audioverse-react/docs/wiki/`.

                ## Technologie

                | Warstwa | Technologia | Logo |
                |---|---|---|
                | Framework | React 18 + TypeScript | ⚛️ |
                | Bundler | Vite | ⚡ |
                | Routing | React Router v6 | 🧭 |
                | Stan | React Context API + TanStack React-Query | 🔄 |
                | HTTP | Axios | 📡 |
                | Stylowanie | Bootstrap 5 + CSS Modules | 🎨 |
                | i18n | react-i18next (pl, en) | 🌐 |
                | Testy | Vitest + React Testing Library (1578+ testów) | ✅ |
                | E2E | Playwright + Cypress | 🎭 |
                | Gra 2D | Phaser 3 + Zustand (Honest Living RPG) | 🎮 |
                | Audio | Web Audio API + CREPE/Aubio | 🎙️ |
                | MIDI | Web MIDI API | 🎹 |
                | Pose | MediaPipe (dance detection) | 💃 |
                | Real-time | SignalR + WebRTC | 📡 |
                | DMX | FTDI/WebSerial | 💡 |

                ## Nawigacja wiki

                Pełna dokumentacja frontendowa podzielona jest na 30 stron — wybierz temat z nawigacji bocznej (kategoria **Frontend — React**).

                ## Linki do API

                - Swagger UI: `http://localhost:5000/swagger`
                - Endpointy: [Endpointy API](/api/wiki/api/endpoints)
                - Autoryzacja JWT: [Auth](/api/wiki/api/auth)
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Tech Stack
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "tech-stack/overview",
            Title = "Tech Stack — przegląd",
            Category = "Tech Stack",
            SortOrder = 0,
            IsPublished = true,
            Tags = "tech,stack,technologies,overview",
            Icon = "cpu",
            ContentMarkdown = """
                # Tech Stack — przegląd

                AudioVerse to platforma fullstack składająca się z backendu .NET, frontendu React i mikroserwisów AI.

                ---

                ## 🖥️ Backend (.NET 10)

                | Kategoria | Technologia | Wersja | Opis |
                |---|---|---|---|
                | 🏗️ Framework | **.NET 10** | 10.0 | Web API, CQRS, Clean Architecture |
                | 🗄️ ORM | **Entity Framework Core** | 10.0 | Code-first, migracje, Fluent API |
                | 🗄️ Micro ORM | **Dapper** | 2.1+ | Raw SQL, hot paths |
                | 📦 CQRS | **MediatR** | 12+ | Commands, Queries, Pipeline behaviors |
                | ✅ Walidacja | **FluentValidation** | 11+ | Request validation |
                | 🔐 Auth | **ASP.NET Identity** + **OpenIddict** | — | JWT, OAuth 2.0, TOTP 2FA |
                | 🗃️ Baza danych | **PostgreSQL** | 16+ | Główna baza (produkcja) |
                | 🗃️ Baza testowa | **SQLite** | — | In-memory (testy) |
                | 📡 Real-time | **SignalR** | — | 5 hubów (Karaoke, Editor, Notifications, Admin, Moderation) |
                | 💾 Object Storage | **MinIO** (S3-compatible) | — | Pliki audio, SF2, nagrania |
                | ⚡ Cache | **Redis** | 7+ | Rate limiting, lobby store, cache |
                | 📧 Email | **MailKit** | — | SMTP, szablony HTML |
                | 📧 Email (dev) | **MailHog** | — | Fake SMTP (port 1025, UI 8025) |
                | 📊 Logging | **Serilog** | — | Console, Elastic, structured logging |
                | 🧪 Testy | **xUnit** + **Moq** | — | 254+ testów (unit + integration) |
                | 🐳 Konteneryzacja | **Docker** + **docker-compose** | — | PostgreSQL, MinIO, Redis, MailHog |
                | 📈 Benchmarks | **BenchmarkDotNet** | — | Filtrowanie, ranking |

                ### Architektura

                ```
                AudioVerse.API ──→ AudioVerse.Application ──→ AudioVerse.Domain
                                          │                         ↑
                                          └──→ AudioVerse.Infrastructure ──┘
                ```

                | Warstwa | Odpowiedzialność |
                |---|---|
                | API | 49 kontrolerów, 5 hubów, 8 middleware |
                | Application | 243 handlery MediatR, DTOs, serwisy |
                | Domain | 162 encje, enumy, kontrakty repozytoriów |
                | Infrastructure | EF Core, Dapper, 10 klientów API, MinIO, Redis |

                ---

                ## ⚛️ Frontend (React + TypeScript)

                | Kategoria | Technologia | Wersja | Opis |
                |---|---|---|---|
                | ⚛️ Framework | **React** | 18 | SPA, functional components, hooks |
                | 📝 Język | **TypeScript** | 5.x | Strict mode (`noUnusedLocals`, `noUnusedParameters`) |
                | ⚡ Bundler | **Vite** | 5+ | HMR, fast build, ESBuild |
                | 🧭 Routing | **React Router** | v6 | Nested routes, lazy loading |
                | 🔄 Stan | **React Context API** | — | GameContext, AudioContext, UserContext, ThemeContext |
                | 📡 Zapytania | **TanStack React-Query** + **Axios** | — | Cache, retry, deduplication |
                | 🎨 UI | **Bootstrap 5** + **CSS Modules** | — | Responsive, custom themes |
                | 🌐 i18n | **react-i18next** | — | Polski, angielski |
                | ✅ Testy | **Vitest** + **React Testing Library** | — | 1578+ testów |
                | 🎭 E2E | **Playwright** + **Cypress** | — | Cross-browser testing |
                | 🎮 Gra 2D | **Phaser 3** + **Zustand** | — | Honest Living RPG |
                | 🎙️ Audio | **Web Audio API** | — | Pitch detection (CREPE, Aubio, Pitchy) |
                | 🎹 MIDI | **Web MIDI API** | — | Kontrolery MIDI, automatyzacja CC |
                | 💃 Pose | **MediaPipe** | — | Dance detection, pose estimation |
                | 📡 Real-time | **SignalR Client** + **WebRTC** | — | Karaoke lobby, czat, P2P audio |
                | 💡 DMX | **WebSerial API** | — | Sterowanie oświetleniem DMX-512 |
                | 🎵 Karaoke | **Canvas 2D** | — | Timeline rendering, glossy bar, particles |
                | 🖼️ Animacje | **SVG** + **IK** (Inverse Kinematics) | — | Animowane postacie, jurorzy |
                | 🎛️ DAW | **Custom Audio Editor** | — | Warstwy, efekty, eksport, kolaboracja |
                | 🕹️ Gamepad | **Gamepad API** | — | Spatial navigation, dead zone, remapping |

                ---

                ## 🤖 Mikroserwisy AI (Docker)

                | Serwis | Technologia | Opis |
                |---|---|---|
                | 🗣️ ASR | **Faster Whisper** | Speech-to-text |
                | 🔊 TTS | **Piper** / **Coqui** | Text-to-speech |
                | 🎵 Separation | **Demucs** | Vocals / instrumental separation |
                | 🎼 MusicGen | **AudioCraft** | Text-to-music generation |
                | 🎤 Voice | **RVC** | Voice conversion |
                | 💃 Pose | **MediaPipe** / **OpenPose** | Pose estimation |

                ---

                ## 🔗 Integracje zewnętrzne

                | Serwis | API | Użycie |
                |---|---|---|
                | 🎵 **Spotify** | REST + OAuth 2.0 | Wyszukiwanie, playlisty, audio features |
                | 🎵 **Tidal** | REST + OAuth 2.0 | Wyszukiwanie, streaming, playlisty |
                | ▶️ **YouTube** | Data API v3 | Wyszukiwanie, import piosenek karaoke |
                | 🎲 **BoardGameGeek** | XML API | Import gier planszowych |
                | 🎮 **IGDB** (Twitch) | REST + OAuth 2.0 | Import gier wideo |
                | 🎮 **Steam** | Web API | Kolekcje, achievementy, wishlist |
                | 🎬 **TMDB** | REST | Filmy, seriale |
                | 📚 **Google Books** | REST | Książki |
                | 📚 **Open Library** | REST | Książki (fallback) |
                | ⚽ **TheSportsDB** | REST | Sport, ligi |
                | 🗺️ **Nominatim/OSM** | REST | Geocoding, routing |
                | 🛡️ **reCAPTCHA v3** | REST | Bot protection |

                ---

                ## 🏗️ Infrastruktura

                | Komponent | Technologia | Port |
                |---|---|---|
                | 🐳 Orkiestracja | **Docker Compose** | — |
                | 🗄️ Baza danych | **PostgreSQL 16** | 5433 |
                | 💾 Object Storage | **MinIO** | 9000 (API), 9001 (konsola) |
                | ⚡ Cache | **Redis 7** | 6379 |
                | 📧 Mail (dev) | **MailHog** | 1025 (SMTP), 8025 (UI) |
                | 🔐 Auth | **AudioVerse.IdentityServer** | 5002 |
                | 📊 Monitoring | **Serilog** → Elastic | — |
                | 🔧 Deployment | **AudioVerse.SetupWizard** | — |
                | 🌐 CI/CD | **Azure DevOps** | — |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "tech-stack/backend",
            Title = "Tech Stack — Backend (.NET 10)",
            Category = "Tech Stack",
            SortOrder = 1,
            IsPublished = true,
            Tags = "backend,dotnet,ef,postgresql,signalr,minio",
            Icon = "server",
            ContentMarkdown = """
                # Tech Stack — Backend (.NET 10)

                ## Główne technologie

                ### 🏗️ .NET 10 (ASP.NET Core Web API)
                - **Typ**: Minimal hosting model (`Program.cs`)
                - **Wzorzec**: Clean Architecture + CQRS
                - **Projekty**: 8 (API, Application, Domain, Infrastructure, Tests, IdentityServer, SetupWizard, Benchmarks)
                - **Endpointy**: 587 REST + 5 SignalR Hubs

                ### 📦 MediatR (CQRS)
                - **Handlery**: 243 (Commands + Queries)
                - **Pipeline behaviors**: Logging, Validation, Performance
                - **Użycie**: Kontrolery delegują do MediatR — zero logiki w kontrolerach

                ### 🗄️ Entity Framework Core 10
                - **Provider**: Npgsql (PostgreSQL)
                - **Podejście**: Code-first, Fluent API
                - **Encje**: 162 w 12 obszarach domenowych
                - **Konfiguracje**: 40+ (`IEntityTypeConfiguration`)
                - **Migracje**: 60+ (auto-apply przy starcie)
                - **JSON**: Owned types + `jsonb` columns

                ### 🗄️ Dapper
                - **Użycie**: Hot paths — ranking karaoke, dashboard, bulk operacje
                - **Repozytoria**: `IDapperKaraokeRepository`, `IEditorRepository`
                - **Raw SQL**: Optymalny czas odpowiedzi na krytycznych endpointach

                ### 🔐 ASP.NET Identity + OpenIddict
                - **JWT**: Access token (30 min) + Refresh token (httpOnly cookie, 14 dni)
                - **2FA**: TOTP (Google Authenticator)
                - **OAuth**: Spotify, Tidal, Google, Discord, Twitch, Microsoft, Steam
                - **Rate limiting**: Redis / InMemory (10 req/min rejestracja)

                ### 📡 SignalR
                | Hub | Opis |
                |---|---|
                | `KaraokeHub` | Lobby, czat, WebRTC signaling, live scoring |
                | `EditorHub` | Kolaboracja real-time, OT/CRDT, cursor tracking |
                | `NotificationHub` | Push notifications |
                | `AdminHub` | Audit log stream, config changes |
                | `ModerationHub` | Abuse reports stream |

                ### 💾 MinIO (S3-compatible)
                - **Buckety**: audio-files, karaoke-recordings, soundfonts, party-posters, sample-packs, editor-exports
                - **Presigned URLs**: 1h TTL, LRU cache (500 pozycji)
                - **Upload**: Multipart, max 500MB (soundfonty), SHA-256 hash

                ### ⚡ Redis
                - **Rate limiting**: INCR + EXPIRE (distributed)
                - **Lobby store**: Aktywne lobby karaoke
                - **Cache**: Presigned URLs, hot queries

                ### ✅ FluentValidation
                - **Validators**: 15+ (request validation)
                - **Pipeline**: MediatR behavior — automatyczna walidacja przed handlerem

                ### 🧪 xUnit + Moq
                - **Testy**: 254+ (unit + integration)
                - **Factory**: `CustomWebApplicationFactory` (SQLite in-memory)
                - **Pokrycie**: Auth, Events, Karaoke, Billing, Games, Editor, DMX, Media, Admin

                ### 📊 Serilog
                - **Sinki**: Console, Elastic (ECS format)
                - **Enrichers**: CorrelationId, RequestPath, UserId
                - **Structured**: JSON, queryable w Kibana

                ### 🐳 Docker
                - **Compose**: PostgreSQL 16, MinIO, Redis, MailHog
                - **API image**: Multi-stage build (.NET 10 Alpine)
                - **AI containers**: Faster Whisper, Piper, Demucs, AudioCraft, MediaPipe

                ## Pakiety NuGet (kluczowe)

                | Pakiet | Wersja | Użycie |
                |---|---|---|
                | `Microsoft.EntityFrameworkCore` | 10.0.x | ORM |
                | `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.x | Provider PostgreSQL |
                | `Dapper` | 2.1.x | Micro ORM |
                | `MediatR` | 12.x | CQRS |
                | `FluentValidation.AspNetCore` | 11.x | Walidacja |
                | `Serilog.AspNetCore` | 10.x | Logging |
                | `Minio` | 6.x | S3 client |
                | `StackExchange.Redis` | 2.x | Redis client |
                | `MailKit` | 4.x | SMTP |
                | `BenchmarkDotNet` | 0.14.x | Benchmarks |
                | `OpenIddict` | 7.x | OAuth/OIDC server |
                | `Swashbuckle.AspNetCore` | 10.x | Swagger UI |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "tech-stack/frontend",
            Title = "Tech Stack — Frontend (React)",
            Category = "Tech Stack",
            SortOrder = 2,
            IsPublished = true,
            Tags = "frontend,react,typescript,vite,phaser,webaudio",
            Icon = "monitor",
            ContentMarkdown = """
                # Tech Stack — Frontend (React + TypeScript)

                ## Główne technologie

                ### ⚛️ React 18
                - **Komponenty**: Functional components + hooks
                - **Rendering**: Client-side SPA
                - **State**: Context API (GameContext, AudioContext, UserContext, ThemeContext)
                - **Lazy loading**: `React.lazy()` + `Suspense`

                ### 📝 TypeScript 5.x
                - **Strict mode**: `noUnusedLocals`, `noUnusedParameters`
                - **Typy**: 500+ interfejsów, enums, DTOs
                - **Generics**: Custom hooks, API client, form builders

                ### ⚡ Vite 5+
                - **Build**: ESBuild (dev), Rollup (prod)
                - **HMR**: < 100ms hot reload
                - **Plugins**: vite-plugin-pwa, vite-plugin-checker

                ### 🧭 React Router v6
                - **Nested routes**: Layout routes, outlet
                - **Protected routes**: Auth guard, role-based
                - **Lazy**: Lazy-loaded pages

                ### 🔄 TanStack React-Query + Axios
                - **Cache**: Automatic, configurable stale time
                - **Retry**: 3 retries z exponential backoff
                - **Deduplication**: Identical queries merged
                - **Mutations**: Optimistic updates
                - **Interceptor**: Auto-refresh JWT on 401

                ### 🎨 Bootstrap 5 + CSS Modules
                - **Grid**: Responsive layout
                - **Themes**: Dark/Light mode + Glossy Bar + custom textures
                - **CSS Modules**: Scoped styles per component
                - **Variables**: CSS custom properties for theming

                ### 🌐 react-i18next
                - **Języki**: Polski (pl), angielski (en)
                - **Namespace**: Grouped by feature
                - **Fallback**: English

                ## Moduły specjalistyczne

                ### 🎙️ Karaoke Engine
                | Komponent | Technologia |
                |---|---|
                | Pitch detection | Web Audio API + CREPE / Aubio / Pitchy / Librosa |
                | Timeline | Canvas 2D (60 FPS, glossy bar, particles) |
                | Scoring | Custom engine (pitch × timing × note weight) |
                | Parser | UltraStar TXT parser (TypeScript) |
                | Recording | MediaRecorder API + Web Audio |

                ### 🎹 MIDI & Automatyzacja
                | Komponent | Technologia |
                |---|---|
                | Input | Web MIDI API |
                | Arpeggiator | Custom (up, down, up-down, random, chord) |
                | LFO | Sine, square, triangle, saw generators |
                | Sequencer | Step sequencer (16/32 steps) |
                | CC mapping | MIDI CC → UI controls |

                ### 🎛️ Audio Editor (DAW)
                | Komponent | Technologia |
                |---|---|
                | Warstwy | Custom layer system (drag & drop) |
                | Efekty | Web Audio nodes (reverb, delay, EQ, compressor) |
                | Timeline | Canvas 2D waveform rendering |
                | Kolaboracja | SignalR real-time (EditorHub) |
                | Export | OfflineAudioContext → WAV/MP3 |

                ### 🎮 Honest Living (RPG)
                | Komponent | Technologia |
                |---|---|
                | Engine | Phaser 3 |
                | State | Zustand |
                | Mapy | Tiled (TMX format) |
                | Combat | Turn-based RPG |
                | Farming | Sim-style resource management |

                ### 💃 Dance & Pose Detection
                | Komponent | Technologia |
                |---|---|
                | Pose | MediaPipe Pose (33 keypoints) |
                | Camera | getUserMedia (webcam) |
                | Classification | Custom dance move classifier |
                | Choreography | Pattern matching (DTW) |

                ### 🖼️ Animowane postacie
                | Komponent | Technologia |
                |---|---|
                | Rendering | SVG + CSS transforms |
                | Rigging | Inverse Kinematics (CCD solver) |
                | Audience | Procedural animations |
                | Jurors | Reaction system (score-based) |

                ### 💡 DMX-512 Oświetlenie
                | Komponent | Technologia |
                |---|---|
                | Port | WebSerial API (FTDI D2XX) |
                | Sceny | JSON presets (512 channels) |
                | Sekwencje | Timed cue lists |
                | Beat-sync | BPM tap tempo → DMX sync |

                ## Testy

                | Typ | Framework | Ilość |
                |---|---|---|
                | Unit + Component | **Vitest** + React Testing Library | 1578+ |
                | E2E | **Playwright** | Cross-browser |
                | E2E | **Cypress** | Component testing |

                ## Pakiety npm (kluczowe)

                | Pakiet | Użycie |
                |---|---|
                | `react` / `react-dom` | UI framework |
                | `react-router-dom` | Routing |
                | `@tanstack/react-query` | Server state |
                | `axios` | HTTP client |
                | `react-bootstrap` | UI components |
                | `react-i18next` | Internationalization |
                | `phaser` | 2D game engine |
                | `zustand` | Game state (Honest Living) |
                | `tone` | Web Audio synthesis |
                | `@mediapipe/pose` | Pose detection |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Mobile (placeholder)
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "mobile/home",
            Title = "Mobile — dokumentacja",
            Category = "Mobile",
            SortOrder = 0,
            IsPublished = true,
            Tags = "mobile,flutter,ios,android",
            ContentMarkdown = """
                # Mobile — dokumentacja

                > 🚧 Ta sekcja jest przeznaczona dla zespołu mobile. Uzupełnij ją o:

                - Architektura aplikacji (Flutter / React Native / natywna)
                - Nawigacja i ekrany
                - Komunikacja z API (REST + SignalR)
                - Push notifications (FCM / APNs)
                - OAuth flow na mobile (deep links, redirect URI)
                - Offline mode / cache
                - Build i release (CI/CD, App Store, Google Play)

                ## Linki do API

                - Pełna dokumentacja endpointów: [Endpointy API](/api/wiki/api/endpoints)
                - Autoryzacja JWT: [Auth](/api/wiki/api/auth)
                - OAuth platformy: [Integracje](/api/wiki/integrations/overview)
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend (rozszerzenie)
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/enums",
            Title = "Enumy — referencja",
            Category = "API — Backend",
            SortOrder = 7,
            IsPublished = true,
            Tags = "enums,types,reference",
            Icon = "list",
            ContentMarkdown = """
                # Enumy — pełna referencja

                ## Events

                | Enum | Wartości |
                |---|---|
                | `EventType` | Unknown=0, Event=1, Meeting=2, Conference=3, Workshop=4, GameNight=5, Screening=6 |
                | `EventVisibility` | Private=0, Unlisted=1, Public=2 |
                | `EventInviteStatus` | Pending=0, Accepted=1, Declined=2, Cancelled=3 |
                | `AttractionType` | PhotoBooth=0, DanceFloor=1, KaraokeBooth=2, DJSet=3, Custom=4 |
                | `ScheduleCategory` | Karaoke=0, Food=1, Game=2, Break=3, Custom=4 |
                | `MenuItemCategory` | Food=0, Drink=1, Snack=2, Dessert=3 |
                | `RecurrencePattern` | None=0, Daily=1, Weekly=2, BiWeekly=3, Monthly=4, Custom=99 |

                ## Billing

                | Enum | Wartości |
                |---|---|
                | `ExpenseCategory` | Food=0, Drink=1, Attraction=2, Rental=3, Equipment=4, Transport=5, Custom=6 |
                | `SplitMethod` | Equal=0, PerCapita=1, Custom=2, ByPollResponse=3 |
                | `PaymentMethod` | Cash=0, BankTransfer=1, Blik=2, PayPal=3, Card=4, Other=5 |
                | `PaymentStatus` | Pending=0, Confirmed=1, Rejected=2, Refunded=3 |

                ## Karaoke

                | Enum | Wartości |
                |---|---|
                | `KaraokeSessionMode` | Classic=0, Tournament=1, Knockout=2, Casual=3 |
                | `KaraokeRoundMode` | Normal=0, Demo=1, NoLyrics=2, NoTimeline=3, Blind=4, SpeedRun=5, Duet=6, FreeStyle=7 |
                | `SongQueueStatus` | Pending=0, Playing=1, Done=2, Skipped=3 |
                | `CollaborationPermission` | Read=0, Write=1, Manage=2 |

                ## Polls

                | Enum | Wartości |
                |---|---|
                | `EventPollType` | SingleChoice=0, MultiChoice=1, YesNo=2 |
                | `EventPollOptionSource` | Manual=0, BoardGames=1, VideoGames=2, Songs=3, MenuItems=4, Attractions=5 |
                | `DateVoteStatus` | Available=0, Maybe=1, Unavailable=2 |

                ## Games

                | Enum | Wartości |
                |---|---|
                | `GamePlatform` | PC=0, PS5=1, Xbox=2, Switch=3, Mobile=4, Other=5 |
                | `GameStatus` | Available=0, InUse=1, Reserved=2 |

                ## Audio / Editor

                | Enum | Wartości |
                |---|---|
                | `AudioEffectType` | Reverb=0, Delay=1, EQ=2, Compressor=3, PitchShift=4, Filter=5, Distortion=6, Chorus=7 |
                | `ExportStatus` | Pending=0, Processing=1, Completed=2, Failed=3 |
                | `PitchDetectionMethod` | UltrastarWP=0, Crepe=1, Aubio=2, Pitchy=3, Librosa=4 |

                ## Notifications

                | Enum | Wartości |
                |---|---|
                | `NotificationType` | General=0, EventInvite=1, EventUpdate=2, KaraokeScore=3, PollCreated=4, CommentReply=5, SystemAlert=6, EventReminder=7, PollDeadline=8 |

                ## User / Devices

                | Enum | Wartości |
                |---|---|
                | `DeviceType` | Unknown=0, Microphone=1, Gamepad=2, Keyboard=3, Mouse=4, Speaker=5, Camera=6 |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/error-handling",
            Title = "Obsługa błędów i kody HTTP",
            Category = "API — Backend",
            SortOrder = 8,
            IsPublished = true,
            Tags = "errors,http,problem-details,exceptions",
            Icon = "alert-triangle",
            ContentMarkdown = """
                # Obsługa błędów i kody HTTP

                ## Format błędów (RFC 7807)

                ```json
                {
                  "type": "https://tools.ietf.org/html/rfc7807",
                  "title": "Not Found",
                  "status": 404,
                  "detail": "Song with ID 42 was not found",
                  "traceId": "00-abc123-def456-01"
                }
                ```

                ## Mapowanie wyjątków

                | Wyjątek | HTTP | Kiedy |
                |---|---|---|
                | `NotFoundException` | 404 | Zasób nie istnieje |
                | `BadRequestException` | 400 | Niepoprawne dane |
                | `NotAuthorizedException` | 403 | Brak uprawnień |
                | `UnauthorizedAccessException` | 401 | Brak tokena JWT |
                | `ValidationException` | 400 | Walidacja FluentValidation |
                | `Exception` (inne) | 500 | Błąd serwera |

                ## Korelacja: `X-Correlation-ID`

                Każdy request ma header `X-Correlation-ID` (auto-generowany). Używaj go do śledzenia w logach.

                ## Walidacja

                ```json
                {
                  "errors": {
                    "Name": ["Name must not be empty"],
                    "FillPattern": ["FillPattern must not be empty"]
                  }
                }
                ```
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/conventions",
            Title = "Konwencje API",
            Category = "API — Backend",
            SortOrder = 9,
            IsPublished = true,
            Tags = "conventions,pagination,sorting,filtering",
            Icon = "book",
            ContentMarkdown = """
                # Konwencje API

                ## Paginacja

                ```
                GET /api/events?page=1&pageSize=20
                ```

                Response:
                ```json
                { "items": [...], "totalCount": 150, "page": 1, "pageSize": 20, "totalPages": 8 }
                ```

                ## Sortowanie

                `GET /api/events?sortBy=startTime&descending=true`

                ## Formaty dat

                ISO 8601 UTC: `2025-07-27T12:00:00Z`

                ## Odpowiedzi HTTP

                | Metoda | Sukces | Opis |
                |---|---|---|
                | `GET` (lista) | 200 | Paginowana lista |
                | `GET` (single) | 200 / 404 | Obiekt lub NotFound |
                | `POST` | 201 | Created + Location |
                | `PUT` | 200 / 404 | Zaktualizowany obiekt |
                | `DELETE` | 204 / 404 | NoContent |

                ## Nazewnictwo

                - URL: kebab-case (`/api/user/connections/spotify/auth-url`)
                - JSON: camelCase (`preferredColors`, `fillPattern`)
                - C#: PascalCase (`PreferredColors`, `FillPattern`)
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/signalr",
            Title = "SignalR Hubs — szczegóły",
            Category = "API — Backend",
            SortOrder = 10,
            IsPublished = true,
            Tags = "signalr,websocket,realtime,hubs",
            Icon = "radio",
            ContentMarkdown = """
                # SignalR Hubs — szczegóły

                ## Połączenie (JavaScript)

                ```javascript
                const connection = new HubConnectionBuilder()
                  .withUrl('http://localhost:5000/hubs/karaoke', {
                    accessTokenFactory: () => jwtToken
                  })
                  .withAutomaticReconnect()
                  .build();
                await connection.start();
                ```

                ## KaraokeHub (`/hubs/karaoke`)

                | Client → Server | Parametry |
                |---|---|
                | `JoinLobby` | eventId |
                | `LeaveLobby` | eventId |
                | `SendChatMessage` | eventId, message |
                | `StartRound` | roundId |
                | `UpdateScore` | roundId, playerId, score |
                | `SendOffer/Answer/IceCandidate` | targetUserId, sdp/candidate |

                | Server → Client | Dane |
                |---|---|
                | `UserJoined/Left` | userId, userName |
                | `ChatMessage` | userId, userName, message, timestamp |
                | `RoundStarted` | roundId, songTitle |
                | `ScoreUpdated` | roundId, playerId, score |
                | `ReceiveOffer/Answer/IceCandidate` | fromUserId, sdp/candidate |

                ## EditorHub (`/hubs/editor`)

                | Client → Server | Parametry |
                |---|---|
                | `JoinProject/LeaveProject` | projectId |
                | `SendItemChange` | projectId, change |
                | `SendCursorPosition` | projectId, position |
                | `LockSection/UnlockSection` | projectId, sectionId |

                ## NotificationHub (`/hubs/notifications`)

                | Server → Client | Dane |
                |---|---|
                | `ReceiveNotification` | NotificationDto |
                | `UnreadCountChanged` | count |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Karaoke (rozszerzenie)
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "karaoke/ultrastar",
            Title = "Ultrastar — format i import",
            Category = "Karaoke",
            SortOrder = 1,
            IsPublished = true,
            Tags = "ultrastar,format,import,parsing,txt",
            Icon = "music",
            ContentMarkdown = """
                # Ultrastar — format i import

                ## Format pliku TXT

                ```
                #TITLE:Never Gonna Give You Up
                #ARTIST:Rick Astley
                #BPM:113
                #GAP:5120
                #MP3:song.mp3
                : 0 5 60 We're
                : 6 2 60  no
                * 9 3 62  stran    ← golden note
                - 30               ← line break
                E                  ← end
                ```

                ## Typy nut

                | Prefix | Typ | Scoring |
                |---|---|---|
                | `:` | Normal | 1× punkty |
                | `*` | Golden | 2× punkty |
                | `F` | Freestyle | Brak scoringu |
                | `R` | Rap | Tylko timing |
                | `-` | LineBreak | — |
                | `E` | End | — |

                ## Endpointy

                | Metoda | URL | Opis |
                |---|---|---|
                | `POST` | `/api/karaoke/ultrastar/import` | Import z pliku TXT |
                | `POST` | `/api/karaoke/ultrastar/import/batch` | Batch import |
                | `GET` | `/api/karaoke/ultrastar/scan` | Skanowanie katalogu |
                | `POST` | `/api/karaoke/ultrastar/reindex` | Reindeksowanie |

                ## Konfiguracja

                ```json
                "Ultrastar": {
                  "RootDirectory": "/data/karaoke/songs",
                  "IndexFileName": ".ultrastar_index.json"
                }
                ```
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "karaoke/scoring",
            Title = "Karaoke — scoring",
            Category = "Karaoke",
            SortOrder = 2,
            IsPublished = true,
            Tags = "scoring,presets,pitch,timing",
            Icon = "star",
            ContentMarkdown = """
                # Karaoke — scoring

                ## Algorytm

                1. Mikrofon → pitch detection (Crepe/Aubio/UltrastarWP)
                2. Porównanie z notami Ultrastar (±tolerancja)
                3. Punkty = pitch accuracy × timing accuracy × note weight

                ## ScoringPreset (admin)

                | Pole | Domyślna | Opis |
                |---|---|---|
                | `PitchTolerance` | 2 semitony | Tolerancja pitch |
                | `TimingToleranceMs` | 150ms | Tolerancja timingu |
                | `GoldenMultiplier` | 2.0 | Mnożnik golden notes |
                | `PitchDetectionMethod` | Crepe | Metoda detekcji |

                ## PitchDetectionMethod

                `UltrastarWP=0, Crepe=1, Aubio=2, Pitchy=3, Librosa=4`
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Integracje (rozszerzenie)
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "integrations/spotify",
            Title = "Spotify — integracja",
            Category = "Integracje",
            SortOrder = 1,
            IsPublished = true,
            Tags = "spotify,oauth,search,playlists",
            Icon = "music",
            ContentMarkdown = """
                # Spotify — integracja

                ## ISpotifyService

                | Metoda | Opis |
                |---|---|
                | `AuthenticateWithAuthCodeAsync(code, redirectUri)` | OAuth code exchange |
                | `RefreshTokenAsync(refreshToken)` | Odświeżenie tokena |
                | `SearchAsync(query, types, limit, offset)` | Wyszukiwanie |
                | `GetTrackAsync(trackId)` | Szczegóły tracka |
                | `GetAudioFeaturesAsync(trackId)` | BPM, key, energy |
                | `GetCurrentUserAsync()` | Profil |
                | `GetUserPlaylistsAsync()` | Playlisty |
                | `CreatePlaylistAsync(userId, request)` | Tworzenie playlisty |
                | `GetRecommendationsAsync(seeds)` | Rekomendacje |

                ## Scopes

                `user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private user-library-read user-library-modify`

                ## Redirect URI

                - Prod: `https://www.audioverse.io/spotifyCallback`
                - Dev: `http://localhost:3000/spotifyCallback`
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "integrations/oauth-flow",
            Title = "OAuth — flow",
            Category = "Integracje",
            SortOrder = 5,
            IsPublished = true,
            Tags = "oauth,flow,callback",
            Icon = "lock",
            ContentMarkdown = """
                # OAuth — flow dla wszystkich platform

                ## Sekwencja

                ```
                1. GET /api/user/connections/{platform}/auth-url?redirectUri=...
                   → { url: "https://accounts.spotify.com/authorize?..." }
                2. Frontend redirect na URL
                3. Użytkownik autoryzuje
                4. Platforma redirect z ?code=...
                5. POST /api/user/connections/{platform}/callback
                   { code: "...", redirectUri: "..." }
                6. Backend → token exchange → profil → zapis UserExternalAccount
                   → { success: true, displayName: "...", email: "..." }
                ```

                ## Redirect URIs

                | Platforma | Produkcja | Dev |
                |---|---|---|
                | Spotify | `.../spotifyCallback` | `localhost:3000/spotifyCallback` |
                | Tidal | `.../tidalCallback` | `localhost:3000/tidalCallback` |
                | Google | `.../googleCallback` | `localhost:3000/googleCallback` |
                | Discord | `.../discordCallback` | `localhost:3000/discordCallback` |
                | Twitch | `.../twitchCallback` | `localhost:3000/twitchCallback` |
                | Microsoft | `.../microsoftCallback` | `localhost:3000/microsoftCallback` |

                ## Specjalne platformy

                - **Steam**: OpenID (nie OAuth)
                - **BGG**: Username-based (`POST .../bgg/link` z `{ username }`)
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Infrastruktura (rozszerzenie)
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "infra/configuration",
            Title = "Konfiguracja — referencja",
            Category = "Infrastruktura",
            SortOrder = 2,
            IsPublished = true,
            Tags = "config,appsettings,secrets,environment",
            Icon = "settings",
            ContentMarkdown = """
                # Konfiguracja — pełna referencja

                ## Hierarchia (od najniższego priorytetu)

                1. `appsettings.json` — defaults
                2. `appsettings.{Environment}.json` — per env
                3. `dotnet user-secrets` — dev secrets
                4. Environment variables — produkcja

                ## ConnectionStrings

                | Klucz | Opis |
                |---|---|
                | `PostgresConnection` | PostgreSQL (port 5433) |
                | `Redis` | Cache (port 6379) |
                | `Minio` | Object storage (port 9000) |

                ## Sekrety

                ```bash
                dotnet user-secrets set "Spotify:ClientId" "xxx"
                dotnet user-secrets set "YouTube:ApiKey" "xxx"
                dotnet user-secrets set "Igdb:ClientId" "xxx"
                dotnet user-secrets set "Tmdb:ApiKey" "xxx"
                ```

                ⚠️ **NIGDY** nie commituj kluczy do repozytorium!
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Przewodnik
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "guide/adding-feature",
            Title = "Jak dodać nową funkcjonalność",
            Category = "Przewodnik",
            SortOrder = 0,
            IsPublished = true,
            Tags = "guide,howto,cqrs,handler",
            Icon = "plus-circle",
            ContentMarkdown = """
                # Jak dodać nową funkcjonalność

                ## Checklist

                1. **Encja** → `AudioVerse.Domain/Entities/{Area}/`
                2. **DbSet** → `AudioVerseDbContext.cs`
                3. **Migracja** → `dotnet ef migrations add Xxx --project AudioVerse.API`
                4. **Repository interface** → `AudioVerse.Domain/Repositories/`
                5. **Repository impl** → `AudioVerse.Infrastructure/Repositories/`
                6. **Command/Query** → `AudioVerse.Application/Commands/` lub `Queries/`
                7. **Handler** → `AudioVerse.Application/Handlers/`
                8. **Request DTO** → `AudioVerse.Application/Models/Requests/`
                9. **Response DTO** → `AudioVerse.Application/Models/`
                10. **Validator** → `AudioVerse.Application/Validators/`
                11. **Controller** → `AudioVerse.API/Areas/{Area}/Controllers/`
                12. **Test** → `AudioVerse.Tests/`

                ## Dodawanie pola do encji

                ```
                1. Pole w encji (Domain)
                2. Pole w DTO (Application/Models)
                3. Pole w Request (Application/Models/Requests)
                4. Parametr w Command record
                5. Mapowanie w Handler (create + update + get)
                6. Walidacja w Validator
                7. Przekazanie w Controller
                8. SQL w Dapper repo (INSERT/UPDATE)
                9. Mapowanie w EF repo
                10. Migracja EF → Build → Testy
                ```

                ## Konwencje

                - Jeden typ per plik C#
                - Handlery rzucają `NotFoundException` / `BadRequestException` (nie HTTP kody)
                - Kontrolery delegują do MediatR — zero logiki
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "guide/testing",
            Title = "Testowanie",
            Category = "Przewodnik",
            SortOrder = 1,
            IsPublished = true,
            Tags = "testing,xunit,moq",
            Icon = "check-circle",
            ContentMarkdown = """
                # Testowanie

                ## Struktura

                ```
                AudioVerse.Tests/
                ├── Unit/          # Mock repo → handler
                ├── Integration/   # In-memory DB → E2E
                └── Seed/          # TestDataSeeder
                ```

                ## Uruchomienie

                ```bash
                dotnet test AudioVerse.Tests
                # Passed! — Failed: 0, Passed: 269
                ```

                > ⚠️ Nie uruchamiaj z terminala Copilot — użyj Test Explorer.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "guide/faq",
            Title = "FAQ",
            Category = "Przewodnik",
            SortOrder = 2,
            IsPublished = true,
            Tags = "faq,troubleshooting",
            Icon = "help-circle",
            ContentMarkdown = """
                # FAQ

                **Jak dodać migrację?**
                `dotnet ef migrations add Xxx --project AudioVerse.API --startup-project AudioVerse.API`

                **Jak cofnąć migrację?**
                `dotnet ef migrations remove --project AudioVerse.API`

                **Skąd klucze API?**
                Patrz: [Integracje](/api/wiki/integrations/overview)

                **API nie startuje — Connection refused?**
                Sprawdź `docker ps` — PostgreSQL port 5433.

                **401 Unauthorized?**
                Token JWT wygasł lub `JwtSettings:Secret` za krótki (min 64 znaki).

                **MinIO — bucket not found?**
                Buckety tworzone automatycznie. Konsola: `http://localhost:9001`.

                **Seedowanie nie działa?**
                Pomijane gdy `skipMigrations=true`. Sprawdź logi startowe.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ════════════════════════════════════════════════
        //  NOWE STRONY — pełna dokumentacja projektu
        // ════════════════════════════════════════════════

        // ────────────────────────────────────────────────
        //  Kategoria: Serwisy i Utility
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "services/overview",
            Title = "Serwisy — przegląd",
            Category = "Serwisy i Utility",
            SortOrder = 0,
            IsPublished = true,
            Tags = "services,utility,overview,di",
            Icon = "cpu",
            ContentMarkdown = """
                # Serwisy — przegląd

                Serwisy aplikacyjne znajdują się w `AudioVerse.Application/Services/` i rejestrowane są w DI w `DependencyInjection.cs`.

                ## Katalog serwisów

                | Katalog | Serwisy | Opis |
                |---|---|---|
                | `User/` | TokenService, PasswordService, OtpService, TotpService, LoginAttemptService, AuditLogService | Autoryzacja, tokeny JWT, hasła, 2FA, audit |
                | `Security/` | CaptchaService, RecaptchaService, CustomHashService, HoneyTokenService | CAPTCHA, reCAPTCHA v3, honey tokens |
                | `Platforms/Spotify/` | SpotifyService | OAuth, wyszukiwanie, playlisty, audio features |
                | `Platforms/Tidal/` | TidalService | OAuth, wyszukiwanie, streaming, playlisty |
                | `Platforms/` | YouTubeService, YouTubeSearchService | YouTube Data API v3, search, playlists |
                | `Utils/` | AiAudioService, AiVideoService, DanceClassificationService | Mikroserwisy AI, klasyfikacja taneczna |
                | `Audio/` | AudioFilesService | Obsługa plików audio (upload, metadata, tags) |
                | `DMX/` | DmxPort, DmxWorker, PlaylistService, FtdiD2xxDmxPort | Sterowanie oświetleniem DMX |
                | `Karaoke/` | UltrastarFileService, UltrastarConverterService | Parsowanie i konwersja Ultrastar |
                | `MediaLibrary/` | DownloadService | Pobieranie plików z URL |
                | `SongInformations/` | SongInformationService, SongLicenseService | Metadane piosenek, licencje |
                | Root | ProfanityFilter, ICurrentUserService | Filtr wulgaryzmów, kontekst użytkownika |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "services/user-auth",
            Title = "Serwisy użytkownika i autoryzacji",
            Category = "Serwisy i Utility",
            SortOrder = 1,
            IsPublished = true,
            Tags = "token,jwt,password,otp,totp,2fa,audit,login",
            Icon = "shield",
            ContentMarkdown = """
                # Serwisy użytkownika i autoryzacji

                ## TokenService

                | Metoda | Opis |
                |---|---|
                | `GenerateAccessToken(user)` | JWT access token (HMAC-SHA256) |
                | `GenerateRefreshToken()` | Refresh token (random 64 bytes → base64) |
                | `ValidateRefreshToken(userId, token)` | Walidacja + rotacja |

                ## PasswordService

                | Metoda | Opis |
                |---|---|
                | `HashPassword(password)` | BCrypt hash |
                | `VerifyPassword(hash, password)` | Weryfikacja |
                | `ValidatePasswordPolicy(password, requirements)` | Sprawdzenie wymagań |
                | `CheckPasswordHistory(userId, hash)` | Porównanie z historią haseł |

                ## OtpService (jednorazowe hasła e-mail)

                | Metoda | Opis |
                |---|---|
                | `GenerateOtp(userId, purpose)` | 6-cyfrowy kod, 5 min TTL |
                | `ValidateOtp(userId, code, purpose)` | Jednorazowa walidacja |

                ## TotpService (2FA — Google Authenticator)

                | Metoda | Opis |
                |---|---|
                | `GenerateSecret()` | TOTP secret key |
                | `GenerateQrCodeUri(email, secret)` | URI do QR code |
                | `VerifyCode(secret, code)` | 30s window weryfikacja |

                ## LoginAttemptService

                | Metoda | Opis |
                |---|---|
                | `RecordAttempt(ip, email, success)` | Zapis próby logowania |
                | `IsBlocked(ip)` | Blokada IP po 5 nieudanych próbach (15 min) |
                | `GetRecentAttempts(userId)` | Lista ostatnich prób |

                ## AuditLogService

                | Metoda | Opis |
                |---|---|
                | `LogAsync(action, entity, entityId, userId, details)` | Zapis wpisu audit |
                | `BroadcastAsync(auditLog)` | SignalR → AdminHub |

                Audit loguje: logowanie, zmiana hasła, bany, zmiany konfiguracji, operacje CRUD admina.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "services/security",
            Title = "Bezpieczeństwo — CAPTCHA, Honey Tokens, Profanity Filter",
            Category = "Serwisy i Utility",
            SortOrder = 2,
            IsPublished = true,
            Tags = "security,captcha,recaptcha,honeytokens,profanity",
            Icon = "shield",
            ContentMarkdown = """
                # Bezpieczeństwo

                ## reCAPTCHA v3

                Integracja z Google reCAPTCHA v3 na rejestracji i logowaniu.

                ```json
                "RecaptchaSettings": {
                  "SecretKey": "<user-secrets>",
                  "SiteKey": "...",
                  "MinimumScore": 0.5
                }
                ```

                | Metoda | Opis |
                |---|---|
                | `VerifyAsync(token)` | Weryfikacja tokena reCAPTCHA |
                | `VerifyAsync(token, action)` | + sprawdzenie action name |

                ## CaptchaService (custom CAPTCHA)

                Alternatywne opcje CAPTCHA konfigurowalne w `SystemConfiguration`:

                `CaptchaOption: None=0, Type1=1, Type2=2, ..., Type8=8`

                | Metoda | Opis |
                |---|---|
                | `GenerateCaptcha(option)` | Generuj challenge |
                | `ValidateCaptcha(option, answer)` | Walidacja odpowiedzi |

                ## Honey Tokens (canary tokens)

                System wykrywania nieautoryzowanego dostępu do danych:

                | Metoda | Opis |
                |---|---|
                | `CreateHoneyTokenAsync(type, description)` | Tworzenie tokena (opcjonalnie w Canarytokens) |
                | `TriggerHoneyTokenAsync(tokenId, ip, userAgent)` | Oznaczenie jako triggered |
                | `GetAllTokensAsync()` | Lista tokenów |

                Typy: `api_key`, `database_record`, `document`, `url`

                ## Profanity Filter

                Middleware `ProfanityMiddleware` automatycznie sprawdza POST/PUT body na wulgaryzmy.

                | Metoda | Opis |
                |---|---|
                | `ContainsProfanity(text)` | bool — czy tekst zawiera wulgaryzmy |
                | `CensorText(text)` | Zamiana na gwiazdki |

                Słownik wulgaryzmów w `ProfanityFilter.cs` (PL + EN).
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "services/ai",
            Title = "Mikroserwisy AI — szczegóły",
            Category = "Serwisy i Utility",
            SortOrder = 3,
            IsPublished = true,
            Tags = "ai,whisper,tts,demucs,musicgen,rvc,dance",
            Icon = "zap",
            ContentMarkdown = """
                # Mikroserwisy AI — szczegóły

                ## AiAudioService

                | Metoda | Kontener | Opis |
                |---|---|---|
                | `TranscribeAsync(audioStream)` | Faster Whisper | Speech-to-text (zwraca `AsrResult`) |
                | `SynthesizeAsync(text, voice)` | Piper | TTS → WAV stream |
                | `SeparateAsync(audioStream)` | Demucs | Vocals/instrumental separation |
                | `GenerateMusicAsync(prompt, duration)` | AudioCraft | MusicGen text-to-music |
                | `ConvertVoiceAsync(audioStream, model)` | RVC | Voice conversion |
                | `AnalyzeAudioAsync(audioStream)` | Analyze | BPM, key, loudness |

                ### Modele odpowiedzi

                ```csharp
                record AsrResult(string Text, string Language, float Duration, List<Segment> Segments);
                record SeparationResult(byte[] Vocals, byte[] Instrumental, byte[] Drums, byte[] Bass);
                record AudioAnalysisResult(float Bpm, string Key, float Loudness, float Energy);
                ```

                ## AiVideoService

                | Metoda | Kontener | Opis |
                |---|---|---|
                | `DetectPoseAsync(imageStream)` | MediaPipe | Keypoints (33 punkty ciała) |

                ```csharp
                record PoseDetectionResult(List<PoseKeypoint> Keypoints);
                record PoseKeypoint(string Name, float X, float Y, float Z, float Visibility);
                ```

                ## DanceClassificationService

                | Metoda | Opis |
                |---|---|
                | `ClassifyAsync(audioFeatures)` | Klasyfikacja stylu tańca na podstawie BPM/energy/danceability |

                Klasyfikuje do: Waltz, Tango, Cha-cha, Samba, Jive, Quickstep, Rumba, Foxtrot, Salsa, Bachata, ...

                ## Konfiguracja

                ```json
                "AiAudio": {
                  "FasterWhisperBaseUrl": "http://asr_fw:8000/v1",
                  "PiperBaseUrl": "http://tts_piper:5000",
                  "SeparateBaseUrl": "http://audio_separate:8086",
                  "AudioCraftBaseUrl": "http://audiocraft:7861"
                },
                "AiVideo": {
                  "MediaPipeBaseUrl": "http://mediapipe:8080"
                }
                ```

                > Wszystkie serwisy opcjonalne — endpointy zwracają 503 jeśli kontener niedostępny.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "services/dmx",
            Title = "DMX — sterowanie oświetleniem",
            Category = "Serwisy i Utility",
            SortOrder = 4,
            IsPublished = true,
            Tags = "dmx,lighting,ftdi,enttec,artnet",
            Icon = "sun",
            ContentMarkdown = """
                # DMX — sterowanie oświetleniem

                ## Architektura

                ```
                DmxController ──→ MediatR ──→ Handler ──→ DmxWorker ──→ IDmxPort
                                                                          ├── DmxPort (virtual)
                                                                          └── FtdiD2xxDmxPort (FTDI USB)
                ```

                ## IDmxPort — interfejs

                | Metoda | Opis |
                |---|---|
                | `Open(portName)` | Otwarcie portu DMX (np. COM3, /dev/ttyUSB0) |
                | `Close()` | Zamknięcie portu |
                | `SetChannel(channel, value)` | Kanał 1–512, wartość 0–255 |
                | `GetChannel(channel)` | Odczyt wartości kanału |
                | `Blackout()` | Wszystkie kanały → 0 |
                | `SendUniverse()` | Wysłanie 512 bajtów na port |

                ## DmxWorker (BackgroundService)

                - Odświeża DMX universe co 40ms (25 FPS)
                - Beat-reactive mode: synchronizacja z BPM audio (tap tempo)
                - Obsługa scen i sekwencji

                ## FtdiD2xxDmxPort

                Implementacja dla kontrolerów **ENTTEC Open DMX USB** (FTDI FT232R chip).

                - Wymaga biblioteki natywnej FTDI D2XX
                - Break: 176µs, Mark After Break: 12µs
                - Pełny refresh: 512 kanałów + start code (513 bytes)

                ## Sceny i sekwencje

                | Encja | Opis |
                |---|---|
                | `DmxScene` | Snapshot 512 kanałów (JSON) |
                | `DmxSequence` | Lista scen + timing (cue list) |
                | `DmxDevice` | Definicja urządzenia (nazwa, kanał startowy, typ) |

                ## PlaylistService

                Automatyczne odtwarzanie sekwencji DMX zsynchronizowane z playlistą audio.

                | Metoda | Opis |
                |---|---|
                | `StartPlaylistAsync(playlistId)` | Start playlisty z sekwencjami DMX |
                | `StopPlaylist()` | Stop |
                | `SyncBeat(bpm)` | Synchronizacja z BPM |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Infrastruktura (rozszerzenie)
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "infra/middleware",
            Title = "Middleware — pipeline HTTP",
            Category = "Infrastruktura",
            SortOrder = 3,
            IsPublished = true,
            Tags = "middleware,pipeline,exception,correlation,jwt,ban,profanity,ratelimit",
            Icon = "layers",
            ContentMarkdown = """
                # Middleware — pipeline HTTP

                Pipeline (kolejność w `Program.cs`):

                ```
                Request
                  → CorrelationIdMiddleware     (auto-generuje X-Correlation-ID)
                  → ApiVersionMiddleware        (dodaje X-Api-Version header)
                  → ExceptionHandlingMiddleware (łapie wyjątki → ProblemDetails)
                  → UserBanMiddleware           (sprawdza bany → 403)
                  → JwtMiddleware               (dekoduje JWT, ustawia claims)
                  → SessionTimeoutMiddleware    (sprawdza timeout sesji)
                  → ProfanityMiddleware         (filtruje wulgaryzmy w POST/PUT)
                  → [Rate Limiting]             (opcjonalny — Redis/InMemory)
                  → Controller/Hub
                ```

                ## CorrelationIdMiddleware

                - Jeśli request ma header `X-Correlation-ID` → używa go
                - Jeśli brak → generuje nowy GUID
                - Dodaje do response i logów (Serilog enricher)

                ## ExceptionHandlingMiddleware

                | Wyjątek | HTTP | Response |
                |---|---|---|
                | `NotFoundException` | 404 | ProblemDetails |
                | `BadRequestException` | 400 | ProblemDetails |
                | `NotAuthorizedException` | 403 | ProblemDetails |
                | `ValidationException` | 400 | { errors: { field: [...] } } |
                | `ConflictException` | 409 | ProblemDetails |
                | `Exception` | 500 | ProblemDetails (bez stacktrace w prod) |

                ## UserBanMiddleware

                - Sprawdza `UserBan` w bazie dla userId z JWT
                - Tymczasowy ban → sprawdza `ExpiresAt`
                - Stały ban → 403 z komunikatem

                ## JwtMiddleware

                - Dekoduje JWT z `Authorization: Bearer <token>`
                - Ustawia `HttpContext.User` z claims: `id`, `email`, `role`
                - Nie blokuje requestów bez tokena (to robi `[Authorize]`)

                ## ProfanityMiddleware

                - Interceptuje POST/PUT body
                - Sprawdza przez `IProfanityFilter.ContainsProfanity()`
                - Jeśli wykryje → 400 Bad Request z komunikatem

                ## Rate Limiting

                Dwie implementacje:
                - `InMemoryRateLimiter` — dev (ConcurrentDictionary)
                - `RedisRateLimiter` — produkcja (Redis INCR + EXPIRE)

                Konfiguracja per endpoint w `Program.cs`.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "infra/storage",
            Title = "Storage — MinIO / S3 pipeline",
            Category = "Infrastruktura",
            SortOrder = 4,
            IsPublished = true,
            Tags = "storage,minio,s3,presigned,upload,cache",
            Icon = "hard-drive",
            ContentMarkdown = """
                # Storage — MinIO / S3 pipeline

                ## Architektura

                ```
                Controller ──→ IFileStorage ──→ S3FileStorage ──→ MinIO (S3-compatible)
                                                    │
                                                    └──→ IPresignedUrlCache
                                                           ├── PresignedUrlCache (in-memory)
                                                           └── PresignedUrlBackgroundCache (background refresh)
                ```

                ## IFileStorage — interfejs

                | Metoda | Opis |
                |---|---|
                | `UploadAsync(bucket, key, stream, contentType)` | Upload pliku |
                | `DownloadAsync(bucket, key)` | Download → stream |
                | `DeleteAsync(bucket, key)` | Usunięcie pliku |
                | `ExistsAsync(bucket, key)` | Sprawdzenie istnienia |
                | `GetPresignedUrlAsync(bucket, key, expiry)` | Presigned URL |
                | `ListObjectsAsync(bucket, prefix)` | Lista obiektów |

                ## StorageInitializer

                Przy starcie aplikacji automatycznie tworzy wymagane buckety:

                | Bucket | Opis | Public |
                |---|---|---|
                | `audio-files` | Pliki audio | ❌ |
                | `karaoke-recordings` | Nagrania karaoke | ❌ |
                | `party-posters` | Plakaty eventów | ✅ |
                | `soundfonts` | Pliki SF2/SFZ/DLS | ❌ |
                | `sample-packs` | Sample packs edytora | ❌ |
                | `editor-exports` | Eksporty projektów | ❌ |

                ## PresignedUrlCache

                - Cache: 500 URL-i (LRU)
                - TTL: 1 godzina
                - Background refresh: 60s przed wygaśnięciem
                - Klucz: `{bucket}/{key}` → presigned URL

                ## MinioOptions

                ```json
                "Minio": {
                  "AccessKey": "minioadmin",
                  "SecretKey": "minioadmin",
                  "Endpoint": "localhost:9000",
                  "UseSSL": false
                }
                ```

                ## Upload flow

                ```
                1. Controller: walidacja typu i rozmiaru (ImageValidator)
                2. SHA-256 hash pliku
                3. Upload do MinIO (S3FileStorage)
                4. Zapis metadanych w PostgreSQL
                5. Return: presigned URL do pobrania
                ```
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "infra/repositories",
            Title = "Repozytoria — EF Core i Dapper",
            Category = "Infrastruktura",
            SortOrder = 5,
            IsPublished = true,
            Tags = "repositories,ef,dapper,pattern,persistence",
            Icon = "database",
            ContentMarkdown = """
                # Repozytoria — EF Core i Dapper

                ## Pattern

                - Interfejsy: `AudioVerse.Domain/Repositories/` (24 kontrakty)
                - Implementacje: `AudioVerse.Infrastructure/Repositories/`
                - DI: rejestracja w `DependencyInjection.cs`

                ## Lista repozytoriów (24)

                | Repozytorium | Impl | Opis |
                |---|---|---|
                | `IEventRepository` | EF | CRUD eventów, filtry, paginacja |
                | `IKaraokeRepository` | EF + **Dapper** | Eventy karaoke, sesje, rundy, scoring |
                | `IDapperKaraokeRepository` | **Dapper** | Raw SQL — hot path (ranking, top scores) |
                | `IBillingRepository` | EF | Wydatki, płatności, settlement |
                | `IBettingRepository` | EF | Zakłady, rynki, opcje |
                | `IPollRepository` | EF | Ankiety, głosy, wyniki |
                | `ILeagueRepository` | EF | Ligi, uczestnicy, harmonogram |
                | `IGameRepository` | EF | Gry planszowe/wideo, sesje, statystyki |
                | `IEditorRepository` | EF + **Dapper** | Projekty, warstwy, klipy, efekty |
                | `IMediaCatalogRepository` | EF | Filmy, książki, seriale, sporty |
                | `IPlaylistRepository` | EF | Playlisty, elementy |
                | `IMusicGenreRepository` | EF | Gatunki muzyczne |
                | `IUserProfileRepository` | EF + **Dapper** | Profile, gracze, urządzenia |
                | `IExternalAccountRepository` | EF | Konta zewnętrzne (OAuth) |
                | `IUserSecurityRepository` | EF | Hasła, OTP, bany |
                | `INotificationRepository` | EF | Powiadomienia |
                | `IAuditRepository` | EF | Audit log |
                | `IModerationRepository` | EF | Zgłoszenia nadużyć |
                | `IDmxRepository` | EF | Sceny, sekwencje, urządzenia DMX |
                | `ISkinThemeRepository` | EF | Skin themes |
                | `ISystemConfigRepository` | EF | System configuration |
                | `ILocationRepository` | EF | Lokalizacje eventów |
                | `IKaraokeSongPickRepository` | EF | Propozycje piosenek karaoke |

                ## Dapper — kiedy używać?

                - **Hot paths**: ranking karaoke, top scores, statystyki
                - **Złożone raporty**: dashboard admina, billing settlement
                - **Bulk operacje**: batch insert/update

                Dapper repos mają raw SQL w metodach — czytelne nazwy plików:
                - `KaraokeRepository.cs` (Dapper)
                - `EditorRepository.cs` (Dapper)
                - `UserProfileRepository.cs` (Dapper)
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "infra/external-apis",
            Title = "External APIs — klienci",
            Category = "Infrastruktura",
            SortOrder = 6,
            IsPublished = true,
            Tags = "external,apis,bgg,igdb,tmdb,steam,geocoding,googlebooks",
            Icon = "globe",
            ContentMarkdown = """
                # External APIs — klienci

                Klienci HTTP w `AudioVerse.Infrastructure/ExternalApis/`:

                ## BoardGameGeek (BGG)

                | Metoda | Opis |
                |---|---|
                | `SearchAsync(query)` | Wyszukiwanie gier |
                | `GetGameDetailsAsync(bggId)` | Szczegóły gry (XML API) |
                | `GetHotGamesAsync()` | Hot games (cache 15 min) |
                | `GetUserCollectionAsync(username)` | Kolekcja użytkownika |

                ## IGDB (via Twitch)

                | Metoda | Opis |
                |---|---|
                | `SearchAsync(query, limit)` | Wyszukiwanie gier wideo |
                | `GetGameDetailsAsync(igdbId)` | Szczegóły (cover, rating, genres) |

                Auth: Client Credentials → `Igdb:ClientId` + `Igdb:ClientSecret`

                ## TMDB

                | Metoda | Opis |
                |---|---|
                | `SearchMoviesAsync(query)` | Wyszukiwanie filmów |
                | `GetMovieDetailsAsync(tmdbId)` | Szczegóły filmu |
                | `SearchTvShowsAsync(query)` | Wyszukiwanie seriali |
                | `GetTvShowDetailsAsync(tmdbId)` | Szczegóły serialu |

                ## Steam

                | Metoda | Opis |
                |---|---|
                | `GetPlayerSummaryAsync(steamId)` | Profil gracza |
                | `GetOwnedGamesAsync(steamId)` | Posiadane gry |
                | `GetRecentGamesAsync(steamId)` | Ostatnio grane |
                | `GetFriendsAsync(steamId)` | Lista znajomych |
                | `GetAchievementsAsync(steamId, appId)` | Achievementy |
                | `GetGlobalAchievementsAsync(appId)` | Globalne % |
                | `GetWishlistAsync(steamId)` | Wishlist |
                | `GetNewsAsync(appId)` | Newsy gry |
                | `ResolveVanityUrlAsync(vanityUrl)` | Vanity URL → SteamID |

                ## Google Books

                | Metoda | Opis |
                |---|---|
                | `SearchAsync(query)` | Wyszukiwanie książek |
                | `GetDetailsAsync(googleBooksId)` | Szczegóły (ISBN, opis, okładka) |

                ## Open Library

                | Metoda | Opis |
                |---|---|
                | `SearchAsync(query)` | Wyszukiwanie (fallback jeśli Google Books niedostępny) |
                | `GetBookDetailsAsync(olId)` | Szczegóły |

                ## Geocoding (OpenStreetMap / Nominatim)

                | Metoda | Opis |
                |---|---|
                | `GeocodeAsync(address)` | Adres → lat/lng |
                | `ReverseGeocodeAsync(lat, lng)` | lat/lng → adres |
                | `GetDirectionsAsync(from, to)` | Routing (steps, duration, distance) |
                | `GetPlaceDetailsAsync(placeId)` | Godziny otwarcia, kontakt |

                ## Song Metadata

                | Metoda | Opis |
                |---|---|
                | `SearchAsync(title, artist)` | Wyszukiwanie metadanych z wielu źródeł |

                ## TheSportsDB

                | Metoda | Opis |
                |---|---|
                | `SearchAsync(query)` | Wyszukiwanie sportów/lig |
                | `GetLeagueEventsAsync(leagueId)` | Nadchodzące wydarzenia |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "infra/telemetry",
            Title = "Telemetria i metryki",
            Category = "Infrastruktura",
            SortOrder = 7,
            IsPublished = true,
            Tags = "telemetry,metrics,realtime,upload,monitoring",
            Icon = "activity",
            ContentMarkdown = """
                # Telemetria i metryki

                ## IRealtimeMetrics

                Metryki real-time dla SignalR hubów:

                | Metoda | Opis |
                |---|---|
                | `IncrementConnections(hubName)` | +1 aktywne połączenie |
                | `DecrementConnections(hubName)` | -1 aktywne połączenie |
                | `GetActiveConnections(hubName)` | Liczba aktywnych |
                | `RecordLatency(hubName, ms)` | Latencja wiadomości |

                Implementacja: `InMemoryRealtimeMetrics` (ConcurrentDictionary)

                ## IUploadMetrics

                Metryki uploadów plików:

                | Metoda | Opis |
                |---|---|
                | `RecordUpload(bucket, sizeBytes, durationMs)` | Zapis metryki uploadu |
                | `GetTotalUploads(bucket)` | Łączna liczba |
                | `GetTotalBytes(bucket)` | Łączny rozmiar |
                | `GetAverageDuration(bucket)` | Średni czas uploadu |

                ## Realtime Lobby Store

                | Implementacja | Backend | Opis |
                |---|---|---|
                | `InMemoryLobbyStore` | ConcurrentDictionary | Dev — single instance |
                | `RedisLobbyStore` | Redis | Prod — distributed |

                | Metoda | Opis |
                |---|---|
                | `JoinLobby(eventId, userId)` | Dołączenie do lobby |
                | `LeaveLobby(eventId, userId)` | Opuszczenie |
                | `GetLobbyMembers(eventId)` | Lista członków |
                | `GetActiveLobbies()` | Aktywne lobby |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "infra/rate-limiting",
            Title = "Rate Limiting",
            Category = "Infrastruktura",
            SortOrder = 8,
            IsPublished = true,
            Tags = "ratelimit,throttling,redis,inmemory",
            Icon = "clock",
            ContentMarkdown = """
                # Rate Limiting

                ## Implementacje

                | Klasa | Backend | Deployment |
                |---|---|---|
                | `InMemoryRateLimiter` | ConcurrentDictionary | Dev (single instance) |
                | `RedisRateLimiter` | Redis INCR + EXPIRE | Produkcja (distributed) |

                ## IRateLimiter — interfejs

                | Metoda | Opis |
                |---|---|
                | `IsAllowedAsync(key, limit, window)` | Czy request dozwolony |
                | `GetRemainingAsync(key, limit, window)` | Ile pozostało |
                | `ResetAsync(key)` | Reset licznika (admin) |

                ## Skonfigurowane limity

                | Endpoint | Limit | Okno |
                |---|---|---|
                | `POST /api/user/register` | 10 req | 1 min |
                | `POST /api/user/login` | 20 req | 1 min |
                | `POST /api/ai/*` | 5 req | 1 min |
                | Pozostałe | Brak limitu (dev) | — |

                ## Response headers

                ```
                X-RateLimit-Limit: 10
                X-RateLimit-Remaining: 7
                X-RateLimit-Reset: 1690461600
                ```

                Przy przekroczeniu → `429 Too Many Requests`
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend (events subresources)
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/events-subresources",
            Title = "Eventy — sub-zasoby i schedule",
            Category = "API — Backend",
            SortOrder = 11,
            IsPublished = true,
            Tags = "events,photos,comments,schedule,menu,attractions,locations",
            Icon = "calendar",
            ContentMarkdown = """
                # Eventy — sub-zasoby i schedule

                ## Zdjęcia i komentarze

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events/{id}/photos` | Lista zdjęć |
                | `POST` | `/api/events/{id}/photos` | Upload zdjęcia (multipart) |
                | `DELETE` | `/api/events/{id}/photos/{photoId}` | Usunięcie |
                | `GET` | `/api/events/{id}/photos/{photoId}/comments` | Komentarze do zdjęcia |
                | `POST` | `/api/events/{id}/photos/{photoId}/comments` | Dodaj komentarz |
                | `GET` | `/api/events/{id}/comments` | Komentarze eventu |
                | `POST` | `/api/events/{id}/comments` | Dodaj komentarz |

                ## Uczestnicy

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events/{id}/participants` | Lista uczestników |
                | `POST` | `/api/events/{id}/participants` | Dodaj uczestnika |
                | `DELETE` | `/api/events/{id}/participants/{participantId}` | Usuń |
                | `POST` | `/api/events/{id}/cancel-participation` | Anuluj udział |

                ## Schedule (harmonogram)

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events/{id}/schedule` | Lista pozycji harmonogramu |
                | `POST` | `/api/events/{id}/schedule` | Dodaj pozycję |
                | `PUT` | `/api/events/{id}/schedule/{itemId}` | Aktualizacja |
                | `DELETE` | `/api/events/{id}/schedule/{itemId}` | Usunięcie |

                `ScheduleCategory: Karaoke=0, Food=1, Game=2, Break=3, Custom=4`

                ## Menu (jedzenie i picie)

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events/{id}/menu` | Lista pozycji menu |
                | `POST` | `/api/events/{id}/menu` | Dodaj pozycję |
                | `PUT/DELETE` | `/api/events/{id}/menu/{itemId}` | Aktualizacja/usunięcie |

                `MenuItemCategory: Food=0, Drink=1, Snack=2, Dessert=3`

                ## Attractions

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events/{id}/attractions` | Lista atrakcji |
                | `POST` | `/api/events/{id}/attractions` | Dodaj atrakcję |

                `AttractionType: PhotoBooth=0, DanceFloor=1, KaraokeBooth=2, DJSet=3, Custom=4`

                ## Lokalizacje

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events/{id}/location` | Lokalizacja eventu |
                | `POST` | `/api/events/{id}/location` | Przypisanie lokalizacji |

                `EventLocationType: Address, Coordinates, VenueId, Online, Hybrid`

                ## Game/Song picks

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET/POST` | `/api/events/{id}/game-picks` | Propozycje gier na event |
                | `POST` | `/api/events/{id}/game-picks/{pickId}/vote` | Głosowanie |
                | `GET/POST` | `/api/events/{id}/song-picks` | Propozycje piosenek |
                | `POST` | `/api/events/{id}/song-picks/{pickId}/vote` | Głosowanie |

                ## Propozycje dat

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events/{id}/date-proposals` | Lista propozycji |
                | `POST` | `/api/events/{id}/date-proposals` | Dodaj propozycję |
                | `POST` | `/api/events/{id}/date-proposals/{proposalId}/vote` | Głosuj: Available/Maybe/Unavailable |
                | `POST` | `/api/events/{id}/date-proposals/{proposalId}/select` | Wybierz termin (host) |

                ## Recurrence (cykliczność)

                `RecurrencePattern: None=0, Daily=1, Weekly=2, BiWeekly=3, Monthly=4, Custom=99`

                | Metoda | URL | Opis |
                |---|---|---|
                | `POST` | `/api/events/{id}/generate-next` | Generuj następne wystąpienie |
                | `PUT` | `/api/events/{id}/occurrences/{date}/reschedule` | Przenieś datę |
                | `DELETE` | `/api/events/{id}/occurrences/{date}` | Anuluj wystąpienie |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/billing-detail",
            Title = "Billing — podział kosztów szczegółowo",
            Category = "API — Backend",
            SortOrder = 12,
            IsPublished = true,
            Tags = "billing,expenses,payments,settlement,wallet",
            Icon = "credit-card",
            ContentMarkdown = """
                # Billing — podział kosztów

                ## Wydatki

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events/{id}/billing/expenses` | Lista wydatków |
                | `POST` | `/api/events/{id}/billing/expenses` | Dodaj wydatek |
                | `PUT` | `/api/events/{id}/billing/expenses/{expenseId}` | Aktualizacja |
                | `DELETE` | `/api/events/{id}/billing/expenses/{expenseId}` | Usunięcie |

                `ExpenseCategory: Food=0, Drink=1, Attraction=2, Rental=3, Equipment=4, Transport=5, Custom=6`

                ## Podział kosztów

                | Metoda | URL | Opis |
                |---|---|---|
                | `POST` | `/api/events/{id}/billing/split` | Podział (Equal / PerCapita / Custom / ByPollResponse) |
                | `POST` | `/api/events/{id}/billing/import-from-poll/{pollId}` | Import z ankiety |

                `SplitMethod: Equal=0, PerCapita=1, Custom=2, ByPollResponse=3`

                ## Płatności

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events/{id}/billing/payments` | Lista płatności |
                | `POST` | `/api/events/{id}/billing/payments` | Dodaj płatność |
                | `POST` | `/api/events/{id}/billing/payments/{paymentId}/confirm` | Potwierdź |
                | `DELETE` | `/api/events/{id}/billing/payments/{paymentId}` | Usuń |

                `PaymentMethod: Cash=0, BankTransfer=1, Blik=2, PayPal=3, Card=4, Other=5`
                `PaymentStatus: Pending=0, Confirmed=1, Rejected=2, Refunded=3`

                ## Settlement (kto komu ile)

                ```
                GET /api/events/{id}/billing/settlement
                → [
                    { "from": "Alice", "to": "Bob", "amount": 42.50 },
                    { "from": "Charlie", "to": "Bob", "amount": 15.00 }
                  ]
                ```

                Algorytm: minimalna liczba transakcji do wyrównania sald.

                ## Virtual Wallet

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/events/{id}/billing/wallet` | Saldo wirtualnego portfela |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/leagues-betting",
            Title = "Ligi, Fantasy i Betting",
            Category = "API — Backend",
            SortOrder = 13,
            IsPublished = true,
            Tags = "leagues,fantasy,betting,standings",
            Icon = "trophy",
            ContentMarkdown = """
                # Ligi, Fantasy i Betting

                ## Ligi

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/leagues` | Lista lig |
                | `POST` | `/api/leagues` | Tworzenie ligi |
                | `GET` | `/api/leagues/{id}` | Szczegóły |
                | `PUT` | `/api/leagues/{id}` | Aktualizacja |
                | `DELETE` | `/api/leagues/{id}` | Usunięcie |
                | `GET` | `/api/leagues/{id}/standings` | Tabela ligowa |
                | `POST` | `/api/leagues/{id}/participants` | Dodaj uczestnika |
                | `DELETE` | `/api/leagues/{id}/participants/{userId}` | Usuń uczestnika |
                | `POST` | `/api/leagues/{id}/generate-schedule` | Generuj harmonogram |

                `LeagueType: Karaoke=0, BoardGame=1, VideoGame=2, Mixed=3`
                `LeagueStatus: Draft=0, Active=1, Finished=2, Archived=3`

                ## Fantasy

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/leagues/{id}/fantasy/team` | Mój team fantasy |
                | `POST` | `/api/leagues/{id}/fantasy/team` | Tworzenie teamu |
                | `POST` | `/api/leagues/{id}/fantasy/draft/{playerId}` | Draft gracza |
                | `POST` | `/api/leagues/{id}/fantasy/drop/{playerId}` | Zwolnienie gracza |
                | `GET` | `/api/leagues/{id}/fantasy/standings` | Ranking fantasy |

                ## Betting (zakłady)

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/betting/events/{eventId}/markets` | Rynki zakładów |
                | `POST` | `/api/betting/markets` | Tworzenie rynku |
                | `GET` | `/api/betting/markets/{id}` | Szczegóły rynku |
                | `POST` | `/api/betting/markets/{id}/options` | Dodaj opcję |
                | `POST` | `/api/betting/markets/{id}/place` | Postaw zakład |
                | `POST` | `/api/betting/markets/{id}/resolve` | Rozstrzygnięcie (admin) |
                | `GET` | `/api/betting/my-bets` | Moje zakłady |

                `BettingMarketType: WinnerTakesAll=0, OverUnder=1, HeadToHead=2, Custom=3`
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "api/invites-organizations",
            Title = "Zaproszenia i organizacje",
            Category = "API — Backend",
            SortOrder = 14,
            IsPublished = true,
            Tags = "invites,organizations,email,access",
            Icon = "mail",
            ContentMarkdown = """
                # Zaproszenia i organizacje

                ## Zaproszenia na event

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/invites` | Moje zaproszenia |
                | `POST` | `/api/events/{id}/invites` | Wyślij zaproszenie |
                | `POST` | `/api/invites/{inviteId}/respond` | Akceptuj/Odrzuć |
                | `DELETE` | `/api/invites/{inviteId}` | Anuluj zaproszenie |

                `EventInviteStatus: Pending=0, Accepted=1, Declined=2, Cancelled=3`

                ## Zaproszenia karaoke

                | Metoda | URL | Opis |
                |---|---|---|
                | `POST` | `/api/karaoke/events/{eventId}/invites` | Wyślij (e-mail) |
                | `GET` | `/api/karaoke/events/{eventId}/invites` | Lista |
                | `GET` | `/api/karaoke/invites/{inviteId}` | Szczegóły |
                | `POST` | `/api/karaoke/invites/{inviteId}/respond` | Akceptuj/Odrzuć |
                | `DELETE` | `/api/karaoke/invites/{inviteId}` | Anuluj |

                ## Organizacje

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/organizations` | Lista organizacji |
                | `POST` | `/api/organizations` | Tworzenie |
                | `GET` | `/api/organizations/{id}` | Szczegóły |
                | `PUT` | `/api/organizations/{id}` | Aktualizacja |
                | `DELETE` | `/api/organizations/{id}` | Usunięcie |

                Organizacja to grupa użytkowników mogąca tworzyć eventy i ligi.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Projekty dodatkowe
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "projects/identity-server",
            Title = "IdentityServer — centralna autoryzacja",
            Category = "Projekty dodatkowe",
            SortOrder = 0,
            IsPublished = true,
            Tags = "identity,auth,server,jwt,separate",
            Icon = "key",
            ContentMarkdown = """
                # IdentityServer — centralna autoryzacja

                Osobny mikroserwis autoryzacji: `AudioVerse.IdentityServer`

                ## Struktura

                ```
                AudioVerse.IdentityServer/
                ├── Controllers/
                │   └── AuthController.cs       # Login, register, refresh
                ├── Middleware/
                │   └── ExceptionHandlingMiddleware.cs
                ├── Persistence/
                │   └── IdentityDbContext.cs     # Osobna baza auth
                └── Program.cs
                ```

                ## Przeznaczenie

                - Oddzielna baza danych dla danych autoryzacyjnych
                - Możliwość niezależnego deploymentu
                - Skalowanie osobno od głównego API
                - Przyszłość: SSO (Single Sign-On) dla wielu serwisów AudioVerse

                ## Aktualny stan

                Projekt istnieje w solucji, ale domyślnie autoryzacja działa w `AudioVerse.API` (kontroler `UserController`). IdentityServer jest przygotowany do ekstrakcji auth do osobnego serwisu.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "projects/setup-wizard",
            Title = "SetupWizard — automatyzacja deploymentu",
            Category = "Projekty dodatkowe",
            SortOrder = 1,
            IsPublished = true,
            Tags = "setup,wizard,deploy,docker-compose,env,backup",
            Icon = "terminal",
            ContentMarkdown = """
                # SetupWizard — automatyzacja deploymentu

                Konsolowy wizard do generowania plików konfiguracyjnych: `AudioVerse.SetupWizard`

                ## Uruchomienie

                ```bash
                dotnet run --project AudioVerse.SetupWizard [--force] [--apply] [--certbot] [--manage]
                ```

                ## Flagi

                | Flaga | Opis |
                |---|---|
                | `--force` | Nadpisuje istniejące pliki |
                | `--apply` | Uruchamia docker-compose + migracje |
                | `--certbot` | Konfiguruje Let's Encrypt SSL |
                | `--manage` | Tryb zarządzania (backup, restore, status) |

                ## Co generuje

                - `docker-compose.yml` — pełny stack (API, PostgreSQL, MinIO, Redis, MailHog)
                - `.env` — zmienne środowiskowe (hasła, klucze, porty)
                - Konfiguracja Nginx reverse proxy (opcjonalna)
                - Certbot setup (SSL)

                ## Backup scheduler

                W trybie `--manage` uruchamia scheduler automatycznych backupów:

                | Parametr | Domyślny | Opis |
                |---|---|---|
                | Interwał | 24h | Co ile wykonywać backup |
                | Retencja | 7 | Ile backupów zachować |
                | Katalog | `./backups/` | Gdzie zapisywać |

                Backup: `docker compose exec postgres pg_dump` → `audioverse_db_YYYYMMDDHHMMSS.sql`

                Automatyczna rotacja — najstarsze pliki usuwane po przekroczeniu retencji.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "projects/benchmarks",
            Title = "Benchmarks — testy wydajności",
            Category = "Projekty dodatkowe",
            SortOrder = 2,
            IsPublished = true,
            Tags = "benchmarks,performance,benchmarkdotnet",
            Icon = "bar-chart",
            ContentMarkdown = """
                # Benchmarks — testy wydajności

                Projekt: `AudioVerse.Benchmarks` (BenchmarkDotNet)

                ## Uruchomienie

                ```bash
                dotnet run --project AudioVerse.Benchmarks -c Release -- --filter *
                ```

                ## SongFilterBenchmarks

                Symulacja hot-path filtrowania piosenek karaoke (in-memory):

                | Benchmark | Opis |
                |---|---|
                | `FilterByTitle` | Wyszukiwanie po tytule (Contains) |
                | `FilterByGenreAndLanguage` | Filtr gatunek + język |
                | `FilterByBpmRange` | Filtr BPM 120–140 |
                | `FullTextSearch` | Szukanie w title + artist (OrdinalIgnoreCase) |
                | `SortByBpmDescending` | Sortowanie po BPM |
                | `CombinedFilterAndSort` | Filtr + sort |

                Parametry: `[Params(100, 1000, 10000)]` piosenek

                ## RankingBenchmarks

                Obliczanie rankingu karaoke:

                | Benchmark | Opis |
                |---|---|
                | `ComputeAverageRanking` | GroupBy → Average → Sort |
                | `ComputeTotalRanking` | GroupBy → Sum → Sort |

                Parametry: `[Params(100, 1000)]` graczy × 10 rund
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Karaoke (rozszerzenie)
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "karaoke/teams-queue",
            Title = "Karaoke — drużyny i kolejka",
            Category = "Karaoke",
            SortOrder = 3,
            IsPublished = true,
            Tags = "karaoke,teams,queue,players,rounds",
            Icon = "users",
            ContentMarkdown = """
                # Karaoke — drużyny i kolejka

                ## Drużyny

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/karaoke/events/{eventId}/teams` | Lista drużyn |
                | `POST` | `/api/karaoke/events/{eventId}/teams` | Tworzenie drużyny |
                | `GET` | `/api/karaoke/teams/{teamId}` | Szczegóły |
                | `PUT` | `/api/karaoke/teams/{teamId}` | Aktualizacja |
                | `DELETE` | `/api/karaoke/teams/{teamId}` | Usunięcie |
                | `POST` | `/api/karaoke/teams/{teamId}/players` | Dodaj gracza |
                | `DELETE` | `/api/karaoke/teams/{teamId}/players/{playerId}` | Usuń gracza |

                ## Kolejka piosenek

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/karaoke/queue/{eventId}` | Bieżąca kolejka |
                | `POST` | `/api/karaoke/queue/{eventId}` | Dodaj do kolejki |
                | `PUT` | `/api/karaoke/queue/{eventId}/reorder` | Zmiana kolejności |
                | `DELETE` | `/api/karaoke/queue/{eventId}/{queueItemId}` | Usuń z kolejki |
                | `POST` | `/api/karaoke/queue/{eventId}/{queueItemId}/skip` | Pomiń |
                | `POST` | `/api/karaoke/queue/{eventId}/{queueItemId}/play` | Odtwórz |

                `SongQueueStatus: Pending=0, Playing=1, Done=2, Skipped=3`

                ## Rundundy — gracze

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/karaoke/rounds/{roundId}/players` | Gracze rundy |
                | `POST` | `/api/karaoke/rounds/{roundId}/players` | Dodaj gracza |
                | `PUT` | `/api/karaoke/rounds/{roundId}/players/{playerId}` | Aktualizacja slotu |
                | `DELETE` | `/api/karaoke/rounds/{roundId}/players/{playerId}` | Usuń |

                ## Ulubione piosenki

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/karaoke/favorites` | Moje ulubione |
                | `POST` | `/api/karaoke/favorites/{songId}` | Dodaj |
                | `DELETE` | `/api/karaoke/favorites/{songId}` | Usuń |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "karaoke/permissions",
            Title = "Karaoke — uprawnienia i wersjonowanie",
            Category = "Karaoke",
            SortOrder = 4,
            IsPublished = true,
            Tags = "karaoke,permissions,collaborators,versioning",
            Icon = "lock",
            ContentMarkdown = """
                # Karaoke — uprawnienia i wersjonowanie

                ## Kolaboranci piosenek

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/karaoke/songs/{songId}/collaborators` | Lista kolaborantów |
                | `POST` | `/api/karaoke/songs/{songId}/collaborators` | Dodaj kolaboranta |
                | `PUT` | `/api/karaoke/songs/{songId}/collaborators/{userId}` | Zmiana uprawnień |
                | `DELETE` | `/api/karaoke/songs/{songId}/collaborators/{userId}` | Usuń kolaboranta |
                | `POST` | `/api/karaoke/songs/{songId}/permissions/grant` | Nadanie uprawnienia |
                | `POST` | `/api/karaoke/songs/{songId}/permissions/revoke` | Cofnięcie uprawnienia |
                | `POST` | `/api/karaoke/songs/{songId}/permissions/bulk-update` | Batch update |
                | `POST` | `/api/karaoke/songs/{songId}/permissions/bulk-revoke` | Batch revoke |
                | `GET` | `/api/karaoke/songs/{songId}/permissions/history` | Historia zmian uprawnień |

                `CollaborationPermission: Read=0, Write=1, Manage=2`

                ## Wersjonowanie

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/karaoke/songs/{songId}/versions` | Lista wersji |
                | `GET` | `/api/karaoke/songs/{songId}/versions/{version}` | Konkretna wersja |
                | `POST` | `/api/karaoke/songs/{songId}/versions/{version}/revert` | Przywróć |
                | `GET` | `/api/karaoke/songs/{songId}/history` | Historia zmian |

                ## Statusy piosenki

                | Metoda | URL | Opis |
                |---|---|---|
                | `POST` | `/api/karaoke/songs/{songId}/in-development` | Oznacz jako WIP |
                | `POST` | `/api/karaoke/songs/{songId}/verified` | Oznacz jako zweryfikowana |
                | `POST` | `/api/karaoke/songs/bulk/in-development` | Batch — WIP |
                | `POST` | `/api/karaoke/songs/bulk/verified` | Batch — verified |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend (games extended)
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/games-sessions",
            Title = "Gry — sesje, rundy i statystyki",
            Category = "API — Backend",
            SortOrder = 15,
            IsPublished = true,
            Tags = "games,sessions,rounds,stats,board,video",
            Icon = "gamepad",
            ContentMarkdown = """
                # Gry — sesje, rundy i statystyki

                ## Board Game Sessions

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/games/board/sessions` | Lista sesji |
                | `POST` | `/api/games/board/sessions` | Tworzenie sesji |
                | `GET` | `/api/games/board/sessions/{id}` | Szczegóły |
                | `POST` | `/api/games/board/sessions/{id}/rounds` | Dodaj rundę |
                | `GET` | `/api/games/board/sessions/{id}/rounds` | Rundy sesji |
                | `POST` | `/api/games/board/sessions/{id}/end` | Zakończ sesję |

                ## Video Game Sessions

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/games/video/sessions` | Lista sesji |
                | `POST` | `/api/games/video/sessions` | Tworzenie sesji |
                | `POST` | `/api/games/video/sessions/{id}/rounds` | Dodaj rundę |
                | `POST` | `/api/games/video/sessions/{id}/rounds/{roundId}/parts` | Dodaj part |
                | `POST` | `/api/games/video/sessions/{id}/rounds/{roundId}/parts/{partId}/players` | Dodaj gracza |

                ## Kolekcje gier

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/games/board/collections` | Kolekcje gier planszowych |
                | `POST` | `/api/games/board/collections` | Tworzenie kolekcji |
                | `POST` | `/api/games/video/collections` | Kolekcja gier wideo |

                ## Statystyki

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/games/board/stats/player/{playerId}` | Statystyki gracza (planszówki) |
                | `GET` | `/api/games/board/stats/game/{gameId}` | Statystyki gry |

                ## Katalog gier per event

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET/POST` | `/api/events/{id}/board-games` | Planszówki na event |
                | `GET/POST` | `/api/events/{id}/video-games` | Gry wideo na event |
                | `GET/POST` | `/api/events/{id}/board-game-sessions` | Sesje planszówkowe na event |
                | `GET/POST` | `/api/events/{id}/video-game-sessions` | Sesje gier wideo na event |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: Przewodnik (rozszerzenie)
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "guide/project-structure",
            Title = "Struktura projektu — mapa plików",
            Category = "Przewodnik",
            SortOrder = 3,
            IsPublished = true,
            Tags = "structure,files,directories,map",
            Icon = "folder",
            ContentMarkdown = """
                # Struktura projektu — mapa plików

                ## Solucja (8 projektów)

                | Projekt | Typ | Opis |
                |---|---|---|
                | `AudioVerse.API` | Web API | Kontrolery, Huby, Middleware, Seed |
                | `AudioVerse.Application` | Class Library | CQRS, Handlery, Serwisy, Walidatory |
                | `AudioVerse.Domain` | Class Library | Encje, Enumy, Kontrakty repozytoriów |
                | `AudioVerse.Infrastructure` | Class Library | EF Core, Dapper, External APIs, Storage |
                | `AudioVerse.Tests` | xUnit | Testy unit + integration |
                | `AudioVerse.IdentityServer` | Web API | Osobny serwis auth (przygotowany) |
                | `AudioVerse.SetupWizard` | Console App | Wizard deploymentu |
                | `AudioVerse.Benchmarks` | Console App | BenchmarkDotNet |

                ## Kluczowe liczby

                | Metryka | Wartość |
                |---|---|
                | Pliki C# | 1441 |
                | Linie kodu | 55k+ |
                | Kontrolery | 49 |
                | Endpointy REST | 587 |
                | SignalR Hubs | 5 |
                | Encje domenowe | 162 |
                | MediatR Handlery | 243 |
                | Repozytoria | 24 (interfejsy) |
                | External API clients | 10 |
                | Middleware | 8 |
                | Enumy | 36 |
                | FluentValidation validators | 15+ |
                | Testy | 254 (269 z migracjami) |
                | EF Core Configurations | 40+ |
                | EF Core Migrations | 60+ |

                ## Konwencje nazewnictwa plików

                | Warstwa | Konwencja | Przykład |
                |---|---|---|
                | Domain | `{Name}.cs` | `Event.cs`, `EventType.cs` |
                | Application | `{Action}{Entity}Command.cs` | `CreateEventCommand.cs` |
                | Application | `{Action}{Entity}Handler.cs` | `CreateEventHandler.cs` |
                | Application | `{Entity}Dto.cs` | `KaraokeEventDto.cs` |
                | Application | `{Entity}Validator.cs` | `AddRoundPlayerRequestValidator.cs` |
                | Infrastructure | `{Entity}RepositoryEF.cs` | `EventRepositoryEF.cs` |
                | Infrastructure | `{Entity}Configuration.cs` | `EventConfiguration.cs` |
                | API | `{Entity}Controller.cs` | `EventsController.cs` |
                | Tests | `{Handler}Tests.cs` | `EventHandlerTests.cs` |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "guide/testing-detail",
            Title = "Testowanie — szczegółowo",
            Category = "Przewodnik",
            SortOrder = 4,
            IsPublished = true,
            Tags = "testing,integration,unit,factory,seeder",
            Icon = "check-circle",
            ContentMarkdown = """
                # Testowanie — szczegółowo

                ## Podział testów (254)

                | Kategoria | Plików | Przykłady |
                |---|---|---|
                | **Unit** (Handlers) | 12 | EventHandlerTests, BillingHandlerTests, PollHandlerTests |
                | **Integration** (E2E) | 37 | AuthIntegrationTests, KaraokeE2EFlowTests, EventE2EFlowTests |
                | **Services** | 2 | LoginAttemptServiceTests, OtpServiceTests |
                | **Seed** | 1 | TestDataSeeder |

                ## CustomWebApplicationFactory

                In-memory test server z:
                - SQLite in-memory database (zamiast PostgreSQL)
                - Fake reCAPTCHA service (`FakeRecaptchaService`)
                - JWT token helper (`JwtTokenHelper`)
                - Auto-migracja + seed danych (`TestDatabaseInitializer`)

                ## Pokryte obszary

                | Obszar | Testy |
                |---|---|
                | Auth (login, register, refresh, 2FA) | AuthIntegrationTests |
                | Events CRUD + permissions | EventsIntegrationTests, EventsPermissionTests |
                | Event sub-resources | EventSubResourcesIntegrationTests |
                | Event photos/comments | EventPhotosCommentsIntegrationTests |
                | Billing (expenses, payments, settlement) | BillingIntegrationTests |
                | Polls (create, vote, results) | PollsIntegrationTests |
                | Karaoke (sessions, rounds, scoring, songs) | KaraokeE2EFlowTests |
                | Teams + queue | TeamsAndQueueIntegrationTests |
                | Permissions (grant, revoke, bulk) | PermissionsIntegrationTests |
                | Game sessions | GameSessionsIntegrationTests |
                | Media catalog (songs, albums, movies, books) | MediaCatalogIntegrationTests |
                | Soundfonts | SoundfontIntegrationTests |
                | Editor + DMX | EditorAndDmxIntegrationTests |
                | AI controllers | AiControllersIntegrationTests |
                | Notifications | NotificationsIntegrationTests |
                | Moderation | ModerationIntegrationTests |
                | Admin (users, audit, config) | AuditIntegrationTests |
                | Security (captcha, honey tokens) | HoneyTokenCaptchaIntegrationTests |
                | Leagues + Betting | LeagueAndBettingIntegrationTests |
                | Skin Themes | SkinThemeIntegrationTests |
                | Genres Admin | GenresAdminIntegrationTests |
                | External connections (OAuth) | ExternalConnectionsIntegrationTests |
                | Password requirements | PasswordRequirementsIntegrationTests |
                | Locations | EventLocationIntegrationTests |
                | Player status | KaraokePlayerStatusIntegrationTests |
                | Bouncer + Access | BouncerAndAccessIntegrationTests |
                | Licenses | LicenseIntegrationTests |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        pages.Add(new WikiPage
        {
            Slug = "guide/database",
            Title = "Baza danych — EF Core, migracje, seedy",
            Category = "Przewodnik",
            SortOrder = 5,
            IsPublished = true,
            Tags = "database,ef,migrations,seed,postgresql,sqlite",
            Icon = "database",
            ContentMarkdown = """
                # Baza danych — EF Core, migracje, seedy

                ## AudioVerseDbContext

                Główny kontekst EF Core: `AudioVerse.Infrastructure/Persistence/AudioVerseDbContext.cs`

                - 162 encji → DbSets
                - 40+ konfiguracji (Fluent API) w `Persistence/Configurations/`
                - PostgreSQL (prod) / SQLite (testy)

                ## Migracje

                ```bash
                # Dodanie migracji
                dotnet ef migrations add NazwaMigracji \
                  --project AudioVerse.API \
                  --startup-project AudioVerse.API

                # Zastosowanie
                dotnet ef database update \
                  --project AudioVerse.API \
                  --startup-project AudioVerse.API

                # Cofnięcie
                dotnet ef migrations remove \
                  --project AudioVerse.API \
                  --startup-project AudioVerse.API

                # Script SQL (produkcja)
                dotnet ef migrations script \
                  --project AudioVerse.API \
                  --startup-project AudioVerse.API \
                  --output migration.sql
                ```

                ## Seedowanie (kolejność w `Program.cs`)

                | Seeder | Opis |
                |---|---|
                | `IdentitySeeder` | Admin user (admin@audioverse.local / Admin123!) |
                | `SongSeeder` | Piosenki karaoke z `Seed/Ultrastar/` |
                | `SoundfontSeeder` | 5 banków SF2 z `Seed/Soundfonts/` |
                | `AudioFileSeeder` | Prywatne pliki audio z `Seed/Music/` |
                | `WikiSeeder` | 29 stron wiki (ta dokumentacja!) |
                | `SeedRunner` (Infrastructure) | Gatunki muzyczne, dane infrastrukturalne |

                ## Konfiguracje EF (przykłady)

                | Konfiguracja | Opis |
                |---|---|
                | `EventConfiguration` | Event → Participants, Comments, Photos (cascade) |
                | `KaraokeSongFileConfiguration` | Song → Notes, Collaborators, Versions |
                | `SoundfontConfiguration` | Soundfont → Files (1:N), Programs (JSON) |
                | `UserProfileConfiguration` | Profile → Players, Devices, Microphones |

                ## PostgreSQL vs SQLite

                | Cecha | PostgreSQL | SQLite |
                |---|---|---|
                | Użycie | Produkcja, dev | Testy (in-memory) |
                | Port | 5433 (docker) | — |
                | JSON | `jsonb` typ kolumny | String (serializacja) |
                | Full-text | `tsvector` + `GIN` | `LIKE`/`COLLATE` |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend / News RSS
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/news-rss",
            Title = "News RSS — agregacja feedów",
            Category = "API — Backend",
            SortOrder = 700,
            IsPublished = true,
            Tags = "news,rss,feeds,artykuły",
            ContentMarkdown = """
                # News RSS — agregacja feedów

                ## Opis modułu

                Moduł News pobiera artykuły z ~150 feedów RSS/Atom w 15 kategoriach i 9 językach (PL, EN, DE, FR, IT, ES, ZH, JA).
                Background worker `RssFetcherBackgroundService` odpytuje feedy co 5 minut, parsuje je (`System.ServiceModel.Syndication`) i zapisuje w DB z deduplikacją po `ExternalId`.

                ## Architektura

                ```
                Domain:         NewsFeedCategory → NewsFeed → NewsArticle
                Repository:     INewsFeedRepository → NewsFeedRepositoryEF
                CQRS Queries:   GetNewsCategoriesQuery, GetNewsArticlesQuery, GetNewsFeedsQuery, GetNewsCategoryBySlugQuery
                CQRS Commands:  CreateNewsFeedCommand, ToggleNewsFeedCommand, DeleteNewsFeedCommand, CreateNewsCategoryCommand, ToggleNewsCategoryCommand
                Controller:     NewsController (9 endpointów)
                Worker:         RssFetcherBackgroundService
                Seeder:         NewsFeedSeeder (~150 feedów)
                ```

                ## Endpointy

                | Metoda | URL | Auth | Opis |
                |---|---|---|---|
                | `GET` | `/api/news/categories` | — | Lista kategorii |
                | `GET` | `/api/news/articles` | — | Artykuły (paginacja, filtr) |
                | `GET` | `/api/news/{slug}` | — | Artykuły po slug kategorii |
                | `GET` | `/api/news/feeds` | — | Lista feedów |
                | `POST` | `/api/news/feeds` | Admin | Dodaj feed |
                | `PATCH` | `/api/news/feeds/{id}/toggle` | Admin | Włącz/wyłącz feed |
                | `DELETE` | `/api/news/feeds/{id}` | Admin | Usuń feed |
                | `POST` | `/api/news/categories` | Admin | Dodaj kategorię |
                | `PATCH` | `/api/news/categories/{id}/toggle` | Admin | Włącz/wyłącz kategorię |

                ## Kategorie (slug → nazwa)

                | Slug | Nazwa | Feedy |
                |---|---|---|
                | `music` | Muzyka | Pitchfork, NME, Billboard, Stereogum, Musikexpress, Natalie Music… |
                | `sport` | Sport | ESPN, BBC Sport, kicker.de, L'Équipe, Marca, Gazzetta… |
                | `video-games` | Gry video | IGN, PC Gamer, Kotaku, GameStar, Famitsu, 4Gamer, Gry-Online… |
                | `board-games` | Gry planszowe | BoardGameGeek, Dice Tower, Shut Up & Sit Down, Planszeo… |
                | `movies` | Filmy | Screen Rant, Hollywood Reporter, Collider, Filmweb, AlloCiné… |
                | `tv-series` | Seriale | TVLine, Deadline TV, Serienjunkies, naEKRANIE… |
                | `technology` | Technologia | Ars Technica, The Verge, TechCrunch, Heise, Niebezpiecznik… |
                | `science` | Nauka | Nature, Science Daily, Spektrum, Futura Sciences, Crazy Nauka… |
                | `anime-manga` | Anime & Manga | Anime News Network, Crunchyroll, MyAnimeList, Anime2You… |
                | `books` | Książki | Book Riot, Literary Hub, Buchreport, Lubimyczytac… |
                | `automotive` | Motoryzacja | Top Gear, Motor1, Auto Motor Sport, Auto Świat… |
                | `art-design` | Sztuka & Design | Dezeen, Colossal, It's Nice That, Designtagebuch… |
                | `food` | Kulinaria | Serious Eats, Food52, Kwestia Smaku, Chefkoch… |
                | `travel` | Podróże | Lonely Planet, The Points Guy, Fly4free, Urlaubsguru… |
                | `business` | Biznes & Finanse | Bloomberg, Financial Times, CNBC, Money.pl, Nikkei… |

                ## Języki pokryte

                🇵🇱 PL · 🇬🇧 EN · 🇩🇪 DE · 🇫🇷 FR · 🇮🇹 IT · 🇪🇸 ES · 🇨🇳 ZH · 🇯🇵 JA
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend / Radio Live Voice
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/radio-live-voice",
            Title = "Radio Live Voice — WebRTC + Archiwum",
            Category = "API — Backend",
            SortOrder = 710,
            IsPublished = true,
            Tags = "radio,voice,webrtc,live,archiwum,nagrywanie",
            ContentMarkdown = """
                # Radio Live Voice — WebRTC + Archiwum

                ## Opis

                Funkcja „mówienie na żywo" — DJ/admin włącza mikrofon i nadaje głos do słuchaczy stacji radiowej, podobnie jak w prawdziwym radiu.
                Nagrywanie jest opcjonalne. Archiwum pozwala „przewinąć dzień radiowy".

                ## Architektura

                ```
                Domain:       VoiceSession, VoiceSegment (encje w Radio namespace)
                Repository:   rozszerzenie istniejącego radio repo
                Controller:   RadioController (dodatkowe endpointy /voice/*)
                SignalR Hub:  RadioHub (rozszerzenie — StartVoice, SendVoiceChunk, StopVoice)
                Storage:      voice-archive/{sessionId}/{segmentIndex}.webm (MinIO/S3)
                ```

                ## Encje

                - `VoiceSession` — sesja live voice (start/stop, kto mówił, nagrywanie włączone, powiązany BroadcastSession)
                - `VoiceSegment` — pojedynczy segment nagrania (storage key, timestamp, czas trwania, co leciało w tle)

                ## Endpointy

                | Metoda | URL | Auth | Opis |
                |---|---|---|---|
                | `POST` | `/api/radio/{id}/voice/start` | Admin | Rozpocznij live voice |
                | `POST` | `/api/radio/{id}/voice/stop` | Admin | Zakończ live voice |
                | `GET` | `/api/radio/{id}/voice/status` | — | Czy ktoś mówi na żywo |
                | `GET` | `/api/radio/{id}/archive/{date}` | — | Timeline dnia (voice + tracki) |
                | `GET` | `/api/radio/{id}/archive/{date}/segments` | — | Segmenty audio (presigned URLs) |

                ## SignalR events

                | Hub method (DJ→server) | Client event (server→listeners) |
                |---|---|
                | `StartVoice(radioId)` | `VoiceLiveStarted` |
                | `SendVoiceChunk(radioId, chunk)` | `VoiceChunk` |
                | `StopVoice(radioId)` | `VoiceLiveStopped` |

                ## Nagrywanie

                Jeśli `EnableRecording = true` przy starcie sesji, backend zapisuje chunki audio do storage pod `voice-archive/{voiceSessionId}/{index}.webm`.
                Metadane (co leciało, timestamp) zapisywane w `VoiceSegment`. Archiwum domyślnie 7 dni (konfigurowalne).
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend / Radio Station Invites
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/radio-invites",
            Title = "Radio Station Invite — zaproszenia gości",
            Category = "API — Backend",
            SortOrder = 720,
            IsPublished = true,
            Tags = "radio,invite,guest,email,voice",
            ContentMarkdown = """
                # Radio Station Invite — zaproszenia gości

                ## Opis

                Admin stacji radiowej może zaprosić gościa (po e-mailu) do mówienia na żywo w wyznaczonym oknie czasowym.
                Gość nie musi mieć konta — otrzymuje e-mail z unikalnym linkiem (tokenem).
                Po kliknięciu linku i akceptacji, gość może w wyznaczonych godzinach połączyć się przez SignalR (`JoinVoiceAsGuest`) i nadawać głos.

                ## Encje

                - `RadioStationInvite` — zaproszenie (token, email, okno czasowe, status: Pending/Accepted/Revoked/Expired)

                ## CQRS

                ```
                Commands:  CreateRadioInviteCommand, RevokeRadioInviteCommand, VerifyRadioInviteCommand, AcceptRadioInviteCommand
                Queries:   GetRadioInvitesQuery
                Handlers:  CreateRadioInviteHandler (wysyła e-mail), RevokeRadioInviteHandler, VerifyRadioInviteHandler, AcceptRadioInviteHandler, GetRadioInvitesHandler
                ```

                ## Endpointy

                | Metoda | URL | Auth | Opis |
                |---|---|---|---|
                | `POST` | `/api/radio/{id}/invites` | Admin | Wyślij zaproszenie |
                | `GET` | `/api/radio/{id}/invites` | Admin | Lista zaproszeń |
                | `DELETE` | `/api/radio/{id}/invites/{inviteId}` | Admin | Odwołaj zaproszenie |
                | `GET` | `/api/radio/invites/verify/{token}` | Public | Weryfikuj token |
                | `POST` | `/api/radio/invites/accept/{token}` | Public | Zaakceptuj zaproszenie |

                ## SignalR

                - `JoinVoiceAsGuest(radioId, inviteToken)` — gość dołącza do voice bez logowania

                ## E-mail

                Handler `CreateRadioInviteHandler` wysyła HTML e-mail z:
                - Nazwą stacji
                - Oknem czasowym (UTC)
                - Wiadomością od admina
                - Przyciskiem z linkiem do akceptacji (`{App:BaseUrl}/radio/invite/{token}`)

                Konfiguracja: `App:BaseUrl` w appsettings (domyślnie `https://audioverse.local`).
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend / Radio Schedule & Social
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/radio-schedule-social",
            Title = "Radio — harmonogram, chat, reakcje, komentarze, follow",
            Category = "API — Backend",
            SortOrder = 730,
            IsPublished = true,
            Tags = "radio,schedule,chat,reactions,comments,follow,social",
            ContentMarkdown = """
                # Radio — harmonogram, chat, reakcje, komentarze, follow

                ## Harmonogram (ramówka)

                Encja `RadioScheduleSlot` — slot w harmonogramie stacji.
                - Cykliczny: `DayOfWeek` (0–6) + `StartTimeUtc`/`EndTimeUtc`
                - Jednorazowy: `SpecificDate` + godziny

                | Metoda | URL | Auth | Opis |
                |---|---|---|---|
                | `GET` | `/api/radio/{id}/schedule` | Public | Potwierdzone sloty |
                | `GET` | `/api/radio/{id}/schedule/all` | Admin | Wszystkie sloty |
                | `POST` | `/api/radio/{id}/schedule` | Admin | Dodaj slot |
                | `PUT` | `/api/radio/{id}/schedule/{slotId}` | Admin | Aktualizuj |
                | `DELETE` | `/api/radio/{id}/schedule/{slotId}` | Admin | Usuń |

                ## Chat (real-time)

                Encja `RadioChatMessage`. REST + SignalR (`SendChatMessage`, event `ChatMessage`).

                ## Reakcje na piosenkę

                Encja `RadioSongReaction`. Typy: like, love, fire, sad, laugh, clap, dislike.
                SignalR: `SendReaction(radioId, reactionType)` → event `SongReaction`.

                ## Komentarze / oceny stacji

                Encja `RadioComment` z opcjonalnym `Rating` (1–5). GET zwraca średnią ocenę.

                ## Follow (obserwowanie)

                Encja `RadioFollow`. POST/DELETE follow, GET status (followers count + isFollowing).
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend / External Radio Stations
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/external-radio-stations",
            Title = "Zewnętrzne stacje radiowe online",
            Category = "API — Backend",
            SortOrder = 740,
            IsPublished = true,
            Tags = "radio,external,stream,countries,seed",
            ContentMarkdown = """
                # Zewnętrzne stacje radiowe online

                ## Opis

                Moduł agreguje ~150 darmowych stacji radiowych online z 25+ krajów.
                Encja `ExternalRadioStation` z polami: name, slug, streamUrl, countryCode, countryName, language, genre, bitrateKbps.

                ## Seedowane kraje

                PL (Polska, 14 stacji), US/GB (USA/UK, 20 stacji), DE (Niemcy, 12), FR (Francja, 12),
                IT (Włochy, 11), ES (Hiszpania, 10), JP (Japonia, 7), CN (Chiny, 5), BR (Brazylia, 3),
                NL (Holandia, 5), BE (Belgia, 4), AT (Austria, 3), CH (Szwajcaria, 4), CZ (Czechy, 3),
                SE (Szwecja, 3), NO (Norwegia, 2), DK (Dania, 2), FI (Finlandia, 2), PT (Portugalia, 2),
                HU (Węgry, 2), RO (Rumunia, 2), TR (Turcja, 2), KR (Korea, 2), IE (Irlandia, 2),
                GR (Grecja, 2), IN (Indie, 2), CA (Kanada, 2), AU (Australia, 3), NZ (Nowa Zelandia, 2),
                MX (Meksyk, 2), AR (Argentyna, 1), UA (Ukraina, 1)

                ## Endpointy

                | Metoda | URL | Auth | Opis |
                |---|---|---|---|
                | `GET` | `/api/radio/external` | Public | Lista (filtr country/language/genre, paginacja) |
                | `GET` | `/api/radio/external/countries` | Public | Dostępne kraje |
                | `POST` | `/api/radio/external` | Admin | Dodaj stację |
                | `PATCH` | `/api/radio/external/{id}/toggle` | Admin | Włącz/wyłącz |

                ## Frontend

                Użyj `streamUrl` bezpośrednio w `<audio>` (mp3/aac) lub HLS.js (m3u8).
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend / Wishlists
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/wishlists",
            Title = "Wishlists — listy życzeń + Steam sync",
            Category = "API — Backend",
            SortOrder = 750,
            IsPublished = true,
            Tags = "wishlist,steam,games,boardgames,videogames,sync",
            ContentMarkdown = """
                # Wishlists — listy życzeń + Steam sync

                ## Opis

                Uniwersalny moduł wishlist — użytkownik tworzy listy życzeń z elementami różnych typów:
                BoardGame, VideoGame, Movie, Book, Music, TvShow, Custom.
                Wishlisty mogą być publiczne (udostępniane tokenem/linkiem) i synchronizowane ze Steam.

                ## Encje

                ```
                Domain:     Wishlist → WishlistItem (Wishlists namespace)
                Enums:      WishlistItemType, WishlistPriority
                Controller: WishlistController (12 endpointów)
                ```

                ## Endpointy

                | Metoda | URL | Auth | Opis |
                |---|---|---|---|
                | `GET` | `/api/wishlists/my` | User | Moje wishlisty |
                | `GET` | `/api/wishlists/{id}` | Public/Owner | Wishlist po ID |
                | `GET` | `/api/wishlists/shared/{token}` | Public | Wishlist po tokenie |
                | `POST` | `/api/wishlists` | User | Utwórz |
                | `PUT` | `/api/wishlists/{id}` | Owner | Aktualizuj |
                | `DELETE` | `/api/wishlists/{id}` | Owner | Usuń |
                | `POST` | `/api/wishlists/{id}/items` | Owner | Dodaj element |
                | `PUT` | `/api/wishlists/{id}/items/{itemId}` | Owner | Aktualizuj element |
                | `PATCH` | `/api/wishlists/{id}/items/{itemId}/acquired` | Owner | Toggle kupiony |
                | `DELETE` | `/api/wishlists/{id}/items/{itemId}` | Owner | Usuń element |
                | `POST` | `/api/wishlists/{id}/sync/steam` | Owner | Sync ze Steam |

                ## Steam Sync

                Endpoint importuje elementy z Steam wishlist API (deduplikacja po SteamAppId).
                Mapowanie priorytetów: Steam priority 1 → MustHave, 2-5 → High, 6-15 → Normal, 16+ → Low.
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend / Gift Registry
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/gift-registry",
            Title = "Gift Registry — listy prezentowe na eventy",
            Category = "API — Backend",
            SortOrder = 760,
            IsPublished = true,
            Tags = "gift,registry,wedding,prezent,event,contribution",
            ContentMarkdown = """
                # Gift Registry — listy prezentowe na eventy

                ## Opis

                Lista prezentowa powiązana z eventem (wesele, urodziny).
                Goście dołączają się do prezentów — wielu do jednego dużego (crowdfunding prezentowy).
                Udostępnianie przez publiczny link (token).

                ## Encje

                ```
                Domain:     GiftRegistry → GiftRegistryItem → GiftContribution (Wishlists namespace)
                Controller: GiftRegistryController (11 endpointów)
                ```

                ## Mechanizm grupowego prezentu

                1. Właściciel dodaje prezent z `TargetAmount` (np. 500 PLN) i/lub `MaxContributors` (np. 10)
                2. Goście wchodzą na link `shared/{token}` i widzą listę prezentów
                3. Gość klika „Dołóż się" — podaje imię, kwotę, opcjonalną wiadomość, `isAnonymous`
                4. Backend sumuje wkłady — gdy suma ≥ targetAmount → `IsFullyReserved = true`
                5. Alternatywnie: limit osób (maxContributors) bez kwoty
                6. Właściciel widzi darczyńców (chyba że anonimowi)

                ## Endpointy

                | Metoda | URL | Auth |
                |---|---|---|
                | `GET` | `/api/gift-registry/my` | User |
                | `GET` | `/api/gift-registry/shared/{token}` | Public |
                | `POST` | `/api/gift-registry` | User |
                | `PUT` | `/api/gift-registry/{id}` | Owner |
                | `PATCH` | `/api/gift-registry/{id}/toggle` | Owner |
                | `DELETE` | `/api/gift-registry/{id}` | Owner |
                | `POST` | `/api/gift-registry/{id}/items` | Owner |
                | `PUT` | `/api/gift-registry/{id}/items/{itemId}` | Owner |
                | `DELETE` | `/api/gift-registry/{id}/items/{itemId}` | Owner |
                | `POST` | `/api/gift-registry/items/{itemId}/contribute` | Public |
                | `DELETE` | `/api/gift-registry/contributions/{id}` | Contributor/Admin |
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        // ────────────────────────────────────────────────
        //  Kategoria: API — Backend / Vendor Marketplace
        // ────────────────────────────────────────────────
        pages.Add(new WikiPage
        {
            Slug = "api/vendor-marketplace",
            Title = "Vendor Marketplace — organizacje, cenniki, oferty",
            Category = "API — Backend",
            SortOrder = 770,
            IsPublished = true,
            Tags = "vendor,marketplace,catering,venue,offers,events,wedding",
            ContentMarkdown = """
                # Vendor Marketplace — organizacje, cenniki, oferty, porównywanie

                ## Opis

                Moduł marketplace umożliwia organizacjom (firmom) tworzenie profili vendorów z cennikami,
                menu, portfolio i zbieranie zapytań ofertowych od klientów. Organizatorzy eventów mogą
                podłączyć wielu vendorów do jednego wydarzenia i porównywać ich oferty.

                ## Architektura

                ```
                Organization (istniejąca encja)
                  └─ VendorProfile (1:1 — profil w marketplace)
                       ├─ VendorPriceListItem (cennik)
                       ├─ VendorMenuItem (menu — catering)
                       ├─ VendorPortfolioItem (galeria)
                       ├─ VendorReview (recenzje)
                       ├─ VendorInquiry (zapytania ofertowe)
                       └─ VendorOffer → VendorOfferItem (oferty)
                Event └─ EventVendor (wielu vendorów na event)
                ```

                ## CQRS

                ```
                Commands (18): CreateVendorProfile, UpdateVendorProfile, Add/Update/DeletePriceListItem,
                  Add/Update/DeleteVendorMenuItem, Add/DeletePortfolioItem, AddVendorReview,
                  SendVendorInquiry, UpdateInquiryStatus, CreateVendorOffer, SendVendorOffer,
                  RespondToOffer, AddEventVendor, UpdateEventVendorStatus

                Queries (12): BrowseVendors, GetVendorCategories, GetVendorProfile,
                  GetVendorPriceList, GetVendorMenu, GetVendorPortfolio, GetVendorReviews,
                  GetVendorInquiries, GetVendorOffer, GetVendorOffers, GetMyOffers, GetEventVendors
                ```

                ## Kategorie usług (20)

                Catering, Venue, Music, Photography, Videography, Decorations, Flowers, Cake,
                Entertainment, Transport, Accommodation, Beauty, Invitations, Lighting, Sound,
                Security, Cleaning, Rentals, Planning, Other

                ## Kluczowe endpointy

                | Metoda | URL | Opis |
                |---|---|---|
                | `GET` | `/api/vendors?category=Catering&city=Warszawa` | Przeglądaj marketplace |
                | `GET` | `/api/vendors/{slug}` | Profil vendora |
                | `POST` | `/api/vendors/{id}/inquiries` | Zapytanie ofertowe |
                | `POST` | `/api/vendors/{id}/offers` | Utwórz ofertę |
                | `GET` | `/api/vendors/event-vendors/{eventId}/compare` | Porównaj vendorów |

                ## Flow

                1. Organizator przegląda marketplace → filtruje po kategorii/mieście
                2. Wysyła zapytanie ofertowe (contactName, message, guestCount, budget)
                3. Vendor tworzy spersonalizowaną ofertę z pozycjami (ilość × cena)
                4. Organizator podłącza vendorów do eventu
                5. Porównuje oferty od różnych vendorów tej samej kategorii
                6. Akceptuje wybraną ofertę
                """,
            CreatedAt = now,
            UpdatedAt = now
        });

        db.WikiPages.AddRange(pages);
        await db.SaveChangesAsync();
    }
}
