using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Application.Models.Dtos;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetSessionRoundsHandler : IRequestHandler<GetSessionRoundsQuery, IEnumerable<KaraokeSessionRoundDto>>
    {
        private readonly IEfKaraokeRepository _repo;
        public GetSessionRoundsHandler(IEfKaraokeRepository repo) => _repo = repo;

        public async Task<IEnumerable<KaraokeSessionRoundDto>> Handle(GetSessionRoundsQuery request, CancellationToken cancellationToken)
        {
            var rounds = await _repo.GetRoundsBySessionIdAsync(request.SessionId);
            return rounds.Select(KaraokeSessionRoundDto.FromDomain);
        }
    }
}
