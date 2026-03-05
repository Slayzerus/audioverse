using AudioVerse.Application.Models.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetKaraokeRankingHandler : IRequestHandler<GetKaraokeRankingQuery, List<KaraokeRankingEntryDto>>
    {
        private readonly IKaraokeRepository _repo;
        public GetKaraokeRankingHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<List<KaraokeRankingEntryDto>> Handle(GetKaraokeRankingQuery request, CancellationToken cancellationToken)
        {
            var singings = await _repo.GetRankingSingingsAsync(request.Top, cancellationToken);
            var ranking = singings
                .GroupBy(s => s.PlayerId)
                .Select(g => new KaraokeRankingEntryDto
                {
                    UserId = g.Key,
                    Username = g.Select(s => s.Player?.Name).FirstOrDefault() ?? "",
                    TotalScore = g.Sum(s => s.Score),
                    SongsSung = g.Count(),
                    BestScore = g.Max(s => s.Score)
                })
                .OrderByDescending(r => r.TotalScore)
                .Take(request.Top)
                .ToList();
            return ranking;
        }
    }
}
