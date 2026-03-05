using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Reschedules an event occurrence to a new date/time, preserving the original date.</summary>
public class RescheduleEventOccurrenceHandler(IKaraokeRepository repo) : IRequestHandler<RescheduleEventOccurrenceCommand, bool>
{
    public async Task<bool> Handle(RescheduleEventOccurrenceCommand req, CancellationToken ct)
    {
        var ev = await repo.GetEventByIdAsync(req.EventId);
        if (ev == null) return false;

        ev.OriginalStartTime ??= ev.StartTime;
        ev.StartTime = req.NewStartTime;
        if (req.NewEndTime.HasValue)
            ev.EndTime = req.NewEndTime;
        else if (ev.EndTime.HasValue && ev.OriginalStartTime.HasValue)
        {
            var duration = ev.EndTime.Value - ev.OriginalStartTime.Value;
            ev.EndTime = req.NewStartTime + duration;
        }

        return await repo.UpdateEventAsync(ev);
    }
}
