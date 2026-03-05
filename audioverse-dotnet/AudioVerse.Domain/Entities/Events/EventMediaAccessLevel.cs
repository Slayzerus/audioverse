namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Access level for event media collection.
/// </summary>
public enum EventMediaAccessLevel
{
    Public = 0,
    ParticipantsOnly = 1,
    OrganizersOnly = 2,
    Private = 3
}
