# AudioVerse Project Structure Reorganization

## Overview

This document describes the reorganization of AudioVerse project into a modular Area-based structure.

## Target Structure

```
AudioVerse.sln
?
??? AudioVerse.API/
?   ??? Areas/
?       ??? Identity/
?       ?   ??? Controllers/
?       ?   ??? Hubs/
?       ??? Karaoke/
?       ?   ??? Controllers/
?       ?   ??? Hubs/
?       ??? Events/
?       ?   ??? Controllers/
?       ??? Editor/
?       ?   ??? Controllers/
?       ??? Admin/
?       ?   ??? Controllers/
?       ?   ??? Hubs/
?       ??? DMX/
?       ?   ??? Controllers/
?       ??? Games/
?       ?   ??? Controllers/
?       ??? MediaLibrary/
?           ??? Controllers/
?
??? AudioVerse.Application/
?   ??? Areas/
?       ??? Identity/
?       ?   ??? Commands/
?       ?   ??? Queries/
?       ?   ??? Handlers/
?       ?   ??? Validators/
?       ?   ??? Services/
?       ?   ??? Models/
?       ?       ??? Dto/
?       ?       ??? Requests/
?       ?       ??? Results/
?       ??? Karaoke/
?       ?   ??? Commands/
?       ?   ??? Queries/
?       ?   ??? Handlers/
?       ?   ??? Validators/
?       ?   ??? Services/
?       ?   ??? Models/
?       ?       ??? Dto/
?       ?       ??? Requests/
?       ?       ??? Results/
?       ??? Events/
?       ?   ??? ... (same structure)
?       ??? Editor/
?       ?   ??? ...
?       ??? Admin/
?       ?   ??? ...
?       ??? DMX/
?       ?   ??? ...
?       ??? MediaLibrary/
?       ?   ??? Commands/
?       ?   ??? Queries/
?       ?   ??? Handlers/
?       ?   ??? Services/
?       ?   ?   ??? Platforms/
?       ?   ?   ?   ??? Spotify/
?       ?   ?   ?   ??? Tidal/
?       ?   ?   ?   ??? YouTube/
?       ?   ?   ??? SongInformations/
?       ?   ??? Models/
?       ?       ??? Dto/
?       ?       ??? Requests/
?       ?       ??? Results/
?       ?       ??? Platforms/
?       ?           ??? Spotify/
?       ?           ??? Tidal/
?       ?           ??? YouTube/
?       ??? Common/
?           ??? Services/
?           ??? Models/
?
??? AudioVerse.Domain/
?   ??? Areas/
?       ??? Identity/
?       ?   ??? Entities/
?       ?   ??? Enums/
?       ?   ??? Repositories/
?       ??? Karaoke/
?       ?   ??? Entities/
?       ?   ??? Enums/
?       ?   ??? Repositories/
?       ??? Events/
?       ?   ??? Entities/
?       ?   ??? Enums/
?       ?   ??? Repositories/
?       ??? Editor/
?       ?   ??? Entities/
?       ?   ??? Enums/
?       ??? Admin/
?       ?   ??? Entities/
?       ??? DMX/
?       ?   ??? Entities/
?       ?   ??? Enums/
?       ??? Games/
?       ?   ??? Entities/
?       ??? MediaLibrary/
?           ??? Entities/
?           ??? Enums/
?
??? AudioVerse.Infrastructure/
?   ??? Persistence/
?   ?   ??? AudioVerseDbContext.cs
?   ??? Areas/
?       ??? Identity/
?       ?   ??? Repositories/
?       ??? Karaoke/
?       ?   ??? Repositories/
?       ??? Events/
?       ?   ??? Repositories/
?       ??? Editor/
?       ?   ??? Repositories/
?       ??? DMX/
?       ?   ??? Services/
?       ??? MediaLibrary/
?       ?   ??? ExternalApis/
?       ??? Common/
?           ??? Storage/
?           ??? Email/
?           ??? RateLimiting/
?           ??? Realtime/
?           ??? Telemetry/
?           ??? Validation/
?
??? AudioVerse.Tests/
    ??? Areas/
        ??? Identity/
        ??? Karaoke/
        ??? ...
```

## Module Descriptions

| Module | Description | Key Components |
|--------|-------------|----------------|
| **Identity** | User authentication, authorization, profiles | UserProfile, Permissions, Invites, 2FA |
| **Karaoke** | Core karaoke functionality | Parties, Songs, Sessions, Rounds, Singing, Scoring |
| **Events** | Event management | Events, Polls, Billing, Schedule |
| **Editor** | Audio/video editing | Projects, Clips, Layers, Sections |
| **Admin** | Administration | System config, Audit logs, Moderation, User management |
| **DMX** | Lighting control | DMX hardware, Scenes, Channels |
| **Games** | Board/couch games | BoardGames, CouchGames integration |
| **MediaLibrary** | Music library | Songs, Artists, Albums, Platforms (Spotify/Tidal/YouTube) |
| **Common** | Shared utilities | Storage, Email, Rate limiting, Profanity filter |

## Namespace Convention

```
AudioVerse.{Layer}.Areas.{Module}.{Component}

Examples:
- AudioVerse.API.Areas.Karaoke.Controllers
- AudioVerse.Application.Areas.Karaoke.Commands
- AudioVerse.Application.Areas.Karaoke.Models.Dto
- AudioVerse.Domain.Areas.Karaoke.Entities
- AudioVerse.Infrastructure.Areas.Karaoke.Repositories
```

## Running Reorganization Scripts

### Option 1: Run all at once (recommended)

```powershell
cd audioverse-dotnet
powershell -ExecutionPolicy Bypass -File AudioVerse.API\scripts\reorganize-all.ps1

# Dry run first (preview changes):
powershell -ExecutionPolicy Bypass -File AudioVerse.API\scripts\reorganize-all.ps1 -DryRun
```

### Option 2: Run individually

```powershell
# 1. Domain (run first)
cd AudioVerse.Domain
powershell -ExecutionPolicy Bypass -File scripts\reorganize-domain.ps1

# 2. Application
cd AudioVerse.Application
powershell -ExecutionPolicy Bypass -File scripts\reorganize-application.ps1

# 3. Infrastructure
cd AudioVerse.Infrastructure
powershell -ExecutionPolicy Bypass -File scripts\reorganize-infrastructure.ps1

# 4. API (run last)
cd AudioVerse.API
powershell -ExecutionPolicy Bypass -File scripts\reorganize-project.ps1
```

## Post-Reorganization Steps

### 1. Build and fix errors

```bash
dotnet build
```

### 2. Sync Namespaces (Visual Studio)

- Right-click on Solution ? **Sync Namespaces**
- Or use ReSharper/Rider: **Adjust Namespaces**

### 3. Update using statements

Many files will need updated `using` statements. Common patterns:

```csharp
// Before
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Entities.Karaoke;

// After
using AudioVerse.Application.Areas.Karaoke.Commands;
using AudioVerse.Domain.Areas.Karaoke.Entities;
```

### 4. Update DependencyInjection.cs

Update service registrations to use new namespaces.

### 5. Update DbContext

Entity configurations may need namespace updates.

### 6. Run tests

```bash
dotnet test
```

### 7. Commit

```bash
git add -A
git commit -m "Reorganized project into modular Area structure"
```

## Model Organization

Models are organized into three categories:

| Category | Suffix/Location | Purpose |
|----------|-----------------|---------|
| **Dto** | `*Dto.cs`, `Models/Dto/` | Data transfer objects returned from queries |
| **Requests** | `*Request.cs`, `Models/Requests/` | Input models for commands |
| **Results** | `*Result.cs`, `*Response.cs`, `Models/Results/` | Output models from commands/services |

## Migration Checklist

- [ ] Backup or commit current state
- [ ] Run reorganization scripts
- [ ] Build solution
- [ ] Sync namespaces
- [ ] Fix using statements
- [ ] Update DI registrations
- [ ] Update DbContext if needed
- [ ] Run all tests
- [ ] Manual testing
- [ ] Commit changes
