using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record DeleteBoardGameCommand(int Id) : IRequest<bool>;
}
