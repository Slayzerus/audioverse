using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record UpdateVideoGameSessionRoundPartPlayerScoreCommand(int Id, int Score) : IRequest<bool>;
}
