namespace AudioVerse.Domain.Entities.Games;

/// <summary>State of BGG sync job.</summary>
public enum BggSyncState
{
    Idle = 0,
    Running = 1,
    Paused = 2,
    Completed = 3,
    Failed = 4,
    Cancelled = 5
}
