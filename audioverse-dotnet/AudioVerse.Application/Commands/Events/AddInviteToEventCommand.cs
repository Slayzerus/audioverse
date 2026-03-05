using MediatR;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Commands.Events
{
    public record AddInviteToEventCommand(int EventId, EventInvite Invite) : IRequest<int>;
}
