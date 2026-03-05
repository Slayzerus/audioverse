using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record DeleteBoardGameSessionCommand(int Id) : IRequest<bool>;
}
