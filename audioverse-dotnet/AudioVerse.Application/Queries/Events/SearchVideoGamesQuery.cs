using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Events
{
    public record SearchVideoGamesQuery(string Query, int Limit) : IRequest<IEnumerable<VideoGame>>;
}
