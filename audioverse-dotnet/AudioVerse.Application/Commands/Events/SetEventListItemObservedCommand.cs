using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record SetEventListItemObservedCommand(
    int ItemId,
    int UserId,
    bool IsObserved,
    EventNotificationLevel Level = EventNotificationLevel.Standard) : IRequest<bool>;
