using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record UpdateVideoGameSessionPlayerScoreCommand(int Id, int Score) : IRequest<bool>;
}
