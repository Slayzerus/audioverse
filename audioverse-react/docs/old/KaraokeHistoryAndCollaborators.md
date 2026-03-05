# Karaoke: History & Collaborators — Frontend integration notes

This document summarizes the frontend expectations and backend contract for the karaoke song versioning (snapshots) and collaborator management features.

## Endpoints (frontend expectations)

Base: `/api/karaoke`

- Search users
  - GET `/api/karaoke/users/search?term={term}`
  - Response: `200` JSON array of `{ Id: number, UserName: string, Email: string }`
  - Term must be at least 3 characters.

- Collaborators
  - GET `/api/karaoke/songs/{songId}/collaborators`
    - Response: `200` JSON array of collaborator `UserId` numbers.
  - POST `/api/karaoke/songs/{songId}/collaborators` (body `{ userId, permission }`)
    - Adds a collaborator. `permission` may be an enum name (e.g. `"Manage"`) or numeric enum.
  - DELETE `/api/karaoke/songs/{songId}/collaborators/{userId}`
    - Removes a collaborator.
  - PUT `/api/karaoke/songs/{songId}/collaborators/{userId}` (body: `permission`)
    - Update collaborator permission. Accepts enum name or numeric value.

- Collaborator permission query (optional but recommended)
  - GET `/api/karaoke/songs/{songId}/collaborators/{userId}/permission`
  - Response: `200` with `"Read"|"Write"|"Manage"` or numeric enum value.

- Versions (snapshots)
  - GET `/api/karaoke/songs/{songId}/versions` — list metadata (Version, ChangedAt, ChangedByUserId, Reason)
  - GET `/api/karaoke/songs/{songId}/versions/{version}` — snapshot JSON (DataJson)
  - POST `/api/karaoke/songs/{songId}/versions/{version}/revert` — optional body: reason (string)
    - Revert operation should create a new snapshot (incrementing version) and replace the song state atomically.

- Song create/update (editor save)
  - POST `/api/karaoke/songs` — create song, body: `KaraokeSongFile` (or partial)
  - PUT `/api/karaoke/songs/{songId}` — update existing song
  - Responses should include the song's `id`, `ownerId` and `canBeModifiedByAll` so frontend can enable ACL UI.

## Model expectations (subset)

`KaraokeSongFile` should expose at least:
- `id`
- `title`, `artist`, `notes` (snapshot content)
- `ownerId` (nullable)
- `canBeModifiedByAll` (nullable boolean)

Collaborator `Permission` enum values should be stable (either string names or numeric mapping).

## Migration commands (EF Core)

Run these in the API project to add the new tables and fields:

```powershell
cd path\to\AudioVerse.API
dotnet ef migrations add KaraokeHistoryAndCollaborators -p AudioVerse.API -s AudioVerse.API
dotnet ef database update -p AudioVerse.API -s AudioVerse.API
```

## Frontend notes

- Editor: when a song is created (parse+save) the server should return `id` so the editor can enable History & Collaborators UI.
- ACL: frontend enforces the following rules for management actions (UI-only; server must still validate):
  - Admin (`IsAdmin`) — full access.
  - Owner (`ownerId === currentUser.userId`) — full access.
  - Collaborator with `Permission === Manage` — access to history revert and collaborator management.
  - `canBeModifiedByAll === true` — grants manage-like access for common operations.

- Revert: client posts a textual reason; server should validate permissions and perform the revert atomically.

## Suggested backend validations

- Validate that only owners/admins/collaborator.Manage can call sensitive endpoints.
- Create initial snapshot on song create (version=1).
- Revert should write a new snapshot and update song atomically.

---

If you want, I can also generate a Postman collection or OpenAPI snippet for these routes to accelerate backend integration and manual testing.
