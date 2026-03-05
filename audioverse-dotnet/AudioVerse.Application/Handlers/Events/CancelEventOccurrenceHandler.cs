using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Cancels an event occurrence by setting status and cancellation reason.</summary>
public class CancelEventOccurrenceHandler(IKaraokeRepository repo) : IRequestHandler<CancelEventOccurrenceCommand, bool>
{
    public async Task<bool> Handle(CancelEventOccurrenceCommand req, CancellationToken ct)
    {
        var ev = await repo.GetEventByIdAsync(req.EventId);
        if (ev == null) return false;

        ev.Status = Domain.Enums.EventStatus.Cancelled;
        ev.CancellationReason = req.Reason;
        return await repo.UpdateEventAsync(ev);
    }
}
