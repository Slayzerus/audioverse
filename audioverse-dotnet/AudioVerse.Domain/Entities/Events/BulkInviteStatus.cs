namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Status of bulk invitation job.
/// </summary>
public enum BulkInviteStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Failed = 3
}
