using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetFavoriteSongsHandler(IKaraokeRepository r) : IRequestHandler<GetFavoriteSongsQuery, IEnumerable<KaraokeFavoriteSong>>
    {
        public Task<IEnumerable<KaraokeFavoriteSong>> Handle(GetFavoriteSongsQuery req, CancellationToken ct) => r.GetFavoriteSongsAsync(req.PlayerId);
    }
}
