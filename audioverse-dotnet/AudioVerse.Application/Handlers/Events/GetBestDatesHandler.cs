using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetBestDatesHandler(IEventRepository r) : IRequestHandler<GetBestDatesQuery, IEnumerable<DateRankingDto>>
{
    public async Task<IEnumerable<DateRankingDto>> Handle(GetBestDatesQuery req, CancellationToken ct)
    {
        var proposals = await r.GetDateProposalsByEventAsync(req.EventId);
        return proposals.Select(p =>
        {
            var available = p.Votes.Count(v => v.Status == DateVoteStatus.Available);
            var maybe = p.Votes.Count(v => v.Status == DateVoteStatus.Maybe);
            var unavailable = p.Votes.Count(v => v.Status == DateVoteStatus.Unavailable);
            var total = p.Votes.Count;
            // Score: Available=1.0, Maybe=0.5, Unavailable=0.0 â†’ higher is better
            var score = total > 0 ? (available + maybe * 0.5) / total : 0.0;
            return new DateRankingDto(p.Id, p.ProposedStart, p.ProposedEnd, p.Note, available, maybe, unavailable, total, Math.Round(score, 3));
        })
        .OrderByDescending(d => d.Score)
        .ThenBy(d => d.UnavailableCount)
        .ThenByDescending(d => d.TotalVotes)
        .ToList();
    }
}
