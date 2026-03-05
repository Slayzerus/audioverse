using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Audio
{
    public class GetGenreByIdHandler : IRequestHandler<GetGenreByIdQuery, MusicGenre?>
    {
        private readonly ILibrarySongRepository _repo;
        public GetGenreByIdHandler(ILibrarySongRepository repo) => _repo = repo;
        public async Task<MusicGenre?> Handle(GetGenreByIdQuery request, CancellationToken ct)
            => await _repo.GetGenreByIdAsync(request.Id, ct);
    }
}
