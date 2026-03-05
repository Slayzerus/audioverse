using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetPollResultsHandler(IEventRepository r) : IRequestHandler<GetPollResultsQuery, PollResultsDto?>
{
    public async Task<PollResultsDto?> Handle(GetPollResultsQuery req, CancellationToken ct)
    {
        var poll = await r.GetPollByIdAsync(req.PollId);
        if (poll == null) return null;

        var options = (await r.GetPollOptionsAsync(poll.Id)).ToList();
        var responses = (await r.GetPollResponsesAsync(poll.Id)).ToList();

        var totalResponses = responses.Count;
        var uniqueRespondents = responses.Select(rr => rr.RespondentEmail ?? rr.RespondentUserId?.ToString() ?? "").Distinct().Count();

        var optionResults = options.Select(o =>
        {
            var optResponses = responses.Where(rr => rr.OptionId == o.Id).ToList();
            var count = optResponses.Count;
            var totalQty = optResponses.Sum(rr => rr.Quantity > 0 ? rr.Quantity : 1);
            return new PollOptionResultDto
            {
                OptionId = o.Id,
                Text = o.Text,
                SourceEntityId = o.SourceEntityId,
                SourceEntityType = o.SourceEntityType?.ToString(),
                UnitCost = o.UnitCost,
                ImageUrl = o.ImageUrl,
                Count = count,
                TotalQuantity = totalQty,
                Percentage = totalResponses > 0 ? Math.Round(100.0 * count / totalResponses, 1) : 0,
                LineCost = (o.UnitCost ?? 0) * totalQty
            };
        }).ToList();

        return new PollResultsDto
        {
            PollId = poll.Id,
            Title = poll.Title,
            PollType = poll.Type.ToString(),
            OptionSource = poll.OptionSource.ToString(),
            TotalResponses = totalResponses,
            UniqueRespondents = uniqueRespondents,
            TotalCost = optionResults.Sum(o => o.LineCost),
            Options = optionResults
        };
    }
}
