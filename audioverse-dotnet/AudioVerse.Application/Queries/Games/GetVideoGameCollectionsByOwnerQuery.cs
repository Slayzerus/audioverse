using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Games
{
    public record GetVideoGameCollectionsByOwnerQuery(int OwnerId) : IRequest<IEnumerable<VideoGameCollection>>;
}
