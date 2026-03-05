using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetKaraokePlayersByEventHandler : IRequestHandler<GetKaraokePlayersByEventQuery, IEnumerable<KaraokeSessionPlayer>>
    {
        private readonly IKaraokeRepository _repo;
        public GetKaraokePlayersByEventHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<IEnumerable<KaraokeSessionPlayer>> Handle(GetKaraokePlayersByEventQuery request, CancellationToken cancellationToken)
        {
            return await _repo.GetParticipantsByEventAsync(request.EventId);
        }
    }
}
