namespace AudioVerse.Domain.Enums.Events;

/// <summary>
/// Event visibility level determining who can see and join.
/// </summary>
public enum EventVisibility
{
    /// <summary>Only explicitly invited users can see the event.</summary>
    Private = 0,
    
    /// <summary>Anyone with the link can view, but not searchable.</summary>
    Unlisted = 1,
    
    /// <summary>Visible in search results and on map.</summary>
    Public = 2
}
