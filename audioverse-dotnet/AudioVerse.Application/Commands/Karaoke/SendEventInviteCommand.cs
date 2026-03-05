using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record SendEventInviteCommand(EventInvite Invite) : IRequest<int>;
}
