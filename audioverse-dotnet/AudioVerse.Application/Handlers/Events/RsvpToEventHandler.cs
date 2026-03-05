using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles self-service RSVP — creates user-level participant with Registered status.</summary>
public class RsvpToEventHandler(IEventRepository eventRepo) : IRequestHandler<RsvpToEventCommand, bool>
{
    public async Task<bool> Handle(RsvpToEventCommand req, CancellationToken ct)
    {
        var ev = await eventRepo.GetEventByIdAsync(req.EventId);
        if (ev == null) return false;

        // Check if user is already registered
        var existing = await eventRepo.GetParticipantAsync(req.EventId, req.UserId, ct);
        if (existing != null) return true;

        var participant = new EventParticipant
        {
            EventId = req.EventId,
            UserId = req.UserId,
            Status = EventParticipantStatus.Registered
        };

        await eventRepo.AddParticipantAsync(participant, ct);
        return true;
    }
}
