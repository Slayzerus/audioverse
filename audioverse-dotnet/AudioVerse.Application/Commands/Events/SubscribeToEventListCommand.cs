using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record SubscribeToEventListCommand(
    int UserId,
    int EventListId,
    EventNotificationLevel Level = EventNotificationLevel.Standard) : IRequest<int>;
