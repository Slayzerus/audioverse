using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record DeleteBoardGameSessionRoundCommand(int Id) : IRequest<bool>;
}
