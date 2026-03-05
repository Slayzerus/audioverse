using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetSongPicksRankedHandler(IEventRepository r) : IRequestHandler<GetSongPicksRankedQuery, IEnumerable<SongPickRankingDto>>
{
    public async Task<IEnumerable<SongPickRankingDto>> Handle(GetSongPicksRankedQuery req, CancellationToken ct)
    {
        var picks = await r.GetSongPicksBySessionAsync(req.EventId, req.SessionId);
        var sorted = picks.OrderByDescending(p => p.Signups.Count).ToList();
        return sorted.Select((p, i) => new SongPickRankingDto(
            p.Id, p.SongTitle, p.SongId, p.Signups.Count,
            !req.MaxRounds.HasValue || i < req.MaxRounds.Value,
            i + 1
        )).ToList();
    }
}
