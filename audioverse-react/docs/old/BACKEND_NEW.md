AudioVerse API — zmiany dla frontendu
===================================

Ostatnia aktualizacja: 2025-06-23

---

## 1. BREAKING CHANGES

### 1.1 Party → Event (SCALENIE)
Encja `KaraokeParty` nie istnieje. Wszystko jest teraz w `Event`:

| Dawne pole (Party)      | Nowe pole (Event)       | Typ                     |
|-------------------------|-------------------------|-------------------------|
| `Party.Name`            | `Event.Title`           | `string`                |
| `Party.Poster`          | `Event.Poster`          | `string?`               |
| `Party.OrganizerId`     | `Event.OrganizerId`     | `int?`                  |
| `Party.Access`          | `Event.Access`          | `EventAccessType` enum  |
| `Party.CodeHash`        | `Event.CodeHash`        | `string?`               |
| `Party.AccessToken`     | `Event.AccessToken`     | `string?`               |
| `Party.Status`          | `Event.Status`          | `EventStatus` enum      |
| `Party.LocationType`    | `Event.LocationType`    | `EventLocationType`     |
| `Party.Location`        | `Event.LocationName`    | `string?`               |
| —                       | `Event.LocationId`      | `int?` (FK → EventLocation) |
| —                       | `Event.MaxParticipants`  | `int?`                 |
| —                       | `Event.WaitingListEnabled` | `bool`               |
| —                       | `Event.Visibility`      | `EventVisibility` enum  |
| `party.Event.Id`        | `event.Id`              | Event IS the root       |

- DbSet `KaraokeParties` **nie istnieje** — używajcie `Events`.
- `PartyPlayers` → endpoint `/api/events/{id}/participants`
- `Event.Name` jest aliasem na `Event.Title` (getter/setter) — kompatybilność wsteczna w JSON

### 1.2 Zmienione route'y HTTP (party → events)

| Stary route                                                        | Nowy route                                                         |
|--------------------------------------------------------------------|--------------------------------------------------------------------|
| `POST /api/karaoke/party/{id}/join`                                | `POST /api/karaoke/events/{id}/join`                               |
| `GET /api/karaoke/get-party/{id}`                                  | `GET /api/karaoke/get-event/{id}`                                  |
| `GET /api/karaoke/party/{id}/poster-url`                           | `GET /api/karaoke/events/{id}/poster-url`                          |
| `GET /api/karaoke/party/{id}/poster-public-url`                    | `GET /api/karaoke/events/{id}/poster-public-url`                   |
| `POST /api/invites/party/{partyId}/send`                           | `POST /api/invites/events/{eventId}/send`                          |
| `POST /api/permissions/party/{partyId}/players/{playerId}/grant`   | `POST /api/permissions/events/{eventId}/players/{playerId}/grant`  |
| `POST /api/permissions/party/{partyId}/players/{playerId}/revoke`  | `POST /api/permissions/events/{eventId}/players/{playerId}/revoke` |
| `POST /api/permissions/party/{partyId}/players/permissions/bulk`   | `POST /api/permissions/events/{eventId}/players/permissions/bulk`  |
| `POST /api/permissions/party/{partyId}/.../bulk-revoke`            | `POST /api/permissions/events/{eventId}/.../bulk-revoke`           |
| `GET /api/permissions/party/{partyId}/history`                     | `GET /api/permissions/events/{eventId}/history`                    |
| `GET /api/permissions/readable/party/{partyId}/history/expanded`   | `GET /api/permissions/readable/events/{eventId}/history/expanded`  |

### 1.3 Zmienione enumy

#### EventPermission (flags) — ZMIENIONE WARTOŚCI
```
None = 0, Invite = 1, ManageMusic = 2, Admit = 4, Moderate = 8, Bouncer = 16, All = 31
```
⚠️ Dawne: `ManageSongs=2, ManageQueue=8` → Nowe: `ManageMusic=2, Admit=4`

#### EventPlayerStatus — ZMIENIONE WARTOŚCI
```
None = 0, Waiting = 1, Validation = 2, Inside = 3, Outside = 4, Left = 5
```
⚠️ Dawne: `Waiting=0, Inside=1, Outside=2, Validation=3` → Nowe: numeracja od 0=None

### 1.4 Zmieniony route CouchGames

| Stary route              | Nowy route               |
|--------------------------|--------------------------|
| `api/couch-games/...`    | `api/games/couch/...`    |

---

## 2. NOWE ENCJE

### 2.1 BoardGame sub-encje

| Encja                             | Pola kluczowe                                       |
|-----------------------------------|------------------------------------------------------|
| `BoardGameSession`                | `Id, EventId, StartedAt, EndedAt`                   |
| `BoardGameSessionRound`           | `Id, SessionId, Number, CreatedAt`                  |
| `BoardGameSessionRoundPart`       | `Id, RoundId, Name, Duration (TimeSpan)`            |
| `BoardGameSessionRoundPartPlayer` | `Id, PartId, PlayerId, Score`                       |
| `BoardGameCollection`             | `Id, OwnerId, Name, IsPublic, CreatedAt`            |
| `BoardGameCollectionBoardGame`    | `Id, CollectionId, BoardGameId, Copies`             |

### 2.2 ~~CouchGame~~ → VideoGame sub-encje (patrz sekcja 10.2)

> ⚠️ **RENAME**: Wszystkie `CouchGame*` → `VideoGame*`. Patrz sekcja 10.2.

| Encja (NOWA nazwa)                | Pola kluczowe                                        |
|-----------------------------------|------------------------------------------------------|
| `VideoGameSession`                | `Id, EventId, VideoGameId, StartedAt, EndedAt`       |
| `VideoGameSessionPlayer`          | `Id, SessionId, PlayerId, Score, JoinedAt`           |
| `VideoGameCollection`             | `Id, OwnerId, Name, IsPublic, CreatedAt, ParentId`  |
| `VideoGameCollectionVideoGame`    | `Id, CollectionId, VideoGameId, Copies`              |

### 2.3 Inne nowe/zmienione encje

| Encja                      | Pola kluczowe                                                   |
|----------------------------|------------------------------------------------------------------|
| `EventLocation`            | `Id, Name, Description, StreetAddress, City, State, PostalCode, Country, CountryCode, FormattedAddress, Latitude, Longitude, ...` |
| `EventPoll`                | `Id, EventId, Title, Type, OptionSource, Token, TrackCosts, IsActive, ExpiresAt` |
| `EventPollOption`          | `Id, PollId, Text, SortOrder, SourceEntityId, SourceEntityType, UnitCost, ImageUrl` |
| `EventPollResponse`        | `Id, PollId, OptionId, RespondentEmail, RespondentUserId, Quantity` |
| `EventExpense`             | `Id, EventId, Title, Category, Amount, SplitMethod, SourcePollId, PaidByUserId` |
| `EventExpenseShare`        | `Id, ExpenseId, UserId, Email, ShareAmount, Quantity`           |
| `EventPayment`             | `Id, EventId, UserId, Amount, Method, Status, Reference, ConfirmedByUserId` |
| `UserExternalAccount`      | `Id, UserProfileId, Platform (enum), ExternalUserId, DisplayName, AccessToken, ...` |
| `AudioSample`              | `Id, PackId, Name, ObjectKey, MimeType, DurationMs, Bpm, Key`  |
| `AudioLayerEffect`         | `Id, LayerId, EffectId, Order, ParamsOverrideJson`              |
| `DmxSceneSequence`         | `Id, Name, Loop, Steps[]`                                       |
| `DmxSceneStep`             | `Id, SequenceId, SceneId, Order, HoldMs, FadeMs`               |
| `EventPhoto` ⚡            | `Id, EventId, ObjectKey, Caption, UploadedByUserId, CreatedAt`  |
| `EventComment` ⚡          | `Id, EventId, UserId, Text, ParentId, Replies[], CreatedAt`     |
| `Notification` ⚡          | `Id, UserId, Title, Body, Type (NotificationType), IsRead, CreatedAt, ReadAt` |
| `VideoGameSessionRound` ⚡ | `Id, SessionId, Number, CreatedAt, Parts[]`                     |
| `VideoGameSessionRoundPart` ⚡ | `Id, RoundId, Name, Duration (TimeSpan), Players[]`         |
| `VideoGameSessionRoundPartPlayer` ⚡ | `Id, PartId, PlayerId, Score`                         |

---

## 3. NOWE ENDPOINTY

### 3.1 Board Game Sessions (`/api/games/board/...`)
| Metoda   | Route                                     | Opis                             |
|----------|-------------------------------------------|----------------------------------|
| `POST`   | `/sessions`                               | Utwórz sesję `{ eventId }`       |
| `GET`    | `/sessions/event/{eventId}`               | Sesje eventu                     |
| `GET`    | `/sessions/{id}`                          | Szczegóły (z rundami i graczami) |
| `DELETE` | `/sessions/{id}`                          | Usuń sesję                       |
| `POST`   | `/sessions/{sessionId}/rounds`            | Dodaj rundę `{ number }`         |
| `GET`    | `/sessions/{sessionId}/rounds`            | Rundy sesji                      |
| `DELETE` | `/rounds/{roundId}`                       | Usuń rundę                       |
| `POST`   | `/rounds/{roundId}/parts`                 | Dodaj part `{ name, duration }`  |
| `DELETE` | `/parts/{partId}`                         | Usuń part                        |
| `POST`   | `/parts/{partId}/players`                 | Dodaj gracza `{ playerId }`      |
| `PATCH`  | `/part-players/{id}/score`                | Zmień wynik (body: `int`)        |
| `DELETE` | `/part-players/{id}`                      | Usuń gracza                      |

### 3.2 Board Game Collections (`/api/games/board/...`)
| Metoda   | Route                                     | Opis                                |
|----------|-------------------------------------------|--------------------------------------|
| `POST`   | `/collections`                            | Utwórz `{ ownerId, name, isPublic }` |
| `GET`    | `/collections/{id}`                       | Kolekcja z grami                     |
| `GET`    | `/collections/owner/{ownerId}`            | Kolekcje użytkownika                 |
| `PUT`    | `/collections/{id}`                       | Aktualizuj                           |
| `DELETE` | `/collections/{id}`                       | Usuń                                 |
| `POST`   | `/collections/{collectionId}/games`       | Dodaj grę `{ boardGameId, copies }`  |
| `DELETE` | `/collections/games/{id}`                 | Usuń grę z kolekcji                  |

### 3.3 Video Game Sessions (`/api/games/video/...`)
| Metoda   | Route                                     | Opis                                   |
|----------|-------------------------------------------|-----------------------------------------|
| `POST`   | `/sessions`                               | Utwórz `{ eventId, videoGameId }`      |
| `GET`    | `/sessions/event/{eventId}`               | Sesje eventu                            |
| `GET`    | `/sessions/{id}`                          | Szczegóły                               |
| `DELETE` | `/sessions/{id}`                          | Usuń                                    |
| `POST`   | `/sessions/{sessionId}/players`           | Dodaj gracza `{ playerId }`             |
| `PATCH`  | `/session-players/{id}/score`             | Zmień wynik (body: `int`)               |
| `DELETE` | `/session-players/{id}`                   | Usuń gracza                             |
| `POST`   | `/sessions/{sessionId}/rounds`            | Dodaj rundę `{ number }`               |
| `GET`    | `/sessions/{sessionId}/rounds`            | Rundy sesji                             |
| `DELETE` | `/rounds/{roundId}`                       | Usuń rundę                              |
| `POST`   | `/rounds/{roundId}/parts`                 | Dodaj part `{ name, duration }`         |
| `DELETE` | `/parts/{partId}`                         | Usuń part                               |
| `POST`   | `/parts/{partId}/players`                 | Dodaj gracza `{ playerId }`             |
| `PATCH`  | `/part-players/{id}/score`                | Zmień wynik (body: `int`)               |
| `DELETE` | `/part-players/{id}`                      | Usuń gracza                             |

### 3.4 Video Game Collections (`/api/games/video/...`)
| Metoda   | Route                                     | Opis                                   |
|----------|-------------------------------------------|-----------------------------------------|
| `POST`   | `/collections`                            | Utwórz `{ ownerId, name, isPublic }`   |
| `GET`    | `/collections/{id}?includeChildren=&maxDepth=` | Kolekcja z grami (+ hierarchy)    |
| `GET`    | `/collections/owner/{ownerId}`            | Kolekcje użytkownika                    |
| `PUT`    | `/collections/{id}`                       | Aktualizuj                              |
| `DELETE` | `/collections/{id}`                       | Usuń                                    |
| `POST`   | `/collections/{collectionId}/games`       | Dodaj grę `{ videoGameId, copies }`     |
| `DELETE` | `/collections/games/{id}`                 | Usuń grę z kolekcji                     |

---

## 4. ISTNIEJĄCE ENDPOINTY — KOMPLETNA MAPA

### Events (`/api/events`)
- CRUD: `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`
- Schedule: CRUD `/{eventId}/schedule`, `/{eventId}/schedule/{id}`
- Menu: CRUD `/{eventId}/menu`, `/{eventId}/menu/{id}`
- Attractions: CRUD `/{eventId}/attractions`, `/{eventId}/attractions/{id}`
- Board games (event): CRUD `/{eventId}/board-games`, `/{eventId}/board-games/{id}`
- Video games (event): CRUD `/{eventId}/video-games`, `/{eventId}/video-games/{id}`
- Participants: `POST /{eventId}/participants`, `DELETE /{eventId}/participants/{playerId}`, `PATCH /{eventId}/participants/{playerId}/status`
- Invites: `POST /{eventId}/invites`
- Sessions: `POST /{eventId}/sessions`
- Access: `POST /{eventId}/generate-link`, `GET /join/{token}`, `POST /{eventId}/validate-code`
- Bouncer: `GET /{eventId}/bouncer/waiting`, `POST /{eventId}/bouncer/validate|admit|reject/{playerId}`
- Poster: `GET /{eventId}/poster-public-url`
- **Photos**: `POST/GET /{eventId}/photos`, `DELETE /{eventId}/photos/{id}` ⚡
- **Comments**: `POST/GET /{eventId}/comments`, `DELETE /{eventId}/comments/{id}` ⚡
- **PDF Export**: `GET /{eventId}/export/pdf` ⚡
- **Filtering**: `GET /?query=&types=&statuses=&startFrom=&startTo=&page=&pageSize=&sortBy=&descending=` ⚡

### Board Games catalog (`/api/games/board`)
- CRUD: `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`
- BGG: `GET /bgg/search`, `GET /bgg/{bggId}`, `POST /bgg/import/{bggId}`, `GET /bgg/hot`, `GET /bgg/collection/{username}`, `POST /bgg/import/batch`, `POST /bgg/import/collection/{username}`, `GET /bgg/batch`
- Refresh: `POST /{id}/refresh-bgg`
- **Stats**: `GET /stats/player/{playerId}`, `GET /stats/game/{gameId}` ⚡

### Video Games catalog (`/api/games/video`)
- CRUD: `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`
- Steam: `GET /steam/search`, `GET /steam/{steamAppId}`, `POST /steam/import/{steamAppId}`
- **IGDB**: `GET /igdb/search?query=&limit=`, `POST /igdb/import/{igdbId}` ⚡

### Polls (`/api/events/{eventId}/polls`)
- CRUD: `POST /`, `GET /`, `GET /{pollId}`, `PUT /{pollId}`, `DELETE /{pollId}`
- Results: `GET /{pollId}/results`
- Populate: `POST /events/{eventId}/polls/{pollId}/populate`
- Send: `POST /{pollId}/send`
- Voting (AllowAnonymous): `GET /api/events/polls/view/{token}`, `POST /api/events/polls/vote/{token}`

### Billing (`/api/events/{eventId}/billing`)
- Expenses: CRUD `/expenses`, `/expenses/{id}`, `POST /expenses/{id}/split-equally`
- Payments: CRUD `/payments`, `/payments/{id}`, `POST /payments/{id}/confirm`
- Import: `POST /import-from-poll/{pollId}`
- Settlement: `GET /settlement`

### Karaoke (`/api/karaoke`)
- Events: `POST /events/{id}/join`, `GET /get-event/{id}`, `GET /events/{id}/poster-url`, `GET /events/{id}/poster-public-url`
- Songs: `GET /songs`, `GET /songs/all`, `GET /get-song/{id}`, `PUT /songs/{id}`, `DELETE /songs/{id}`, `GET /filter-songs`, `GET /search-songs`, `POST /get-filtered-songs`
- Song versions: `GET /songs/{songId}/versions`, `GET /songs/{songId}/versions/{version}`, `POST /songs/{songId}/versions/{version}/revert`
- Song collaborators: CRUD `/songs/{songId}/collaborators`
- Song flags: `POST /songs/{songId}/set-verified`, `POST /songs/{songId}/set-development`, bulk variants
- Queue: `GET/POST /events/{eventId}/queue`, `PATCH /queue/{id}/status`, `DELETE /queue/{id}`
- Teams: `POST /teams`, `GET /events/{eventId}/teams`, `GET/PUT/DELETE /teams/{teamId}`, players: `POST/DELETE /teams/{teamId}/players/{playerId}`, `GET /teams/{teamId}/players`
- Favorites: `GET /players/{playerId}/favorites`, `POST/DELETE /players/{playerId}/favorites/{songId}`, `POST /players/{playerId}/favorites/{songId}/queue/{eventId}`
- Rounds: `POST /add-round`, `POST /add-session`, `POST /add-round-part`, `POST /add-song-to-round`, `POST /save-results`
- Round players: `POST/DELETE /rounds/{roundId}/players/{id}`, `GET /rounds/{roundId}/players`, `PATCH /rounds/{roundId}/players/{id}/slot`
- YouTube import: `GET /songs/youtube/search`, `GET /songs/youtube/{videoId}`, `POST /songs/import-youtube/{videoId}`
- Stats: `GET /stats/ranking`, `GET /stats/history/{userId}`, `GET /stats/activity`
- Admin: `GET /admin/buckets`, `GET/POST /admin/buckets/{bucket}/public`, `GET /admin/metrics/upload-failures`

### Permissions (`/api/permissions`)
- Grant: `POST /events/{eventId}/players/{playerId}/grant?permission=`
- Revoke: `POST /events/{eventId}/players/{playerId}/revoke?permission=`
- Bulk: `POST /events/{eventId}/players/permissions/bulk`, `POST .../bulk-revoke`
- History: `GET /events/{eventId}/history`
- Readable: `GET /api/permissions/readable/events/{eventId}/history/expanded`

### Invites (`/api/invites`)
- Send: `POST /events/{eventId}/send`
- Respond: `POST /{inviteId}/respond?accept=true|false`
- Cancel: `POST /{inviteId}/cancel`

### Editor (`/api/editor`)
- Projects: CRUD `/project`, `/project/{id}`
- Templates: `GET /projects/templates`
- Sections: `POST /section`, `PUT/DELETE /section/{id}`
- Layers: `POST /layer`, `PUT/DELETE /layer/{id}`
- Layer items: `POST /layer/item`, `POST /layer/items`, `DELETE /layer/item/{id}`
- Audio clips: `POST /audioclip`, `GET /audioclips`, `GET /audioclip/{id}`, `GET /audioclip/{id}/stream`, `DELETE /audioclip/{id}`
- Clip tags: `POST/DELETE /audioclip/{clipId}/tag`
- Effects: CRUD `/effects`, `/effects/{id}`
- Layer effects: `POST/GET /layers/{layerId}/effects`, `DELETE /layer-effects/{id}`
- Collaborators: CRUD `/project/{projectId}/collaborators`, `PUT /project/{projectId}/collaborators/{id}`
- Export: `POST /project/{projectId}/export`, `GET /export/{taskId}/status`
- Sample packs: CRUD `/sample-packs`, `POST /sample-packs/{packId}/samples`, `DELETE /samples/{id}`
- Input presets: `POST /inputpreset`, `GET /inputpresets`, `GET /inputpreset/{id}`

### Admin (`/api/admin`)
- Dashboard: `GET /dashboard`
- Events: `GET /events?page=&pageSize=&type=`
- Users: CRUD `/users`, `/users/{userId}`, `/users/list`
- Bans: `POST /users/{userId}/ban`, `DELETE /bans/{banId}`, `GET /users/{userId}/bans`
- Block: `POST /users/{userId}/block`
- Passwords: `POST /users/{userId}/change-password`, `POST /users/{userId}/password-validity`, `POST /users/{userId}/generate-otp`, `POST /change-password`, `POST /password-requirements`
- OTP/Login: `GET /otp-history`, `GET /login-attempts`, `GET /login-attempts/{userId}`, `GET /login-attempts/recent-failed`
- Scoring: `POST/GET /scoring-presets`
- System: `GET/PUT /system-config`

### DMX (`/api/dmx`)
- State: `GET /state`
- Channels: `PUT /channel/{ch}`, `PUT /universe`
- Port: `POST /port/open`, `POST /port/close`
- Config: `POST /config`
- Blackout: `POST /blackout`
- Devices: `GET /devices`
- Scenes: `POST/GET /scenes`, `DELETE /scenes/{id}`, `POST /scenes/{id}/apply`
- Sequences: `POST/GET /sequences`, `DELETE /sequences/{id}`, `POST /sequences/{id}/run`
- Beat-reactive: `POST /beat-reactive/start`, `POST /beat-reactive/tap`

### Auth (`/api/user`)
- Register: `POST /register`
- Login: `POST /login`, `POST /guest-login`, `POST /logout`
- Token: `POST /refresh-token`
- Password: `POST /change-password`, `POST /change-password-with-recaptcha`, `POST /first-login-password-change`
- Profile: `GET /me`, `PUT /settings`
- Devices: CRUD `/devices`
- Microphones: CRUD `/microphones`, `/microphone-assignments`
- Players: CRUD `/profiles/{profileId}/players`, `POST .../set-primary`
- TOTP 2FA: `POST /totp/enable`, `POST /totp/confirm`, `POST /totp/verify`, `POST /totp/disable`
- Captcha: `POST /captcha/generate`, `POST /captcha/validate`
- reCAPTCHA: `POST /recaptcha/verify`
- HoneyTokens: `POST /honeytokens/create`, `GET /honeytokens/triggered`
- Audit: `GET /audit-logs`, `GET /audit-logs/all`
- **Notifications** ⚡: `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all`, `DELETE /notifications/{id}`

### Locations (`/api/events/locations`)
- CRUD: `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`
- Event binding: `GET /api/events/{eventId}/location`
- Geocoding: `GET /geocode`, `GET /autocomplete`, `GET /directions`

### Moderation (`/api/moderation`)
- Report: `POST /report`
- Admin: `GET /reports`, `PUT /report/{id}/resolve`

### Library — Songs (`/api/library/songs`)
- Search: `GET /?q=&page=&pageSize=`
- CRUD: `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`
- Details: `GET /{songId}/details`, `POST /{songId}/details`, `DELETE /details/{id}`
- **Auto-tag**: `POST /{id}/auto-tag` ⚡

### Library — Albums (`/api/library/albums`)
- CRUD: `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`
- Artist links: `POST /{albumId}/artists`, `DELETE /{albumId}/artists/{artistId}`

### Library — Artists (`/api/library/artists`)
- CRUD: `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`

### Library — Playlists (`/api/library/playlists`)
- CRUD: `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`
- Links: `POST /{id}/links`, `DELETE /{id}/links/{linkId}`

### Library — Files (`/api/library/files`)
- Audio files: `POST /audio`, `GET /audio`
- Media files: `POST /media`, `GET /media`

### Library — License (`/api/library/license`)
- Lookup: `GET /?title=&artist=` — zwraca listę informacji o licencji

### Library — External Search (`/api/library/external`)
- Import: `POST /import`

### Library — Download (`/api/library/download`)
- Audio: `POST /audio`

### Genres (`/api/genres`)
- List: `GET /`
- Admin CRUD (`/api/admin/genres`): `GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`

### Playlists — global (`/api/playlists`)
- CRUD: `POST /`, `GET /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`

### Skins (`/api/skins`)
- List: `GET /`
- Admin CRUD (`/api/admin/skins`): `GET /`, `POST /`, `PUT /{id}`, `DELETE /{id}`

### Password Requirements (`/api/password-requirements`)
- Get: `GET /`

### External Connections (`/api/user/connections`)
- Spotify, Tidal, YouTube, Steam, BGG, Discord — connect/disconnect/status/refresh

### Audio Editor (`/api/audio-editor`) ⚡
- Assets: `POST /assets`
- Projects: `GET /projects`, `POST /projects`, `GET /projects/{id}`, `PUT /projects/{id}`
- Tracks: `POST /projects/{id}/tracks`, `DELETE /projects/{id}/tracks/{trackId}`
- Clips: `POST /projects/{id}/tracks/{trackId}/clips`
- Export: `POST /projects/{id}/export`, `GET /projects/{id}/download`

### Dance (`/api/dance`) ⚡
- Classify by song: `GET /song/{songId}`
- Classify by params: `GET /classify?bpm=&timeSignature=&energy=&valence=`

---

## 5. ENUMY — KOMPLETNA LISTA

### EventType
`Unknown=0, Event=1, Meeting=2, Conference=3, Workshop=4, GameNight=5, Screening=6`

### EventAccessType
`Public=0, Private=1, Code=2, Link=3`

### EventStatus
`Created=0, Planned=1, ItsOn=2, Finished=3`

### EventLocationType
`Virtual=0, Real=1`

### EventVisibility
`Private=0, Unlisted=1, Public=2`

### EventPermission (flags)
`None=0, Invite=1, ManageMusic=2, Admit=4, Moderate=8, Bouncer=16, All=31`

### EventPlayerStatus
`None=0, Waiting=1, Validation=2, Inside=3, Outside=4, Left=5`

### GamePlatform
`PC=0, PS5=1, Xbox=2, Switch=3, Mobile=4, Other=5`

### GameStatus
`Available=0, InUse=1, Reserved=2`

### ScheduleCategory
`Karaoke=0, Food=1, Game=2, Break=3, Custom=4`

### MenuItemCategory
`Food=0, Drink=1, Snack=2, Dessert=3`

### AttractionType
`PhotoBooth=0, DanceFloor=1, KaraokeBooth=2, DJSet=3, Custom=4`

### ExpenseCategory
`Food=0, Drink=1, Attraction=2, Rental=3, Equipment=4, Transport=5, Custom=6`

### SplitMethod
`Equal=0, PerCapita=1, Custom=2, ByPollResponse=3`

### PaymentMethod
`Cash=0, BankTransfer=1, Blik=2, PayPal=3, Card=4, Other=5`

### PaymentStatus
`Pending=0, Confirmed=1, Rejected=2, Refunded=3`

### EventPollType
`SingleChoice=0, MultiChoice=1, YesNo=2`

### EventPollOptionSource
`Manual=0, BoardGames=1, VideoGames=2, Songs=3, MenuItems=4, Attractions=5`

### SongQueueStatus
`Pending=0, Playing=1, Done=2, Skipped=3`

### AudioEffectType
`Reverb=0, Delay=1, EQ=2, Compressor=3, PitchShift=4, Filter=5, Distortion=6, Chorus=7`

### ExportStatus
`Pending=0, Processing=1, Completed=2, Failed=3`

### CollaboratorPermission
`View=0, Edit=1, Admin=2`

### PlaylistAccess
`Public=0, Unlisted=1, Private=2`

### ExternalPlatform
`Spotify=1, Tidal=2, YouTube=3, Google=4, Steam=5, BoardGameGeek=6, Discord=7, Twitch=8, Apple=9, Facebook=10, Microsoft=11`

### EventInviteStatus
`Pending=0, Accepted=1, Declined=2, Cancelled=3`

### KaraokeSessionMode ⚡ NOWY
`Classic=0, Tournament=1, Knockout=2, Casual=3`

### KaraokeRoundMode ⚡ NOWY
`Normal=0, Demo=1, NoLyrics=2, NoTimeline=3, Blind=4, SpeedRun=5, Duet=6, FreeStyle=7`

### NotificationType ⚡ NOWY
`General=0, EventInvite=1, EventUpdate=2, KaraokeScore=3, PollCreated=4, CommentReply=5, SystemAlert=6`

### DeviceType
`Unknown=0, Microphone=1, Gamepad=2, Keyboard=3, Mouse=4, Speaker=5, Camera=6`

### CollaborationPermission (Song collaborators)
`Read=0, Write=1, Manage=2`

---

## 6. MODELE JSON — KLUCZOWE ENCJE

### Event (główna encja)
```json
{
  "id": 1,
  "title": "Game Night",
  "name": "Game Night",
  "description": "...",
  "type": 5,
  "startTime": "2025-06-20T18:00:00Z",
  "endTime": "2025-06-20T23:00:00Z",
  "organizerId": 1,
  "maxParticipants": 20,
  "waitingListEnabled": true,
  "visibility": 0,
  "locationId": null,
  "locationName": "Dom kultury",
  "status": 0,
  "locationType": 1,
  "access": 0,
  "codeHash": null,
  "accessToken": null,
  "poster": "events/1/poster.jpg"
}
```

### BoardGame
```json
{
  "id": 1,
  "name": "Catan",
  "description": "...",
  "minPlayers": 3,
  "maxPlayers": 4,
  "estimatedDurationMinutes": 90,
  "genre": "Strategy",
  "imageKey": "board-games/catan.jpg",
  "ownerId": 1,
  "bggId": 13,
  "bggImageUrl": "https://...",
  "bggRating": 7.15,
  "bggYearPublished": 1995
}
```

### VideoGame
```json
{
  "id": 1,
  "name": "Overcooked 2",
  "description": "...",
  "platform": 0,
  "minPlayers": 1,
  "maxPlayers": 4,
  "genre": "Event",
  "imageKey": null,
  "isLocal": true,
  "isOnline": true,
  "ownerId": 1,
  "steamAppId": 728880,
  "steamHeaderImageUrl": "https://...",
  "videoGameGenreId": null,
  "igdbId": null,
  "coverImageUrl": null,
  "importedFrom": null
}
```

### BoardGameSession (z nested data)
```json
{
  "id": 1,
  "eventId": 5,
  "startedAt": "2025-06-20T19:00:00Z",
  "endedAt": null,
  "rounds": [
    {
      "id": 1,
      "sessionId": 1,
      "number": 1,
      "createdAt": "...",
      "parts": [
        {
          "id": 1,
          "roundId": 1,
          "name": "Part A",
          "duration": "00:10:00",
          "players": [
            { "id": 1, "partId": 1, "playerId": 3, "score": 42 }
          ]
        }
      ]
    }
  ]
}
```

### VideoGameSession
```json
{
  "id": 1,
  "eventId": 5,
  "videoGameId": 2,
  "videoGame": { "id": 2, "name": "Overcooked 2" },
  "startedAt": "2025-06-20T20:00:00Z",
  "endedAt": null,
  "players": [
    { "id": 1, "sessionId": 1, "playerId": 3, "score": 99, "joinedAt": "..." }
  ],
  "rounds": [
    {
      "id": 1, "sessionId": 1, "number": 1, "createdAt": "...",
      "parts": [
        {
          "id": 1, "roundId": 1, "name": "Part A", "duration": "00:10:00",
          "players": [
            { "id": 1, "partId": 1, "playerId": 3, "score": 42 }
          ]
        }
      ]
    }
  ]
}
```

### BoardGameCollection / VideoGameCollection
```json
{
  "id": 1,
  "ownerId": 1,
  "name": "Moja kolekcja",
  "isPublic": true,
  "createdAt": "2025-06-20T10:00:00Z",
  "items": [
    { "id": 1, "collectionId": 1, "boardGameId": 5, "boardGame": { "..." }, "copies": 2 }
  ]
}
```

### EventPhoto ⚡
```json
{
  "id": 1,
  "eventId": 5,
  "objectKey": "events/5/photos/abc123.jpg",
  "caption": "Zdjęcie z imprezy",
  "uploadedByUserId": 1,
  "createdAt": "2025-06-23T20:00:00Z"
}
```

### EventComment ⚡
```json
{
  "id": 1,
  "eventId": 5,
  "userId": 3,
  "text": "Świetna impreza!",
  "parentId": null,
  "replies": [
    {
      "id": 2,
      "eventId": 5,
      "userId": 1,
      "text": "Dzięki!",
      "parentId": 1,
      "replies": [],
      "createdAt": "2025-06-23T20:05:00Z"
    }
  ],
  "createdAt": "2025-06-23T20:00:00Z"
}
```

### Notification ⚡
```json
{
  "id": 1,
  "userId": 5,
  "title": "Nowe zaproszenie",
  "body": "Zostałeś zaproszony na Game Night",
  "type": 1,
  "isRead": false,
  "createdAt": "2025-06-23T14:00:00Z",
  "readAt": null
}
```

---

## 7. CHECKLIST DLA FRONTU

- [ ] Zamienić wszystkie odwołania `Event` → `Event` w modelu danych
- [ ] Zmienić URL-e z `/party/` na `/events/` (lista w sekcji 1.2)
- [ ] Zmienić `get-party` → `get-event`
- [ ] Zaktualizować wartości enumów `EventPermission` i `EventPlayerStatus` (sekcja 1.3)
- [ ] Dodać obsługę nowych endpointów gier (sekcja 3)
- [ ] Dodać widoki dla kolekcji gier (BoardGame/VideoGame collections)
- [ ] Dodać widoki dla sesji gier (scoring, rundy, gracze)
- [ ] Sprawdzić kompatybilność z nowym polem `Event.Visibility`
- [ ] Obsłużyć `Event.MaxParticipants` i `WaitingListEnabled` w UI
- [ ] Sprawdzić nowe pola `Event.LocationId` / `Event.LocationName` / `Event.Status`
- [ ] Zmienić nazwy grup SignalR z `party:` / `party-` na `event:` / `event-` (sekcja 8)
- [ ] Zmienić bucket plakatu z `party-posters` na `event-posters` w konfiguracji MinIO

---

## 8. SIGNALR (KaraokeHub) — BREAKING CHANGES

### Zmienione nazwy grup
| Stare                                    | Nowe                                     |
|------------------------------------------|------------------------------------------|
| `party-{id}`                             | `event-{id}`                             |
| `party:{id}:lobby:{channel}`             | `event:{id}:lobby:{channel}`             |
| `party:{id}:lobby:participants`          | `event:{id}:lobby:participants`          |

### Zmienione parametry metod hub
Wszystkie publiczne metody huba zmieniły parametr `partyId` → `eventId`:

| Metoda               | Stara sygnatura                                        | Nowa sygnatura                                         |
|----------------------|--------------------------------------------------------|--------------------------------------------------------|
| `JoinLobby`          | `(int partyId, string username, string? channel)`      | `(int eventId, string username, string? channel)`      |
| `LeaveLobby`         | `(int partyId, string? channel)`                       | `(int eventId, string? channel)`                       |
| `GetLobbyMembers`    | `(int partyId, string? channel)`                       | `(int eventId, string? channel)`                       |
| `SendChatMessage`    | `(int partyId, string user, string message)`           | `(int eventId, string user, string message)`           |
| `BroadcastEventStatus` | `(int partyId, object status)`                       | `(int eventId, object status)`                         |
| `StartRound`         | `(int partyId, int roundNumber, object metadata)`      | `(int eventId, int roundNumber, object metadata)`      |
| `EndRound`           | `(int partyId, int roundNumber, object results)`       | `(int eventId, int roundNumber, object results)`       |
| `UpdateScore`        | `(int partyId, int playerId, int score)`               | `(int eventId, int playerId, int score)`               |

### Hub URL
Bez zmian: `/karaokehub`

### Eventy emitowane (bez zmian w nazwie)
- `ReceiveChatMessage`, `ReceiveTimelineUpdate`, `EventStatusUpdated`
- `RoundStarted`, `RoundEnded`, `ScoreboardUpdated`
- `PlayerMovedIn`, `PlayerMovedOut`
- `PermissionsChanged`, `PermissionsBulkChanged`
- `LobbyMembersUpdated`

---

## 9. STORAGE (MinIO) — ZMIANA BUCKETU

| Stary bucket       | Nowy bucket        |
|--------------------|--------------------|
| `party-posters`    | `event-posters`    |

Klucze obiektów nie zmieniły się (`posters/{guid}{ext}`). Jeśli macie istniejącą instancję MinIO, zmieńcie nazwę bucketu lub utwórzcie nowy.

---

Kontakt: pytania/problemy → zgłaszajcie w Teamsie kanał #api-changes.

---

## 10. ZMIANY 2025-06-23 — RENAME + NOWE ENCJE

### 10.1 Genre → MusicGenre
- Encja `Genre` → `MusicGenre`
- DbSet `Genres` → `MusicGenres`
- Tabela DB: `MusicGenres`
- Route'y **bez zmian**: `/api/genres`, `/api/admin/genres`
- JSON response bez zmian — pola `id`, `name`, `parentGenreId`, `subGenres`

### 10.2 CouchGame → VideoGame
| Stare | Nowe |
|---|---|
| `CouchGame` | `VideoGame` |
| `CouchGameSession` | `VideoGameSession` |
| `CouchGameSessionPlayer` | `VideoGameSessionPlayer` |
| `CouchGameCollection` | `VideoGameCollection` |
| `CouchGameCollectionCouchGame` | `VideoGameCollectionVideoGame` |
| `EventCouchGameSession` | `EventVideoGameSession` |
| DbSet `CouchGames` | `VideoGames` |
| Route `api/games/couch/...` | `api/games/video/...` |

⚠️ **BREAKING**: Wszystkie URL-e `/api/games/couch/...` → `/api/games/video/...`

### 10.3 Nowe encje gatunków gier

| Encja | Tabela | Pola |
|---|---|---|
| `BoardGameGenre` | `BoardGameGenres` | `Id, Name, ParentGenreId` (hierarchia) |
| `VideoGameGenre` | `VideoGameGenres` | `Id, Name, ParentGenreId` (hierarchia) |
| `BoardGameTag` | `BoardGameTags` | `Id, BoardGameId, Name` |

- `BoardGame` ma nowe FK: `BoardGameGenreId` → `BoardGameGenre`
- `BoardGame` ma nową kolekcję: `Tags` → `BoardGameTag[]`
- `VideoGame` ma nowe FK: `VideoGameGenreId` → `VideoGameGenre`

### 10.4 Hierarchiczne kolekcje i playlisty (ParentId)

Dodano `ParentId` + `Parent` + `Children` na:
- `BoardGameCollection`
- `VideoGameCollection`
- `Playlist`

Endpointy GET kolekcji/playlist mają nowe query parametry:
```
GET /api/games/board/collections/{id}?includeChildren=true&maxDepth=2
GET /api/games/video/collections/{id}?includeChildren=true&maxDepth=2
GET /api/playlists/{id}?includeChildren=true&maxDepth=2
```

Domyślnie `includeChildren=false`, `maxDepth=1`.

### 10.5 Klasyfikacja tańców (NOWE)

| Encja | Tabela | Pola |
|---|---|---|
| `DanceStyle` | `DanceStyles` | `Id, Name, NamePl, Category, BpmMin, BpmMax, TimeSignature, EnergyMin, EnergyMax, ValenceMin, ValenceMax, RhythmPattern, Description` |
| `SongDanceMatch` | `SongDanceMatches` | `Id, SongId, DanceStyleId, Confidence, Source, AnalyzedAt` |

Nowe endpointy:
| Metoda | Route | Opis |
|---|---|---|
| `GET` | `/api/dance/song/{songId}` | Klasyfikacja tańców dla piosenki (po BPM) |
| `GET` | `/api/dance/classify?bpm=&timeSignature=&energy=&valence=` | Klasyfikacja po parametrach |

Rozszerzony `AudioAnalysisResult`:
```json
{
  "bpm": 120,
  "key": "C",
  "loudness": -5.2,
  "energy": 0.8,
  "timeSignature": 4,
  "danceability": 0.75,
  "valence": 0.6,
  "rhythmPattern": "straight"
}
```

### 10.6 Nowe enumy EventPollOptionSource — ZMIANA
```
Manual=0, BoardGames=1, VideoGames=2, Songs=3, MenuItems=4, Attractions=5
```
⚠️ Dawne: `CouchGames=2` → Nowe: `VideoGames=2`

---

## 11. CHECKLIST DLA FRONTU (2025-06-23)

- [ ] Zmienić URL-e z `/api/games/couch/` na `/api/games/video/` **wszędzie**
- [ ] Zmienić nazwy pól `couchGame*` → `videoGame*` w modelach
- [ ] Dodać obsługę `?includeChildren=true&maxDepth=N` na kolekcjach i playlistach
- [ ] Dodać widok/komponent drzewa kolekcji (Children)
- [ ] Obsłużyć nowe pola: `BoardGame.boardGameGenreId`, `BoardGame.tags[]`, `VideoGame.videoGameGenreId`
- [ ] Dodać widok klasyfikacji tańców (`/api/dance/song/{id}`)
- [ ] Zaktualizować enum `EventPollOptionSource`: `CouchGames` → `VideoGames`

---

## 12. ZMIANY 2025-06-23 (batch 2) — NOWE FICZERY + INFRASTRUKTURA

### 12.1 Powiadomienia push (in-app) ⚡ NOWY MODUŁ

**Encja `Notification`:**
```json
{
  "id": 1,
  "userId": 5,
  "title": "Nowe zaproszenie",
  "body": "Zostałeś zaproszony na Game Night",
  "type": 0,
  "isRead": false,
  "createdAt": "2025-06-23T14:00:00Z",
  "readAt": null
}
```

**Enum `NotificationType`:**
```
General=0, EventInvite=1, EventUpdate=2, KaraokeScore=3, PollCreated=4, CommentReply=5, SystemAlert=6
```

**Nowe endpointy:**
| Metoda | Route | Opis |
|---|---|---|
| `GET` | `/api/user/notifications?unreadOnly=true` | Lista powiadomień |
| `GET` | `/api/user/notifications/unread-count` | Liczba nieprzeczytanych `{ count: N }` |
| `POST` | `/api/user/notifications` | Wyślij powiadomienie |
| `POST` | `/api/user/notifications/{id}/read` | Oznacz jako przeczytane |
| `POST` | `/api/user/notifications/read-all` | Oznacz wszystkie |
| `DELETE` | `/api/user/notifications/{id}` | Usuń |

**SignalR `NotificationHub`:**
- URL: `/hubs/notifications`
- Event: `NotificationReceived` — emitowany przy POST /notifications
- Payload: obiekt `Notification` (jak JSON powyżej)

### 12.2 Zdjęcia eventów ⚡ NOWY

| Metoda | Route | Opis |
|---|---|---|
| `POST` | `/api/events/{eventId}/photos` | Dodaj zdjęcie `{ objectKey, caption }` |
| `GET` | `/api/events/{eventId}/photos` | Lista zdjęć |
| `DELETE` | `/api/events/{eventId}/photos/{id}` | Usuń zdjęcie |

### 12.3 Komentarze eventów ⚡ NOWY

| Metoda | Route | Opis |
|---|---|---|
| `POST` | `/api/events/{eventId}/comments` | Dodaj komentarz `{ text, userId, parentId? }` |
| `GET` | `/api/events/{eventId}/comments` | Lista z drzewkiem (1 poziom: `replies[]`) |
| `DELETE` | `/api/events/{eventId}/comments/{id}` | Usuń |

### 12.4 Export PDF ⚡ NOWY

| Metoda | Route | Opis |
|---|---|---|
| `GET` | `/api/events/{eventId}/export/pdf` | Pobierz PDF (harmonogram + menu + uczestnicy) |

Response: `application/pdf` z `Content-Disposition: attachment; filename=event-{id}.pdf`

### 12.5 IGDB — import gier video ⚡ NOWY

| Metoda | Route | Opis |
|---|---|---|
| `GET` | `/api/games/video/igdb/search?query=&limit=10` | Szukaj gier w IGDB |
| `POST` | `/api/games/video/igdb/import/{igdbId}` | Importuj grę z IGDB do katalogu |

**Nowe pola `VideoGame`:**
```json
{
  "igdbId": 12345,
  "coverImageUrl": "https://images.igdb.com/...",
  "importedFrom": "IGDB"
}
```

Wymaga konfiguracji: `Igdb:ClientId`, `Igdb:ClientSecret` (Twitch Developer)

### 12.6 Auto-tag piosenek ⚡ NOWY

| Metoda | Route | Opis |
|---|---|---|
| `POST` | `/api/library/songs/{id}/auto-tag` | AI auto-tagging (zwraca 503 gdy brak konfiguracji AI) |

### 12.7 Statystyki gier planszowych ⚡ NOWY

| Metoda | Route | Opis |
|---|---|---|
| `GET` | `/api/games/board/stats/player/{playerId}` | Statystyki gracza (wins, avg score, top games) |
| `GET` | `/api/games/board/stats/game/{gameId}` | Statystyki gry (play count, avg duration) |

### 12.8 Paginacja i filtrowanie ⚡ ZMIANA

**Events** — nowe query parametry:
```
GET /api/events?query=&types=&statuses=&startFrom=&startTo=&organizerIds=&page=1&pageSize=20&sortBy=&descending=false
```

**Games** — nowe query parametry:
```
GET /api/games/board?page=1&pageSize=20&sortBy=&descending=false
GET /api/games/video?page=1&pageSize=20&sortBy=&descending=false
```

Response format z paginacją:
```json
{
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "totalCount": 150,
  "totalPages": 8
}
```

---

## 13. SIGNALR — NOWE HUBY

### EditorHub (real-time audio editor)
- URL: `/hubs/editor`
- Metody klienta → serwer:
  - `JoinProject(projectId)` — dołącz do edycji
  - `LeaveProject(projectId)` — opuść
  - `SendItemChange(projectId, change)` — broadcast zmiany
  - `SendCursorPosition(projectId, timePosition, trackId?, layerId?)` — presence
  - `LockSection(projectId, sectionType, sectionId)` — zablokuj sekcję
  - `UnlockSection(projectId, sectionType, sectionId)` — odblokuj
- Eventy serwer → klient:
  - `UserJoined { connectionId, userId, projectId, joinedAt }`
  - `UserLeft { connectionId, userId, projectId }`
  - `ItemChanged { userId, change, timestamp }`
  - `CursorMoved { userId, connectionId, timePosition, trackId, layerId }`
  - `SectionLocked { userId, sectionType, sectionId }`
  - `SectionUnlocked { userId, sectionType, sectionId }`

### NotificationHub
- URL: `/hubs/notifications`
- Event serwer → klient: `NotificationReceived` (payload: obiekt Notification)

---

## 14. NOWE RESPONSE HEADERS

| Header | Opis | Przykład |
|---|---|---|
| `X-Correlation-ID` | ID korelacji requestu (do debugowania) | `a1b2c3d4e5f6` |
| `api-version` | Wersja API | `1.0` |

Klient może wysłać `X-Correlation-ID` w requeście — zostanie użyty. Jeśli nie wyśle, serwer wygeneruje nowy.

Klient może wysłać `api-version` header lub `?api-version=1.0` query param. Domyślnie `1.0`.

---

## 15. RATE LIMITING

Endpointy auth mają ściślejszy limit:
- **Login/Register**: 10 req/min (HTTP 429 gdy przekroczony)
- **Ogólne API**: 60 req/min
- **Publiczne**: 120 req/min

Response przy 429:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

---

## 16. SWAGGER — GRUPOWANIE

Swagger UI teraz ma **dropdown z grupami** zamiast jednego monolitycznego dokumentu:

| Grupa | Endpointy | JSON URL |
|---|---|---|
| ⭐ **All Endpoints** | wszystkie | `/swagger/all/swagger.json` |
| Events | `/api/events/*` | `/swagger/events/swagger.json` |
| Karaoke | `/api/karaoke/*` | `/swagger/karaoke/swagger.json` |
| Games | `/api/games/*` | `/swagger/games/swagger.json` |
| Editor & DMX | `/api/editor/*`, `/api/audio-editor/*`, `/api/dmx/*` | `/swagger/editor/swagger.json` |
| Admin | `/api/admin/*` | `/swagger/admin/swagger.json` |
| Media Library | `/api/library/*`, `/api/genres/*`, `/api/playlists/*`, `/api/dance/*` | `/swagger/library/swagger.json` |
| Auth & User | `/api/user/*`, `/api/license/*` | `/swagger/auth/swagger.json` |
| Other | reszta | `/swagger/other/swagger.json` |

> 💡 **Pełny swagger.json**: `/swagger/all/swagger.json` — zawiera wszystkie endpointy w jednym pliku.

---

## 17. OUTPUT CACHING

Niektóre endpointy GET mają cache:
| Endpoint | Cache | TTL |
|---|---|---|
| `GET /api/genres` | `CacheLong` | 1h |
| `GET /api/games/board/bgg/hot` | `CacheMedium` | 15 min |
| `GET /api/admin/dashboard` | `CacheShort` | 30s |

⚠️ Dane mogą być nieaktualne o max TTL. Użyj `Cache-Control: no-cache` w requeście jeśli potrzebujesz świeżych danych.

---

## 18. CHECKLIST DLA FRONTU (batch 2)

- [ ] Dodać moduł powiadomień — lista, badge z liczbą, mark as read
- [ ] Podpiąć SignalR `/hubs/notifications` → nasłuch `NotificationReceived`
- [ ] Dodać galerię zdjęć w widoku eventu (`/photos`)
- [ ] Dodać komentarze/wall w widoku eventu (`/comments` z reply)
- [ ] Dodać przycisk "Eksport PDF" na stronie eventu
- [ ] Dodać widok statystyk gier planszowych (gracz + gra)
- [ ] Obsłużyć paginację `{ items, page, pageSize, totalCount, totalPages }`
- [ ] Dodać filtrowanie eventów (query, types, statuses, date range)
- [ ] Dodać import gier z IGDB (search + import button)
- [ ] Obsłużyć nowe pola VideoGame: `igdbId`, `coverImageUrl`, `importedFrom`
- [ ] Podpiąć SignalR `/hubs/editor` dla collaborative editing
- [ ] Obsłużyć header `X-Correlation-ID` (logowanie w konsoli do debugowania)
- [ ] Obsłużyć HTTP 429 (rate limiting) — wyświetlić komunikat "zbyt wiele żądań"
- [ ] Wybrać grupę w Swagger UI zamiast scrollowania

***
Plik aktualizowany po każdej większej zmianie API.
