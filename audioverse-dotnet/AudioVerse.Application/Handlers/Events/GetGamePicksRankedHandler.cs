using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetGamePicksRankedHandler(IEventRepository r) : IRequestHandler<GetGamePicksRankedQuery, IEnumerable<GamePickRankingDto>>
{
    public async Task<IEnumerable<GamePickRankingDto>> Handle(GetGamePicksRankedQuery req, CancellationToken ct)
    {
        var picks = await r.GetGamePicksByEventAsync(req.EventId);
        var ranked = picks
            .OrderByDescending(p => p.Votes.Count)
            .Select((p, i) => new GamePickRankingDto(p.Id, p.GameName, p.BoardGameId, p.VideoGameId, p.Votes.Count, i + 1));
        return req.Limit.HasValue ? ranked.Take(req.Limit.Value).ToList() : ranked.ToList();
    }
}
