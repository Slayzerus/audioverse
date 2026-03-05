using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Cancel participation in an event (withdraw RSVP).</summary>
public record CancelParticipationCommand(int EventId, int UserId) : IRequest<bool>;
