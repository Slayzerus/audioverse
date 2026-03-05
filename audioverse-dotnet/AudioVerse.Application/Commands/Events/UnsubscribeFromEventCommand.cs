using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record UnsubscribeFromEventCommand(int UserId, int EventId) : IRequest<bool>;
