using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record DeleteTeamCommand(int TeamId) : IRequest<bool>;
}
