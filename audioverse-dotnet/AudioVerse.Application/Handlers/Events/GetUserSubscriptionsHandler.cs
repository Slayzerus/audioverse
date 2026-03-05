using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetUserSubscriptionsHandler(IEventSubscriptionRepository repo) : IRequestHandler<GetUserSubscriptionsQuery, IEnumerable<EventSubscription>>
{
    public async Task<IEnumerable<EventSubscription>> Handle(GetUserSubscriptionsQuery req, CancellationToken ct)
        => await repo.GetByUserAsync(req.UserId, ct);
}
