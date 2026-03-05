using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Games
{
    public record GetVideoGameSessionsByEventQuery(int EventId) : IRequest<IEnumerable<VideoGameSession>>;
}
