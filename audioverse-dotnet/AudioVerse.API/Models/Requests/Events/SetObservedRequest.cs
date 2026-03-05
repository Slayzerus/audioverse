using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request to set IsObserved on an EventListItem with optional notification level.</summary>
public record SetObservedRequest(
    bool IsObserved,
    EventNotificationLevel Level = EventNotificationLevel.Standard);
