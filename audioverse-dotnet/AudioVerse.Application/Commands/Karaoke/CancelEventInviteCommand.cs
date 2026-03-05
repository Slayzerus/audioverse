using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record CancelEventInviteCommand(int InviteId, int CancelledByUserId) : IRequest<bool>;
}
