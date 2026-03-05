# AudioVerse — RTC (SignalR + WebRTC) guide for frontend

This document describes the current real-time (RTC) design so the frontend team can implement chat, audio/video streaming (WebRTC signaling), lobby flows and game management (round lifecycle, scoring).

## High level

- Control-plane & signaling: SignalR hub `KaraokeHub` (route `/hubs/karaoke`).
- Media-plane: WebRTC peer-to-peer (P2P). SignalR only forwards offers/answers/ICE candidates.
- Lobby state: stored in Redis when `REDIS_CONNECTION` is configured, otherwise in-memory store (single instance).
- Persistence: rounds and singing results are saved in the server DB via EF Core when `EndRound` is called.
- Security: hub and HTTP endpoints use JWT-based authentication. Claims used: `id`, `username`, roles (e.g. `Admin`).
- Auditing: server logs join/leave/start/end/assign actions to `IAuditLogService`.

## SignalR hub: `KaraokeHub`

Location: `AudioVerse.API/Hubs/KaraokeHub.cs`

Main capabilities:

- Lobby management
  - `JoinLobby(int partyId, string username)`
  - `LeaveLobby(int partyId)`
  - `GetLobbyMembers(int partyId)`
  - `LobbyMembersUpdated` event broadcast
  - Server records membership in Redis (if configured) or in-memory store.

- Chat
  - `SendChatMessage(int partyId, string user, string message)` -> broadcast `ReceiveChatMessage` (server adds timestamp).

- WebRTC signaling
  - `SendOffer(string targetConnectionId, object offer)` -> forwards `ReceiveOffer`.
  - `SendAnswer(string targetConnectionId, object answer)` -> forwards `ReceiveAnswer`.
  - `SendIceCandidate(string targetConnectionId, object candidate)` -> forwards `ReceiveIceCandidate`.

- Game events
  - `StartRound(int partyId, int roundNumber, object metadata)` -> broadcasts `RoundStarted` (organizer/admin only).
  - `EndRound(int partyId, int roundNumber, object results)` -> broadcasts `RoundEnded`, persists round + singings (organizer/admin only).
  - `UpdateScore(int partyId, int playerId, int score)` -> broadcasts `ScoreboardUpdated` (organizer/admin only).

Security & authorization:

- Hub and HTTP controllers are protected with `[Authorize]`.
- Critical actions (start/end round, update party, update score) require the caller to be the party organizer or have role `Admin`.
- Server reads JWT claims: `id` and `username` and role claims.

Auditing:

- The server records audited entries through `IAuditLogService.LogActionAsync(userId, username, action, message, success, reason?)` for actions such as Join/Leave/StartRound/EndRound/AssignPlayer/UpdateParty.

## Server -> client events (SignalR)

- `MemberJoined` { ConnectionId, Username }
- `MemberLeft` { ConnectionId }
- `LobbyMembersUpdated` [ { ConnectionId, Username }, ... ]
- `ReceiveChatMessage` (user, message, timestamp)
- `ReceiveOffer` (fromConnectionId, offer)
- `ReceiveAnswer` (fromConnectionId, answer)
- `ReceiveIceCandidate` (fromConnectionId, candidate)
- `PartyStatusUpdated` (object)
- `RoundStarted` { Round, Metadata, StartedBy, StartedAt }
- `RoundEnded` { Round, Results, EndedAt }
- `ScoreboardUpdated` [ { PlayerId, Score }, ... ]
- `Error` (string)

## HTTP endpoints relevant for frontend

- `POST /api/karaoke/party/{id}/join`
  - Body: `{ "code": "optional-plaintext-code" }`.
  - Server verifies `CodeHash` (SHA256 hex) for `Access == Code`. Returns 200 if allowed or 403 if not allowed. Audited.

- `POST /api/karaoke/create-party` and `PUT /api/karaoke/party/{id}`
  - Provide `access` enum and `code` when using `Code` access. Server stores only hashed code (SHA256 hex).
  - Update endpoint restricted to organizer or Admin.

- `POST /api/karaoke/assign-player-to-party`
  - Body: `KaraokePartyPlayer` (PartyId, PlayerId). Audited.

## WebRTC client flow (recommended)

1. Establish SignalR connection with JWT (use `accessTokenFactory` in JS client):

```js
const connection = new signalR.HubConnectionBuilder()
  .withUrl('/hubs/karaoke', { accessTokenFactory: () => token })
  .withAutomaticReconnect()
  .build();
await connection.start();
```

2. Join lobby: `connection.invoke('JoinLobby', partyId, username)`.
3. To create a P2P call between two clients A and B:
   - A: create RTCPeerConnection, add local tracks, `createOffer()`, `setLocalDescription(offer)`, then `connection.invoke('SendOffer', targetConnectionId, offer)`.
   - B: receive `ReceiveOffer(fromId, offer)`, `setRemoteDescription(offer)`, `createAnswer()`, `setLocalDescription(answer)`, send `SendAnswer(fromId, answer)`.
   - Both exchange ICE candidates using `SendIceCandidate` and `ReceiveIceCandidate`.
4. For resiliency use `withAutomaticReconnect()` and re-join lobby and re-negotiate if peer connections are lost.

## Format expectations and samples

- JWT claims used by backend:
  - `id` (integer user id)
  - `username` (string)
  - roles (e.g. `Admin`)

- `Join party` HTTP body example:

```json
{ "code": "my-secret" }
```

- `KaraokeSinging` JSON (elements expected in `EndRound` results array):

```json
{
  "PlayerId": 42,
  "Score": 12345,
  "Hits": 100,
  "Misses": 2,
  "Good": 10,
  "Perfect": 20,
  "Combo": 50
}
```

## Redis notes

- To enable Redis set environment variable `REDIS_CONNECTION` (e.g. `localhost:6379` or `redis:6379,password=secret`).
- Server connects with retry/backoff; on success uses `RedisLobbyStore`. Otherwise falls back to `InMemoryLobbyStore`.
- Redis key pattern: `lobby:{partyId}` storing a hash of `connectionId -> username`.

## Recommendations for frontend

- Use the official SignalR JS client and include JWT via `accessTokenFactory`.
- Re-join lobby on reconnection and re-subscribe to events.
- Send plaintext `code` only when joining a code-protected party; server compares a SHA256 hash.
- For larger rooms, adopt an SFU; SignalR remains useful for control messages.
- Handle `Error` events from the server (e.g. unauthorized operations) and surface friendly messages.

## Troubleshooting

- If membership is inconsistent across servers, ensure `REDIS_CONNECTION` is configured and reachable by all API instances.
- If join returns 403, check party access type and supply the correct code if required.

## Where to look in backend code

- Hub: `AudioVerse.API/Hubs/KaraokeHub.cs`
- Lobby store: `AudioVerse.Infrastructure/Realtime/ILobbyStore.cs`, `InMemoryLobbyStore.cs`, `RedisLobbyStore.cs`
- Redis config and startup: `AudioVerse.API/Program.cs` (reads `REDIS_CONNECTION`).
- Party endpoints: `AudioVerse.API/Controllers/KaraokeController.cs`
- Repositories: `AudioVerse.Infrastructure/Repositories/*`


