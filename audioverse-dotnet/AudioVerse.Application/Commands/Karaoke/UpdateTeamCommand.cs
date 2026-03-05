using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record UpdateTeamCommand(KaraokeTeam Team) : IRequest<bool>;
}
