using AudioVerse.Application.Models.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetKaraokeActivityHandler : IRequestHandler<GetKaraokeActivityQuery, List<KaraokeActivityEntryDto>>
    {
        private readonly IKaraokeRepository _repo;
        public GetKaraokeActivityHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<List<KaraokeActivityEntryDto>> Handle(GetKaraokeActivityQuery request, CancellationToken cancellationToken)
        {
            var singings = await _repo.GetActivitySingingsAsync(request.Days, cancellationToken);
            var activity = singings
                .GroupBy(s => (s.Round?.PerformedAt ?? s.Round?.CreatedAt ?? s.Round?.StartTime ?? DateTime.MinValue).Date)
                .Select(g => new KaraokeActivityEntryDto
                {
                    Date = g.Key,
                    SongsSung = g.Count(),
                    TotalScore = g.Sum(s => s.Score)
                })
                .OrderBy(a => a.Date)
                .ToList();
            return activity;
        }
    }
}
