using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class SubmitPollResponseHandler(IEventRepository r) : IRequestHandler<SubmitPollResponseCommand, bool>
{
    public async Task<bool> Handle(SubmitPollResponseCommand req, CancellationToken ct)
    {
        var poll = await r.GetPollByTokenAsync(req.Token);
        if (poll == null) return false;

        foreach (var optionId in req.OptionIds)
        {
            var qty = req.Quantities != null && req.Quantities.TryGetValue(optionId, out var q) ? q : 1;
            await r.AddPollResponseAsync(new EventPollResponse
            {
                PollId = poll.Id,
                OptionId = optionId,
                RespondentEmail = req.Email,
                RespondentUserId = req.UserId,
                Quantity = qty
            });
        }
        return true;
    }
}
