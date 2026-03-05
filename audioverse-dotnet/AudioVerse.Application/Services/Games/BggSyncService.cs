using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.ExternalApis.Bgg;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Application.Services.Games;

/// <summary>
/// BGG sync service — handles full sync (with 5s rate-limit), cache-through search,
/// and export/import of the local game catalog.
/// </summary>
public class BggSyncService(
    IServiceScopeFactory scopeFactory,
    ILogger<BggSyncService> logger) : IBggSyncService
{
    private CancellationTokenSource? _syncCts;
    private Task? _runningSync;

    public async Task StartFullSyncAsync(CancellationToken ct = default)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IGameRepository>();
        var status = await repo.GetBggSyncStatusAsync();

        if (status.State == BggSyncState.Running)
        {
            logger.LogWarning("BGG sync already running, ignoring request");
            return;
        }

        _syncCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        _runningSync = Task.Run(() => RunFullSyncAsync(_syncCts.Token), _syncCts.Token);
    }

    public async Task CancelSyncAsync()
    {
        if (_syncCts != null)
        {
            await _syncCts.CancelAsync();
            logger.LogInformation("BGG sync cancellation requested");

            using var scope = scopeFactory.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IGameRepository>();
            var status = await repo.GetBggSyncStatusAsync();
            status.State = BggSyncState.Cancelled;
            status.FinishedAtUtc = DateTime.UtcNow;
            await repo.UpdateBggSyncStatusAsync(status);
        }
    }

    public async Task<BggSyncStatus> GetSyncStatusAsync(CancellationToken ct = default)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IGameRepository>();
        return await repo.GetBggSyncStatusAsync();
    }

    public async Task<List<BoardGame>> SearchWithCacheThroughAsync(string query, int limit = 20, CancellationToken ct = default)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IGameRepository>();
        var bggClient = scope.ServiceProvider.GetRequiredService<IBggClient>();

        // 1. Search local DB first
        var local = (await repo.SearchBoardGamesAsync(query, limit)).ToList();
        if (local.Count >= limit)
            return local;

        // 2. Not enough results → search BGG
        try
        {
            var bggResults = await bggClient.SearchAsync(query, ct);
            var newBggIds = bggResults
                .Select(r => r.BggId)
                .Where(id => !local.Any(l => l.BggId == id))
                .Take(Math.Min(20, limit - local.Count))
                .ToList();

            if (newBggIds.Count > 0)
            {
                // 3. Fetch details in batches of 20 (BGG limit)
                var details = await bggClient.GetDetailsBatchAsync(newBggIds, ct);
                var newGames = details.Select(MapBggDetailsToBoardGame).ToList();

                // 4. Save to local DB
                await repo.UpsertBoardGamesFromBggAsync(newGames);
                logger.LogInformation("Cache-through: fetched {Count} games from BGG for query '{Query}'", newGames.Count, query);

                // 5. Re-search local DB to get saved entities with IDs
                local = (await repo.SearchBoardGamesAsync(query, limit)).ToList();
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "BGG search failed for '{Query}', returning local results only", query);
        }

        return local;
    }

    public async Task<List<BoardGame>> ExportCatalogAsync(CancellationToken ct = default)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IGameRepository>();
        return await repo.GetAllBggBoardGamesAsync();
    }

    public async Task<int> ImportCatalogAsync(List<BoardGame> games, CancellationToken ct = default)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IGameRepository>();
        var count = await repo.UpsertBoardGamesFromBggAsync(games);
        logger.LogInformation("Imported {Count} BGG games from catalog file", count);
        return count;
    }

    private async Task RunFullSyncAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IGameRepository>();
        var bggClient = scope.ServiceProvider.GetRequiredService<IBggClient>();
        var status = await repo.GetBggSyncStatusAsync();

        status.State = BggSyncState.Running;
        status.StartedAtUtc = DateTime.UtcNow;
        status.FinishedAtUtc = null;
        status.SyncedGames = 0;
        status.FailedGames = 0;
        status.ErrorMessage = null;
        await repo.UpdateBggSyncStatusAsync(status);

        try
        {
            // Step 1: Fetch hot games list to get a starting set of IDs
            logger.LogInformation("BGG sync: fetching hot games list...");
            var hotGames = await bggClient.GetHotGamesAsync(ct);
            var bggIds = hotGames.Select(h => h.BggId).ToList();

            // Step 2: Also sync existing games that need refreshing (older than 7 days)
            var existingGames = await repo.GetAllBggBoardGamesAsync();
            var staleIds = existingGames
                .Where(g => g.BggId.HasValue && (!g.BggLastSyncUtc.HasValue || g.BggLastSyncUtc < DateTime.UtcNow.AddDays(-7)))
                .Select(g => g.BggId!.Value)
                .ToList();

            var allIds = bggIds.Union(staleIds).Distinct().ToList();
            status.TotalGames = allIds.Count;
            await repo.UpdateBggSyncStatusAsync(status);

            logger.LogInformation("BGG sync: {Total} games to sync ({Hot} hot + {Stale} stale)", allIds.Count, bggIds.Count, staleIds.Count);

            // Step 3: Fetch in batches of 20 with 5s delay between requests
            const int batchSize = 20;
            for (int i = 0; i < allIds.Count; i += batchSize)
            {
                ct.ThrowIfCancellationRequested();

                var batch = allIds.Skip(i).Take(batchSize).ToList();
                try
                {
                    var details = await bggClient.GetDetailsBatchAsync(batch, ct);
                    var games = details.Select(MapBggDetailsToBoardGame).ToList();
                    await repo.UpsertBoardGamesFromBggAsync(games);

                    status.SyncedGames += games.Count;
                    status.LastSyncedBggId = batch.Last();
                    await repo.UpdateBggSyncStatusAsync(status);

                    logger.LogDebug("BGG sync: batch {Batch}/{Total} done ({Synced} synced)",
                        i / batchSize + 1, (allIds.Count + batchSize - 1) / batchSize, status.SyncedGames);
                }
                catch (OperationCanceledException) { throw; }
                catch (Exception ex)
                {
                    status.FailedGames += batch.Count;
                    logger.LogWarning(ex, "BGG sync: batch starting at index {Index} failed", i);
                }

                // Rate limit: 5 seconds between requests
                if (i + batchSize < allIds.Count)
                    await Task.Delay(TimeSpan.FromSeconds(5), ct);
            }

            status.State = BggSyncState.Completed;
            status.FinishedAtUtc = DateTime.UtcNow;
            status.LastFullSyncUtc = DateTime.UtcNow;
            logger.LogInformation("BGG sync completed: {Synced} synced, {Failed} failed",
                status.SyncedGames, status.FailedGames);
        }
        catch (OperationCanceledException)
        {
            status.State = BggSyncState.Cancelled;
            status.FinishedAtUtc = DateTime.UtcNow;
            logger.LogInformation("BGG sync cancelled after {Synced} games", status.SyncedGames);
        }
        catch (Exception ex)
        {
            status.State = BggSyncState.Failed;
            status.FinishedAtUtc = DateTime.UtcNow;
            status.ErrorMessage = ex.Message;
            logger.LogError(ex, "BGG sync failed");
        }

        await repo.UpdateBggSyncStatusAsync(status);
    }

    private static BoardGame MapBggDetailsToBoardGame(BggGameDetails d) => new()
    {
        BggId = d.BggId,
        Name = d.Name,
        Description = d.Description?.Length > 2000 ? d.Description[..2000] : d.Description,
        MinPlayers = d.MinPlayers,
        MaxPlayers = d.MaxPlayers,
        EstimatedDurationMinutes = d.PlayingTimeMinutes,
        BggImageUrl = d.ImageUrl,
        BggThumbnailUrl = d.ThumbnailUrl,
        BggRating = d.AverageRating,
        BggYearPublished = d.YearPublished,
        BggWeight = d.Weight,
        BggRank = d.Rank,
        BggUsersRated = d.UsersRated,
        BggMinAge = d.MinAge,
        BggCategories = d.Categories.Count > 0 ? string.Join(",", d.Categories) : null,
        BggMechanics = d.Mechanics.Count > 0 ? string.Join(",", d.Mechanics) : null,
        BggDesigners = d.Designers.Count > 0 ? string.Join(",", d.Designers) : null,
        BggPublishers = d.Publishers.Count > 0 ? string.Join(",", d.Publishers) : null,
        BggLastSyncUtc = DateTime.UtcNow,
        IsFullBggData = true
    };
}
