using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record RespondToEventInviteCommand(int InviteId, bool Accept) : IRequest<bool>;

}
