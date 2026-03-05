using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record RemoveTeamPlayerCommand(int TeamId, int PlayerId) : IRequest<bool>;
}
