# ?? SignalR Hubs

Real-time komunikacja przez SignalR w AudioVerse.

---

## KaraokeHub

**Endpoint:** `/hubs/karaoke`

Hub do komunikacji w czasie rzeczywistym podczas imprez karaoke.

---

## Po??czenie

### JavaScript/TypeScript

```typescript
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl("/hubs/karaoke", {
    accessTokenFactory: () => getAccessToken()
  })
  .withAutomaticReconnect()
  .build();

await connection.start();
```

### C# (.NET)

```csharp
var connection = new HubConnectionBuilder()
    .WithUrl("https://api.audioverse.app/hubs/karaoke", options =>
    {
        options.AccessTokenProvider = () => Task.FromResult(accessToken);
    })
    .WithAutomaticReconnect()
    .Build();

await connection.StartAsync();
```

---

## Metody klienta ? serwer

### JoinParty

Do??cz do grupy imprezy (wymagane do otrzymywania zdarze?).

```typescript
await connection.invoke("JoinParty", partyId);
```

### LeaveParty

Opu?? grup? imprezy.

```typescript
await connection.invoke("LeaveParty", partyId);
```

### SendPitchData

Wy?lij dane analizy tonu (podczas ?piewania).

```typescript
await connection.invoke("SendPitchData", {
  timestamp: Date.now(),
  pitch: 440.0,        // Hz
  volume: 0.8,         // 0-1
  noteIndex: 42
});
```

### UpdatePlayerStatus

Aktualizuj status gracza.

```typescript
await connection.invoke("UpdatePlayerStatus", {
  partyId: 1,
  status: "Ready"  // Ready, Singing, Waiting, AFK
});
```

### RequestNextSong

Popro? o nast?pn? piosenk? w kolejce.

```typescript
await connection.invoke("RequestNextSong", partyId);
```

---

## Zdarzenia serwer ? klient

### PlayerJoined

Gracz do??czy? do imprezy.

```typescript
connection.on("PlayerJoined", (data) => {
  console.log(`${data.playerName} do??czy? do imprezy`);
});

// Payload:
{
  "playerId": 5,
  "playerName": "Jan",
  "avatarUrl": "https://..."
}
```

### PlayerLeft

Gracz opu?ci? imprez?.

```typescript
connection.on("PlayerLeft", (data) => {
  console.log(`Gracz ${data.playerId} opu?ci? imprez?`);
});

// Payload:
{
  "playerId": 5
}
```

### RoundStarted

Runda zosta?a rozpocz?ta.

```typescript
connection.on("RoundStarted", (data) => {
  loadSong(data.songId);
});

// Payload:
{
  "roundId": 10,
  "songId": 42,
  "songTitle": "Bohemian Rhapsody",
  "difficulty": "Normal"
}
```

### SingingStarted

Gracz rozpocz?? ?piewanie.

```typescript
connection.on("SingingStarted", (data) => {
  highlightPlayer(data.playerId);
});

// Payload:
{
  "playerId": 5,
  "playerName": "Jan",
  "songId": 42,
  "startTime": "2026-02-15T20:30:00Z"
}
```

### SingingEnded

Gracz zako?czy? ?piewanie.

```typescript
connection.on("SingingEnded", (data) => {
  showScore(data);
});

// Payload:
{
  "playerId": 5,
  "songId": 42,
  "score": 8500,
  "accuracyPercent": 85.5,
  "perfectNotes": 120,
  "goodNotes": 50,
  "missedNotes": 10
}
```

### ScoreUpdated

Aktualizacja wyniku w czasie rzeczywistym.

```typescript
connection.on("ScoreUpdated", (data) => {
  updateScoreDisplay(data.playerId, data.score);
});

// Payload:
{
  "playerId": 5,
  "score": 4250,
  "currentStreak": 15,
  "multiplier": 2
}
```

### QueueUpdated

Kolejka piosenek zosta?a zmieniona.

```typescript
connection.on("QueueUpdated", (data) => {
  refreshQueue(data.queue);
});

// Payload:
{
  "queue": [
    { "id": 1, "songTitle": "Song A", "playerName": "Jan", "status": "Playing" },
    { "id": 2, "songTitle": "Song B", "playerName": "Anna", "status": "Queued" }
  ]
}
```

### PlayerStatusChanged

Status gracza si? zmieni?.

```typescript
connection.on("PlayerStatusChanged", (data) => {
  updatePlayerStatus(data.playerId, data.status);
});

// Payload:
{
  "playerId": 5,
  "status": "Ready"
}
```

### PartyEnded

Impreza zosta?a zako?czona.

```typescript
connection.on("PartyEnded", (data) => {
  showFinalScores(data.leaderboard);
});

// Payload:
{
  "partyId": 1,
  "leaderboard": [
    { "rank": 1, "playerName": "Jan", "totalScore": 25000 },
    { "rank": 2, "playerName": "Anna", "totalScore": 22000 }
  ]
}
```

### Error

Wyst?pi? b??d.

```typescript
connection.on("Error", (data) => {
  showError(data.message);
});

// Payload:
{
  "code": "QUEUE_FULL",
  "message": "Kolejka jest pe?na"
}
```

---

## Grupy

Gracze s? automatycznie dodawani do grup na podstawie `partyId`:

- `party-{partyId}` — wszyscy uczestnicy imprezy
- `party-{partyId}-organizers` — tylko organizatorzy
- `party-{partyId}-singers` — aktualnie ?piewaj?cy

---

## Przyk?ad kompletny

```typescript
import * as signalR from "@microsoft/signalr";

class KaraokeClient {
  private connection: signalR.HubConnection;

  constructor(private accessToken: string) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("/hubs/karaoke", {
        accessTokenFactory: () => this.accessToken
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.registerHandlers();
  }

  private registerHandlers() {
    this.connection.on("PlayerJoined", (data) => {
      console.log(`${data.playerName} joined`);
      this.onPlayerJoined?.(data);
    });

    this.connection.on("ScoreUpdated", (data) => {
      this.onScoreUpdated?.(data);
    });

    this.connection.on("QueueUpdated", (data) => {
      this.onQueueUpdated?.(data);
    });

    this.connection.onreconnecting(() => {
      console.log("Reconnecting...");
    });

    this.connection.onreconnected(() => {
      console.log("Reconnected!");
    });
  }

  async connect() {
    await this.connection.start();
  }

  async joinParty(partyId: number) {
    await this.connection.invoke("JoinParty", partyId);
  }

  async sendPitchData(pitch: number, volume: number) {
    await this.connection.invoke("SendPitchData", {
      timestamp: Date.now(),
      pitch,
      volume
    });
  }

  // Event handlers
  onPlayerJoined?: (data: any) => void;
  onScoreUpdated?: (data: any) => void;
  onQueueUpdated?: (data: any) => void;
}

// U?ycie
const client = new KaraokeClient(accessToken);
await client.connect();
await client.joinParty(1);

client.onScoreUpdated = (data) => {
  document.getElementById("score").textContent = data.score;
};
```

---

## Autoryzacja

Hub wymaga autoryzacji JWT. Token jest przekazywany:
- W nag?ówku `Authorization` (WebSockets)
- Jako query parameter `access_token` (fallback)

---

*Ostatnia aktualizacja: Luty 2026*
