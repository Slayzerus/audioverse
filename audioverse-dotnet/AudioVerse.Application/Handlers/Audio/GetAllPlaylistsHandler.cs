using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class GetAllPlaylistsHandler : IRequestHandler<GetAllPlaylistsQuery, IEnumerable<Playlist>>
    {
        private readonly IPlaylistRepository _repo;
        public GetAllPlaylistsHandler(IPlaylistRepository repo) => _repo = repo;
        public async Task<IEnumerable<Playlist>> Handle(GetAllPlaylistsQuery request, CancellationToken ct) => await _repo.GetAllAsync();
    }
}
