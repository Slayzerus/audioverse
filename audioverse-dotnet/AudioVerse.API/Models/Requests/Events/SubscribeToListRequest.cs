using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request to bulk-subscribe to all events in a list.</summary>
public record SubscribeToListRequest(
    EventNotificationLevel Level = EventNotificationLevel.Standard);
