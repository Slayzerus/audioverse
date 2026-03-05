using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.ExternalApis.Bgg;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Application.Services.Games;

/// <summary>
/// Interface for BGG catalog synchronization and cache-through search.
/// </summary>
public interface IBggSyncService
{
    /// <summary>Start a full BGG hot-games sync in background.</summary>
    Task StartFullSyncAsync(CancellationToken ct = default);

    /// <summary>Cancel a running sync.</summary>
    Task CancelSyncAsync();

    /// <summary>Get current sync status.</summary>
    Task<BggSyncStatus> GetSyncStatusAsync(CancellationToken ct = default);

    /// <summary>Search local DB first; if not found, fetch from BGG, save, and return.</summary>
    Task<List<BoardGame>> SearchWithCacheThroughAsync(string query, int limit = 20, CancellationToken ct = default);

    /// <summary>Export all BGG games from local DB as JSON.</summary>
    Task<List<BoardGame>> ExportCatalogAsync(CancellationToken ct = default);

    /// <summary>Import games from JSON into local DB (upsert by BggId).</summary>
    Task<int> ImportCatalogAsync(List<BoardGame> games, CancellationToken ct = default);
}
