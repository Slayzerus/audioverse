using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles soft-deleting an event.</summary>
public class SoftDeleteEventHandler(IEventRepository eventRepo) : IRequestHandler<SoftDeleteEventCommand, bool>
{
    public async Task<bool> Handle(SoftDeleteEventCommand req, CancellationToken ct)
    {
        return await eventRepo.SoftDeleteEventAsync(req.EventId, req.DeletedByUserId, ct);
    }
}
