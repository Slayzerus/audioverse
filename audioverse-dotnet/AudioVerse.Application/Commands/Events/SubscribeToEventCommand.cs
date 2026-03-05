using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record SubscribeToEventCommand(
    int UserId,
    int EventId,
    EventNotificationLevel Level = EventNotificationLevel.Standard,
    bool EmailEnabled = false,
    bool PushEnabled = true) : IRequest<int>;
