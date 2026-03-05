# Backend Changes Needed — KaraokeHub.cs

**File:** `AudioVerse.API/Areas/Karaoke/Hubs/KaraokeHub.cs`

## Problem

Frontend joins the SignalR lobby with channel `"participants"`, but `PublishTimelineUpdate` checks membership only in channel `null` (→ `"default"`). Additionally, broadcasting uses a SignalR group (`"event-{id}"`) that nobody is ever added to.

---

## Fix 1: Membership check — use `_connectionMemberships` instead of hardcoded null channel

**Line 252** — current code:

```csharp
var members = await _lobbyStore.GetMembersAsync(eventId, null);
var isMember = members.Any(m => m.ConnectionId == Context.ConnectionId);
if (!isMember)
    throw new HubException("Forbidden: not a member of the party");
```

**Replace with:**

```csharp
var isMember = _connectionMemberships.TryGetValue(Context.ConnectionId, out var mems)
    && mems.Keys.Any(k => k.StartsWith($"{eventId}:"));
if (!isMember)
    throw new HubException("Forbidden: not a member of the party");
```

**Why:** `_connectionMemberships` already tracks all `"{eventId}:{channel}"` entries per connection (set in `JoinLobby` at line 131). This correctly finds the user regardless of which channel they joined.

---

## Fix 2: Add connection to broadcast group on join

**Line 121** (`JoinLobby` method) — current code:

```csharp
var group = GroupFor(eventId, channel);
await _lobbyStore.AddMemberAsync(eventId, Context.ConnectionId, username, channel);
await Groups.AddToGroupAsync(Context.ConnectionId, group);
```

**Add after the existing `AddToGroupAsync`:**

```csharp
// Also join the main event broadcast group used by PublishTimelineUpdate,
// RoundStarted, RoundEnded, ScoreboardUpdated, EventStatusUpdated etc.
await Groups.AddToGroupAsync(Context.ConnectionId, GroupNameFor(eventId));
```

**Why:** Multiple methods broadcast to `GroupNameFor(eventId)` = `"event-{id}"` (lines 281, 287, 304, 312, 374), but `JoinLobby` only adds to `GroupFor(eventId, channel)` = `"event:{id}:lobby:{channel}"`. These are different groups. Without this fix, `ReceiveTimelineUpdate` and other broadcasts go to an empty group.

---

## Fix 3: Remove from broadcast group on disconnect

**Line 396** (`OnDisconnectedAsync`, inside the `foreach` cleanup loop) — current code:

```csharp
await _lobbyStore.RemoveMemberAsync(eventId, Context.ConnectionId, channel);
await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
```

**Add after the existing `RemoveFromGroupAsync`:**

```csharp
await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupNameFor(eventId));
```

**Why:** Symmetry with Fix 2 — clean up the broadcast group membership on disconnect.

---

## Frontend Workaround (removed)

The temporary double-join workaround has been removed now that backend fixes are deployed.
All three fixes above are live.
