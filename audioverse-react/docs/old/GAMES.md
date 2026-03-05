1. Potrzebuję taką gierkę zrobić (nie minigierka, bo to będzie raczej większe i już może mieć swoją osobną stronę, ale narazie może mieć początek z minigierki - dołączanie), którą nazwiemy bunny i będzie odzwierciedlać grę Super Bunny Man, w której trzeba albo robić zagadki zręcznościowe albo walczyć na arenie. 

Gra bazuje na mechanice, grawitacji, ginie się na kolcach albo uderzając z dużą prędkością ze wrażliwą część ciała taką jak głowa. 

Najbardziej charakterystyczną rzeczą jest to, że domyślną pozą jest pozycja "na pieska" - ręce wyprostowane, dłonie na ziemi, grzbiet prosty, pupa zgięta, kolana zgięte. Trzymając klawisz A na padzie przechodzimy do pozycji wyprostowanej. To powoduje skok, kopnięcie, zmianę kształtu ciała. W obu pozycjach poruszamy się turlając się w lewo lub w prawo (nie obracając się przy tym - całą grę jestem obrócony w tą samą stronę - głową w lewo), przy czy ciało zachowuje się przy tym sztywno - tylko klawisz A zmienia pozę. 

Naciskając klawisz LB z kolei na padzie powodujemy chwycenie się rękami do powierzchni, przeciwnika, jakiegoś obiektu z mapy (np. głazu).

Tu jest coś, co już kiedyś zacząłem robić w tym kierunku w Unity (c:\Users\Radko\source\repos\BunnyClone\Bouncers\). Możesz to zrobić w 2d albo w 3d z prostych kształtów, jak Ci prościej. Możesz zrobić 2d z przełącznikiem na 3d to porównamy

Miałem już w tym kilka planów na rozbudowę - dodatkowe rzeczy do podnoszenia, przeszkody, edytory map, kampanii, tryby zaawansowane z możliwością obracania się (zmiany kierunku), strzelania z pupy, zbierania amunicji, bonusów etc. 

Tryb motorowy - w grze są motowy, na który królik może się wturlać i akurat pasuje idealnie do jego naturalnej pozycji ciała. Można zrobić mount na motor i wtedy A zmienia kierunek jazdy a RT robi gaz 


2. Do każdej gierki dodaj kartę tytułową, jakieś fajne przejście i ustawienia np. poziom trudności, ilość asteroid, szybkość, wybór pojazdu (ale znaczący - że inaczej się zachowuje jakoś - ma inne parametry czy coś) - cos adekwatnego. Poziom trudności już gdzieś mamy na ustawieniach gracza, to może się podpowiadać. 

3. Dalej urozmaicać mini gierki. Grafiki się może jeszcze kiedyś dorobią, ale chciałbym już teaz, żeby mechaniki miały wspaniałe. 

4. Dodaj jakieś boty i zrób tak, żeby każdą grę się dało od 1 gracza, choćby po to, żeby ćwiczyć albo robić wyniki. Fajnie jak boty będą miały poziomy trudności i będzie go można odcjonalnie dołączyć w większości mini gier i bunny (w honest living bez sensu)


5. Jak już mamy boty, to fajnie by było, jakby każda minigierka miała zarówno tryby coop jak i versus. Boty niech w miarę możliwości będą innymi rzeczami (w asteroid np. statkami w innym kolorze z wolniejszym strzelaniem albo w ogóle kamikaze - może być ich kilka typów). W każdej grze bym chciał tak rozbudować rzeczy, tylko niech zawsze jest opcja gdzieś player mode: coop/vs, game mode: Classic z wszystkim najprostszym bez udziwnień (klasyczny asteroid tylko na kilku graczy) i niech to zawsze będzie pierwszy wybrany domyślny tryb

Tu masz dokumentację z backend, bo przygotowali już encje pod dane z naszych frontowych gier:
## 10. Mini-Games API — sesje, rundy, wyniki, rekordy

### Opis

System mini-gier z zapisywaniem wyników per gracz, rekordami (personal best) i automatycznym przyznawaniem XP. Struktura: **Session → Round → Player**.

### Architektura

```
MiniGameSession
  ├─ EventId?          (opcjonalne powiązanie z eventem)
  ├─ HostPlayerId      (kto hostował sesję)
  ├─ Title?            (opcjonalna etykieta)
  └─ Rounds[]
       └─ MiniGameRound
            ├─ Game              ("GuessTheSong", "LyricsBattle", "PitchRace"…)
            ├─ Mode              ("Classic", "Timed", "Elimination", "Team"…)
            ├─ SettingsJson?     (konfiguracja gry — JSON blob)
            ├─ DurationSeconds?  (czas trwania rundy)
            └─ Players[]
                 └─ MiniGameRoundPlayer
                      ├─ PlayerId          → UserProfilePlayer
                      ├─ Score             (wynik)
                      ├─ Placement?        (1 = zwycięzca)
                      ├─ IsPersonalBest    (auto-detekcja per Game+Mode)
                      ├─ XpEarned          (zawsze przyznawane)
                      └─ ResultDetailsJson? (szczegóły — JSON blob)
```

### System XP

XP wchodzi **zawsze** przez `IPlayerProgressService.AddXpAsync()` z kategorią `MiniGame` i source `"minigame_round"`.

| Komponent | XP |
|---|---|
| Bazowe za udział | **10 XP** |
| Bonus za 1. miejsce | **+15 XP** |
| Bonus za personal best | **+20 XP** |
| **Max za rundę** | **45 XP** |

Personal best wykrywany automatycznie per `Game` + `Mode` — porównanie z najlepszym dotychczasowym wynikiem gracza.

### Endpointy

#### Sesje

| Metoda | URL | Auth | Opis |
|---|---|---|---|
| `POST` | `/api/minigames/sessions` | 🔒 | Utwórz sesję |
| `POST` | `/api/minigames/sessions/{id}/end` | 🔒 | Zakończ sesję |
| `GET` | `/api/minigames/sessions/{id}` | Public | Pobierz sesję z rundami i wynikami |

#### Rundy

| Metoda | URL | Auth | Opis |
|---|---|---|---|
| `POST` | `/api/minigames/sessions/{id}/rounds` | 🔒 | Wyślij wynik rundy (auto XP + personal best) |

#### Leaderboard i statystyki

| Metoda | URL | Auth | Opis |
|---|---|---|---|
| `GET` | `/api/minigames/leaderboard?game=X&mode=Y&top=20` | Public | Ranking per gra/tryb |
| `GET` | `/api/minigames/players/{playerId}/stats` | Public | Statystyki gracza (personal best per gra) |

---

### `POST /api/minigames/sessions` — utwórz sesję 🔒

```bash
POST /api/minigames/sessions
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "hostPlayerId": 5,
  "eventId": 42,
  "title": "Piątkowe mini-gierki"
}
```

| Pole | Typ | Wymagany | Opis |
|---|---|---|---|
| `hostPlayerId` | int | ✅ | ID gracza-hosta |
| `eventId` | int? | ❌ | Powiązanie z eventem |
| `title` | string? | ❌ | Opcjonalna nazwa sesji |

**Response `200`:**

```json
{ "id": 1 }
```

---

### `POST /api/minigames/sessions/{id}/end` — zakończ sesję 🔒

```bash
POST /api/minigames/sessions/1/end
Authorization: Bearer <jwt>
```

**Response `200`**: sesja zakończona.
**Response `404`**: sesja nie istnieje lub już zakończona.

---

### `GET /api/minigames/sessions/{id}` — szczegóły sesji

```bash
GET /api/minigames/sessions/1
```

**Response `200`:**

```json
{
  "id": 1,
  "eventId": 42,
  "hostPlayerId": 5,
  "hostPlayerName": "Jan",
  "title": "Piątkowe mini-gierki",
  "startedAtUtc": "2025-07-27T19:00:00Z",
  "endedAtUtc": "2025-07-27T20:30:00Z",
  "rounds": [
    {
      "id": 1,
      "roundNumber": 1,
      "game": "GuessTheSong",
      "mode": "Timed",
      "durationSeconds": 120,
      "startedAtUtc": "2025-07-27T19:05:00Z",
      "endedAtUtc": "2025-07-27T19:07:00Z",
      "players": [
        {
          "playerId": 5,
          "playerName": "Jan",
          "score": 850,
          "placement": 1,
          "isPersonalBest": true,
          "xpEarned": 45,
          "completedAtUtc": "2025-07-27T19:07:00Z"
        },
        {
          "playerId": 12,
          "playerName": "Asia",
          "score": 620,
          "placement": 2,
          "isPersonalBest": false,
          "xpEarned": 10,
          "completedAtUtc": "2025-07-27T19:07:00Z"
        }
      ]
    }
  ]
}
```

---

### `POST /api/minigames/sessions/{id}/rounds` — wyślij wynik rundy 🔒

**Najważniejszy endpoint** — zapisuje rundę, wykrywa personal best, przyznaje XP.

```bash
POST /api/minigames/sessions/1/rounds
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "game": "GuessTheSong",
  "mode": "Timed",
  "settingsJson": "{\"timeLimit\":120,\"category\":\"pop\"}",
  "durationSeconds": 118,
  "players": [
    { "playerId": 5, "score": 850, "placement": 1 },
    { "playerId": 12, "score": 620, "placement": 2 },
    { "playerId": 13, "score": 450, "placement": 3, "resultDetailsJson": "{\"correctAnswers\":9}" }
  ]
}
```

| Pole | Typ | Wymagany | Opis |
|---|---|---|---|
| `game` | string | ✅ | Identyfikator mini-gry |
| `mode` | string | ✅ | Tryb gry |
| `settingsJson` | string? | ❌ | Konfiguracja gry (JSON) |
| `durationSeconds` | int? | ❌ | Czas trwania rundy |
| `players` | array | ✅ | Wyniki graczy |
| `players[].playerId` | int | ✅ | ID gracza |
| `players[].score` | int | ✅ | Wynik |
| `players[].placement` | int? | ❌ | Miejsce (1 = zwycięzca) |
| `players[].resultDetailsJson` | string? | ❌ | Szczegóły wyniku (JSON) |

**Response `200`:**

```json
{
  "roundId": 1,
  "roundNumber": 1,
  "playerResults": [
    {
      "playerId": 5,
      "score": 850,
      "placement": 1,
      "isPersonalBest": true,
      "xpEarned": 45,
      "newTotalXp": 245,
      "newLevel": 3,
      "leveledUp": true
    },
    {
      "playerId": 12,
      "score": 620,
      "placement": 2,
      "isPersonalBest": false,
      "xpEarned": 10,
      "newTotalXp": 130,
      "newLevel": 2,
      "leveledUp": false
    }
  ]
}
```

**Response `400`**: sesja nie istnieje.

---

### `GET /api/minigames/leaderboard` — ranking

```bash
GET /api/minigames/leaderboard?game=GuessTheSong&mode=Timed&top=10
```

| Param | Typ | Wymagany | Domyślna | Opis |
|---|---|---|---|---|
| `game` | string | ✅ | — | Nazwa mini-gry |
| `mode` | string | ❌ | all modes | Tryb gry |
| `top` | int | ❌ | `20` | Max wyników (1–100) |

**Response `200`:**

```json
[
  { "playerId": 5, "playerName": "Jan", "bestScore": 850, "totalGames": 12, "achievedAtUtc": "2025-07-27T19:07:00Z" },
  { "playerId": 12, "playerName": "Asia", "bestScore": 780, "totalGames": 8, "achievedAtUtc": "2025-07-26T21:15:00Z" }
]
```

---

### `GET /api/minigames/players/{playerId}/stats` — statystyki gracza

```bash
GET /api/minigames/players/5/stats
```

**Response `200`:**

```json
[
  { "game": "GuessTheSong", "mode": "Classic", "bestScore": 920, "totalGames": 15, "totalXpEarned": 380, "lastPlayedAtUtc": "2025-07-27T20:00:00Z" },
  { "game": "GuessTheSong", "mode": "Timed", "bestScore": 850, "totalGames": 12, "totalXpEarned": 290, "lastPlayedAtUtc": "2025-07-27T19:07:00Z" },
  { "game": "LyricsBattle", "mode": "Classic", "bestScore": 1200, "totalGames": 5, "totalXpEarned": 150, "lastPlayedAtUtc": "2025-07-25T22:30:00Z" }
]
```

---

### TypeScript interfaces

```typescript
// === Request DTOs ===

interface CreateMiniGameSessionRequest {
  hostPlayerId: number;
  eventId?: number;
  title?: string;
}

interface SubmitMiniGameRoundRequest {
  game: string;           // "GuessTheSong", "LyricsBattle", "PitchRace"…
  mode: string;           // "Classic", "Timed", "Elimination", "Team"…
  settingsJson?: string;  // konfiguracja gry (JSON)
  durationSeconds?: number;
  players: SubmitMiniGameRoundPlayerRequest[];
}

interface SubmitMiniGameRoundPlayerRequest {
  playerId: number;
  score: number;
  placement?: number;     // 1 = zwycięzca
  resultDetailsJson?: string;
}

// === Response DTOs ===

interface MiniGameSessionDto {
  id: number;
  eventId: number | null;
  hostPlayerId: number;
  hostPlayerName: string | null;
  title: string | null;
  startedAtUtc: string;
  endedAtUtc: string | null;
  rounds: MiniGameRoundDto[];
}

interface MiniGameRoundDto {
  id: number;
  roundNumber: number;
  game: string;
  mode: string;
  durationSeconds: number | null;
  startedAtUtc: string;
  endedAtUtc: string | null;
  players: MiniGameRoundPlayerDto[];
}

interface MiniGameRoundPlayerDto {
  playerId: number;
  playerName: string | null;
  score: number;
  placement: number | null;
  isPersonalBest: boolean;
  xpEarned: number;
  completedAtUtc: string;
}

interface SubmitMiniGameRoundResult {
  roundId: number;
  roundNumber: number;
  playerResults: MiniGamePlayerXpResult[];
}

interface MiniGamePlayerXpResult {
  playerId: number;
  score: number;
  placement: number | null;
  isPersonalBest: boolean;
  xpEarned: number;
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
}

interface MiniGameLeaderboardEntry {
  playerId: number;
  playerName: string;
  bestScore: number;
  totalGames: number;
  achievedAtUtc: string;
}

interface PlayerMiniGameStat {
  game: string;
  mode: string;
  bestScore: number;
  totalGames: number;
  totalXpEarned: number;
  lastPlayedAtUtc: string;
}
```

### Przykłady integracji

#### React — wysyłanie wyniku rundy

```tsx
const submitRound = async (sessionId: number) => {
  const res = await fetch(`/api/minigames/sessions/${sessionId}/rounds`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      game: 'GuessTheSong',
      mode: 'Timed',
      durationSeconds: 118,
      players: [
        { playerId: 5, score: 850, placement: 1 },
        { playerId: 12, score: 620, placement: 2 }
      ]
    })
  });

  const result: SubmitMiniGameRoundResult = await res.json();

  // Pokaż personal best i level-up animację
  for (const p of result.playerResults) {
    if (p.isPersonalBest) showPersonalBestToast(p.playerId);
    if (p.leveledUp) showLevelUpAnimation(p.playerId, p.newLevel);
  }
};
```

#### Flutter — leaderboard

```dart
Future<List<MiniGameLeaderboardEntry>> getLeaderboard(String game, {String? mode, int top = 20}) async {
  final params = {'game': game, 'top': top.toString()};
  if (mode != null) params['mode'] = mode;

  final response = await dio.get('/api/minigames/leaderboard', queryParameters: params);
  return (response.data as List).map((e) => MiniGameLeaderboardEntry.fromJson(e)).toList();
}
```

#### React — flow pełnej sesji

```tsx
// 1. Utwórz sesję
const { id: sessionId } = await (await fetch('/api/minigames/sessions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ hostPlayerId: myPlayerId, eventId: currentEventId, title: 'Piątkowe mini-gierki' })
})).json();

// 2. Po każdej rundzie — wyślij wyniki
const roundResult = await submitRound(sessionId);

// 3. Zakończ sesję
await fetch(`/api/minigames/sessions/${sessionId}/end`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});

// 4. Pobierz statystyki gracza
const stats = await (await fetch(`/api/minigames/players/${myPlayerId}/stats`)).json();
```

### Znane gry (przykłady)

| Game ID | Opis |
|---|---|
| `GuessTheSong` | Odgadnij tytuł/artystę po fragmencie |
| `LyricsBattle` | Uzupełnij brakujące słowa w tekście |
| `PitchRace` | Traf w nuty na czas |
| `MusicQuiz` | Quiz muzyczny (wielokrotny wybór) |
| `RhythmTap` | Stuknij w rytm muzyki |
| `SongChain` | Piosenka łańcuchowa — następna zaczyna się od ostatniej litery |

> Game ID to dowolny string — nowe gry można dodawać bez zmian w backendzie.
> Od wersji z AvGame — preferowane jest tworzenie gier w katalogu i referencja przez `gameId` (FK).

---

## 11. AvGame — uniwersalny katalog gier

### Opis

Katalog wszystkich gier w systemie — mini-gierki i duże gry. Jedna encja `AvGame` z modami, konfiguracją admina, ustawieniami gracza, zapisami stanu (save) i assetami.

### Architektura

```
AvGame (katalog gier)
  ├─ Code                 (unikalny identyfikator, np. "GuessTheSong")
  ├─ IsMiniGame            (true = mini-gra, false = pełna gra)
  ├─ VsPlayersMin/Max      (limity graczy vs)
  ├─ CoopPlayersMin/Max    (limity graczy coop)
  ├─ Difficulty / Complexity / Category
  │
  ├─ AvGameMode (1:N)      — tryby gry (Classic, Timed, Team…)
  ├─ AvGameConfiguration (1:1) — admińska konfiguracja (JSON)
  ├─ AvGameSettings (1:N)  — preferencje gracza per gra (JSON)
  ├─ AvGameAsset (1:N)     — dodatkowe pliki (obrazki, audio, dane)
  ├─ AvGameSave (1:N)      — zapisy stanu per gracz (JSON)
  └─ AvGameAchievement (1:N) — osiągnięcia do odblokowania
```

### Enumy

#### `AvGameCategory`

| Wartość | Nazwa |
|---|---|
| `0` | `MiniGame` |
| `1` | `Party` |
| `2` | `Trivia` |
| `3` | `Music` |
| `4` | `Board` |
| `5` | `Card` |
| `6` | `Puzzle` |
| `7` | `Strategy` |
| `8` | `Action` |
| `9` | `Rhythm` |
| `10` | `Word` |
| `11` | `Drawing` |
| `12` | `Social` |
| `99` | `Other` |

#### `AvGameDifficulty`

| Wartość | Nazwa |
|---|---|
| `0` | `Easy` |
| `1` | `Medium` |
| `2` | `Hard` |
| `3` | `Expert` |

#### `AvGameComplexity`

| Wartość | Nazwa |
|---|---|
| `0` | `Trivial` |
| `1` | `Simple` |
| `2` | `Moderate` |
| `3` | `Complex` |
| `4` | `VeryComplex` |

#### `AvGameAssetType`

| Wartość | Nazwa |
|---|---|
| `0` | `Image` |
| `1` | `Audio` |
| `2` | `Video` |
| `3` | `Document` |
| `4` | `Data` |
| `99` | `Other` |

### TypeScript interfaces

```typescript
// === AvGame ===

interface AvGameDto {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isMiniGame: boolean;
  vsPlayersMinimum: number;
  vsPlayersMaximum: number;
  coopPlayersMinimum: number;
  coopPlayersMaximum: number;
  icon: string | null;
  imageUrl: string | null;
  category: number;         // AvGameCategory
  difficulty: number;       // AvGameDifficulty
  complexity: number;       // AvGameComplexity
  roundTimeSeconds: number | null;
  estimatedDurationMinutes: number | null;
  supportsCoop: boolean;
  supportsVs: boolean;
  supportsSolo: boolean;
  isEnabled: boolean;
  sortOrder: number;
  tags: string | null;
  version: string | null;
  modes: AvGameModeDto[];
  achievements: AvGameAchievementDto[];
}

interface AvGameModeDto {
  id: number;
  gameId: number;
  code: string;
  name: string;
  description: string | null;
  roundTimeSecondsOverride: number | null;
  defaultSettingsJson: string | null;
  sortOrder: number;
  isEnabled: boolean;
}

// === AvGameConfiguration (admin) ===

interface AvGameConfigurationDto {
  id: number;
  gameId: number;
  configJson: string;       // globalna konfiguracja (JSON)
  scoringJson: string | null;
  xpMultiplier: number;
  notes: string | null;
  updatedAtUtc: string;
  lastEditedByUserId: number | null;
}

// === AvGameSettings (per player) ===

interface AvGameSettingsDto {
  id: number;
  gameId: number;
  playerId: number;
  settingsJson: string;     // preferencje gracza (JSON)
  updatedAtUtc: string;
}

// === AvGameAsset ===

interface AvGameAssetDto {
  id: number;
  gameId: number;
  assetType: number;        // AvGameAssetType
  name: string;
  url: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  sortOrder: number;
  uploadedAtUtc: string;
}

// === AvGameSave (per player) ===

interface AvGameSaveDto {
  id: number;
  gameId: number;
  playerId: number;
  slotName: string;
  dataJson: string;
  metadataJson: string | null;
  gameVersion: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

// === AvGameAchievement ===

interface AvGameAchievementDto {
  id: number;
  gameId: number;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  xpReward: number;
  sortOrder: number;
  isEnabled: boolean;
}
```

### Powiązanie z MiniGameRound

`MiniGameRound` ma teraz opcjonalne FK do katalogu:

```typescript
interface MiniGameRoundDto {
  // ... istniejące pola ...
  game: string;             // legacy string identifier
  mode: string;             // legacy string mode
  gameId: number | null;    // FK → AvGame (nowe)
  gameModeId: number | null; // FK → AvGameMode (nowe)
}
```

> Stare pola `game` / `mode` (string) zostają dla backward compatibility. Nowe rundy powinny ustawiać `gameId` + `gameModeId`.

6. Jak chcesz coś zrobić inaczej, to zrób inaczej i napisz mi tylko notatkę dla backendu co byś chciał zmodyfikować

7. Napisz wsad w JSON dla backendu do zaseedowania tych gier, które już masz - zarówno mini jak i honest living i bunny. Karaoke niech zostanie tak jak jest, bo ma bardziej skomplikowaną bazę








7. Da się zrobić gry na 2 i więcej okna przeglądarki, jak ktoś ma więcej monitorów - musiałby chyba osobno dołączyć w innym oknie przeglądarki

8. Jeśli jeszcze nie ma, to menu pauzy w każdej grze bez wyjątków (ESC/Start na pad), minimum to: opcja save (backend jest na to gotowy), ustawienia, przypisań kontrolerów, i wyjścia do menu. W bardziej złożonych grach będzie więcej

9. Dodać support online multiplayer (opcjonalnie: private/public game), matchmaking po podobnym poziomie dla session gry, żeby było kilka rund itd. Przy konfiguracji sesji i rund musi być wtedy jakieś lobby - jeśli trzeba coś na backendzie zrobić, to potrzebuję takiej informacji od razu w miarę 

10. Wyciągnąć assetmanager do Admin->Asset Manager (do cięcia elementów, tworzenia animacji - jest już to tam. Edytor map i światów z zasadzie też może być uniwersalny) z do audioverse, to wtedy będzie można używać tych zasobów w innych grach

11. W każdej grze jest online, więc w każdej musi być teamspeak i chat - możliwość wyciszenia siebie i innych, wybrania urządzenia wejściowego (już łapiemy do karaoke)

12. Opcja pauzy safe for work, która wygląda jak coś biznesowego do pracy ;-) Jakieś wykresy, tabelki - poważne aktualne dane, najlepiej w języku użytkownika

Rozpisz pomysły na dalsze gry w plikach TODO_<nazwa_gry>.md (nazwa na poniższej liście, to tytuł gry, które zasady chcielibyśmy odwzorować - każda single,couch,online - vs i coop. Unikamy trybów turowych i nawet jak są głównymi, bo inaczej się nie da, to robimy alternatywę z czasem rzeczywistym możliwą do wybrania w opcjach). Na tym etapie nie musimy jeszcze tego robić, ale trzeba przygotować te gry pod monetyzację, także wszędzie minimu 2-3 waluty. Na razie rozdawane normalnie, potem ograniczymy. Oto moje pomysły:
- Uplink (i podobne) - z różnymi poziomami złożoności. Na najtrudniejszym już pisanie kodu, na najłatwiejszym to klikanie w jakieś klocki. W tym ulepszanie sprzętu, przypał, naloty policji, relokacja, rozbudowana wielka gra. Na split na 4 osoby byłoby super vs/coop
- Ultimate Chicken Horse - stawianie przeszkód, dobieganie do celu
- No time to relax/Walk of life - gra w życie, taka szybka polegająca na decydowaniu między szkołą a jedzeniem, siłownią a prysznicem. Na określoną ilość rund na podsumowanie komu poszło lepiej w życiu, lub endless. Oryginalne gry mają tryb turowy, że każdy gracz robi swój dzień po kolei. Chciałbym, żeby tutaj gracze grali jednocześnie i żeby każdy miał swoje małe menu z wyborem tego co chce robić w budynku
- Tooth and Tail - Prosty RTS na pady - jeden klawisz wysyła jednoski, inny buduje, inny jakiś special - może być wariant z walczącym bohaterem ale może być że bohaterowie nie walczą sami z siebie, tylko jednostkami
- Worms - zamki, czołki, wormsy - strzelanie bez ruchu albo z bardzo ograniczonym - tryb turowy lub rzeczywisty (były kiedyś wormsy real time i były doskonałe)
- Soldat - platformowa strzelanka z realizmem 1 hit - 1 kill
- Police Stories - top down z realizmem 1 hit - 1 kill
- Battlefield/Urban terror - strzelanka 3d  z grafiką a la minecraft, ale pojazdy muszą być - różne światy - fantasy (miecze, łuki, czary, smoki), średniowiecze (miecze, łuki, katapulty, wieże oblężnicze), modern, sci-fi. Vs i Coop na split i normalne lobby do grania z ludźmi z zewnątrz - różne rasy, frakcje - każda gra musi mieć swój odrębny świat i klimat
- Fallout 1 i 2/Baldur's gate - realtime z walką w turze
- Battle of Wesnoth - też różne światy etc. bardzo rozbudowana,
- Eight minute empire - area control, w czasie rze
- Magic The Gathering - tcg ze zbieraniem kart fantasy, sci-fi, średniowiecze etc. z różnymi zasadami 
- Swords and Sandals - gladiatorzy, rpg z walką turową na takiej linii z polami (nie można iść wgłąb ani w stronę gracza tylko lewo prawo). Sława, rankingi. Ja bym zrobił oprócz trybu turowego tryb autowalki, żeby było trochę jak kings League
- Sensible World of Soccer - prosta piłka nożna (top down - 8 kierunkowa postać) z wielkimi ambicjami - tryby ligii, menedżera z automatycznym rozgrywaniem meczy, jak mi się nie chce, z rpg statystykami piłkarzy, zarządzaniem własnym klubem, rozbudową, marketingiem etc. Poziomy trudności, przestrzeganie reguł, dodatkowe tryby, trening, utrudnienia.
- Overcooked/Tools Up - gotowanie, sprzątanie, budowanie, naprawianie, mechanikowanie, drwale etc. prowadzenie swojego biznesu, rozbudowa, dokupowanie sprzętu, zmiana lokalu, levelowanie w czynnościach. Pierwszy level - robienie lemioniady. Lekki life sim. Kampania z wyborami zawodów, tryb endless 
- Tetris/PuyoPuyo - i inne podobne w jednej grze
- River City Girls - beat'em up, rpg, z rozbudowaną kampanią, wyborem wielu różnych postaci
- GTA 2 - top down strzelanka, bardzo rozbudowane, otwarty proceduralny świat, z RPG, światami (średniowiecze, sci-fi, post apo etc.) możliwość kupowania nieruchomości, budowania, inwestowania, przejmowania terenu -


AdVenture Capitalist - idle game, inwestujemy, zarabiamy więcej, więcej inwestujemy 
Might&Magic - party turn based fpp rpg classic
Heroes of might&magic3
Black Gold/Oil imperium - (oil tycoon - kupowanie pól, ulepszanie, budowanie) - ekonomiczna
Transport tycoon - budowa sieci transportowych 
Sim city - rozbudowa miasta 
Settlers - strategia z charakterystycznym rodzajem zarządzania (nie bezpośrednie komendy, tylko ogólne i robotnicy sami robią)
Red Alert/Starcraft/Age of empires  - typowy szybki RTS z budowaniem. Dodać przejścia przez epoki, różne światy etc.
Instrukcja z klawiszami do każdej gry i krótki opisem w języku, co trzeba robić
Ukrywanie funkcjonalności i zakładek z poziomu admina albo przypisywanie widoczności tylko do wybranych ról
Cywilizacja
League of Legends
Pokemon
Auto zbieranie na plecy + autostrzelanie - takie typowe gry mobilne, zrobić je razem i osobno w grze (tryb gather, tryb survival, tryb combo)
Autostrzelanie do góry (lewo prawo) jak na mobile, shoot em up
Doom - celowanie tylko w 1 osi
Memo - proste zapamiętywanie na wielu graczy z power upami
Drag racing - ulepszamy auto i patrzymy jak jedzie



Lords of the realm
Tower Defense jak jeszcze nie ma 


Jak będzie aplikacja mobila:
- Mafia - 
- Kalambury 


----------------------------------
1. GTA2 - przerobić na 3d, ale dalej top down, tylko musi być czuć wysokość budynków. Trzeba też przybliżyć kamerę o 30% w stosunku do tego co jest teraz
2. 