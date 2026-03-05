using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class RemoveFavoriteSongHandler(IKaraokeRepository r) : IRequestHandler<RemoveFavoriteSongCommand, bool>
    {
        public Task<bool> Handle(RemoveFavoriteSongCommand req, CancellationToken ct) => r.RemoveFavoriteSongAsync(req.PlayerId, req.SongId);
    }
}
