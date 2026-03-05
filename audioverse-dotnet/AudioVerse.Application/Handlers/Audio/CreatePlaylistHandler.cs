using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class CreatePlaylistHandler : IRequestHandler<CreatePlaylistCommand, int>
    {
        private readonly IPlaylistRepository _repo;
        public CreatePlaylistHandler(IPlaylistRepository repo) => _repo = repo;
        public async Task<int> Handle(CreatePlaylistCommand request, CancellationToken ct) => await _repo.CreateAsync(request.Playlist);
    }
}
