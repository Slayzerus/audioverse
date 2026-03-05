using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request to update subscription notification preferences.</summary>
public record UpdateSubscriptionRequest(
    EventNotificationLevel Level,
    EventNotificationCategory? CustomCategories = null,
    bool EmailEnabled = false,
    bool PushEnabled = true);
