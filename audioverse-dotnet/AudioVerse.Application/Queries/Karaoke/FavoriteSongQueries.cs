using AudioVerse.Domain.Entities.Karaoke;
using MediatR;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetFavoriteSongsQuery(int PlayerId) : IRequest<IEnumerable<KaraokeFavoriteSong>>;
}
