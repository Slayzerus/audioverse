using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class SubscribeToEventListHandler(IEventSubscriptionRepository repo) : IRequestHandler<SubscribeToEventListCommand, int>
{
    public async Task<int> Handle(SubscribeToEventListCommand req, CancellationToken ct)
        => await repo.SubscribeToListEventsAsync(req.UserId, req.EventListId, req.Level, ct);
}
