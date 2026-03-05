using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class UpdatePlaylistHandler : IRequestHandler<UpdatePlaylistCommand, bool>
    {
        private readonly IPlaylistRepository _repo;
        public UpdatePlaylistHandler(IPlaylistRepository repo) => _repo = repo;
        public async Task<bool> Handle(UpdatePlaylistCommand request, CancellationToken ct) => await _repo.UpdateAsync(request.Playlist);
    }
}
