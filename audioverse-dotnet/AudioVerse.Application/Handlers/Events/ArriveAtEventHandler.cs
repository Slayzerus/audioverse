using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles arrival announcement — moves user participant from Registered to Waiting.</summary>
public class ArriveAtEventHandler(IEventRepository eventRepo) : IRequestHandler<ArriveAtEventCommand, bool>
{
    public async Task<bool> Handle(ArriveAtEventCommand req, CancellationToken ct)
    {
        var participant = await eventRepo.GetParticipantAsync(req.EventId, req.UserId, ct);
        if (participant == null) return false;

        if (participant.Status != EventParticipantStatus.Registered)
            return false;

        return await eventRepo.UpdateParticipantStatusAsync(
            req.EventId, req.UserId, EventParticipantStatus.Waiting, ct);
    }
}
