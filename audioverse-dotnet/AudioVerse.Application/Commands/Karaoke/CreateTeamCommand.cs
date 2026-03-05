using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record CreateTeamCommand(KaraokeTeam Team) : IRequest<int>;
}
