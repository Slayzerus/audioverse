# Backend Requirements — Online Multiplayer for Mini-Games

> This document describes the backend work required to power the new online multiplayer feature for mini-games.  
> The frontend components (`SignalRTransport`, `useOnlineMultiplayer`, `OnlineLobby`) are ready and expect the following server-side infrastructure.

---

## 1. GameHub (SignalR)

A new SignalR hub must be created and mapped at **`/hubs/game`**.

### Registration (Program.cs)

```csharp
app.MapHub<GameHub>("/hubs/game");
```

### Server Methods (invoked by the client)

| Method | Parameters | Description |
|--------|-----------|-------------|
| `CreateRoom` | `gameId: string`, `isPrivate: bool` | Creates a room; returns a room code (6-char alphanumeric). Caller becomes host. |
| `JoinRoom` | `roomCode: string` | Joins an existing room by code. |
| `LeaveRoom` | *(none)* | Leaves the current room. |
| `SendGameMessage` | `message: object` | Broadcasts an arbitrary game-state message to all room members. |
| `StartMatchmaking` | `gameId: string`, `skillLevel: int` | Enters the matchmaking queue for the given game & skill bracket. |
| `CancelMatchmaking` | *(none)* | Removes the caller from the matchmaking queue. |
| `SetReady` | `isReady: bool` | Toggles the caller's ready state in the lobby. |
| `StartGame` | *(none)* | Host-only. Begins the game session for all players in the room. |

### Client Events (sent from server to client)

| Event | Payload | Description |
|-------|---------|-------------|
| `RoomJoined` | `{ roomCode, players[], isHost }` | Sent to the caller after successfully joining/creating a room. |
| `RoomLeft` | `{ reason? }` | Confirms the caller left the room. |
| `PlayerJoined` | `{ connectionId, name, color }` | Broadcast to all room members when a new player joins. |
| `PlayerLeft` | `{ connectionId }` | Broadcast to all room members when a player leaves. |
| `GameMessage` | `object` | Relayed game-state payload from another player. |
| `MatchFound` | `{ roomCode, players[] }` | Sent when matchmaking succeeds — auto-joins a generated room. |
| `Error` | `{ message }` | Error notification (room full, invalid code, etc.). |
| `PlayerReady` | `{ connectionId, isReady }` | Broadcast when a player changes ready state. |
| `GameStarted` | `{ sessionId }` | Broadcast when the host starts the game. |

### Room Management

- Each room is identified by a **6-character alphanumeric code** (uppercase, no ambiguous chars like 0/O, 1/I/L).
- Rooms can be **private** (join by code only) or **public** (listed/discoverable).
- Maximum players per room: configurable, default **8**.
- Rooms auto-expire after **10 minutes** of inactivity (no messages).
- When the host disconnects, the next player in join-order becomes host.

### Matchmaking

- Queue keyed by `(gameId, skillBracket)`.
- Skill brackets: group players within **±200 Elo** (or equivalent skill points from `PlayerMiniGameStat.AverageScore`).
- When **2+** players are queued for the same bracket for **>5 seconds**, create a room and send `MatchFound`.
- Widen the bracket by **±100** every additional **10 seconds** if no match is found.

---

## 2. AvGameSave Controller Endpoints

The repository layer already has these methods (in `IAvGameSaveRepository`):

- `GetAvGameSavesAsync(int profilePlayerId)`
- `UpsertAvGameSaveAsync(AvGameSave save)`
- `DeleteAvGameSaveAsync(int id)`

**Required**: Expose them via a new controller (or extend `MiniGameController`):

| HTTP Method | Route | Description |
|------------|-------|-------------|
| `GET` | `/api/minigames/saves?profilePlayerId={id}` | List saves for a player |
| `POST` | `/api/minigames/saves` | Create or update a save |
| `DELETE` | `/api/minigames/saves/{id}` | Delete a save |

### AvGameSave Entity (expected shape)

```csharp
public class AvGameSave
{
    public int Id { get; set; }
    public int ProfilePlayerId { get; set; }
    public string GameId { get; set; }     // e.g. "snakes", "pong"
    public string SaveData { get; set; }   // JSON blob
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

---

## 3. Existing Endpoints Used by the Frontend

The frontend API client (`apiMiniGameSessions.ts`) already calls these existing `MiniGameController` endpoints:

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/minigames/sessions` | Create a new game session |
| `PUT` | `/api/minigames/sessions/{id}/end` | End a session |
| `GET` | `/api/minigames/sessions/{id}` | Get session details |
| `POST` | `/api/minigames/sessions/{id}/rounds` | Submit a round result |
| `GET` | `/api/minigames/leaderboard?gameId={id}` | Get leaderboard |
| `GET` | `/api/minigames/stats?profilePlayerId={id}` | Get player stats |

**These are assumed to exist already.** If any are missing, they need to be implemented.

---

## 4. CORS / Authentication

- The GameHub should support the same auth scheme as existing hubs (JWT Bearer via query string `?access_token=…`).
- CORS must allow the SignalR negotiate endpoint and WebSocket upgrade for the frontend origin.
- Anonymous access should be permitted for guest/unregistered players (matchmaking uses display name, not a profile).

---

## 5. Environment Variables

The frontend reads:

```
VITE_AUDIOVERSE_GAME_HUB=/hubs/game
```

This can be overridden to point to a different URL in production if the game hub runs on a separate server.

---

## Summary of Backend Work

1. **Create `GameHub.cs`** — SignalR hub with room management, matchmaking queue, message relay.
2. **Create `GameRoomService.cs`** — In-memory room store (ConcurrentDictionary), room lifecycle, host migration.
3. **Create `MatchmakingService.cs`** — Background queue processor, skill-bracket matching, bracket widening.
4. **Expose AvGameSave endpoints** — REST controller wrapping existing repository methods.
5. **Register in `Program.cs`** — `MapHub<GameHub>("/hubs/game")`, DI for room/matchmaking services.
6. **Verify existing MiniGameController endpoints** match the contracts above.
