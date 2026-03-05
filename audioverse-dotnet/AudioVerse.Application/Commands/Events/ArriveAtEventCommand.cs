using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Participant announces arrival — moves from Registered to Waiting (bouncer queue).</summary>
public record ArriveAtEventCommand(int EventId, int UserId) : IRequest<bool>;
