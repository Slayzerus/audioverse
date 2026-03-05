using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateEventSubscriptionHandler(IEventSubscriptionRepository repo) : IRequestHandler<UpdateEventSubscriptionCommand, bool>
{
    public async Task<bool> Handle(UpdateEventSubscriptionCommand req, CancellationToken ct)
    {
        var sub = await repo.GetAsync(req.UserId, req.EventId, ct);
        if (sub == null) return false;

        sub.Level = req.Level;
        sub.CustomCategories = req.CustomCategories;
        sub.EmailEnabled = req.EmailEnabled;
        sub.PushEnabled = req.PushEnabled;

        return await repo.UpdateAsync(sub, ct);
    }
}
