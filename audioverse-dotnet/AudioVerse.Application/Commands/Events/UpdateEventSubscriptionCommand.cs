using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record UpdateEventSubscriptionCommand(
    int UserId,
    int EventId,
    EventNotificationLevel Level,
    EventNotificationCategory? CustomCategories = null,
    bool EmailEnabled = false,
    bool PushEnabled = true) : IRequest<bool>;
