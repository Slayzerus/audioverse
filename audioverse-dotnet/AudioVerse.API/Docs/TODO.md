# AudioVerse — TODO / Roadmap

> Date: **2025-06-30** · Build: ✅ · .NET 10 · **~2267 C# files** · **89 controllers** · **885 endpoints**

---

## 0. CODE REVIEW — 2025-06-28

### 0.1 Mega-controllers (>500 lines) — need splitting

| Controller | Lines | Endpoints | Proposed split |
|---|---|---|---|
| `EventsController.cs` | 1403 | 108 | → `EventPhotosController`, `EventVideosController`, `EventCollagesController`, `EventMediaCollectionsController`, `EventInviteController`, `EventBillingController` already exists but photos/videos/collages still in EventsController |
| `KaraokeController.cs` | 1230 | 75 | → `KaraokeSongsController`, `KaraokeSessionsController`, `KaraokeStatsController`, `KaraokeAdminController`, `KaraokeImportController` |
| `UserController.cs` | ~~1197~~ 293 | ~~47~~ 13 | ✅ SPLIT → `UserSecurityController` (529 lines, 22 ep), `UserDevicesController` (191 lines, 12 ep) |
| `RadioController.cs` | ~~811~~ 261 | ~~39~~ 14 | ✅ SPLIT → `RadioStatsController` (110), `RadioVoiceController` (58), `RadioInvitesController` (73), `RadioSocialController` (178) |
| `ExternalConnectionsController.cs` | 775 | — | → split per platform if needed |
| `EditorController.cs` | ~~683~~ 338 | ~~44~~ 22 | ✅ SPLIT → `EditorEffectsController` (145), `EditorExportController` (152) |
| `AdminController.cs` | ~~673~~ 102 | ~~25~~ 4 | ✅ SPLIT → `AdminUsersController` (244, 17 ep), `AdminAuditController` (140, 4 ep) |
| `WikiController.cs` | 664 | — | OK (wiki is self-contained) |
| `ContactsController.cs` | 611 | 14 | OK |
| `YouTubeController.cs` | 547 | — | Move to Area `Platforms` |

### ✅ 0.2 DbContext in controllers — 0 remaining ✅ (was 17)

These controllers use `_db` (AudioVerseDbContext) directly instead of repositories:

| Controller | Priority |
|---|---|
| `AdminController.cs` | P1 |
| `AlbumsController.cs` | P1 |
| `ArtistsController.cs` | P1 |
| `AudioEditorController.cs` | P1 |
| `AudioScanController.cs` | P2 |
| `ContactsController.cs` | P1 |
| `DmxController.cs` | P2 |
| `EditorController.cs` | P1 |
| `EventsController.cs` | P1 (partial — repo call via `GetRequiredService`) |
| `ExternalConnectionsController.cs` | P1 |
| `ExternalSearchController.cs` | P2 |
| `MediaFilesController.cs` | P2 |
| `RadioController.cs` | P1 |
| `SongsController.cs` | P1 |
| `SoundfontsController.cs` | P2 |
| `SystemConfigurationController.cs` | P2 |
| `WikiController.cs` | P2 |

### ✅ 0.3 DbContext in handlers — 0 remaining ✅ (was 43)

All 43 handlers/services migrated from `AudioVerseDbContext` to repository interfaces.

**✅ Done (43 handlers/services):** Radio (10), Vendor (8), Karaoke stats (4), Gift/Wishlist (4), Admin/Dashboard (3), Game stats (2), Soundfont (1), Genre (1), PlayerLink (4), Event soft-delete/restore/bulk (3), SyncSteamWishlist (1), UpdatePasswordRequirements (1), Security services (6: AuditLogService, CaptchaService, HoneyTokenService, LoginAttemptService, OtpService, PasswordService), Karaoke search (3: GetFilteredSongsHandler, GetFilteredEntitiesHandler, GetPermissionChangeHistoryHandler)

### ✅ 0.4 Endpoints without `<summary>` — NONE (all 846 have summaries) ✅

### ✅ 0.5 Duplicate `<summary>` tags — KaraokeController — DONE

Fixed. No duplicate `<summary>` pairs remain.

### ✅ 0.6 Multi-type files — API layer — DONE (was 8 → 0)

All inline DTOs extracted to `Models/Requests/` per Area.
- `GiftRegistryRequests.cs` → 3 files
- `NewsRequests.cs` → 2 files
- `PlatformRequests.cs` → 8 files
- `RadioRequests.cs` → 9 files
- `VendorRequests.cs` → 12 files
- `WishlistRequests.cs` → 2 files
- `WikiController.cs` inline DTOs → `Models/Requests/Admin/` (3 files)

### ✅ 0.7 Multi-type files — Application layer — DONE (was 30 → 0)

All Commands, Queries, Handlers, DTOs, and Service records split to one-type-per-file.
- Commands/Queries: 19 multi-type files → 0
- Handlers: 34 multi-type files → 0
- Services/DTOs: 5 multi-type files → 0
- ISongInformationService: 6 MusicBrainz records extracted
- IEventNotificationService: interface extracted to separate file
- AiCircuitBreaker/AiHealthMonitor: records extracted
- BoardGameStatsDto: 3 classes extracted

### ✅ 0.8b Multi-type files — Domain + Infrastructure — DONE (was 3 → 0)

- `RadioStationInvite.cs` → extracted `RadioInviteStatus` enum
- `TmdbMovieDetails.cs` → extracted `TmdbCrewMember` class
- `NotificationMessage.cs` → extracted `NotificationChannel` enum

**Zero multi-type public files across all 4 layers.** ✅

### ✅ 0.8 Controllers outside Areas — DONE (was 13, all moved)

| Controller | Lines | Proposed Area |
|---|---|---|
| `RadioController.cs` | 811 | `Areas/Radio/Controllers/` |
| `YouTubeController.cs` | 547 | `Areas/Platforms/Controllers/` |
| `AudioEditorController.cs` | 353 | `Areas/Editor/Controllers/` (duplicate of EditorController?) |
| `VendorController.cs` | 320 | `Areas/Vendor/Controllers/` |
| `SpotifyController.cs` | 288 | `Areas/Platforms/Controllers/` |
| `SocialController.cs` | 237 | `Areas/Identity/Controllers/` |
| `TidalController.cs` | 221 | `Areas/Platforms/Controllers/` |
| `NewsController.cs` | 174 | `Areas/Admin/Controllers/` |
| `WishlistController.cs` | 129 | `Areas/Identity/Controllers/` or `Areas/Events/Controllers/` |
| `GiftRegistryController.cs` | 121 | `Areas/Events/Controllers/` |
| `MiniGameController.cs` | 117 | `Areas/Games/Controllers/` |
| `NotificationsController.cs` | 67 | `Areas/Identity/Controllers/` |
| `SystemNotificationsController.cs` | 66 | `Areas/Admin/Controllers/` |

---

## 1. REFACTORING [P0 — do before new features]

### ✅ 1.1 Split EventsController (1403 → 938 lines + 5 new controllers) — DONE

| New Controller | Lines | Endpoints |
|---|---|---|
| `EventPhotosController.cs` | ~190 | photos CRUD, thumbnail, filter, versions, tags |
| `EventVideosController.cs` | ~140 | videos CRUD, streaming, thumbnail, tags |
| `EventCollagesController.cs` | ~90 | collages CRUD, items |
| `EventMediaCollectionsController.cs` | ~60 | collections CRUD |
| `EventInvitesController.cs` | ~70 | invite templates, bulk invites |
| `EventsController.cs` (remaining) | 938 | event CRUD, participants, sessions, schedule, menu, attractions, games, comments, access, bouncer, dates, picks, recurring |

### ✅ 1.2 Split KaraokeController (1230 → 811 lines + 2 new controllers) — DONE

| New Controller | Lines | Endpoints |
|---|---|---|
| `KaraokeSongsController.cs` | ~300 | songs CRUD, filter, search, collaborators, versions, YouTube import |
| `KaraokeStatsController.cs` | ~50 | ranking, history, activity |
| `KaraokeController.cs` (remaining) | 811 | events, teams, queue, favorites, song picks, admin, rounds |

### ✅ 1.3 Fix duplicate `<summary>` in KaraokeController — DONE

### ✅ 1.4 All 846 endpoints have `<summary>` — DONE

### ✅ 1.5 Remove DbContext from all controllers (17 → 0 remaining) — DONE

Replace `_db` with appropriate repository interfaces.

**✅ Done:** AdminController, AlbumsController, ArtistsController, AudioEditorController, AudioScanController, ContactsController, DmxController, EditorController, EventsController, ExternalConnectionsController, ExternalSearchController, MediaFilesController, RadioController, SongsController, SoundfontsController, SystemConfigurationController, WikiController

### ✅ 1.6 Remove DbContext from all handlers (43 → 0 remaining) — DONE

All 43 handlers/services migrated to repository interfaces. Zero `AudioVerseDbContext` references in Application layer.

**✅ Done (43 handlers/services):**
- Radio (10), Vendor (8), Karaoke stats (4), Gift/Wishlist (4), Admin (3), Game stats (2), Events (3), PlayerLink (4), Audio/Genre/Soundfont (2)
- Security services (6): `AuditLogService`, `CaptchaService`, `HoneyTokenService`, `LoginAttemptService`, `OtpService`, `PasswordService`
- Karaoke search (3): `GetFilteredSongsHandler`, `GetFilteredEntitiesHandler`, `GetPermissionChangeHistoryHandler`

**New repositories/methods created:**
- `IWishlistRepository`, `ISoundfontRepository`, `IEventListRepository` + EF implementations
- `IUserSecurityRepository` extended: Captcha, HoneyToken, LoginAttempt (extended), OTP (extended)
- `IAuditRepository` extended: `GetPermissionChangeLogsAsync`
- `IKaraokeRepository` extended: `GetSongsQueryable()`
- `IEventRepository` extended: `GetEventsQueryable()`

### ✅ 1.7 Extract inline DTOs from controllers (8 files) — DONE

All inline DTOs moved to `Models/Requests/` per Area.

### ✅ 1.8 Move controllers to Areas (13 controllers) — DONE

All controllers moved out of `Controllers/` to `Areas/`.

### ✅ 1.9 Split UserController (1197 → 293 lines + 2 new controllers) — DONE

| New Controller | Lines | Endpoints |
|---|---|---|
| `UserSecurityController.cs` | 529 | 22 (auth, password, captcha, audit, honeytokens, TOTP 2FA) |
| `UserDevicesController.cs` | 191 | 12 (devices, microphones, mic assignments) |
| `UserController.cs` (remaining) | 293 | 13 (profiles, players, settings, links) |

### ✅ 1.10 Split RadioController (699 → 261 lines + 4 new controllers) — DONE

| New Controller | Lines | Endpoints |
|---|---|---|
| `RadioStatsController.cs` | 110 | 6 (daily stats, CSV export, now playing, listeners, summary, top) |
| `RadioVoiceController.cs` | 58 | 4 (voice start/stop, status, archive) |
| `RadioInvitesController.cs` | 73 | 5 (invite CRUD, verify, accept) |
| `RadioSocialController.cs` | 178 | 10 (chat, reactions, comments, follow) |
| `RadioController.cs` (remaining) | 261 | 14 (station CRUD, start/stop, schedule, external) |

### ✅ 1.11 Split AdminController (663 → 102 lines + 2 new controllers) — DONE

| New Controller | Lines | Endpoints |
|---|---|---|
| `AdminUsersController.cs` | 244 | 17 (users CRUD, password, OTP, block, delete, bans) |
| `AdminAuditController.cs` | 140 | 4 (system config, login attempts, audit log) |
| `AdminController.cs` (remaining) | 102 | 4 (dashboard, events list, scoring presets) |

### ✅ 1.12 Split EditorController (641 → 338 lines + 2 new controllers) — DONE

| New Controller | Lines | Endpoints |
|---|---|---|
| `EditorEffectsController.cs` | 145 | 11 (effects CRUD, layer effects, clip tags, collaborators) |
| `EditorExportController.cs` | 152 | 9 (export/mixdown, sample packs, samples) |
| `EditorController.cs` (remaining) | 338 | 22 (projects, sections, layers, clips, presets) |

---

## 2. QUICK FIXES [P1 — can do now]

### ✅ 2.1 SMSAPI token configured — DONE
### ✅ 2.2 Google Maps API key configured — DONE
### ✅ 2.3 EventLocationsController refactored to repository — DONE
### ✅ 2.4 SMS/Email test endpoints secured (admin only) — DONE
### ✅ 2.5 Entity summaries translated to English — DONE
### ✅ 2.6 Multi-type entity files split — DONE (BulkInviteStatus, EventMediaAccessLevel, SmsApiOptions, RabbitMqOptions)
### ✅ 2.7 Ranking endpoint [AllowAnonymous] — DONE

---

## 3. NEW FEATURES [P2]

### ✅ 3.1 Recurring events — DONE

**Encje:** `Event.Recurrence` (enum `RecurrencePattern`), `Event.RecurrenceInterval`, `Event.SeriesParentId`, `Event.CarryOverProposals`, `Event.CancellationReason`, `Event.OriginalStartTime`

**Enum `RecurrencePattern`:** None, Daily, Weekly, BiWeekly, Monthly, Custom

**CQRS:** `GenerateNextOccurrenceCommand`, `CancelEventOccurrenceCommand`, `RescheduleEventOccurrenceCommand` + handlers

**Endpointy (EventsController):**
| Metoda | URL | Opis |
|---|---|---|
| `POST` | `/api/events/{id}/generate-next` | Generuj następne wystąpienie (kopiuje ustawienia, carry-over propozycji) |
| `POST` | `/api/events/{id}/cancel-occurrence` | Odwołaj wystąpienie (z powodem) |
| `POST` | `/api/events/{id}/reschedule` | Przesuń termin (nowy start/end) |

### ✅ 3.2 Leagues (series of events) — DONE

**Encje:** `League`, `LeagueEvent`, `LeagueParticipant`, `Organization` + enumy `LeagueStatus`, `LeagueType`

**Kontrolery:** `LeaguesController` (9 ep), `OrganizationsController` (5 ep), `FantasyController` (5 ep)

**Endpointy (LeaguesController):**
| Metoda | URL | Opis |
|---|---|---|
| `GET/POST/PUT/DELETE` | `/api/leagues[/{id}]` | CRUD lig |
| `POST` | `/api/leagues/{id}/participants` | Dodaj uczestnika |
| `GET` | `/api/leagues/{id}/standings` | Tabela wyników |
| `DELETE` | `/api/leagues/participants/{id}` | Usuń uczestnika |
| `POST` | `/api/leagues/{id}/generate-schedule` | Auto-generuj harmonogram meczów |

### ✅ 3.3 Betting system — DONE

**Encje:** `BettingMarket`, `BettingOption`, `Bet` + enum `BettingMarketType`

**Kontroler:** `BettingController` — 8 endpointów

**Endpointy:**
| Metoda | URL | Opis |
|---|---|---|
| `GET` | `/api/betting/events/{id}/markets` | Rynki zakładów dla eventu |
| `GET` | `/api/betting/markets/{id}` | Szczegóły rynku z opcjami |
| `POST` | `/api/betting/markets` | Utwórz rynek |
| `POST` | `/api/betting/markets/{id}/options` | Dodaj opcję zakładu |
| `POST` | `/api/betting/markets/{id}/bets` | Postaw zakład |
| `GET` | `/api/betting/users/{id}/bets` | Zakłady użytkownika |
| `GET` | `/api/betting/users/{id}/wallet` | Portfel wirtualnej waluty |
| `POST` | `/api/betting/markets/{id}/resolve` | Rozstrzygnij rynek |

### ✅ 3.4 External data integrations — DONE

Zaimplementowane klienty API (w `AudioVerse.Infrastructure/ExternalApis/`):
- ✅ **BoardGameGeek** — BGG XML API2, search/details/hot/collection (see 3.7)
- ✅ **Steam** — player summary, games, achievements, wishlist, friends, news
- ✅ **IGDB** — game search & details (via Twitch auth)
- ✅ **TMDB** — movie/TV search & details
- ✅ **OpenLibrary** — book search & details
- ✅ **Google Books** — book search & details
- ✅ **TheSportsDB** — sports events, leagues, search
- ✅ **MusicBrainz** — recording/artist/release lookup, ISRC lookup
- ✅ **Spotify/Tidal/YouTube** — search & track/album/artist details

Unified search: `GET /api/external-search/search?q=...&sources=spotify,youtube,tidal,musicbrainz`

### ✅ 3.7 BGG Catalog Integration — DONE

**Token:** `2d6ce2d4-5a3b-4901-95ac-819cba936127` (appsettings.json `Bgg:ApiToken`)

**Encje:** `BggSyncStatus` + enum `BggSyncState` — tracking sync progress

**Rozszerzenie `BoardGame`:** dodane pola `BggThumbnailUrl`, `BggWeight`, `BggRank`, `BggUsersRated`, `BggMinAge`, `BggCategories`, `BggMechanics`, `BggDesigners`, `BggPublishers`, `BggLastSyncUtc`

**Serwis:** `IBggSyncService` + `BggSyncService` (singleton)
- Full sync: hot games + stale refresh (>7 dni), batch po 20, **5s rate-limit**
- Cache-through search: local DB → BGG API → upsert → return
- Export/Import: JSON backup katalogu gier (bez ponownego obciążania BGG)
- Cancel: możliwość przerwania sync

**Kontroler:** `BggCatalogController` — 6 endpointów

| Metoda | URL | Auth | Opis |
|---|---|---|---|
| `GET` | `/api/bgg/search?q=Catan&limit=20` | 🔓 Anon | Cache-through search |
| `GET` | `/api/bgg/sync/status` | Admin | Status synchronizacji |
| `POST` | `/api/bgg/sync/start` | Admin | Start full sync |
| `POST` | `/api/bgg/sync/cancel` | Admin | Anuluj sync |
| `GET` | `/api/bgg/export` | Admin | Eksport katalogu (JSON) |
| `POST` | `/api/bgg/import` | Admin | Import katalogu (JSON) |

**Konfiguracja (appsettings.json):**
```json
"Bgg": {
  "ApiToken": "2d6ce2d4-...",
  "RateLimitSeconds": 5,
  "BatchSize": 20,
  "StaleRefreshDays": 7
}
```

### ✅ 3.8 Google Books Catalog Integration — DONE

**API Key:** `AIzaSyD4CGsRqjzmLochANQodHaDf7iktQaJHR8` (appsettings.json `GoogleBooks:ApiKey`)

**Strategia:** Tylko cache-through (brak full sync — zbyt wiele książek). Każde wyszukanie i pobranie detali jest cachowane lokalnie.

**Rozszerzenie `Book`:** dodane pole `GoogleBooksLastSyncUtc`

**Repozytorium rozszerzone:** `GetBookByGoogleIdAsync`, `UpsertBooksFromGoogleAsync`, `GetAllGoogleBooksAsync`

**Serwis:** `IBookCacheService` + `BookCacheService` (singleton)
- Cache-through search: local DB → Google Books API → upsert → return
- Get by Google ID: local → Google → upsert → return
- Export/Import: JSON backup katalogu (restart-safe)

**Kontroler:** `BookCatalogController` — 4 endpointy

| Metoda | URL | Auth | Opis |
|---|---|---|---|
| `GET` | `/api/books/search?q=Sapiens&limit=20` | 🔓 Anon | Cache-through search |
| `GET` | `/api/books/google/{googleBooksId}` | 🔓 Anon | Detale po Google Books ID (cache-through) |
| `GET` | `/api/books/export` | Admin | Eksport katalogu (JSON) |
| `POST` | `/api/books/import` | Admin | Import katalogu (JSON, upsert by GoogleBooksId) |

**Konfiguracja (appsettings.json):**
```json
"GoogleBooks": {
  "ApiKey": "AIzaSyD4CGsR..."
}
```

### ✅ 3.5 Event Lists — DONE

**Encje:** `EventList`, `EventListItem` (+ `IsObserved` flag) + enumy `EventListType`, `EventListVisibility`

**Repozytorium:** `IEventListRepository` + `EventListRepositoryEF` (CRUD, bulk add/remove/move/copy, reorder, favorites toggle)

**CQRS:** 12 commands + 7 queries + 19 handlers

**Kontroler:** `EventListsController` — 19 endpointów

**Request models:** 7 plików w `Models/Requests/Events/`

**Migracja:** `AddEventLists` — tabele `EventLists`, `EventListItems`

**Funkcjonalność:**
- Listy eventów dla użytkowników, organizacji, lig
- Typy: Ulubione, Obserwowane, Wg lokalizacji, Wg kategorii, Archiwum, Custom
- Widoczność: Prywatne, Udostępnione (link), Publiczne
- Bulk: masowe dodawanie/usuwanie/przenoszenie/kopiowanie eventów
- Toggle favorites (auto-tworzenie listy)
- Reorder, tagi, notatki na item
- ShareToken dla publicznego dostępu

### ✅ 3.6 Event Subscriptions (powiadomienia) — DONE

**Encje:** `EventSubscription` + enumy `EventNotificationLevel`, `EventNotificationCategory` (flags/bitmask)

**Repozytorium:** `IEventSubscriptionRepository` + `EventSubscriptionRepositoryEF`
- CRUD, toggle, bulk subscribe do listy
- `GetSubscribersForCategoryAsync` — filtruje subskrybentów wg bitmask kategorii
- `GetPendingReminders24hAsync` / `GetPendingReminders1hAsync` — upcoming reminders

**Serwis:** `IEventNotificationService` + `EventNotificationService`
- `NotifySubscribersAsync(eventId, category, title, body)` — wysyła do subskrybentów z włączoną kategorią
- `ProcessRemindersAsync()` — automatyczne przypomnienia 24h/1h

**CQRS:** 6 commands + 4 queries + 10 handlers

**Kontroler:** `EventSubscriptionsController` — 10 endpointów

**Request models:** 4 pliki (`SubscribeToEventRequest`, `UpdateSubscriptionRequest`, `SetObservedRequest`, `SubscribeToListRequest`)

**Migracja:** `AddEventSubscriptions` — tabela `EventSubscriptions`, kolumna `EventListItems.IsObserved`

**Funkcjonalność:**
- 4 poziomy: Muted, Essential (krytyczne), Standard (+przypomnienia), All (+news/hype/komentarze)
- Fine-grained: 11 kategorii jako bitmask (Cancellation, DateTimeChange, Reminder24h/1h, Schedule, Participants, News, Comments, Polls, Media, GameUpdates)
- Preset LUB custom override (CustomCategories nadpisuje Level)
- Automatyczne przypomnienia 24h/1h przed eventem (z flagą anty-duplikat)
- `EventListItem.IsObserved` → auto-tworzy/kasuje subskrypcję
- Bulk subscribe do całej listy eventów
- Email + Push kanały osobno konfigurowalne

---

## STATS

| Metric | Value |
|---|---|
| C# files | ~2267 |
| Controllers | 89 |
| Endpoints | 885 |
| Endpoints without `<summary>` | 0 ✅ |
| Controllers with `_db` | 0 ✅ (was 17) |
| Handlers with `_db` | 0 ✅ (was 43) |
| Multi-type files (API) | 0 ✅ (was 8) |
| Multi-type files (Application) | 0 ✅ (was 30) |
| Multi-type files (Domain) | 0 ✅ (was 1) |
| Multi-type files (Infrastructure) | 0 ✅ (was 2) |
| Controllers outside Areas | 0 ✅ (was 13) |
| Controllers >500 lines | 6 (was 10) |
