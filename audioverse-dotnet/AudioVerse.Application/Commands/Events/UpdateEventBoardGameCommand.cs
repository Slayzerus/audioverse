using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record UpdateEventBoardGameCommand(EventBoardGameSession Link) : IRequest<bool>;
}
