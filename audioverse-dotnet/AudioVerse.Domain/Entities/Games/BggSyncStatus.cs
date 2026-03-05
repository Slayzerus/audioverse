namespace AudioVerse.Domain.Entities.Games;

/// <summary>
/// Tracks the state of a BGG catalog synchronization job.
/// </summary>
public class BggSyncStatus
{
    public int Id { get; set; }

    /// <summary>Current sync state.</summary>
    public BggSyncState State { get; set; } = BggSyncState.Idle;

    /// <summary>Total number of games to sync in this batch.</summary>
    public int TotalGames { get; set; }

    /// <summary>Number of games already synced.</summary>
    public int SyncedGames { get; set; }

    /// <summary>Number of games that failed during this sync.</summary>
    public int FailedGames { get; set; }

    /// <summary>BGG ID of the last successfully synced game (for resume).</summary>
    public int? LastSyncedBggId { get; set; }

    /// <summary>When the current sync started.</summary>
    public DateTime? StartedAtUtc { get; set; }

    /// <summary>When the sync finished (or was stopped).</summary>
    public DateTime? FinishedAtUtc { get; set; }

    /// <summary>When the catalog was last fully updated.</summary>
    public DateTime? LastFullSyncUtc { get; set; }

    /// <summary>Error message if sync failed.</summary>
    public string? ErrorMessage { get; set; }

    /// <summary>Estimated progress (0.0 – 1.0).</summary>
    public double Progress => TotalGames > 0 ? (double)SyncedGames / TotalGames : 0;
}
