using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Self-service RSVP — user signs themselves up for an event.</summary>
public record RsvpToEventCommand(int EventId, int UserId) : IRequest<bool>;
