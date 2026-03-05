using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request to update an event list.</summary>
public record UpdateEventListRequest(
    string Name,
    string? Description = null,
    EventListVisibility Visibility = EventListVisibility.Private,
    string? IconKey = null,
    string? Color = null,
    bool IsPinned = false,
    int SortOrder = 0);
