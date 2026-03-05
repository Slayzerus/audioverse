# Backend API: Karaoke Round Players

This document describes the backend endpoints, DTOs and example server-side stubs needed to support the frontend round-player assignment UI (`RoundPlayersModal`). It implements the new domain entity `KaraokeRoundPlayer` and three REST endpoints used by the frontend:

- `POST  /api/karaoke/rounds/{roundId}/players` — add a player assignment to a round
- `GET   /api/karaoke/rounds/{roundId}/players` — list assignments for a round
- `DELETE /api/karaoke/rounds/{roundId}/players/{id}` — remove an assignment

The frontend currently performs create-with-slot + delete flow for slot updates (no PATCH required), and supports both "waiting" (slot == null) and "approved" (slot != null) assignments.

---

## Domain model

Table `KaraokeRoundPlayers` (example columns):

- `Id` BIGINT PK (identity)
- `RoundId` INT NOT NULL
- `PlayerId` INT NOT NULL  -- references `UserProfilePlayers.Id`
- `Slot` INT NULL
- `JoinedAt` DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()

Indexes:
- PK(Id)
- IDX_RoundId (RoundId)
- IDX_Round_Player (RoundId, PlayerId)

Optional: `Status` enum later (None, Waiting, Validation, Inside, Outside, Left) — frontend will handle UI statuses; backend acceptance TBD.

---

## DTOs

AddRoundPlayerRequest (POST payload)

{
  "playerId": 123,
  "slot": 1 // optional
}

Server response (201 / 200):

{
  "success": true,
  "id": 789
}

RoundPlayerDto (returned by GET):

{
  "id": 789,
  "roundId": 456,
  "playerId": 123,
  "slot": 1,
  "joinedAt": "2026-02-11T12:34:56.789Z",
  "player": { /* optional embedded UserProfilePlayer object (id, name, profileId, ... ) */ }
}

---

## Endpoint behaviour and rules

- Authentication required (JWT/cookie). Use existing karaoke controller auth scheme.
- Authorization: the caller must own the `playerId` (compare `UserProfilePlayer.ProfileId` to authenticated user's profile id) OR have admin/organizer rights (optional config). Return `403` for forbidden.
- Validation: reject unknown `playerId` (400) and invalid `slot` ranges (400).
- Duplicate prevention: if an identical assignment exists (same roundId + playerId + slot), return success with existing id or a 409 depending on policy.
- Concurrency: lightweight row-level unique constraint not required, but recommended to avoid duplicates.
- When deleting, return 200/204 on success, 404 if not found.
- GET should return assignments sorted by `slot` (NULLs last) and include embedded `player` object when available.

Rate limits and caps (recommended):

- MAX_ASSIGNMENTS_PER_ROUND = 500
- Calls per second per connection: 5

---

## C# Controller stub (ASP.NET Core)

Drop-in example controller and DTOs. Adjust namespaces and DI registration to your project.

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

[ApiController]
[Route("api/karaoke/rounds/{roundId:int}/players")]
[Authorize]
public class KaraokeRoundPlayersController : ControllerBase
{
    private readonly IRoundPlayerRepository _repo;
    private readonly IUserProfileService _profileService; // to validate ownership

    public KaraokeRoundPlayersController(IRoundPlayerRepository repo, IUserProfileService profileService)
    {
        _repo = repo;
        _profileService = profileService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoundPlayers(int roundId)
    {
        var list = await _repo.GetRoundPlayersAsync(roundId);
        return Ok(list);
    }

    public class AddRoundPlayerRequest { public int PlayerId { get; set; } public int? Slot { get; set; } }

    [HttpPost]
    public async Task<IActionResult> AddRoundPlayer(int roundId, [FromBody] AddRoundPlayerRequest req)
    {
        if (req == null) return BadRequest();
        // validate player exists & ownership
        var userId = User.GetUserId(); // helper extension
        var profileOk = await _profileService.IsOwnerOfProfilePlayerAsync(userId, req.PlayerId);
        if (!profileOk && !User.IsInRole("Admin")) return Forbid();

        // validate limits
        var count = await _repo.CountRoundPlayersAsync(roundId);
        if (count > 1000) return BadRequest("Too many assignments");

        var id = await _repo.AddRoundPlayerAsync(new KaraokeRoundPlayer { RoundId = roundId, PlayerId = req.PlayerId, Slot = req.Slot });
        return Ok(new { success = true, id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRoundPlayer(int roundId, int id)
    {
        var existed = await _repo.DeleteRoundPlayerAsync(id);
        if (!existed) return NotFound();
        return NoContent();
    }
}
```

Repository interface (example)

```csharp
public interface IRoundPlayerRepository
{
    Task<int> AddRoundPlayerAsync(KaraokeRoundPlayer entity);
    Task<bool> DeleteRoundPlayerAsync(int id);
    Task<IEnumerable<KaraokeRoundPlayerDto>> GetRoundPlayersAsync(int roundId);
    Task<int> CountRoundPlayersAsync(int roundId);
}
```

Domain entity / DTO (example)

```csharp
public class KaraokeRoundPlayer { public int Id {get;set;} public int RoundId {get;set;} public int PlayerId {get;set;} public int? Slot {get;set;} public DateTimeOffset JoinedAt {get;set;} }
public class KaraokeRoundPlayerDto { public int Id {get;set;} public int RoundId {get;set;} public int PlayerId {get;set;} public int? Slot {get;set;} public DateTimeOffset JoinedAt {get;set;} public UserProfilePlayerDto Player {get;set;} }
```

---

## Migration (SQL example)

```sql
CREATE TABLE KaraokeRoundPlayers (
  Id BIGINT IDENTITY PRIMARY KEY,
  RoundId INT NOT NULL,
  PlayerId INT NOT NULL,
  Slot INT NULL,
  JoinedAt DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IDX_KRP_Round ON KaraokeRoundPlayers(RoundId);
CREATE INDEX IDX_KRP_RoundPlayer ON KaraokeRoundPlayers(RoundId, PlayerId);
```

---

## Notes for backend implementer

- Return embedded `player` (UserProfilePlayer) in GET for the frontend to show `player.name` without extra calls.
- On POST, return created record id; the frontend stores it to later call DELETE with the assignment id.
- Keep POST id stable (return created id) for deletion.
- If you add PATCH later, frontend code can be simplified (no create+delete pattern).

If you want I can also prepare a ready-to-apply C# PR with EF migration, repository implementations (Dapper + EF examples), controller, DTOs and unit tests.
