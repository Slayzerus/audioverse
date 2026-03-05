using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class GetKaraokeSongPicksRankedHandler(IKaraokeSongPickRepository r) : IRequestHandler<GetKaraokeSongPicksRankedQuery, IEnumerable<KaraokeSongPickRankingDto>>
{
    public async Task<IEnumerable<KaraokeSongPickRankingDto>> Handle(GetKaraokeSongPicksRankedQuery req, CancellationToken ct)
    {
        var picks = await r.GetKaraokeSongPicksBySessionAsync(req.SessionId);
        var sorted = picks.OrderByDescending(p => p.Signups.Count).ToList();
        return sorted.Select((p, i) => new KaraokeSongPickRankingDto(
            p.Id, p.SongTitle, p.SongId, p.Signups.Count,
            !req.MaxRounds.HasValue || i < req.MaxRounds.Value,
            i + 1
        )).ToList();
    }
}
