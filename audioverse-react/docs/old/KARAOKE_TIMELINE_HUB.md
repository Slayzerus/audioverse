SignalR Hub spec: Karaoke timeline synchronization

Overview

This document describes the minimal server-side SignalR hub API and client DTOs needed to synchronize per-player karaoke timeline / pitch points in real time.

Goals

- Allow clients to publish small batches of pitch/timestamp points.
- Server validates and broadcasts updates to other party members.
- Include an optional server timestamp or sequence number for time alignment and deduplication.

Client -> Server: RPC

Method: PublishTimelineUpdate
Signature: Task PublishTimelineUpdate(TimelineUpdateDto payload)
Payload (TimelineUpdateDto):
- int PartyId (optional if hub already has group context)
- int PlayerId
- TimelinePointDto[] Points
- long? Seq (optional sequence number from client)

TimelinePointDto:
- double T  // song-relative time in seconds as measured by client when point was captured
- double Hz // frequency in Hz

Compression (recommended client-side):
- Clients MAY downsample and quantize points to reduce bandwidth.
- Example: limit to 100-200 recent points, quantize time to milliseconds (3 decimals) and frequency to integer Hz.
- Suggested payload field: `quantized: true` when points are sent in quantized form.
- Server SHOULD accept both full-precision and quantized payloads.

Additional optional RPC: GetServerTime
Signature: Task<string> GetServerTime()
Behavior: return server UTC timestamp (ISO, e.g. DateTime.UtcNow.ToString("o")) to allow clients to perform a clock sync measurement.

Behavior:
- Authenticate/authorize caller.
- Rate-limit and size-check payloads (e.g. max 500 points per call, max 5 calls/sec).
- Optionally sanitize timestamps (clamp, drop duplicates/outliers).
- Broadcast to party group: call Clients.Group(partyGroup).SendAsync("ReceiveTimelineUpdate", serverPayload)
- Server may exclude the sender from recipients (Clients.OthersInGroup) to avoid echo.

Server -> Client: Event

Event: ReceiveTimelineUpdate
Payload (ServerTimelineUpdateDto):
- int PlayerId
- TimelinePointDto[] Points
- string? ServerTimeUtc  // ISO timestamp when server received/broadcast the packet
- long? Seq  // if provided by client, echo for dedup/ordering
- string? SenderConnectionId  // optional for debugging/dedup

C# SignalR Hub Stub (example)

```csharp
public class KaraokeHub : Hub
{
    public async Task PublishTimelineUpdate(TimelineUpdateDto payload)
    {
        // Basic validation
        if (payload == null || payload.Points == null || payload.Points.Length == 0) return;

        var partyId = payload.PartyId;
        // TODO: check membership/authorization

        // TODO: rate-limit / size-limit

        var serverPayload = new ServerTimelineUpdateDto
        {
            PlayerId = payload.PlayerId,
            Points = payload.Points,
            ServerTimeUtc = DateTime.UtcNow.ToString("o"),
            Seq = payload.Seq,
            SenderConnectionId = Context.ConnectionId
        };

        // Broadcast to party group (exclude sender if desired)
        await Clients.OthersInGroup(GetPartyGroupName(partyId)).SendAsync("ReceiveTimelineUpdate", serverPayload);
    }

    private string GetPartyGroupName(int partyId) => $"party-{partyId}";
}
```

TypeScript client DTOs (example)

```ts
export interface TimelinePointDto { t: number; hz: number }
export interface TimelineUpdateDto { partyId?: number; playerId: number; points: TimelinePointDto[]; seq?: number }
export interface ServerTimelineUpdateDto { playerId: number; points: TimelinePointDto[]; serverTimeUtc?: string; seq?: number; senderConnectionId?: string }
```

Time alignment recommendations

- Clients should include their local capture time in `t` relative to song playback (song position in seconds). This is already used in client code.
- Server includes `ServerTimeUtc` to help clients compute clock offset if needed.
- For robust alignment across clients, implement a lightweight clock-sync exchange on connect (client requests server time, server responds), or include serverTime on every broadcast.

Scaling and robustness

- Enforce per-connection throttling.
- Optionally aggregate/compress points server-side and broadcast lower-rate aggregates.
- Consider accepting downsampled / quantized points if bandwidth is a concern.

Security

- Authenticate hub calls. Ensure only authorized party members can publish or receive updates.
- Validate `playerId` belongs to the caller (prevent spoofing).

Additional implementation details (recommended)

1) Group context / party identification

- Preferred: maintain party membership server-side via existing lobby/group APIs. When a client joins a party they should be added to the SignalR group `party-{partyId}` (server-side). In that case `PublishTimelineUpdate` does not need `partyId` in every payload and the hub can infer it from Context.Items or the user's current group membership.
- Alternative: if groups are not used, require `partyId` in `TimelineUpdateDto` and validate the caller is a member of that party.

2) Authorization & validation steps (server-side)

- Authenticate the connection (JWT/cookie) and map the connection to a userId.
- Verify the caller is a member of the target party (if partyId provided) or is attached to a party group.
- Verify `playerId` is owned by the caller (the user is allowed to publish for that `playerId`). Reject attempts to publish for other players with a `HubException` (or an appropriate error payload).
- Validate payload shape and types before processing (points count, numeric ranges for `t` and `hz`).

3) Limits, throttling and backpressure

- Example recommended limits (tunable):
    - `MAX_POINTS_PER_CALL = 500` (hard upper bound)
    - `RECOMMENDED_POINTS_PER_CALL = 120` (client should aim for this)
    - `MAX_CALLS_PER_SECOND_PER_CONNECTION = 5` (hard guard)
    - `RECOMMENDED_CALLS_PER_SECOND = 2-3` (client should target)
- Server behaviour when limit exceeded:
    - Reject the call with a `HubException` containing an error code such as `TooManyPoints` or `RateLimitExceeded` and a short human-friendly message.
    - Optionally drop oldest points silently and accept a smaller payload, but always log/throttle and emit a metric.

4) Echoes, deduplication and sequencing

- Clients MAY include an optional monotonically-increasing `seq` number per-client to help the server and other clients detect duplicates or out-of-order packets.
- Server SHOULD avoid echoing a packet back to the sender (use `Clients.OthersInGroup`) unless echo is desired for state confirmation.
- When broadcasting, server SHOULD include `serverTimeUtc` (ISO) and echo `seq` if present.
- Client deduplication strategy: ignore points with identical timestamps already present or maintain a small per-player recent-window hash/seq buffer to drop duplicates.

5) JSON payload examples

Full-precision payload (no quantization):

```json
{
    "partyId": 42,
    "playerId": 7,
    "points": [ { "t": 12.345678, "hz": 196.45 }, { "t": 12.364345, "hz": 198.12 } ],
    "seq": 1234
}
```

Quantized payload (recommended in production):

```json
{
    "partyId": 42,
    "playerId": 7,
    "points": [ { "t": 12.345, "hz": 196 }, { "t": 12.364, "hz": 198 } ],
    "quantized": true,
    "seq": 1234
}
```

Server-broadcast example (`ReceiveTimelineUpdate`):

```json
{
    "playerId": 7,
    "points": [ { "t": 12.345, "hz": 196 }, { "t": 12.364, "hz": 198 } ],
    "serverTimeUtc": "2026-02-11T12:34:56.789Z",
    "seq": 1234,
    "senderConnectionId": "abc-conn-123"
}
```

6) Error handling / Hub responses

- Prefer `HubException` with a small machine-friendly `errorCode` and `message`.
- Example server errors:
    - `BadRequest` — malformed payload
    - `Unauthorized` — not authenticated or missing permission
    - `Forbidden` — not member of the party
    - `RateLimitExceeded` — exceeded calls/sec
    - `TooManyPoints` — payload too large

Server example (C#) returning structured error:

```csharp
if (!IsMember(callerUserId, payload.PartyId))
        throw new HubException("Forbidden: not a member of the party");

if (payload.Points.Length > MAX_POINTS_PER_CALL)
        throw new HubException("TooManyPoints: reduce points per call");
```

7) Clock-sync and client usage example

- Implement: `Task<string> GetServerTime()` returning ISO UTC.
- Client-side recommended usage (already implemented client-side): execute N quick probes, measure RTT and compute `offset = (serverTime + rtt/2) - clientReceiveTime`. Use the sample with smallest RTT as best estimate. Refresh every 10–30s.

Minimal C# stub for `GetServerTime`:

```csharp
public Task<string> GetServerTime() => Task.FromResult(DateTime.UtcNow.ToString("o"));
```

8) Monitoring, logging and metrics

- Log and expose metrics for:
    - `timeline_packets_received` (count)
    - `timeline_points_received` (sum)
    - `timeline_packets_dropped` (count) and reasons (rate, size)
    - per-party / per-connection rate-limit hits
- Emit warnings when individual connection's average latency is high or when payload sizes are consistently large.

9) Production and security notes

- Always run hub over TLS (wss) and authenticate connections.
- Validate `playerId` ownership server-side — do not trust client-supplied player identifiers without verification.
- Limit memory used per-connection for buffering; cap at a reasonable size and drop older data when exceeded.

10) Suggested incremental rollout plan

- Phase 1: Implement `PublishTimelineUpdate`, `GetServerTime`, broadcast `ReceiveTimelineUpdate` to OthersInGroup, basic validation and hard limits. Log metrics.
- Phase 2: Add rate-limiting, better validation, and monitoring alerts.
- Phase 3: Optionally add server-side aggregation/compression for large parties.

If you want, I can also provide a ready-to-apply C# PR that implements the hub with validation, rate-limiting scaffolding and example unit tests. 


