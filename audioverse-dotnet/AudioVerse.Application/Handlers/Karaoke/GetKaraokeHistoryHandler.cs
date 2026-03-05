using AudioVerse.Application.Models.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetKaraokeHistoryHandler : IRequestHandler<GetKaraokeHistoryQuery, List<KaraokeHistoryEntryDto>>
    {
        private readonly IKaraokeRepository _repo;
        public GetKaraokeHistoryHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<List<KaraokeHistoryEntryDto>> Handle(GetKaraokeHistoryQuery request, CancellationToken cancellationToken)
        {
            var singings = await _repo.GetHistorySingingsAsync(request.UserId, request.Take, cancellationToken);
            return singings.Select(s => new KaraokeHistoryEntryDto
            {
                SingingId = s.Id,
                SongTitle = s.Round?.Song?.Title ?? "",
                Score = s.Score,
                PerformedAt = s.Round?.PerformedAt ?? s.Round?.CreatedAt ?? s.Round?.StartTime ?? default
            }).ToList();
        }
    }
}
