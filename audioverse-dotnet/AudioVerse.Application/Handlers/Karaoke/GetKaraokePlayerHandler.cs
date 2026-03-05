using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetKaraokePlayerHandler : IRequestHandler<GetKaraokePlayerQuery, KaraokeSessionPlayer?>
    {
        private readonly IKaraokeRepository _repo;
        public GetKaraokePlayerHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<KaraokeSessionPlayer?> Handle(GetKaraokePlayerQuery request, CancellationToken cancellationToken)
        {
            return await _repo.GetKaraokePlayerAsync(request.EventId, request.PlayerId);
        }
    }
}
