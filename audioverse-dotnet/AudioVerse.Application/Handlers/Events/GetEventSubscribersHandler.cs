using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventSubscribersHandler(IEventSubscriptionRepository repo) : IRequestHandler<GetEventSubscribersQuery, IEnumerable<EventSubscription>>
{
    public async Task<IEnumerable<EventSubscription>> Handle(GetEventSubscribersQuery req, CancellationToken ct)
        => await repo.GetByEventAsync(req.EventId, ct);
}
