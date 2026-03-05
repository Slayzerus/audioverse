Karaoke timeline hub handoff

Summary

This package contains client-side changes to synchronize karaoke timelines across party members, plus a suggested SignalR hub spec. Deliver these to backend devs to implement server-side relaying and clock sync.

Files to review

- `documentation/KARAOKE_TIMELINE_HUB.md` — detailed hub API, C# stub, and DTOs.
- `src/components/controls/karaoke/KaraokeManager.tsx` — client batching, quantization, and publish/subscribe logic.
- `src/services/rtcService.ts` — added `publishTimelineUpdate`, `onTimelineUpdate`, `getServerTime`, `computeClockOffset` helpers.

Key points for backend implementers

1) Methods/events to add in KaraokeHub (SignalR):
   - RPC: `Task PublishTimelineUpdate(TimelineUpdateDto payload)` — accept payload, validate, and broadcast.
   - RPC: `Task<string> GetServerTime()` — return server UTC timestamp (ISO) for client clock sync.
   - Event: `ReceiveTimelineUpdate` — broadcast to party members with payload `{ playerId, points, serverTimeUtc, seq?, senderConnectionId? }`.

2) Payload details:
   - Clients may send `quantized: true` with points as `{ t: number, hz: number }` where `t` is rounded to milliseconds (seconds with 3 decimals) and `hz` is integer.
   - Server should accept either quantized or full-precision points.

3) Time alignment:
   - Server SHOULD include `serverTimeUtc` in broadcasts.
   - Optionally, implement groups per-party (e.g., `party-{id}`) and use `Clients.OthersInGroup` to avoid echo.

4) Performance and safety:
   - Enforce per-connection rate and size limits (e.g., max 5 calls/sec, max 500 points/call).
   - Validate `playerId` belongs to the caller's user.

Suggested message to backend team (copy-paste)

"Hi — I've implemented client-side timeline sync for Karaoke and added a hub spec: `documentation/KARAOKE_TIMELINE_HUB.md`. Please add `PublishTimelineUpdate` and `GetServerTime` RPCs to the Karaoke SignalR hub, and broadcast `ReceiveTimelineUpdate` to party members (include `serverTimeUtc`). Clients will send quantized batches (max ~120 points, time rounded to ms). Let me know if you want the hub to accept compressed delta format; currently clients send quantized full arrays for compatibility."

Optional follow-ups

- If you want even lower bandwidth, we can switch to delta-encoded compressed arrays (base64) and provide a decoder example.
- I can prepare a small server PR (C#) with the hub skeleton and basic validation.
