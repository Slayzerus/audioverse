using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record DeleteBoardGameSessionRoundPartPlayerCommand(int Id) : IRequest<bool>;
}
