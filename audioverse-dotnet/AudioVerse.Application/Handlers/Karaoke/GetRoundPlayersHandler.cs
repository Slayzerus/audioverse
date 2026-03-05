using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetRoundPlayersHandler : IRequestHandler<GetRoundPlayersQuery, IEnumerable<KaraokeSessionRoundPlayer>>
    {
        private readonly IKaraokeRepository _repo;
        public GetRoundPlayersHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<IEnumerable<KaraokeSessionRoundPlayer>> Handle(GetRoundPlayersQuery request, CancellationToken cancellationToken)
        {
            return await _repo.GetRoundPlayersAsync(request.RoundId);
        }
    }
}
