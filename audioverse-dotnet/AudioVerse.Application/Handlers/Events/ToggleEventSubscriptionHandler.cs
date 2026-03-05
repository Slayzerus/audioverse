using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class ToggleEventSubscriptionHandler(IEventSubscriptionRepository repo) : IRequestHandler<ToggleEventSubscriptionCommand, bool>
{
    public async Task<bool> Handle(ToggleEventSubscriptionCommand req, CancellationToken ct)
        => await repo.ToggleAsync(req.UserId, req.EventId, req.DefaultLevel, ct);
}
