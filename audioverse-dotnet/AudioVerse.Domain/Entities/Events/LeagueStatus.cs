namespace AudioVerse.Domain.Entities.Events;

/// <summary>Current status of a league.</summary>
public enum LeagueStatus
{
    Draft = 0,
    Registration = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4
}
