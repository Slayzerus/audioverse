using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles restoring a soft-deleted event (admin only).</summary>
public class RestoreEventHandler(IEventRepository eventRepo) : IRequestHandler<RestoreEventCommand, bool>
{
    public async Task<bool> Handle(RestoreEventCommand req, CancellationToken ct)
    {
        return await eventRepo.RestoreEventAsync(req.EventId, ct);
    }
}
