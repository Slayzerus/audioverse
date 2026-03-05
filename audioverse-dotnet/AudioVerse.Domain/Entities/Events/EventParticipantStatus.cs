namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Attendance status for an event participant (user-level, not player-level).
/// </summary>
public enum EventParticipantStatus
{
    /// <summary>User signed up (RSVP) but has not arrived yet.</summary>
    Registered = 0,

    /// <summary>User arrived and is waiting for bouncer check-in.</summary>
    Waiting = 1,

    /// <summary>Bouncer is currently validating the participant.</summary>
    Validation = 2,

    /// <summary>Participant admitted inside the event.</summary>
    Inside = 3,

    /// <summary>Participant is outside (rejected or stepped out).</summary>
    Outside = 4,

    /// <summary>Participant has left the event.</summary>
    Left = 5,

    /// <summary>Participation cancelled by user.</summary>
    Cancelled = 6
}
