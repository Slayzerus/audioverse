using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class SubscribeToEventHandler(IEventSubscriptionRepository repo) : IRequestHandler<SubscribeToEventCommand, int>
{
    public async Task<int> Handle(SubscribeToEventCommand req, CancellationToken ct)
    {
        var existing = await repo.GetAsync(req.UserId, req.EventId, ct);
        if (existing != null) return existing.Id;

        var sub = new EventSubscription
        {
            UserId = req.UserId,
            EventId = req.EventId,
            Level = req.Level,
            EmailEnabled = req.EmailEnabled,
            PushEnabled = req.PushEnabled
        };
        return await repo.CreateAsync(sub, ct);
    }
}
