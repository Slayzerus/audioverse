using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class GetPlaylistByIdHandler : IRequestHandler<GetPlaylistByIdQuery, Playlist?>
    {
        private readonly IPlaylistRepository _repo;
        public GetPlaylistByIdHandler(IPlaylistRepository repo) => _repo = repo;
        public async Task<Playlist?> Handle(GetPlaylistByIdQuery request, CancellationToken ct) => await _repo.GetByIdAsync(request.Id, request.IncludeChildren, request.MaxDepth);
    }
}
