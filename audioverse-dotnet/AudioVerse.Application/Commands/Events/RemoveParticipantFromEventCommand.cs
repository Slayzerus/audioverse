using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    /// <summary>Remove a user participant from an event (cancel RSVP).</summary>
    public record RemoveParticipantFromEventCommand(int EventId, int UserId) : IRequest<bool>;
}
