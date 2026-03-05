using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record DeleteEventBoardGameCommand(int Id) : IRequest<bool>;
}
