using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record AddEventBoardGameCommand(EventBoardGameSession Link) : IRequest<int>;
}
