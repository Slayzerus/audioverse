using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record UpdateBoardGameSessionRoundPartPlayerScoreCommand(int Id, int Score) : IRequest<bool>;
}
