using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record ToggleEventSubscriptionCommand(
    int UserId,
    int EventId,
    EventNotificationLevel DefaultLevel = EventNotificationLevel.Standard) : IRequest<bool>;
