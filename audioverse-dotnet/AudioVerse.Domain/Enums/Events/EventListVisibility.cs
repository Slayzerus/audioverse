namespace AudioVerse.Domain.Enums.Events;

/// <summary>
/// Visibility level for an event list.
/// </summary>
public enum EventListVisibility
{
    /// <summary>Only the owner can see this list.</summary>
    Private = 0,

    /// <summary>Anyone with the share link can view this list.</summary>
    Shared = 1,

    /// <summary>Publicly visible and discoverable.</summary>
    Public = 2
}
