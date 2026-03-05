using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Application.Models.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetTopSingingsForSongHandler : IRequestHandler<GetTopSingingsForSongQuery, List<KaraokeTopSingingDto>>
    {
        private readonly IKaraokeRepository _repo;
        public GetTopSingingsForSongHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<List<KaraokeTopSingingDto>> Handle(GetTopSingingsForSongQuery request, CancellationToken cancellationToken)
        {
            var singings = await _repo.GetTopSingingsForSongAsync(request.SongId, request.Take, cancellationToken);
            return singings.Select(s => new KaraokeTopSingingDto
            {
                SingingId = s.Id,
                RoundId = s.RoundId,
                PlayerId = s.PlayerId,
                PlayerName = s.Player?.Name ?? "",
                Score = s.Score,
                Hits = s.Hits,
                Misses = s.Misses,
                Good = s.Good,
                Perfect = s.Perfect,
                Combo = s.Combo,
                PerformedAt = s.Round?.PerformedAt ?? s.Round?.CreatedAt ?? s.Round?.StartTime ?? default
            }).ToList();
        }
    }
}
