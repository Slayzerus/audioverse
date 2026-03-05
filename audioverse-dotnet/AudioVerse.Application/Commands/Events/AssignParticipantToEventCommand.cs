using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    /// <summary>Assign a user as participant to an event (admin/organizer action).</summary>
    public record AssignParticipantToEventCommand(int EventId, int UserId) : IRequest<bool>;
}
