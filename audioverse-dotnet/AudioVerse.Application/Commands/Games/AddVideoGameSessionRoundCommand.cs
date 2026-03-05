using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddVideoGameSessionRoundCommand(VideoGameSessionRound Round) : IRequest<int>;
}
