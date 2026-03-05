using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class IsSubscribedHandler(IEventSubscriptionRepository repo) : IRequestHandler<IsSubscribedQuery, bool>
{
    public async Task<bool> Handle(IsSubscribedQuery req, CancellationToken ct)
        => await repo.GetAsync(req.UserId, req.EventId, ct) != null;
}
