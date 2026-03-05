using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class AddFavoriteSongHandler(IKaraokeRepository r) : IRequestHandler<AddFavoriteSongCommand, int>
    {
        public Task<int> Handle(AddFavoriteSongCommand req, CancellationToken ct)
            => r.AddFavoriteSongAsync(new KaraokeFavoriteSong { PlayerId = req.PlayerId, SongId = req.SongId });
    }
}
