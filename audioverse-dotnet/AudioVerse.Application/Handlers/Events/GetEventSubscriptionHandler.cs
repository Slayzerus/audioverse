using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventSubscriptionHandler(IEventSubscriptionRepository repo) : IRequestHandler<GetEventSubscriptionQuery, EventSubscription?>
{
    public async Task<EventSubscription?> Handle(GetEventSubscriptionQuery req, CancellationToken ct)
        => await repo.GetAsync(req.UserId, req.EventId, ct);
}
