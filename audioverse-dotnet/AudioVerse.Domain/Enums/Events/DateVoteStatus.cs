namespace AudioVerse.Domain.Enums.Events;

/// <summary>
/// Participant availability for a proposed event date.
/// </summary>
public enum DateVoteStatus
{
    Available = 0,
    Maybe = 1,
    Unavailable = 2
}
