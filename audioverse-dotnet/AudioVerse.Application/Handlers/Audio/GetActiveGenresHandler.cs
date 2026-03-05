using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class GetActiveGenresHandler : IRequestHandler<GetActiveGenresQuery, IEnumerable<MusicGenre>>
    {
        private readonly ILibrarySongRepository _repo;
        public GetActiveGenresHandler(ILibrarySongRepository repo) => _repo = repo;
        public async Task<IEnumerable<MusicGenre>> Handle(GetActiveGenresQuery request, CancellationToken ct)
            => await _repo.GetAllGenresAsync(ct);
    }
}
