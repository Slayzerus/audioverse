# AudioVerse — Backend API

> Stan na: **2025-07-27** · .NET 10 · **1441 plików C#** · **55k+ LOC** · **49 kontrolerów** · **587 endpointów** · **162 encje** · **243 handlery** · **5 SignalR Hubs** · **254 testy**

---

## Architektura

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
│  254 testy (269 PASS z migracjami)                           │
└──────────────────────────────────────────────────────────────┘
```

### Encje domenowe (162 — podział)

| Obszar | Encje | Przykłady |
|---|---|---|
| **Events** | 35 | Event, Participant, Comment, Photo, Poll, Billing, Invite, DateProposal |
| **Karaoke** | 25 | KaraokeSongFile, KaraokeSession, KaraokeRound, KaraokeTeam, SongCollaborator |
| **Audio** | 20 | AudioFile, AudioTag, AudioScan, Waveform |
| **Games** | 18 | BoardGame, VideoGame, GameSession, GameRound, GameStats |
| **Media** | 18 | Song, Album, Artist, Playlist, Soundfont, Movie, Book, TvShow, Sport |
| **Editor** | 15 | EditorProject, EditorLayer, AudioClip, AudioEffect, SamplePack |
| **UserProfiles** | 8 | UserProfile, UserProfilePlayer, UserExternalAccount, UserDevice |
| **Auth** | 6 | PasswordHistory, PasswordRequirements, OneTimePassword |
| **Admin** | 7 | AuditLog, SystemConfiguration, ScoringPreset, SkinTheme, WikiPage |
| **DMX** | 6 | DmxScene, DmxSequence, DmxDevice |

---

## Swagger Groups (8 grup)

| Grupa | Route prefix | Kontrolery |
|---|---|---|
| **Auth & User** | `/api/user` | UserController, ExternalConnectionsController, PasswordRequirementsController |
| **Events** | `/api/events`, `/api/invites`, `/api/organizations`, `/api/leagues`, `/api/betting` | EventsController, PollsController, BillingController, InvitesController, OrganizationsController, LeaguesController, FantasyController, BettingController |
| **Karaoke** | `/api/karaoke` | KaraokeController, KaraokeChannelController, UltrastarController |
| **Games** | `/api/games` | BoardGamesController, VideoGamesController |
| **Media Library** | `/api/library`, `/api/media` | SongsController, AlbumsController, ArtistsController, PlaylistController, MediaFilesController, SoundfontsController, MoviesController, BooksController, TvShowsController, SportsController |
| **Editor & DMX** | `/api/editor`, `/api/dmx` | EditorController, DmxController |
| **AI** | `/api/ai` | AiAudioController, AiVideoController |
| **Admin** | `/api/admin`, `/api/moderation`, `/api/wiki` | AdminController, GenresAdminController, SkinThemeAdminController, WikiController, ModerationController, PermissionsController |

### SignalR Hubs (5)

| Hub | Path | Opis |
|---|---|---|
| KaraokeHub | `/hubs/karaoke` | Lobby, czat, WebRTC signaling, scoring |
| EditorHub | `/hubs/editor` | Kolaboracja real-time, kursory, blokady |
| NotificationHub | `/hubs/notifications` | Powiadomienia push |
| AdminHub | `/hubs/admin` | Audit log, config changes, real-time logi |
| ModerationHub | `/hubs/moderation` | Zgłoszenia nadużyć |

---

## Uruchomienie lokalne

### Wymagania
- .NET 10 SDK
- PostgreSQL 16+ (lub SQLite do dev/testów)
- MinIO (object storage)
- Redis (opcjonalny — cache, rate limiting)

### Quick start

```bash
# 1. Klonowanie
git clone https://dev.azure.com/audioverse/AudioVerse/_git/AudioVerse
cd audioverse-dotnet

# 2. Przywrócenie pakietów
dotnet restore

# 3. User secrets (klucze API — NIE commituj do repo)
cd AudioVerse.API
dotnet user-secrets set "Spotify:ClientId" "YOUR_ID"
dotnet user-secrets set "Spotify:ClientSecret" "YOUR_SECRET"
dotnet user-secrets set "YouTube:ApiKey" "YOUR_KEY"
dotnet user-secrets set "Igdb:ClientId" "YOUR_TWITCH_CLIENT_ID"
dotnet user-secrets set "Igdb:ClientSecret" "YOUR_TWITCH_CLIENT_SECRET"
dotnet user-secrets set "Tmdb:ApiKey" "YOUR_TMDB_KEY"
dotnet user-secrets set "Tidal:ClientId" "YOUR_ID"
dotnet user-secrets set "Tidal:ClientSecret" "YOUR_SECRET"

# 4. Infrastruktura (docker-compose)
cd Env
docker-compose up -d   # PostgreSQL, MinIO, Redis, MailHog

# 5. Migracje
cd ..
dotnet ef database update --project AudioVerse.API --startup-project AudioVerse.API

# 6. Uruchomienie
dotnet run --project AudioVerse.API
# → http://localhost:5000/swagger
# → https://localhost:5003/swagger
```

---

## Konfiguracja (appsettings.json)

### Infrastruktura

| Sekcja | Opis |
|---|---|
| `ConnectionStrings:PostgresConnection` | PostgreSQL connection string |
| `ConnectionStrings:Redis` | Redis (opcjonalny) |
| `ConnectionStrings:Minio` | MinIO endpoint |
| `JwtSettings:Secret` | Klucz JWT (min 64 znaki) |
| `Minio:AccessKey`, `SecretKey` | MinIO credentials |
| `Smtp:Host`, `Port`, `From` | SMTP (default: MailHog localhost:1025) |
| `RecaptchaSettings:SecretKey`, `SiteKey` | Google reCAPTCHA v3 |

### Serwisy zewnętrzne

| Sekcja | Serwis | Wymagany |
|---|---|---|
| `Spotify:ClientId`, `ClientSecret` | Spotify Web API | ✅ (wyszukiwanie, playlisty) |
| `Tidal:ClientId`, `ClientSecret` | Tidal API | Opcjonalny |
| `YouTube:ApiKey` | YouTube Data API v3 | ✅ (wyszukiwanie) |
| `Igdb:ClientId`, `ClientSecret` | IGDB via Twitch | ✅ (gry wideo) |
| `Tmdb:ApiKey` | TMDB API | ✅ (filmy, seriale) |
| `Steam:ApiKey` | Steam Web API | Ustawiony w appsettings |
| `GoogleBooks:ApiKey` | Google Books API | Opcjonalny (działa bez) |
| `TheSportsDb:ApiKey` | TheSportsDB | Opcjonalny (free tier) |

### AI Mikroserwisy (self-hosted Docker)

| Sekcja | Serwis |
|---|---|
| `AiAudio:FasterWhisperBaseUrl` | Speech-to-text (Faster Whisper) |
| `AiAudio:PiperBaseUrl` | Text-to-speech (Piper) |
| `AiAudio:SeparateBaseUrl` | Separacja ścieżek (Demucs) |
| `AiAudio:AudioCraftBaseUrl` | Generowanie muzyki |
| `AiVideo:MediaPipeBaseUrl` | Pose estimation |

---

## Testy

```bash
dotnet test AudioVerse.Tests
# Passed! — Failed: 0, Passed: 269, Skipped: 0
```

> ⚠️ Nie uruchamiaj `dotnet test` z terminala Copilot — może się zawiesić. Użyj Test Explorer w Visual Studio.

---

## Wiki (dokumentacja w bazie)

Dokumentacja projektu jest przechowywana w bazie danych jako strony wiki (encja `WikiPage` + `WikiPageRevision`) i serwowana przez REST API. Frontend wyświetla markdown, admin edytuje z panelu — bez redeploymentu.

**53 strony seedowane** w 11 kategoriach — kompletna dokumentacja backendu + placeholdery Frontend/Mobile.

### Endpointy Wiki (16)

| Metoda | URL | Opis | Auth |
|---|---|---|---|
| `GET` | `/api/wiki` | Lista stron (`?category=`) | Publiczny |
| `GET` | `/api/wiki/nav` | Drzewo nawigacji (kategorie + parent/child) | Publiczny |
| `GET` | `/api/wiki/{slug}` | Strona po slug (+ breadcrumbs + children) | Publiczny |
| `GET` | `/api/wiki/search?q=` | Wyszukiwanie (tytuł, treść, tagi) | Publiczny |
| `GET` | `/api/wiki/categories` | Kategorie z liczbą stron | Publiczny |
| `GET` | `/api/wiki/{id}/revisions` | Historia rewizji strony | Publiczny |
| `GET` | `/api/wiki/{id}/revisions/{rev}` | Konkretna rewizja (snapshot) | Publiczny |
| `POST` | `/api/wiki` | Tworzenie strony | Admin |
| `PUT` | `/api/wiki/{id}` | Aktualizacja (auto-rewizja) | Admin |
| `DELETE` | `/api/wiki/{id}` | Usunięcie (z rewizjami) | Admin |
| `POST` | `/api/wiki/reorder` | Zmiana kolejności stron | Admin |
| `POST` | `/api/wiki/{id}/revisions/{rev}/revert` | Przywrócenie rewizji | Admin |
| `POST` | `/api/wiki/import-from-docs` | Import z `Docs/*.md` | Admin |

### Seedowane kategorie (11)

| Kategoria | Stron | Zawartość |
|---|---|---|
| **Wprowadzenie** | 3 | Home, Architektura, Pierwsze kroki |
| **API — Backend** | 15 | Endpointy, Auth, Events, Events subresources, Media, Games, Games sessions, Editor/DMX, AI, Enumy, Errors, Konwencje, SignalR, Billing, Leagues/Betting, Invites/Organizations |
| **Karaoke** | 5 | Przegląd, Ultrastar format, Scoring, Teams/Queue, Permissions/Versioning |
| **Integracje** | 3 | Przegląd, Spotify, OAuth flow |
| **Infrastruktura** | 8 | Docker, MinIO, Konfiguracja, Middleware, Storage pipeline, Repozytoria EF/Dapper, External APIs, Telemetria, Rate Limiting |
| **Serwisy i Utility** | 5 | Przegląd serwisów, User/Auth, Security, AI mikroserwisy, DMX |
| **Admin** | 1 | Panel admina |
| **Przewodnik** | 6 | Dodawanie feature, Testowanie, Testowanie szczegółowe, FAQ, Struktura projektu, Baza danych |
| **Projekty dodatkowe** | 3 | IdentityServer, SetupWizard, Benchmarks |
| **Frontend** 🚧 | 1 | Placeholder |
| **Mobile** 🚧 | 1 | Placeholder |

Istniejące pliki dokumentacji:
- `FRONT.md` — dokumentacja endpointów dla frontendu (587 endpointów)
- `ARCHITECTURE.md` — szczegóły architektury
- `MINIO.md` — konfiguracja object storage
- `RTC.md` — WebRTC / real-time
- `RESOURCELIBRARY.md` — biblioteka zasobów
- `TODO.md` — roadmap

---

## Struktura katalogów

```
audioverse-dotnet/
├── AudioVerse.API/                    # Web API (.NET 10)
│   ├── Areas/
│   │   ├── Admin/Controllers/         # AdminController, WikiController
│   │   ├── Identity/Controllers/      # UserController, ExternalConnections
│   │   ├── Events/Controllers/        # EventsController + sub-controllers
│   │   ├── Karaoke/Controllers/       # KaraokeController, UltrastarController
│   │   ├── Karaoke/Hubs/              # KaraokeHub
│   │   ├── Games/Controllers/         # BoardGamesController, VideoGamesController
│   │   └── Media/Controllers/         # SongsController, AlbumsController, ...
│   ├── Hubs/                          # NotificationHub, EditorHub, AdminHub
│   ├── Middleware/                     # ExceptionHandling, Correlation, RateLimit
│   ├── Docs/                          # Pliki .md (importowalne do wiki)
│   ├── Env/                           # docker-compose.yml
│   ├── Migrations/                    # EF Core migrations
│   └── Seed/                          # Dane seedowe (Music, Samples, Soundfonts, Ultrastar)
├── AudioVerse.Application/            # CQRS (Commands, Queries, Handlers)
│   ├── Commands/                      # 100+ komend
│   ├── Queries/                       # 60+ zapytań
│   ├── Handlers/                      # 243 handlery
│   ├── Models/                        # DTOs, Requests
│   ├── Services/                      # Spotify, Tidal, YouTube serwisy
│   └── Validators/                    # FluentValidation
├── AudioVerse.Domain/                 # Encje, enumy, kontrakty repozytoriów
│   ├── Entities/                      # 162 encje (12 obszarów)
│   ├── Enums/                         # EventType, KaraokeMode, ...
│   └── Repositories/                  # Interfejsy repozytoriów
├── AudioVerse.Infrastructure/         # Implementacje
│   ├── Persistence/                   # DbContext, konfiguracje EF
│   ├── Repositories/                  # EF + Dapper implementacje
│   ├── ExternalApis/                  # BGG, Steam, IGDB, TMDB, Spotify, Tidal, YouTube
│   └── Email/                         # SMTP sender
└── AudioVerse.Tests/                  # 254 testy
    ├── Unit/                          # Testy handlerów
    ├── Integration/                   # Testy E2E
    └── Seed/                          # TestDataSeeder
```

---

## Konteneryzacja

```bash
# Build
docker build -t audioverse-api:latest -f AudioVerse.API/Dockerfile .

# Uruchomienie
docker run -e ASPNETCORE_ENVIRONMENT=Production -p 5000:80 audioverse-api:latest

# Pełny stack (API + PostgreSQL + MinIO + Redis + MailHog)
cd AudioVerse.API/Env
docker-compose up -d
```

---

## Projekt AudioVersee.API

W repozytorium istnieje również projekt `AudioVersee.API` (biblioteka współdzielona). Zawiera wspólne komponenty i helpery — DTO, serializacja, storage/pliki, moduły autoryzacji. Przy tworzeniu nowych funkcji utility rozważ umieszczanie kodu w `AudioVersee.API` zamiast bezpośrednio w `AudioVerse.API`.
