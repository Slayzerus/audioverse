using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UnsubscribeFromEventHandler(IEventSubscriptionRepository repo) : IRequestHandler<UnsubscribeFromEventCommand, bool>
{
    public async Task<bool> Handle(UnsubscribeFromEventCommand req, CancellationToken ct)
        => await repo.DeleteAsync(req.UserId, req.EventId, ct);
}
