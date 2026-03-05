# ?? Modu? Gry

Modu? Games integruje si? z BoardGameGeek (BGG) dla gier planszowych i Steam dla gier kooperacyjnych.

---

## Przegl?d funkcji

| Funkcja | Opis |
|---------|------|
| **Gry planszowe** | Katalog z integracj? BGG |
| **Gry kooperacyjne** | Katalog gier Steam (couch co-op) |
| **Wydarzenia** | Przypisywanie gier do wydarze? |
| **Wyszukiwanie** | Wyszukiwanie w zewn?trznych bazach |
| **Import** | Automatyczny import metadanych |

---

## Gry planszowe (BoardGameGeek)

### Encja BoardGame

```
BoardGame
??? Id: int
??? BggId: int (ID z BoardGameGeek)
??? Name: string
??? Description: string
??? YearPublished: int?
??? MinPlayers / MaxPlayers: int
??? MinPlaytime / MaxPlaytime: int (minuty)
??? MinAge: int
??? BggRating: decimal?
??? BggWeight: decimal? (z?o?ono?? 1-5)
??? BggImageUrl: string
??? BggThumbnailUrl: string
??? Categories: string (JSON array)
??? Mechanics: string (JSON array)
??? CreatedAt: DateTime
```

### Encja EventBoardGame

```
EventBoardGame
??? Id: int
??? EventId: int
??? BoardGameId: int
??? Status: GameStatus (Available, InUse, Reserved)
??? BroughtByUserId: int?
??? Notes: string
??? AddedAt: DateTime
```

### API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/games/board` | Lista gier w katalogu |
| `GET` | `/api/games/board/{id}` | Szczegó?y gry |
| `POST` | `/api/games/board` | Dodaj gr? r?cznie |
| `DELETE` | `/api/games/board/{id}` | Usu? z katalogu |

### Wyszukiwanie BGG

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/games/board/bgg/search?q={query}` | Wyszukaj na BGG |
| `GET` | `/api/games/board/bgg/{bggId}` | Szczegó?y z BGG |
| `GET` | `/api/games/board/bgg/hot` | Gor?ce gry |
| `POST` | `/api/games/board/bgg/import/{bggId}` | Import z BGG |

### Gry na wydarzeniu

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/events/{id}/board-games` | Gry na wydarzeniu |
| `POST` | `/api/events/{id}/board-games` | Dodaj gr? |
| `PUT` | `/api/events/{id}/board-games/{gameId}` | Aktualizuj status |
| `DELETE` | `/api/events/{id}/board-games/{gameId}` | Usu? |

---

## Integracja BGG

### Wyszukiwanie

```json
GET /api/games/board/bgg/search?q=Catan

Response:
{
  "results": [
    {
      "bggId": 13,
      "name": "Catan",
      "yearPublished": 1995,
      "thumbnailUrl": "https://cf.geekdo-images.com/..."
    },
    {
      "bggId": 27710,
      "name": "Catan: Cities & Knights",
      "yearPublished": 1998,
      "thumbnailUrl": "https://..."
    }
  ]
}
```

### Import gry

```json
POST /api/games/board/bgg/import/13

Response:
{
  "id": 42,
  "bggId": 13,
  "name": "Catan",
  "description": "In CATAN, players try to be the dominant force...",
  "minPlayers": 3,
  "maxPlayers": 4,
  "minPlaytime": 60,
  "maxPlaytime": 120,
  "minAge": 10,
  "bggRating": 7.1,
  "bggWeight": 2.3,
  "categories": ["Economic", "Negotiation"],
  "mechanics": ["Dice Rolling", "Trading", "Route Building"]
}
```

### Gor?ce gry

```json
GET /api/games/board/bgg/hot

Response:
{
  "games": [
    {
      "rank": 1,
      "bggId": 123456,
      "name": "New Hot Game",
      "thumbnailUrl": "https://..."
    }
  ]
}
```

---

## Gry kooperacyjne (Steam)

### Encja CouchGame

```
CouchGame
??? Id: int
??? SteamAppId: int (ID z Steam)
??? Name: string
??? Description: string
??? Platform: GamePlatform (PC, PlayStation, Xbox, Switch)
??? MinPlayers / MaxPlayers: int
??? HasLocalCoop: bool
??? HasOnlineCoop: bool
??? HasSplitScreen: bool
??? SteamRating: decimal?
??? SteamHeaderImageUrl: string
??? SteamCapsuleImageUrl: string
??? Genres: string (JSON array)
??? Tags: string (JSON array)
??? CreatedAt: DateTime
```

### Encja EventCouchGame

```
EventCouchGame
??? Id: int
??? EventId: int
??? CouchGameId: int
??? Status: GameStatus
??? Platform: string
??? Notes: string
??? AddedAt: DateTime
```

### API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/games/couch` | Lista gier w katalogu |
| `GET` | `/api/games/couch/{id}` | Szczegó?y gry |
| `POST` | `/api/games/couch` | Dodaj gr? r?cznie |
| `DELETE` | `/api/games/couch/{id}` | Usu? z katalogu |

### Wyszukiwanie Steam

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/games/couch/steam/search?q={query}` | Wyszukaj na Steam |
| `GET` | `/api/games/couch/steam/{appId}` | Szczegó?y z Steam |
| `POST` | `/api/games/couch/steam/import/{appId}` | Import ze Steam |

### Gry na wydarzeniu

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/events/{id}/couch-games` | Gry na wydarzeniu |
| `POST` | `/api/events/{id}/couch-games` | Dodaj gr? |
| `PUT` | `/api/events/{id}/couch-games/{gameId}` | Aktualizuj |
| `DELETE` | `/api/events/{id}/couch-games/{gameId}` | Usu? |

---

## Integracja Steam

### Wyszukiwanie

```json
GET /api/games/couch/steam/search?q=Overcooked

Response:
{
  "results": [
    {
      "appId": 448510,
      "name": "Overcooked! 2",
      "headerImageUrl": "https://cdn.akamai.steamstatic.com/..."
    }
  ]
}
```

### Import gry

```json
POST /api/games/couch/steam/import/448510

Response:
{
  "id": 15,
  "steamAppId": 448510,
  "name": "Overcooked! 2",
  "description": "Overcooked returns with a brand-new helping...",
  "minPlayers": 1,
  "maxPlayers": 4,
  "hasLocalCoop": true,
  "hasOnlineCoop": true,
  "hasSplitScreen": false,
  "genres": ["Action", "Casual", "Indie"],
  "tags": ["Co-op", "Local Co-Op", "Cooking", "Multiplayer"]
}
```

---

## Statusy gier

| Status | Opis |
|--------|------|
| `Available` | Dost?pna do grania |
| `InUse` | Aktualnie u?ywana |
| `Reserved` | Zarezerwowana |
| `Unavailable` | Niedost?pna |

---

## Przyk?ady u?ycia

### Dodanie gry planszowej do wydarzenia

```json
POST /api/events/1/board-games
{
  "boardGameId": 42,
  "broughtByUserId": 5,
  "notes": "Mam rozszerzenie Cities & Knights"
}
```

### Aktualizacja statusu

```json
PUT /api/events/1/board-games/42
{
  "status": "InUse"
}
```

### Filtrowanie gier

```json
GET /api/games/board?minPlayers=2&maxPlayers=4&maxPlaytime=60

Response:
{
  "games": [
    { "id": 1, "name": "Ticket to Ride", "minPlayers": 2, "maxPlayers": 5, "maxPlaytime": 60 },
    { "id": 2, "name": "Azul", "minPlayers": 2, "maxPlayers": 4, "maxPlaytime": 45 }
  ]
}
```

---

## Konfiguracja klientów API

### BoardGameGeek

BGG API jest publiczne i nie wymaga klucza.

```csharp
// IBggClient.cs
public interface IBggClient
{
    Task<IEnumerable<BggSearchResult>> SearchAsync(string query);
    Task<BggGameDetails?> GetGameDetailsAsync(int bggId);
    Task<IEnumerable<BggHotGame>> GetHotGamesAsync();
    Task<IEnumerable<BggCollectionItem>> GetUserCollectionAsync(string username);
}
```

### Steam

Steam Store API jest publiczne, ale Steam Web API wymaga klucza.

```json
// appsettings.json
{
  "Steam": {
    "ApiKey": "YOUR_STEAM_API_KEY"
  }
}
```

```csharp
// ISteamClient.cs
public interface ISteamClient
{
    Task<IEnumerable<SteamSearchResult>> SearchAsync(string query);
    Task<SteamGameDetails?> GetGameDetailsAsync(int appId);
}
```

---

*Ostatnia aktualizacja: Luty 2026*
