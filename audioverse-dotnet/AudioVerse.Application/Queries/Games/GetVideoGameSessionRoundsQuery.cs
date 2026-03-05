using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Games
{
    public record GetVideoGameSessionRoundsQuery(int SessionId) : IRequest<IEnumerable<VideoGameSessionRound>>;
}
