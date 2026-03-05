using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request to subscribe to an event with notification preferences.</summary>
public record SubscribeToEventRequest(
    int EventId,
    EventNotificationLevel Level = EventNotificationLevel.Standard,
    bool EmailEnabled = false,
    bool PushEnabled = true);
