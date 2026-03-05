using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Games
{
    public record GetBoardGameCollectionsByOwnerQuery(int OwnerId) : IRequest<IEnumerable<BoardGameCollection>>;
}
